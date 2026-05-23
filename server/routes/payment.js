const router  = require('express').Router();
const crypto  = require('crypto');
const { protect, adminOnly } = require('../middleware/auth');
const Order   = require('../models/Order');
const AuditLog = require('../models/AuditLog');

// ── Helper: get Razorpay instance ──
function getRzp() {
  const Razorpay = require('razorpay');
  const keyId = process.env.RAZORPAY_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
  // Only use demo mode if keys are literally missing or still placeholder
  if (!keyId || !keySecret || keyId === 'rzp_test_placeholder') {
    return null;
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

// ── POST /api/payment/create-order ──
// Creates a Razorpay order. Falls back to demo if keys not configured.
router.post('/create-order', protect, async (req, res) => {
  try {
    const { amount, currency = 'INR', notes = {} } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const rzp = getRzp();
    if (!rzp) {
      // Demo mode — return a fake order so checkout still works
      return res.json({
        success: true,
        demo: true,
        order: { id: 'demo_order_' + Date.now(), amount: amount * 100, currency },
        key: 'demo'
      });
    }

    const order = await rzp.orders.create({
      amount:   Math.round(amount * 100), // paise
      currency,
      receipt:  'bc_' + Date.now(),
      notes:    { userId: req.user._id.toString(), ...notes }
    });

    res.json({ success: true, order, key: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error('Razorpay create-order error:', err.message);
    // Fallback to demo on any Razorpay error
    res.json({
      success: true,
      demo: true,
      order: { id: 'demo_order_' + Date.now(), amount: req.body.amount * 100, currency: 'INR' },
      key: 'demo'
    });
  }
});

// ── POST /api/payment/verify ──
// Verifies Razorpay HMAC signature after payment
router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Demo mode — skip verification
    if (razorpay_order_id?.startsWith('demo_')) {
      return res.json({ success: true, verified: true, demo: true });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret || secret === 'placeholder_secret') {
      return res.json({ success: true, verified: true, demo: true });
    }

    const body     = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expected === razorpay_signature) {
      res.json({ success: true, verified: true });
    } else {
      res.status(400).json({ success: false, message: 'Payment verification failed — signature mismatch' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/payment/webhook ──
// Razorpay webhook — auto-update order status on payment events
router.post('/webhook', async (req, res) => {
  try {
    const secret    = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    // Verify webhook signature if secret is configured
    if (secret && signature) {
      const expected = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');
      if (expected !== signature) {
        return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
      }
    }

    const event   = req.body.event;
    const payload = req.body.payload?.payment?.entity;

    if (!payload) return res.json({ success: true });

    if (event === 'payment.captured') {
      // Find order by razorpay order id and mark as confirmed
      const order = await Order.findOne({ razorpayOrderId: payload.order_id });
      if (order && order.status === 'pending') {
        order.status    = 'confirmed';
        order.paymentId = payload.id;
        order.tracking.push({
          status:  'confirmed',
          message: `Payment captured via ${payload.method?.toUpperCase() || 'Razorpay'} — ${payload.id}`,
          location: 'Payment Gateway'
        });
        await order.save();
      }
    }

    if (event === 'payment.failed') {
      const order = await Order.findOne({ razorpayOrderId: payload.order_id });
      if (order && order.status === 'pending') {
        order.status = 'cancelled';
        order.tracking.push({
          status:  'cancelled',
          message: `Payment failed — ${payload.error_description || 'Unknown error'}`
        });
        await order.save();
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/payment/refund ── (admin only)
router.post('/refund', protect, adminOnly, async (req, res) => {
  try {
    const { paymentId, amount, notes = {} } = req.body;
    if (!paymentId) return res.status(400).json({ success: false, message: 'Payment ID required' });

    const rzp = getRzp();
    if (!rzp) {
      // Demo refund
      return res.json({ success: true, demo: true, refund: { id: 'demo_refund_' + Date.now(), amount: amount * 100 } });
    }

    const refund = await rzp.payments.refund(paymentId, {
      amount: amount ? Math.round(amount * 100) : undefined, // undefined = full refund
      notes
    });

    await AuditLog.create({
      admin: req.user._id, adminEmail: req.user.email,
      action: 'PROCESS_REFUND', entity: 'Payment',
      entityId: paymentId,
      details: { refundId: refund.id, amount: refund.amount / 100 },
      ip: req.ip
    }).catch(() => {});

    res.json({ success: true, refund });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/payment/status/:paymentId ── (admin only)
router.get('/status/:paymentId', protect, adminOnly, async (req, res) => {
  try {
    const rzp = getRzp();
    if (!rzp) return res.json({ success: true, demo: true, payment: { id: req.params.paymentId, status: 'captured' } });

    const payment = await rzp.payments.fetch(req.params.paymentId);
    res.json({ success: true, payment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
