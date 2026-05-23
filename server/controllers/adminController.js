const User         = require('../models/User');
const Product      = require('../models/Product');
const Order        = require('../models/Order');
const InventoryLog = require('../models/Inventory');
const AuditLog     = require('../models/AuditLog');
const Notification = require('../models/Notification');

// Helper: create audit log
const audit = (req, action, entity, entityId, details) =>
  AuditLog.create({ admin: req.user._id, adminEmail: req.user.email, action, entity, entityId: String(entityId), details, ip: req.ip, userAgent: req.headers['user-agent'] }).catch(() => {});

// Helper: create notification
const notify = (type, title, message, link, data) =>
  Notification.create({ type, title, message, link, data }).catch(() => {});

// @GET /api/admin/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const [totalUsers, totalProducts, totalOrders, orders] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Order.find().select('total status createdAt')
    ]);

    const revenue      = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
    const todayStart   = new Date(); todayStart.setHours(0,0,0,0);
    const todayOrders  = orders.filter(o => new Date(o.createdAt) >= todayStart).length;
    const todayRevenue = orders.filter(o => new Date(o.createdAt) >= todayStart && o.status !== 'cancelled')
                               .reduce((s, o) => s + o.total, 0);

    const statusCounts = {};
    orders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });

    // Revenue last 7 days
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      const dayOrders = orders.filter(o => {
        const t = new Date(o.createdAt);
        return t >= d && t < next && o.status !== 'cancelled';
      });
      last7.push({ date: d.toLocaleDateString('en-IN',{day:'numeric',month:'short'}), revenue: dayOrders.reduce((s,o)=>s+o.total,0), orders: dayOrders.length });
    }

    // Low stock
    const products = await Product.find({ isActive: true });
    const lowStock = products.filter(p => (p.variants||[]).some(v => v.stock <= p.lowStockAlert))
      .map(p => ({ id: p._id, productId: p.productId, name: p.name, variants: p.variants.filter(v => v.stock <= p.lowStockAlert) }));

    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(10)
      .populate('user', 'firstName lastName');

    // Unread notifications count
    const unreadNotifications = await Notification.countDocuments({ isRead: false });

    // Pending returns count
    let pendingReturns = 0;
    try {
      const Return = require('../models/Return');
      pendingReturns = await Return.countDocuments({ status: 'requested' });
    } catch(_) {}

    res.json({
      success: true,
      stats: { totalUsers, totalProducts, totalOrders, revenue, todayOrders, todayRevenue, pendingReturns, unreadNotifications },
      statusCounts, last7, lowStock, recentOrders
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, isActive } = req.query;
    const query = { role: 'user' };
    if (search) query.$or = [
      { email: { $regex: search, $options: 'i' } },
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
    if (isActive !== undefined) query.isActive = isActive === 'true';
    const total = await User.countDocuments(query);
    const users = await User.find(query).sort({ createdAt: -1 }).skip((page-1)*limit).limit(+limit);
    res.json({ success: true, total, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/admin/users/:id
exports.getUserDetail = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const orders = await Order.find({ user: req.params.id }).sort({ createdAt: -1 }).limit(20);
    const totalSpent = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
    res.json({ success: true, user, orders, stats: { totalOrders: orders.length, totalSpent } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/admin/users/:id/toggle
exports.toggleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    await audit(req, user.isActive ? 'UNBLOCK_USER' : 'BLOCK_USER', 'User', user._id, { email: user.email });
    res.json({ success: true, isActive: user.isActive });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/admin/inventory
exports.getInventory = async (req, res) => {
  try {
    const products = await Product.find({}).select('productId name category variants lowStockAlert sizes isActive isFeatured images price originalPrice badge tag collection slug');
    const logs     = await InventoryLog.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, products, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/admin/inventory/:productId/restock
exports.restock = async (req, res) => {
  try {
    const { size, qty, note } = req.body;
    const product = await Product.findOne({ productId: +req.params.productId });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const variant = product.variants.find(v => v.size === size);
    if (!variant) return res.status(404).json({ success: false, message: 'Size not found' });

    const before = variant.stock;
    variant.stock += +qty;
    await product.save();

    await InventoryLog.create({
      productId: product.productId, productName: product.name,
      size, type: 'restock', qty: +qty, before, after: variant.stock,
      note: note || 'Manual restock', createdBy: req.user._id
    });

    await audit(req, 'RESTOCK_PRODUCT', 'Product', product.productId, { name: product.name, size, qty, before, after: variant.stock });

    res.json({ success: true, variant, message: `Restocked ${qty} units of ${product.name} (${size})` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/admin/analytics
exports.getAnalytics = async (req, res) => {
  try {
    const topProducts = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.productId', name: { $first: '$items.name' }, totalSold: { $sum: '$items.qty' }, revenue: { $sum: { $multiply: ['$items.price','$items.qty'] } } } },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);

    const categoryRevenue = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.category', revenue: { $sum: { $multiply: ['$items.price','$items.qty'] } }, units: { $sum: '$items.qty' } } },
      { $sort: { revenue: -1 } }
    ]);

    const monthly = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i); d.setDate(1); d.setHours(0,0,0,0);
      const end = new Date(d); end.setMonth(end.getMonth() + 1);
      const result = await Order.aggregate([
        { $match: { createdAt: { $gte: d, $lt: end }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } }
      ]);
      monthly.push({ month: d.toLocaleDateString('en-IN',{month:'short',year:'numeric'}), revenue: result[0]?.revenue || 0, orders: result[0]?.orders || 0 });
    }

    res.json({ success: true, topProducts, categoryRevenue, monthly });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
