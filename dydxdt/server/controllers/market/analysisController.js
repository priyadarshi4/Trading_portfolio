const { getCandles, getBatchQuotes, searchSymbols, getEconomicCalendar, SYMBOL_MAP } = require('../../utils/market/dataService');
const { runFullAnalysis, fibonacci } = require('../../utils/market/indicators');
const { AnalysisHistory } = require('../../models/market/index');

// @GET /api/market/candles?symbol=EURUSD&timeframe=H1&limit=300
exports.getCandles = async (req, res, next) => {
  try {
    const { symbol, timeframe = 'D1', limit = 300 } = req.query;
    if (!symbol) return res.status(400).json({ success: false, message: 'symbol is required' });
    const data = await getCandles(symbol, timeframe, parseInt(limit));
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// @GET /api/market/quote?symbol=XAUUSD
exports.getQuote = async (req, res, next) => {
  try {
    const { symbol } = req.query;
    if (!symbol) return res.status(400).json({ success: false, message: 'symbol required' });
    const [data] = await getBatchQuotes([symbol]);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// @POST /api/market/quotes  body: { symbols: ['XAUUSD','EURUSD'] }
exports.getBatchQuotes = async (req, res, next) => {
  try {
    const { symbols } = req.body;
    if (!Array.isArray(symbols) || !symbols.length) {
      return res.status(400).json({ success: false, message: 'symbols array required' });
    }
    const data = await getBatchQuotes(symbols.slice(0, 20));
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// @GET /api/market/search?q=gold
exports.searchSymbols = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 1) return res.json({ success: true, data: [] });
    const results = await searchSymbols(q);
    res.json({ success: true, data: results });
  } catch (err) { next(err); }
};

// @GET /api/market/symbols  — return our curated list
exports.getSymbolList = (req, res) => {
  const categories = {};
  Object.entries(SYMBOL_MAP).forEach(([sym, info]) => {
    if (!categories[info.cat]) categories[info.cat] = [];
    categories[info.cat].push({ symbol: sym, name: info.name, category: info.cat });
  });
  res.json({ success: true, data: categories });
};

// @GET /api/analysis/run?symbol=XAUUSD&timeframe=D1
exports.runAnalysis = async (req, res, next) => {
  try {
    const { symbol, timeframe = 'D1' } = req.query;
    if (!symbol) return res.status(400).json({ success: false, message: 'symbol required' });

    // Fetch real candles
    const marketData = await getCandles(symbol, timeframe, 300);
    const analysis   = runFullAnalysis(marketData.candles, symbol);
    if (!analysis) return res.status(400).json({ success: false, message: 'Not enough data' });

    // Save to history
    await AnalysisHistory.create({
      user:             req.user._id,
      symbol:           symbol.toUpperCase(),
      timeframe,
      trend:            analysis.trend,
      trendStrength:    analysis.trendStrength,
      bias:             analysis.bias,
      confidence:       analysis.confidence,
      riskLevel:        analysis.riskLevel,
      rsi:              analysis.rsi,
      macdSignal:       analysis.macdSignal,
      volumeStatus:     analysis.volumeStatus,
      sentiment:        analysis.sentiment,
      supportLevels:    analysis.supportLevels,
      resistanceLevels: analysis.resistanceLevels,
      signal:           analysis.signal,
      mtf:              analysis.mtf,
      patterns:         analysis.patterns,
      raw:              { price: marketData.price, change: marketData.change },
    });

    res.json({ success: true, data: { ...analysis, marketInfo: marketData } });
  } catch (err) { next(err); }
};

// @GET /api/analysis/history?symbol=XAUUSD&limit=10
exports.getHistory = async (req, res, next) => {
  try {
    const { symbol, limit = 10 } = req.query;
    const filter = { user: req.user._id };
    if (symbol) filter.symbol = symbol.toUpperCase();
    const data = await AnalysisHistory.find(filter).sort('-createdAt').limit(parseInt(limit));
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// @GET /api/analysis/signals?symbols=XAUUSD,EURUSD,NQ
exports.getSignals = async (req, res, next) => {
  try {
    const symbols = (req.query.symbols || 'XAUUSD,EURUSD,NQ,GBPUSD,BTCUSD').split(',').slice(0, 8);

    const results = await Promise.allSettled(
      symbols.map(async sym => {
        try {
          const md  = await getCandles(sym.trim(), 'H1', 200);
          const ana = runFullAnalysis(md.candles, sym.trim());
          return ana ? { symbol: sym.trim(), ...ana.signal, confidence: ana.confidence, trend: ana.trend, price: ana.price } : null;
        } catch { return null; }
      })
    );

    const signals = results
      .filter(r => r.status === 'fulfilled' && r.value)
      .map(r => r.value)
      .filter(s => s.type !== 'NEUTRAL');

    res.json({ success: true, data: signals });
  } catch (err) { next(err); }
};

// @GET /api/analysis/fibonacci?symbol=XAUUSD&timeframe=D1
exports.getFibonacci = async (req, res, next) => {
  try {
    const { symbol, timeframe = 'D1' } = req.query;
    const md = await getCandles(symbol, timeframe, 100);
    const highs = md.candles.map(c => c.high);
    const lows  = md.candles.map(c => c.low);
    const high  = Math.max(...highs);
    const low   = Math.min(...lows);
    const levels = fibonacci(high, low);
    res.json({ success: true, data: { symbol, high, low, levels } });
  } catch (err) { next(err); }
};

// @GET /api/market/calendar
exports.getCalendar = (req, res) => {
  res.json({ success: true, data: getEconomicCalendar() });
};
