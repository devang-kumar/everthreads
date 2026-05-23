const Return = require('../models/Return');
const Order = require('../models/Order');
const Product = require('../models/Product');
const InventoryLog = require('../models/Inventory');
const AuditLog = require('../models/AuditLog');

const audit = (req, action, entity, entityId, details) =>
  AuditLog.create({ admin: req.user._id, adminEmail: req.user.email, action, entity, entityId: String(entityId), details, ip: req.ip, userAgent: req.headers['user-agent'] }).catch(() => {});

// POST /api/returns  (customer)
exports.createReturn = async (req, res) => {
  try {
    const { orderId, items, reason, description, refundMethod } = req.body;
    const order = await Order.findOne({ orderId, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!['delivered'].includes(order.status))
      return res.status(400).json({ success: false, message: 'Only delivered orders can be returned' });

    const refundAmount = items.reduce((s, i) => s + i.price * i.qty, 0);
    const ret = await Return.create({
      order: order._id, orderId, user: req.user._id, userEmail: req.user.email,
      items, reason, description, refundAmount, refundMethod: refundMethod || 'original',
      timeline: [{ status: 'requested', message: 'Return request submitted', by: req.user.email }]
    });
    res.status(201).json({ success: true, return: ret });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/returns/mine  (customer)
exports.getMyReturns = async (req, res) => {
  try {
    const returns = await Return.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, returns });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/admin/returns
exports.getAllReturns = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) query.$or = [
      { returnId: { $regex: search, $options: 'i' } },
      { orderId: { $regex: search, $options: 'i' } },
      { userEmail: { $regex: search, $options: 'i' } }
    ];
    const total = await Return.countDocuments(query);
    const returns = await Return.find(query).sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(+limit)
      .populate('user', 'firstName lastName email');
    res.json({ success: true, total, returns });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/admin/returns/:id/status
exports.updateReturnStatus = async (req, res) => {
  try {
    const { status, adminNote, refundId } = req.body;
    const ret = await Return.findById(req.params.id);
    if (!ret) return res.status(404).json({ success: false, message: 'Return not found' });

    ret.status = status;
    if (adminNote) ret.adminNote = adminNote;
    if (refundId) ret.refundId = refundId;
    ret.timeline.push({ status, message: adminNote || `Return ${status}`, by: req.user.email });

    // If approved → restore inventory
    if (status === 'received') {
      for (const item of ret.items) {
        const product = await Product.findOne({ productId: item.productId });
        if (product) {
          const variant = product.variants.find(v => v.size === item.size);
          if (variant) {
            const before = variant.stock;
            variant.stock += item.qty;
            await product.save();
            await InventoryLog.create({
              productId: item.productId, productName: item.name,
              size: item.size, type: 'return', qty: item.qty,
              before, after: variant.stock, orderId: ret.orderId, note: 'Return received'
            });
          }
        }
      }
    }

    // Mark order as returned
    if (status === 'refunded') {
      await Order.findByIdAndUpdate(ret.order, { isRefunded: true, refundAmount: ret.refundAmount, status: 'returned' });
    }

    await ret.save();
    await audit(req, 'UPDATE_RETURN_STATUS', 'Return', ret._id, { returnId: ret.returnId, status });
    res.json({ success: true, return: ret });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
