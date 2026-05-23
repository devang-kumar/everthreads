const router = require('express').Router();
const ctrl = require('../controllers/reportController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

router.get('/sales',            ctrl.getSalesReport);
router.get('/products',         ctrl.getProductReport);
router.get('/customers',        ctrl.getCustomerReport);
router.get('/export/orders',    ctrl.exportOrders);

module.exports = router;
