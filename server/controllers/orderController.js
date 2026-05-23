const Order        = require('../models/Order');
const Product      = require('../models/Product');
const InventoryLog = require('../models/Inventory');

const COUPONS = {
  'WELCOME15': { pct: 15 },
  'FIRST15':   { pct: 15 },
  'SUMMER20':  { pct: 20 },
  'WELCOME5':  { pct: 5  },
  'FLAT10':    { pct: 10 }
};

// Helper: restore inventory for order items
async function restoreInventory(items, orderId, note) {
  for (const item of items) {
    const product = await Product.findOne({ productId: item.productId });
    if (product) {
      const variant = product.variants.find(v => v.size === item.size);
      if (variant) {
        const before = variant.stock;
        variant.stock += item.qty;
        product.totalSold = Math.max(0, (product.totalSold || 0) - item.qty);
        await product.save();
        await InventoryLog.create({
          productId: item.productId, productName: item.name,
          size: item.size, type: 'return', qty: item.qty,
          before, after: variant.stock, orderId, note
        });
      }
    }
  }
}

// @POST /api/orders
exports.createOrder = async (req, res) => {
  try {
    const { items, address, paymentMethod, paymentId, couponCode, razorpayOrderId } = req.body;
    if (!items?.length) return res.status(400).json({ success: false, message: 'No items in order' });

    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const coupon   = COUPONS[couponCode?.toUpperCase()];
    const discount = coupon ? Math.round(subtotal * coupon.pct / 100) : 0;
    const prepaid  = paymentMethod === 'razorpay' ? Math.round((subtotal - discount) * 0.05) : 0;
    const shipping = subtotal >= 999 ? 0 : 99;
    const codFee   = paymentMethod === 'cod' ? 49 : 0;
    const total    = subtotal - discount - prepaid + shipping + codFee;

    const order = await Order.create({
      user:          req.user._id,
      userEmail:     req.user.email,
      items,
      address,
      subtotal,
      discount:      discount + prepaid,
      couponCode:    couponCode?.toUpperCase(),
      shipping,
      codFee,
      total,
      paymentMethod,
      paymentId,
      razorpayOrderId,
      status:        'confirmed',
      tracking: [{ status: 'confirmed', message: 'Order placed successfully', location: 'Warehouse', timestamp: new Date() }],
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    });

    // Deduct inventory
    for (const item of items) {
      const product = await Product.findOne({ productId: item.productId });
      if (product) {
        const variant = product.variants.find(v => v.size === item.size);
        if (variant) {
          const before = variant.stock;
          variant.stock = Math.max(0, variant.stock - item.qty);
          product.totalSold = (product.totalSold || 0) + item.qty;
          await product.save();
          await InventoryLog.create({
            productId: item.productId, productName: item.name,
            size: item.size, type: 'sale', qty: item.qty,
            before, after: variant.stock, orderId: order.orderId
          });
        }
      }
    }

    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/orders/myorders
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/orders/:id
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorised' });
    }
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/orders/:id/cancel
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const nonCancellable = ['shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];
    if (nonCancellable.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel — order is already ${order.status.replace(/_/g, ' ')}`
      });
    }

    order.status = 'cancelled';
    order.tracking.push({
      status: 'cancelled',
      message: 'Order cancelled by customer',
      timestamp: new Date()
    });

    // Restore inventory
    await restoreInventory(order.items, order.orderId, 'Order cancelled by customer');
    await order.save();

    res.json({ success: true, order, message: 'Order cancelled successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── ADMIN ──

// @GET /api/admin/orders
exports.getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) query.$or = [
      { orderId:   { $regex: search, $options: 'i' } },
      { userEmail: { $regex: search, $options: 'i' } }
    ];
    const total  = await Order.countDocuments(query);
    const orders = await Order.find(query).sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(+limit)
      .populate('user', 'firstName lastName email');
    res.json({ success: true, total, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/admin/orders/:id/status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, message, location } = req.body;
    const order = await Order.findOne({ orderId: req.params.id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const prevStatus = order.status;
    order.status = status;
    order.tracking.push({
      status,
      message: message || `Order ${status.replace(/_/g, ' ')}`,
      location,
      timestamp: new Date()
    });

    // If admin cancels — restore inventory
    if (status === 'cancelled' && prevStatus !== 'cancelled') {
      await restoreInventory(order.items, order.orderId, `Cancelled by admin`);
    }

    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
