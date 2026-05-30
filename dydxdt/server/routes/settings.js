const router = require('express').Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect } = require('../middleware/auth');
router.use(protect);
router.route('/').get(getSettings).put(updateSettings);
module.exports = router;
