const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

// GET /api/admin/reports/sales
exports.getSalesReport = async (req, res) => {
  try {
    const { from, to, groupBy = 'day' } = req.query;
    const start = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = to ? new Date(to) : new Date();
    end.setHours(23, 59, 59, 999);

    const dateFormat = groupBy === 'month' ? '%Y-%m' : groupBy === 'week' ? '%Y-%U' : '%Y-%m-%d';

    const salesData = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, status: { $ne: 'cancelled' } } },
      { $group: {
        _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
        revenue: { $sum: '$total' },
        orders: { $sum: 1 },
        avgOrderValue: { $avg: '$total' }
      }},
      { $sort: { _id: 1 } }
    ]);

    const summary = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: {
        _id: null,
        totalRevenue: { $sum: { $cond: [{ $ne: ['$status', 'cancelled'] }, '$total', 0] } },
        totalOrders: { $sum: 1 },
        cancelledOrders: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        deliveredOrders: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
        avgOrderValue: { $avg: '$total' },
        totalDiscount: { $sum: '$discount' }
      }}
    ]);

    const paymentBreakdown = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, status: { $ne: 'cancelled' } } },
      { $group: { _id: '$paymentMethod', count: { $sum: 1 }, revenue: { $sum: '$total' } } }
    ]);

    res.json({ success: true, salesData, summary: summary[0] || {}, paymentBreakdown });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/admin/reports/products
exports.getProductReport = async (req, res) => {
  try {
    const { from, to, limit = 20 } = req.query;
    const start = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = to ? new Date(to) : new Date();

    const topSelling = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      { $group: {
        _id: '$items.productId',
        name: { $first: '$items.name' },
        totalSold: { $sum: '$items.qty' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } },
        orders: { $sum: 1 }
      }},
      { $sort: { totalSold: -1 } },
      { $limit: +limit }
    ]);

    const categoryBreakdown = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      { $group: {
        _id: '$items.category',
        revenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } },
        units: { $sum: '$items.qty' }
      }},
      { $sort: { revenue: -1 } }
    ]);

    // Low stock products
    const lowStock = await Product.find({ isActive: true }).then(products =>
      products.filter(p => (p.variants || []).some(v => v.stock <= p.lowStockAlert))
        .map(p => ({ productId: p.productId, name: p.name, category: p.category, variants: p.variants.filter(v => v.stock <= p.lowStockAlert) }))
    );

    res.json({ success: true, topSelling, categoryBreakdown, lowStock });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/admin/reports/customers
exports.getCustomerReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const start = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = to ? new Date(to) : new Date();

    const newCustomers = await User.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, role: 'user' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const topCustomers = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: '$user', totalSpent: { $sum: '$total' }, orderCount: { $sum: 1 }, email: { $first: '$userEmail' } } },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo' } },
      { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
      { $project: { email: 1, totalSpent: 1, orderCount: 1, name: { $concat: ['$userInfo.firstName', ' ', '$userInfo.lastName'] } } }
    ]);

    const summary = await User.aggregate([
      { $match: { role: 'user' } },
      { $group: { _id: null, total: { $sum: 1 }, active: { $sum: { $cond: ['$isActive', 1, 0] } } } }
    ]);

    res.json({ success: true, newCustomers, topCustomers, summary: summary[0] || {} });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/admin/reports/export/orders  (CSV)
exports.exportOrders = async (req, res) => {
  try {
    const { from, to, status } = req.query;
    const query = {};
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) { const e = new Date(to); e.setHours(23,59,59,999); query.createdAt.$lte = e; }
    }
    if (status) query.status = status;

    const orders = await Order.find(query).sort({ createdAt: -1 }).limit(5000)
      .populate('user', 'firstName lastName');

    const rows = [['Order ID','Customer','Email','Items','Subtotal','Discount','Shipping','Total','Payment','Status','Date']];
    orders.forEach(o => {
      rows.push([
        o.orderId,
        o.user ? `${o.user.firstName} ${o.user.lastName}` : '',
        o.userEmail,
        o.items?.length || 0,
        o.subtotal,
        o.discount || 0,
        o.shipping || 0,
        o.total,
        o.paymentMethod,
        o.status,
        new Date(o.createdAt).toLocaleDateString('en-IN')
      ]);
    });

    const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
    res.send(csv);
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
