const router = require('express').Router();
const { protect } = require('../../middleware/auth');
const analysis  = require('../../controllers/market/analysisController');
const watchlist = require('../../controllers/market/watchlistController');
const alerts    = require('../../controllers/market/alertsController');
const scanner   = require('../../controllers/market/scannerController');

router.use(protect);

// Market Data
router.get('/market/candles',       analysis.getCandles);
router.get('/market/quote',         analysis.getQuote);
router.post('/market/quotes',       analysis.getBatchQuotes);
router.get('/market/search',        analysis.searchSymbols);
router.get('/market/symbols',       analysis.getSymbolList);
router.get('/market/calendar',      analysis.getCalendar);

// Analysis Engine
router.get('/analysis/run',         analysis.runAnalysis);
router.get('/analysis/history',     analysis.getHistory);
router.get('/analysis/signals',     analysis.getSignals);
router.get('/analysis/fibonacci',   analysis.getFibonacci);

// Watchlist
router.get('/watchlist',                        watchlist.getWatchlist);
router.post('/watchlist/symbols',               watchlist.addSymbol);
router.delete('/watchlist/symbols/:symbol',     watchlist.removeSymbol);
router.patch('/watchlist/symbols/:symbol/fav',  watchlist.toggleFavorite);

// Alerts
router.get('/alerts',               alerts.getAlerts);
router.get('/alerts/active',        alerts.getActiveAlerts);
router.post('/alerts',              alerts.createAlert);
router.put('/alerts/:id',           alerts.updateAlert);
router.delete('/alerts/:id',        alerts.deleteAlert);

// Scanner
router.get('/scanner',              scanner.scan);
router.get('/scanner/filters',      scanner.getFilters);

module.exports = router;
