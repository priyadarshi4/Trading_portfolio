/**
 * Market Data Service
 * Uses Yahoo Finance v8 API — completely free, no API key required
 * Supports Stocks, ETFs, Forex, Crypto, Commodities, Indices
 */

const https = require('https');

// Symbol mapping for display names and Yahoo tickers
const SYMBOL_MAP = {
  // Indices
  'NIFTY50':   { yahoo: '^NSEI',      name: 'Nifty 50',      cat: 'Indices' },
  'BANKNIFTY': { yahoo: '^NSEBANK',   name: 'Bank Nifty',    cat: 'Indices' },
  'SENSEX':    { yahoo: '^BSESN',     name: 'Sensex',        cat: 'Indices' },
  'SPX':       { yahoo: '^GSPC',      name: 'S&P 500',       cat: 'Indices' },
  'SPY':       { yahoo: 'SPY',        name: 'S&P 500 ETF',   cat: 'ETFs' },
  'NDX':       { yahoo: '^NDX',       name: 'Nasdaq 100',    cat: 'Indices' },
  'QQQ':       { yahoo: 'QQQ',        name: 'Nasdaq ETF',    cat: 'ETFs' },
  'DJI':       { yahoo: '^DJI',       name: 'Dow Jones',     cat: 'Indices' },
  'VIX':       { yahoo: '^VIX',       name: 'VIX',           cat: 'Indices' },
  // Forex
  'EURUSD':    { yahoo: 'EURUSD=X',   name: 'EUR/USD',       cat: 'Forex' },
  'GBPUSD':    { yahoo: 'GBPUSD=X',   name: 'GBP/USD',       cat: 'Forex' },
  'USDJPY':    { yahoo: 'JPY=X',      name: 'USD/JPY',       cat: 'Forex' },
  'AUDUSD':    { yahoo: 'AUDUSD=X',   name: 'AUD/USD',       cat: 'Forex' },
  'USDCAD':    { yahoo: 'CAD=X',      name: 'USD/CAD',       cat: 'Forex' },
  'USDCHF':    { yahoo: 'CHF=X',      name: 'USD/CHF',       cat: 'Forex' },
  'NZDUSD':    { yahoo: 'NZDUSD=X',   name: 'NZD/USD',       cat: 'Forex' },
  'USDINR':    { yahoo: 'INR=X',      name: 'USD/INR',       cat: 'Forex' },
  // Commodities
  'XAUUSD':    { yahoo: 'GC=F',       name: 'Gold',          cat: 'Commodities' },
  'XAGUSD':    { yahoo: 'SI=F',       name: 'Silver',        cat: 'Commodities' },
  'CRUDEOIL':  { yahoo: 'CL=F',       name: 'Crude Oil WTI', cat: 'Commodities' },
  'NATGAS':    { yahoo: 'NG=F',       name: 'Natural Gas',   cat: 'Commodities' },
  'COPPER':    { yahoo: 'HG=F',       name: 'Copper',        cat: 'Commodities' },
  // Crypto
  'BTCUSD':    { yahoo: 'BTC-USD',    name: 'Bitcoin',       cat: 'Crypto' },
  'ETHUSD':    { yahoo: 'ETH-USD',    name: 'Ethereum',      cat: 'Crypto' },
  'SOLUSD':    { yahoo: 'SOL-USD',    name: 'Solana',        cat: 'Crypto' },
  'BNBUSD':    { yahoo: 'BNB-USD',    name: 'BNB',           cat: 'Crypto' },
  // Futures
  'NQ':        { yahoo: 'NQ=F',       name: 'Nasdaq Futures',cat: 'Futures' },
  'ES':        { yahoo: 'ES=F',       name: 'S&P Futures',   cat: 'Futures' },
  'YM':        { yahoo: 'YM=F',       name: 'Dow Futures',   cat: 'Futures' },
  // US Stocks
  'AAPL':      { yahoo: 'AAPL',       name: 'Apple',         cat: 'US Stocks' },
  'TSLA':      { yahoo: 'TSLA',       name: 'Tesla',         cat: 'US Stocks' },
  'MSFT':      { yahoo: 'MSFT',       name: 'Microsoft',     cat: 'US Stocks' },
  'GOOGL':     { yahoo: 'GOOGL',      name: 'Alphabet',      cat: 'US Stocks' },
  'AMZN':      { yahoo: 'AMZN',       name: 'Amazon',        cat: 'US Stocks' },
  'NVDA':      { yahoo: 'NVDA',       name: 'NVIDIA',        cat: 'US Stocks' },
  'META':      { yahoo: 'META',       name: 'Meta',          cat: 'US Stocks' },
  // Indian Stocks
  'RELIANCE':  { yahoo: 'RELIANCE.NS',name: 'Reliance',      cat: 'Indian Stocks' },
  'TCS':       { yahoo: 'TCS.NS',     name: 'TCS',           cat: 'Indian Stocks' },
  'HDFCBANK':  { yahoo: 'HDFCBANK.NS',name: 'HDFC Bank',     cat: 'Indian Stocks' },
  'INFY':      { yahoo: 'INFY.NS',    name: 'Infosys',       cat: 'Indian Stocks' },
  'ICICIBANK': { yahoo: 'ICICIBANK.NS',name:'ICICI Bank',    cat: 'Indian Stocks' },
};

