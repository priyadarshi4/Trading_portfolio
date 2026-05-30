const router = require('express').Router();
const { exportCSV, exportReport } = require('../controllers/exportController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/trades.csv',    exportCSV);
router.get('/report.json',   exportReport);

module.exports = router;
