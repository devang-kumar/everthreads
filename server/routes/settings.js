const router = require('express').Router();
const ctrl = require('../controllers/settingsController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/',  protect, adminOnly, ctrl.getSettings);
router.put('/',  protect, adminOnly, ctrl.updateSettings);

module.exports = router;