const TIMEFRAME_MAP = {
  '1m':  { interval: '1m',  range: '1d' },
  '5m':  { interval: '5m',  range: '5d' },
  '15m': { interval: '15m', range: '5d' },
  '30m': { interval: '30m', range: '1mo' },
  '1H':  { interval: '1h',  range: '1mo' },
  '4H':  { interval: '4h',  range: '3mo' },
  'D1':  { interval: '1d',  range: '1y' },
  'W1':  { interval: '1wk', range: '5y' },
  'MN':  { interval: '1mo', range: 'max' },
};

const fetchJSON = (url) => new Promise((resolve, reject) => {
  https.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; DyDxDt/1.0)',
      'Accept': 'application/json',
    }
  }, (res) => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => {
      try { resolve(JSON.parse(data)); }
      catch (e) { reject(new Error('Invalid JSON response')); }
    });
  }).on('error', reject);
});

const resolveYahoo = (symbol) => {
  const upper = symbol.toUpperCase();
  if (SYMBOL_MAP[upper]) return SYMBOL_MAP[upper].yahoo;
  // Auto-detect: forex pairs, crypto, Indian stocks
  if (/^[A-Z]{6}$/.test(upper) && !upper.endsWith('USD')) return upper + '=X';
  if (upper.endsWith('USD') && upper.length === 6) return upper + '=X';
  if (upper.endsWith('.NS') || upper.endsWith('.BSE')) return upper;
  return upper;
};

/**
 * Get OHLCV candles from Yahoo Finance
 */
const getCandles = async (symbol, timeframe = 'D1', limit = 300) => {
  const tf     = TIMEFRAME_MAP[timeframe] || TIMEFRAME_MAP['D1'];
  const ticker = resolveYahoo(symbol);
  const url    = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${tf.interval}&range=${tf.range}&includePrePost=false`;

  try {
    const data   = await fetchJSON(url);
    const result = data?.chart?.result?.[0];
    if (!result) throw new Error(`No data for ${symbol}`);

    const timestamps = result.timestamp || [];
    const q = result.indicators?.quote?.[0] || {};
    const { open = [], high = [], low = [], close = [], volume = [] } = q;

    const candles = timestamps
      .map((t, i) => ({
        time:   t,
        open:   open[i]   !== null ? parseFloat((open[i]   || 0).toFixed(5)) : null,
        high:   high[i]   !== null ? parseFloat((high[i]   || 0).toFixed(5)) : null,
        low:    low[i]    !== null ? parseFloat((low[i]    || 0).toFixed(5)) : null,
        close:  close[i]  !== null ? parseFloat((close[i]  || 0).toFixed(5)) : null,
        volume: volume[i] || 0,
      }))
      .filter(c => c.open && c.high && c.low && c.close)
      .slice(-limit);

    const meta    = result.meta || {};
    const lastC   = candles[candles.length - 1];
    const prevC   = candles[candles.length - 2];

    return {
      symbol: symbol.toUpperCase(),
      name:   SYMBOL_MAP[symbol.toUpperCase()]?.name || meta.longName || symbol,
      category: SYMBOL_MAP[symbol.toUpperCase()]?.cat || 'Unknown',
      currency: meta.currency || 'USD',
      exchange: meta.exchangeName || '',
      price:    lastC?.close || meta.regularMarketPrice || 0,
      change:   lastC && prevC ? parseFloat(((lastC.close - prevC.close) / prevC.close * 100).toFixed(2)) : 0,
      high52w:  meta.fiftyTwoWeekHigh || 0,
      low52w:   meta.fiftyTwoWeekLow  || 0,
      volume:   lastC?.volume || 0,
      candles,
      timeframe,
    };
  } catch (err) {
    throw new Error(`Failed to fetch ${symbol}: ${err.message}`);
  }
};

/**
 * Get quick quote (price only, no candles)
 */
const getQuote = async (symbol) => {
  const ticker = resolveYahoo(symbol);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`;
  try {
    const data   = await fetchJSON(url);
    const result = data?.chart?.result?.[0];
    const meta   = result?.meta || {};
    const q      = result?.indicators?.quote?.[0] || {};
    const closes = (q.close || []).filter(Boolean);
    const last   = closes[closes.length - 1] || meta.regularMarketPrice || 0;
    const prev   = closes[closes.length - 2] || last;
    return {
      symbol: symbol.toUpperCase(),
      name:   SYMBOL_MAP[symbol.toUpperCase()]?.name || meta.longName || symbol,
      category: SYMBOL_MAP[symbol.toUpperCase()]?.cat || 'Unknown',
      price:  parseFloat(last.toFixed(5)),
      change: parseFloat(((last - prev) / prev * 100).toFixed(2)),
      high:   Math.max(...(q.high || [last]).filter(Boolean)),
      low:    Math.min(...(q.low  || [last]).filter(Boolean)),
      volume: (q.volume || [0]).filter(Boolean).pop() || 0,
    };
  } catch {
    return { symbol: symbol.toUpperCase(), price: 0, change: 0, error: true };
  }
};

