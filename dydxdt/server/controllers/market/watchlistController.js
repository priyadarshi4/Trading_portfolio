const { Watchlist } = require('../../models/market/index');
const { getBatchQuotes } = require('../../utils/market/dataService');

// Get or create default watchlist
const getOrCreate = async (userId) => {
  let wl = await Watchlist.findOne({ user: userId, isDefault: true });
  if (!wl) {
    wl = await Watchlist.create({
      user: userId, name: 'My Watchlist', isDefault: true,
      symbols: [
        { symbol: 'XAUUSD',   name: 'Gold',         category: 'Commodities' },
        { symbol: 'EURUSD',   name: 'EUR/USD',       category: 'Forex' },
        { symbol: 'NIFTY50',  name: 'Nifty 50',      category: 'Indices' },
        { symbol: 'NQ',       name: 'Nasdaq Futures', category: 'Futures' },
        { symbol: 'BTCUSD',   name: 'Bitcoin',       category: 'Crypto' },
        { symbol: 'GBPUSD',   name: 'GBP/USD',       category: 'Forex' },
      ],
    });
  }
  return wl;
};

// @GET /api/watchlist
exports.getWatchlist = async (req, res, next) => {
  try {
    const wl = await getOrCreate(req.user._id);
    // Enrich with live quotes
    const symbols = wl.symbols.map(s => s.symbol);
    let quotes = [];
    try { quotes = await getBatchQuotes(symbols); } catch {}
    const quoteMap = {};
    quotes.forEach(q => { quoteMap[q.symbol] = q; });

    const enriched = wl.symbols.map(s => ({
      ...s.toObject(),
      price:  quoteMap[s.symbol]?.price  || 0,
      change: quoteMap[s.symbol]?.change || 0,
      high:   quoteMap[s.symbol]?.high   || 0,
      low:    quoteMap[s.symbol]?.low    || 0,
      volume: quoteMap[s.symbol]?.volume || 0,
    }));

    res.json({ success: true, data: { ...wl.toObject(), symbols: enriched } });
  } catch (err) { next(err); }
};

// @POST /api/watchlist/symbols
exports.addSymbol = async (req, res, next) => {
  try {
    const { symbol, name, category, exchange } = req.body;
    if (!symbol) return res.status(400).json({ success: false, message: 'symbol required' });
    const wl = await getOrCreate(req.user._id);
    if (wl.symbols.find(s => s.symbol === symbol.toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Symbol already in watchlist' });
    }
    wl.symbols.push({ symbol: symbol.toUpperCase(), name: name || symbol, category: category || 'Forex', exchange: exchange || '' });
    await wl.save();
    res.json({ success: true, data: wl });
  } catch (err) { next(err); }
};

// @DELETE /api/watchlist/symbols/:symbol
exports.removeSymbol = async (req, res, next) => {
  try {
    const wl = await getOrCreate(req.user._id);
    wl.symbols = wl.symbols.filter(s => s.symbol !== req.params.symbol.toUpperCase());
    await wl.save();
    res.json({ success: true, data: wl });
  } catch (err) { next(err); }
};

// @PATCH /api/watchlist/symbols/:symbol/favorite
exports.toggleFavorite = async (req, res, next) => {
  try {
    const wl  = await getOrCreate(req.user._id);
    const sym = wl.symbols.find(s => s.symbol === req.params.symbol.toUpperCase());
    if (!sym) return res.status(404).json({ success: false, message: 'Symbol not found' });
    sym.isFavorite = !sym.isFavorite;
    await wl.save();
    res.json({ success: true, data: sym });
  } catch (err) { next(err); }
};
