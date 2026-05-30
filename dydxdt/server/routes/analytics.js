// analytics.js — re-exports trade stats as analytics namespace
const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { getSummary, getByStrategy, getBySymbol, getMonthly, getBySession } = require('../controllers/tradesController');
router.use(protect);
router.get('/summary',     getSummary);
router.get('/strategy',    getByStrategy);
router.get('/symbol',      getBySymbol);
router.get('/monthly',     getMonthly);
router.get('/session',     getBySession);
module.exports = router;