/**
 * Batch quote multiple symbols
 */
const getBatchQuotes = async (symbols) => {
  const results = await Promise.allSettled(symbols.map(s => getQuote(s)));
  return results.map((r, i) =>
    r.status === 'fulfilled' ? r.value : { symbol: symbols[i], price: 0, change: 0, error: true }
  );
};

/**
 * Search for symbols
 */
const searchSymbols = async (query) => {
  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&lang=en-US&region=US&quotesCount=10&newsCount=0`;
  try {
    const data = await fetchJSON(url);
    return (data?.quotes || [])
      .filter(q => q.quoteType && !['OPTION','MUTUALFUND','FUTURE'].includes(q.quoteType))
      .map(q => ({
        symbol:   q.symbol,
        name:     q.longname || q.shortname || q.symbol,
        exchange: q.exchDisp || '',
        type:     q.quoteType || 'EQUITY',
      }))
      .slice(0, 8);
  } catch { return []; }
};

// Economic calendar (static for now, would integrate with news API in production)
const getEconomicCalendar = () => [
  { id: 1, date: '2025-03-20', time: '19:00', event: 'FOMC Rate Decision',    currency: 'USD', impact: 'High',   forecast: '5.50%',   previous: '5.50%' },
  { id: 2, date: '2025-03-21', time: '12:30', event: 'US Initial Jobless Claims', currency: 'USD', impact: 'Medium', forecast: '215K', previous: '218K' },
  { id: 3, date: '2025-03-28', time: '12:30', event: 'US GDP (QoQ)',          currency: 'USD', impact: 'High',   forecast: '2.3%',    previous: '3.2%' },
  { id: 4, date: '2025-04-01', time: '12:30', event: 'NFP (Non-Farm Payrolls)',currency:'USD', impact: 'High',   forecast: '195K',    previous: '311K' },
  { id: 5, date: '2025-04-10', time: '12:30', event: 'US CPI (YoY)',          currency: 'USD', impact: 'High',   forecast: '3.1%',    previous: '3.2%' },
  { id: 6, date: '2025-04-05', time: '05:30', event: 'RBI Monetary Policy',   currency: 'INR', impact: 'High',   forecast: '6.50%',   previous: '6.50%' },
  { id: 7, date: '2025-04-15', time: '06:00', event: 'India CPI',             currency: 'INR', impact: 'High',   forecast: '4.8%',    previous: '5.1%' },
  { id: 8, date: '2025-03-25', time: '13:30', event: 'ECB Rate Decision',     currency: 'EUR', impact: 'High',   forecast: '4.00%',   previous: '4.50%' },
  { id: 9, date: '2025-04-02', time: '11:00', event: 'UK GDP (MoM)',          currency: 'GBP', impact: 'Medium', forecast: '0.1%',    previous: '-0.1%' },
  { id:10, date: '2025-03-22', time: '23:30', event: 'Japan Inflation Rate',  currency: 'JPY', impact: 'Medium', forecast: '2.3%',    previous: '2.2%' },
];

module.exports = { getCandles, getQuote, getBatchQuotes, searchSymbols, getEconomicCalendar, SYMBOL_MAP };
