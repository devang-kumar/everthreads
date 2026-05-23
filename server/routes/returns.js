const router = require('express').Router();
const ctrl = require('../controllers/returnController');
const { protect, adminOnly } = require('../middleware/auth');

// Customer
router.post('/',       protect, ctrl.createReturn);
router.get('/mine',    protect, ctrl.getMyReturns);

// Admin
router.get('/admin',           protect, adminOnly, ctrl.getAllReturns);
router.put('/admin/:id/status', protect, adminOnly, ctrl.updateReturnStatus);

module.exports = router;
