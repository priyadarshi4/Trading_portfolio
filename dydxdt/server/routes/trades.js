const router = require('express').Router();
const {
  getTrades, createTrade, getTrade, updateTrade, deleteTrade, bulkImportTrades,
  getSummary, getByStrategy, getBySymbol, getMonthly, getBySession
} = require('../controllers/tradesController');
const { protect } = require('../middleware/auth');

router.use(protect);

// Stats (must come before /:id)
router.get('/stats/summary',     getSummary);
router.get('/stats/by-strategy', getByStrategy);
router.get('/stats/by-symbol',   getBySymbol);
router.get('/stats/monthly',     getMonthly);
router.get('/stats/by-session',  getBySession);

// CRUD
router.route('/').get(getTrades).post(createTrade);
router.post('/bulk', bulkImportTrades);
router.route('/:id').get(getTrade).put(updateTrade).delete(deleteTrade);

module.exports = router;
