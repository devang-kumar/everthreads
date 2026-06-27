const Order = require('../models/Order');
const Product = require('../models/Product');
const InventoryLog = require('../models/Inventory');
const User = require('../models/User');
const PaymentAttempt = require('../models/PaymentAttempt');
const {
  CheckoutError,
  buildOrderQuote,
  assertClientTotals,
  markCouponUsed,
  quoteSummary
} = require('../utils/orderPricing');

const COINS_PER_SUCCESSFUL_ORDER = 20;
const LIVE_ORDER_STATUSES = ['confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'];

function makeOrderId() {
  return 'BC' + Date.now().toString().slice(-8) + Math.random().toString(36).slice(-3).toUpperCase();
}

async function rollbackInventory(debits) {
  for (const item of debits) {
    await Product.updateOne(
      { productId: item.productId, 'variants.size': item.size },
      { $inc: { 'variants.$.stock': item.qty, totalSold: -item.qty } }
    );
    await Product.updateOne(
      { productId: item.productId, totalSold: { $lt: 0 } },
      { $set: { totalSold: 0 } }
    );
  }
}

async function debitInventory(items, orderId, createdBy) {
  const debits = [];
  const logs = [];

  try {
    for (const item of items) {
      const product = await Product.findOneAndUpdate(
        {
          productId: item.productId,
          isActive: true,
          variants: { $elemMatch: { size: item.size, stock: { $gte: item.qty } } }
        },
        { $inc: { 'variants.$.stock': -item.qty, totalSold: item.qty } },
        { new: false }
      ).select('productId name variants');

      if (!product) {
        throw new CheckoutError(`${item.name} (${item.size}) is no longer available in the requested quantity`, 409);
      }

      const variant = product.variants.find(v => v.size === item.size);
      const before = variant?.stock || 0;
      debits.push({ productId: item.productId, size: item.size, qty: item.qty });
      logs.push({
        productId: item.productId,
        productName: item.name,
        size: item.size,
        type: 'sale',
        qty: item.qty,
        before,
        after: before - item.qty,
        orderId,
        createdBy
      });
    }

    await InventoryLog.insertMany(logs);
    return debits;
  } catch (err) {
    await rollbackInventory(debits).catch(() => {});
    throw err;
  }
}

async function restoreInventory(items, orderId, note) {
  for (const item of items) {
    const product = await Product.findOne({ productId: item.productId }).select('productId name variants totalSold');
    if (!product) continue;

    const variant = product.variants.find(v => v.size === item.size);
    if (!variant) continue;

    const before = variant.stock || 0;
    await Product.updateOne(
      { _id: product._id, 'variants.size': item.size },
      { $inc: { 'variants.$.stock': item.qty, totalSold: -item.qty } }
    );
    await Product.updateOne(
      { _id: product._id, totalSold: { $lt: 0 } },
      { $set: { totalSold: 0 } }
    );

    await InventoryLog.create({
      productId: item.productId,
      productName: item.name,
      size: item.size,
      type: 'return',
      qty: item.qty,
      before,
      after: before + item.qty,
      orderId,
      note
    });
  }
}

async function awardOrderCoins(order) {
  if (!order.user || order.rewardRedemption?.isReward || order.coinsEarned > 0) return null;
  const user = await User.findByIdAndUpdate(
    order.user,
    { $inc: { coins: COINS_PER_SUCCESSFUL_ORDER } },
    { new: true }
  ).select('coins');
  order.coinsEarned = COINS_PER_SUCCESSFUL_ORDER;
  return user;
}

async function revokeOrderCoins(order) {
  if (!order.user || !order.coinsEarned || order.rewardRedemption?.isReward) return null;
  const user = await User.findById(order.user).select('coins');
  if (!user) return null;
  user.coins = Math.max(0, (user.coins || 0) - order.coinsEarned);
  order.coinsEarned = 0;
  await Promise.all([user.save(), order.save()]);
  return user;
}

async function refundRedeemedCoins(order) {
  if (!order.user || !order.coinsRedeemed || order.coinsRefunded) return null;
  const user = await User.findById(order.user).select('coins');
  if (!user) return null;
  user.coins = (user.coins || 0) + order.coinsRedeemed;
  order.coinsRefunded = order.coinsRedeemed;
  await Promise.all([user.save(), order.save()]);
  return user;
}

async function getExistingPaidOrder(req, razorpayOrderId) {
  if (!razorpayOrderId) return null;
  return Order.findOne({ razorpayOrderId, user: req.user._id });
}

async function validatePaymentAttempt(req, quote, paymentId, razorpayOrderId) {
  if (quote.paymentMethod === 'cod') return null;
  if (!razorpayOrderId) {
    throw new CheckoutError('Payment order is missing. Please retry checkout.');
  }

  const attempt = await PaymentAttempt.findOne({ razorpayOrderId, user: req.user._id });
  if (!attempt) {
    throw new CheckoutError('Payment session not found. Please retry checkout.', 400);
  }
  if (attempt.status === 'used') {
    throw new CheckoutError('This payment has already been used for an order.', 409);
  }
  if (attempt.expiresAt && attempt.expiresAt < new Date()) {
    throw new CheckoutError('Payment session expired. Please retry checkout.', 400);
  }
  if (Math.round(attempt.amount) !== Math.round(quote.total)) {
    throw new CheckoutError('Payment amount does not match the latest cart total.', 409, {
      quote: quoteSummary(quote)
    });
  }
  if (!attempt.demo && attempt.status !== 'verified') {
    throw new CheckoutError('Payment has not been verified yet.', 400);
  }
  if (!attempt.demo && attempt.paymentId && paymentId && attempt.paymentId !== paymentId) {
    throw new CheckoutError('Payment ID does not match the verified payment.', 400);
  }
  if (attempt.demo && quote.paymentMethod !== 'demo') {
    throw new CheckoutError('Demo payment session cannot create a Razorpay order.', 400);
  }

  return attempt;
}

