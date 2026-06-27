const router = require('express').Router();
const ctrl = require('../controllers/rewardController');
const { protect } = require('../middleware/auth');

router.get('/', protect, ctrl.getRewards);
router.post('/redeem', protect, ctrl.redeemReward);

module.exports = router;
