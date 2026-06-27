const router = require('express').Router();
const crypto = require('crypto');
const { protect, adminOnly } = require('../middleware/auth');
const Order = require('../models/Order');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const PaymentAttempt = require('../models/PaymentAttempt');
const {
  CheckoutError,
  buildOrderQuote,
  assertClientTotals,
  quoteSummary
} = require('../utils/orderPricing');

const COINS_PER_SUCCESSFUL_ORDER = 20;

async function awardOrderCoins(order) {
  if (!order.user || order.rewardRedemption?.isReward || order.coinsEarned > 0) return;
  await User.findByIdAndUpdate(order.user, { $inc: { coins: COINS_PER_SUCCESSFUL_ORDER } });
  order.coinsEarned = COINS_PER_SUCCESSFUL_ORDER;
}

function getRzp() {
  const Razorpay = require('razorpay');
  const keyId = process.env.RAZORPAY_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
  if (!keyId || !keySecret || keyId === 'rzp_test_placeholder' || keySecret === 'placeholder_secret') {
    return null;
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

function handlePaymentError(res, err) {
  if (err instanceof CheckoutError) {
    return res.status(err.status || 400).json({
      success: false,
      message: err.message,
      quote: err.quote,
      productId: err.productId,
      size: err.size,
      available: err.available
    });
  }
  return res.status(500).json({ success: false, message: err.message });
}

async function createAttempt({ req, order, quote, demo }) {
  await PaymentAttempt.create({
    user: req.user._id,
    userEmail: req.user.email,
    razorpayOrderId: order.id,
    amount: quote.total,
    currency: order.currency || 'INR',
    status: demo ? 'verified' : 'created',
    demo,
    quote: quoteSummary(quote)
  });
}

router.post('/create-order', protect, async (req, res) => {
  try {
    const { items, couponCode, paymentMethod = 'razorpay', currency = 'INR' } = req.body;
    const quote = await buildOrderQuote({
      items,
      couponCode,
      paymentMethod,
      userId: req.user._id
    });
    assertClientTotals(quote, req.body);

    if (quote.paymentMethod === 'cod') {
      return res.status(400).json({ success: false, message: 'Online payment order is not required for COD' });
    }

    const rzp = getRzp();
    if (!rzp) {
      const demoOrder = {
        id: `demo_order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        amount: Math.round(quote.total * 100),
        currency
      };
      await createAttempt({ req, order: demoOrder, quote, demo: true });
      return res.json({
        success: true,
        demo: true,
        order: demoOrder,
        key: 'demo',
        quote: quoteSummary(quote)
      });
    }

    const order = await rzp.orders.create({
      amount: Math.round(quote.total * 100),
      currency,
      receipt: 'et_' + Date.now(),
      notes: {
        userId: req.user._id.toString(),
        userEmail: req.user.email,
        couponCode: quote.couponCode || '',
        subtotal: String(quote.subtotal),
        total: String(quote.total)
      }
    });

    await createAttempt({ req, order, quote, demo: false });
    res.json({ success: true, order, key: process.env.RAZORPAY_KEY_ID, quote: quoteSummary(quote) });
  } catch (err) {
    console.error('Razorpay create-order error:', err.message);
    handlePaymentError(res, err);
  }
});

router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id) {
      return res.status(400).json({ success: false, message: 'Payment order ID is required' });
    }

    const attempt = await PaymentAttempt.findOne({
      razorpayOrderId: razorpay_order_id,
      user: req.user._id
    });
    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Payment session not found' });
    }
    if (attempt.status === 'used') {
      return res.json({ success: true, verified: true, alreadyUsed: true });
    }
    if (attempt.expiresAt && attempt.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Payment session expired. Please retry checkout.' });
    }

    if (attempt.demo || razorpay_order_id.startsWith('demo_order_')) {
      attempt.status = 'verified';
      attempt.paymentId = razorpay_payment_id || `DEMO_${razorpay_order_id}`;
      await attempt.save();
      return res.json({ success: true, verified: true, demo: true });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret || secret === 'placeholder_secret') {
      return res.status(500).json({ success: false, message: 'Razorpay secret is not configured' });
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');

    if (expected !== razorpay_signature) {
      attempt.status = 'failed';
      attempt.failureReason = 'signature mismatch';
      await attempt.save();
      return res.status(400).json({ success: false, message: 'Payment verification failed - signature mismatch' });
    }

    attempt.status = 'verified';
    attempt.paymentId = razorpay_payment_id;
    await attempt.save();
    res.json({ success: true, verified: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/webhook', async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));

    if (secret && signature) {
      const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
      if (expected !== signature) {
        return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
      }
    }

    const body = Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString('utf8')) : req.body;
    const event = body.event;
    const payload = body.payload?.payment?.entity;

    if (!payload) return res.json({ success: true });

    if (event === 'payment.captured') {
      await PaymentAttempt.findOneAndUpdate(
        { razorpayOrderId: payload.order_id, status: { $ne: 'used' } },
        { status: 'verified', paymentId: payload.id }
      );

      const order = await Order.findOne({ razorpayOrderId: payload.order_id });
      if (order && order.status === 'pending') {
        order.status = 'confirmed';
        order.paymentId = payload.id;
        order.tracking.push({
          status: 'confirmed',
          message: `Payment captured via ${payload.method?.toUpperCase() || 'Razorpay'} - ${payload.id}`,
          location: 'Payment Gateway'
        });
        await awardOrderCoins(order);
        await order.save();
      }
    }

    if (event === 'payment.failed') {
      await PaymentAttempt.findOneAndUpdate(
        { razorpayOrderId: payload.order_id, status: { $ne: 'used' } },
        { status: 'failed', failureReason: payload.error_description || 'Payment failed' }
      );

      const order = await Order.findOne({ razorpayOrderId: payload.order_id });
      if (order && order.status === 'pending') {
        order.status = 'cancelled';
        order.tracking.push({
          status: 'cancelled',
          message: `Payment failed - ${payload.error_description || 'Unknown error'}`
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

router.post('/refund', protect, adminOnly, async (req, res) => {
  try {
    const { paymentId, amount, notes = {} } = req.body;
    if (!paymentId) return res.status(400).json({ success: false, message: 'Payment ID required' });

    const rzp = getRzp();
    if (!rzp) {
      return res.json({ success: true, demo: true, refund: { id: 'demo_refund_' + Date.now(), amount: amount * 100 } });
    }

    const refund = await rzp.payments.refund(paymentId, {
      amount: amount ? Math.round(amount * 100) : undefined,
      notes
    });

    await AuditLog.create({
      admin: req.user._id,
      adminEmail: req.user.email,
      action: 'PROCESS_REFUND',
      entity: 'Payment',
      entityId: paymentId,
      details: { refundId: refund.id, amount: refund.amount / 100 },
      ip: req.ip
    }).catch(() => {});

    res.json({ success: true, refund });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

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
