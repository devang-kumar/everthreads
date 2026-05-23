const router = require('express').Router();
const ctrl   = require('../controllers/adminController');
const oc     = require('../controllers/orderController');
const cc     = require('../controllers/couponController');
const rc     = require('../controllers/returnController');
const rvc    = require('../controllers/reviewController');
const sc     = require('../controllers/settingsController');
const rpc    = require('../controllers/reportController');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

// Core
router.get('/dashboard',          ctrl.getDashboard);
router.get('/analytics',          ctrl.getAnalytics);

// Users / Customers
router.get('/users',              ctrl.getUsers);
router.put('/users/:id/toggle',   ctrl.toggleUser);
router.get('/users/:id',          ctrl.getUserDetail);

// Inventory
router.get('/inventory',          ctrl.getInventory);
router.put('/inventory/:productId/restock', ctrl.restock);

// Orders
router.get('/orders',             oc.getAllOrders);
router.put('/orders/:id/status',  oc.updateOrderStatus);

// Coupons
router.get('/coupons',            cc.getCoupons);
router.post('/coupons',           cc.createCoupon);
router.put('/coupons/:id',        cc.updateCoupon);
router.delete('/coupons/:id',     cc.deleteCoupon);

// Returns
router.get('/returns',            rc.getAllReturns);
router.put('/returns/:id/status', rc.updateReturnStatus);

// Reviews
router.get('/reviews',            rvc.getAllReviews);
router.delete('/reviews/:productId/:reviewId', rvc.deleteReview);
router.put('/reviews/:productId/:reviewId/approve', rvc.approveReview);

// Settings
router.get('/settings',           sc.getSettings);
router.put('/settings',           sc.updateSettings);

// Reports
router.get('/reports/sales',      rpc.getSalesReport);
router.get('/reports/products',   rpc.getProductReport);
router.get('/reports/customers',  rpc.getCustomerReport);
router.get('/reports/export/orders', rpc.exportOrders);

// Audit Logs
router.get('/audit-logs', async (req, res) => {
  try {
    const { page = 1, limit = 50, action, adminId } = req.query;
    const query = {};
    if (action) query.action = { $regex: action, $options: 'i' };
    if (adminId) query.admin = adminId;
    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query).sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(+limit)
      .populate('admin', 'firstName lastName email');
    res.json({ success: true, total, logs });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Notifications
router.get('/notifications', async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50);
    const unread = await Notification.countDocuments({ isRead: false });
    res.json({ success: true, notifications, unread });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
router.put('/notifications/read-all', async (req, res) => {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
