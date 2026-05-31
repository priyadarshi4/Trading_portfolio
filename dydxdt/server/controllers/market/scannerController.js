const { getCandles, SYMBOL_MAP } = require('../../utils/market/dataService');
const { rsi: calcRSI, ema, macd, atr } = require('../../utils/market/indicators');

const SCAN_SYMBOLS = Object.keys(SYMBOL_MAP).slice(0, 20); // scan first 20 symbols

const scanSingle = async (symbol) => {
  try {
    const md      = await getCandles(symbol, 'D1', 100);
    const candles = md.candles;
    if (candles.length < 30) return null;

    const cl = candles.map(c => c.close);
    const n  = candles.length;
    const last = candles[n - 1];
    const prev = candles[n - 2];

    const rsiVals = calcRSI(cl, 14);
    const ema20   = ema(cl, 20);
    const ema50   = ema(cl, 50);
    const { histogram } = macd(cl);
    const atrVals = atr(candles, 14);

    const curRSI  = rsiVals[n - 1] || 50;
    const prevRSI = rsiVals[n - 2] || 50;
    const curEm20 = ema20[n - 1] || last.close;
    const curEm50 = ema50[n - 1] || last.close;
    const curHisto = histogram[n - 1] || 0;
    const prevHisto = histogram[n - 2] || 0;

    const high52w = Math.max(...candles.map(c => c.high));
    const low52w  = Math.min(...candles.map(c => c.low));
    const gapPct  = prev ? ((last.open - prev.close) / prev.close) * 100 : 0;
    const changePct = prev ? ((last.close - prev.close) / prev.close) * 100 : 0;

    const avgVol = candles.slice(-20).reduce((s, c) => s + (c.volume || 0), 0) / 20;
    const volSpike = last.volume > avgVol * 2;

    const signals = [];
    if (curRSI < 30)  signals.push('RSI Oversold');
    if (curRSI > 70)  signals.push('RSI Overbought');
    if (last.high >= high52w * 0.999) signals.push('52W High');
    if (last.low  <= low52w  * 1.001) signals.push('52W Low');
    if (volSpike) signals.push('Volume Spike');
    if (curEm20 > curEm50 && ema20[n - 2] < ema50[n - 2]) signals.push('EMA Crossover Bullish');
    if (curEm20 < curEm50 && ema20[n - 2] > ema50[n - 2]) signals.push('EMA Crossover Bearish');
    if (curHisto > 0 && prevHisto < 0) signals.push('MACD Bullish Cross');
    if (curHisto < 0 && prevHisto > 0) signals.push('MACD Bearish Cross');
    if (gapPct > 1)  signals.push('Gap Up');
    if (gapPct < -1) signals.push('Gap Down');
    if (Math.abs(changePct) > 2) signals.push('Strong Move');

    return {
      symbol,
      name:      md.name,
      category:  md.category,
      price:     last.close,
      change:    parseFloat(changePct.toFixed(2)),
      rsi:       parseFloat(curRSI.toFixed(1)),
      volume:    last.volume,
      volumeAvg: parseFloat(avgVol.toFixed(0)),
      volSpike,
      signals,
      ema20:     parseFloat(curEm20.toFixed(5)),
      ema50:     parseFloat(curEm50.toFixed(5)),
      above200:  last.close > (ema(cl, 200)[n - 1] || 0),
    };
  } catch { return null; }
};

// @GET /api/scanner?filter=RSI Oversold
exports.scan = async (req, res, next) => {
  try {
    const { filter, category } = req.query;

    // Scan in parallel with concurrency limit
    const BATCH = 5;
    const results = [];
    for (let i = 0; i < SCAN_SYMBOLS.length; i += BATCH) {
      const batch = SCAN_SYMBOLS.slice(i, i + BATCH);
      const settled = await Promise.allSettled(batch.map(scanSingle));
      settled.forEach(r => { if (r.status === 'fulfilled' && r.value) results.push(r.value); });
    }

    let filtered = results.filter(Boolean);
    if (category) filtered = filtered.filter(r => r.category === category);
    if (filter)   filtered = filtered.filter(r => r.signals.some(s => s.toLowerCase().includes(filter.toLowerCase())));

    filtered.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    res.json({ success: true, count: filtered.length, data: filtered });
  } catch (err) { next(err); }
};

// @GET /api/scanner/filters — available scan filters
exports.getFilters = (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'RSI Oversold',           label: 'RSI Oversold (<30)',       icon: '↓', color: '#ff3366' },
      { id: 'RSI Overbought',         label: 'RSI Overbought (>70)',      icon: '↑', color: '#00ffb3' },
      { id: 'MACD Bullish Cross',     label: 'MACD Bullish Crossover',   icon: '⊕', color: '#00ffb3' },
      { id: 'MACD Bearish Cross',     label: 'MACD Bearish Crossover',   icon: '⊖', color: '#ff3366' },
      { id: 'EMA Crossover Bullish',  label: 'EMA Golden Cross',         icon: '★', color: '#e8ff00' },
      { id: 'EMA Crossover Bearish',  label: 'EMA Death Cross',          icon: '☆', color: '#ff3366' },
      { id: 'Volume Spike',           label: 'Volume Spike (2x avg)',     icon: '⬆', color: '#a78bfa' },
      { id: '52W High',               label: 'New 52 Week High',          icon: '▲', color: '#00ffb3' },
      { id: '52W Low',                label: 'New 52 Week Low',           icon: '▼', color: '#ff3366' },
      { id: 'Gap Up',                 label: 'Gap Up (>1%)',              icon: '⇑', color: '#00ffb3' },
      { id: 'Gap Down',               label: 'Gap Down (<-1%)',           icon: '⇓', color: '#ff3366' },
      { id: 'Strong Move',            label: 'Strong Move (>2%)',         icon: '⚡', color: '#e8ff00' },
    ]
  });
};
