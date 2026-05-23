const router = require('express').Router();
const ctrl = require('../controllers/couponController');
const { protect, adminOnly } = require('../middleware/auth');

// Public — validate coupon at checkout
router.post('/validate', protect, ctrl.validateCoupon);

// Admin only
router.get('/',     protect, adminOnly, ctrl.getCoupons);
router.post('/',    protect, adminOnly, ctrl.createCoupon);
router.put('/:id',  protect, adminOnly, ctrl.updateCoupon);
router.delete('/:id', protect, adminOnly, ctrl.deleteCoupon);

module.exports = router;