function handleOrderError(res, err) {
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

exports.createOrder = async (req, res) => {
  let inventoryDebits = [];
  let orderSaved = false;

  try {
    const { items, address, paymentMethod, paymentId, couponCode, razorpayOrderId } = req.body;

    const existingOrder = await getExistingPaidOrder(req, razorpayOrderId);
    if (existingOrder) {
      return res.json({
        success: true,
        order: existingOrder,
        coinsBalance: req.user.coins,
        message: 'Order already created for this payment'
      });
    }

    const quote = await buildOrderQuote({
      items,
      couponCode,
      paymentMethod,
      userId: req.user._id
    });
    assertClientTotals(quote, req.body);

    if (!address?.name || !address?.phone || !address?.line1 || !address?.city || !address?.state || !address?.pin) {
      throw new CheckoutError('Delivery address is required');
    }

    const paymentAttempt = await validatePaymentAttempt(req, quote, paymentId, razorpayOrderId);
    const order = new Order({
      orderId: makeOrderId(),
      user: req.user._id,
      userEmail: req.user.email,
      items: quote.items,
      address,
      subtotal: quote.subtotal,
      discount: quote.discount,
      couponCode: quote.couponCode,
      shipping: quote.shipping,
      codFee: quote.codFee,
      total: quote.total,
      paymentMethod: quote.paymentMethod,
      paymentId,
      razorpayOrderId,
      status: 'confirmed',
      tracking: [{
        status: 'confirmed',
        message: quote.paymentMethod === 'cod' ? 'Order placed successfully' : 'Payment verified and order placed successfully',
        location: quote.paymentMethod === 'cod' ? 'Warehouse' : 'Payment Gateway',
        timestamp: new Date()
      }],
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    });

    inventoryDebits = await debitInventory(order.items, order.orderId, req.user._id);
    await order.save();
    orderSaved = true;

    let updatedUser = await awardOrderCoins(order);
    await order.save();

    if (quote.coupon) {
      await markCouponUsed(quote.coupon, req.user._id).catch(() => {});
    }
    if (paymentAttempt) {
      await PaymentAttempt.findByIdAndUpdate(paymentAttempt._id, {
        status: 'used',
        paymentId: paymentId || paymentAttempt.paymentId,
        orderId: order.orderId
      }).catch(() => {});
    }

    res.status(201).json({
      success: true,
      order,
      quote: quoteSummary(quote),
      coinsAwarded: order.coinsEarned,
      coinsBalance: updatedUser?.coins
    });
  } catch (err) {
    if (inventoryDebits.length && !orderSaved) {
      await rollbackInventory(inventoryDebits).catch(() => {});
    }
    handleOrderError(res, err);
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

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

exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const nonCancellable = ['shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];
    if (nonCancellable.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel - order is already ${order.status.replace(/_/g, ' ')}`
      });
    }

    order.status = 'cancelled';
    order.tracking.push({
      status: 'cancelled',
      message: 'Order cancelled by customer',
      timestamp: new Date()
    });

    await restoreInventory(order.items, order.orderId, 'Order cancelled by customer');
    const updatedUser = await revokeOrderCoins(order) || await refundRedeemedCoins(order);
    await order.save();

    res.json({
      success: true,
      order,
      coinsBalance: updatedUser?.coins,
      message: 'Order cancelled successfully'
    });
  } catch (err) {
    handleOrderError(res, err);
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) query.$or = [
      { orderId: { $regex: search, $options: 'i' } },
      { userEmail: { $regex: search, $options: 'i' } }
    ];
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query).sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(+limit)
      .populate('user', 'firstName lastName email');
    res.json({ success: true, total, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

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

    if (status === 'cancelled' && prevStatus !== 'cancelled') {
      await restoreInventory(order.items, order.orderId, 'Cancelled by admin');
      await revokeOrderCoins(order) || await refundRedeemedCoins(order);
    }

    if (status === 'returned' && !['returned', 'cancelled'].includes(prevStatus)) {
      await restoreInventory(order.items, order.orderId, 'Order marked returned by admin');
      await revokeOrderCoins(order) || await refundRedeemedCoins(order);
    }

    if (LIVE_ORDER_STATUSES.includes(status) && prevStatus === 'pending') {
      await awardOrderCoins(order);
    }

    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    handleOrderError(res, err);
  }
};

module.exports._restoreInventory = restoreInventory;
module.exports._revokeOrderCoins = revokeOrderCoins;
module.exports._refundRedeemedCoins = refundRedeemedCoins;
