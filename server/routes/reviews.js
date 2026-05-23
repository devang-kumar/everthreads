const router = require('express').Router();
const ctrl = require('../controllers/reviewController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/',                                    protect, adminOnly, ctrl.getAllReviews);
router.delete('/:productId/:reviewId',             protect, adminOnly, ctrl.deleteReview);
router.put('/:productId/:reviewId/approve',        protect, adminOnly, ctrl.approveReview);

module.exports = router;
