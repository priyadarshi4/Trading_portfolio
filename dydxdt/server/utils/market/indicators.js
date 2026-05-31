/**
 * Technical Indicator Engine for Dy/Dx/Dt Market Analysis
 * Pure JS — no external TA library needed
 */

// ── HELPERS ───────────────────────────────────────────────────────────────────
const closes  = candles => candles.map(c => c.close);
const highs   = candles => candles.map(c => c.high);
const lows    = candles => candles.map(c => c.low);
const volumes = candles => candles.map(c => c.volume || 0);

// ── MOVING AVERAGES ───────────────────────────────────────────────────────────
const sma = (data, period) => {
  const result = new Array(data.length).fill(null);
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    result[i] = slice.reduce((s, v) => s + v, 0) / period;
  }
  return result;
};

const ema = (data, period) => {
  const result = new Array(data.length).fill(null);
  const k = 2 / (period + 1);
  let prev = null;
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { result[i] = null; continue; }
    if (i === period - 1) {
      prev = data.slice(0, period).reduce((s, v) => s + v, 0) / period;
      result[i] = prev; continue;
    }
    prev = data[i] * k + prev * (1 - k);
    result[i] = prev;
  }
  return result;
};

const wma = (data, period) => {
  const result = new Array(data.length).fill(null);
  const denom = (period * (period + 1)) / 2;
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) sum += data[i - j] * (period - j);
    result[i] = sum / denom;
  }
  return result;
};

// ── RSI ───────────────────────────────────────────────────────────────────────
const rsi = (data, period = 14) => {
  const result = new Array(data.length).fill(null);
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = data[i] - data[i - 1];
    if (diff > 0) gains += diff; else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  result[period] = 100 - 100 / (1 + avgGain / (avgLoss || 0.0001));
  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
    result[i] = 100 - 100 / (1 + avgGain / (avgLoss || 0.0001));
  }
  return result;
};

// ── MACD ──────────────────────────────────────────────────────────────────────
const macd = (data, fast = 12, slow = 26, signal = 9) => {
  const fastEma = ema(data, fast);
  const slowEma = ema(data, slow);
  const macdLine = data.map((_, i) =>
    fastEma[i] !== null && slowEma[i] !== null ? fastEma[i] - slowEma[i] : null
  );
  const validMacd = macdLine.map(v => v ?? 0);
  const signalLine = ema(validMacd, signal);
  const histogram = macdLine.map((v, i) =>
    v !== null && signalLine[i] !== null ? v - signalLine[i] : null
  );
  return { macdLine, signalLine, histogram };
};

// ── BOLLINGER BANDS ───────────────────────────────────────────────────────────
const bollingerBands = (data, period = 20, stdDevMult = 2) => {
  const middle = sma(data, period);
  const upper  = new Array(data.length).fill(null);
  const lower  = new Array(data.length).fill(null);
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const mean  = middle[i];
    const variance = slice.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / period;
    const std = Math.sqrt(variance);
    upper[i] = mean + stdDevMult * std;
    lower[i] = mean - stdDevMult * std;
  }
  return { upper, middle, lower };
};

// ── ATR ───────────────────────────────────────────────────────────────────────
const atr = (candles, period = 14) => {
  const result = new Array(candles.length).fill(null);
  const trueRanges = candles.map((c, i) => {
    if (i === 0) return c.high - c.low;
    const prev = candles[i - 1].close;
    return Math.max(c.high - c.low, Math.abs(c.high - prev), Math.abs(c.low - prev));
  });
  for (let i = period - 1; i < candles.length; i++) {
    result[i] = trueRanges.slice(i - period + 1, i + 1).reduce((s, v) => s + v, 0) / period;
  }
  return result;
};

// ── STOCHASTIC RSI ────────────────────────────────────────────────────────────
const stochasticRSI = (data, period = 14, kPeriod = 3, dPeriod = 3) => {
  const rsiVals = rsi(data, period);
  const kLine   = new Array(data.length).fill(null);
  for (let i = period + period - 2; i < data.length; i++) {
    const slice = rsiVals.slice(i - period + 1, i + 1).filter(v => v !== null);
    if (slice.length < period) continue;
    const minRSI = Math.min(...slice);
    const maxRSI = Math.max(...slice);
    kLine[i] = maxRSI === minRSI ? 50 : ((rsiVals[i] - minRSI) / (maxRSI - minRSI)) * 100;
  }
  const dLine = sma(kLine.map(v => v ?? 0), dPeriod);
  return { k: kLine, d: dLine };
};

// ── OBV ───────────────────────────────────────────────────────────────────────
const obv = (candles) => {
  const result = [0];
  for (let i = 1; i < candles.length; i++) {
    const prev = result[i - 1];
    const vol  = candles[i].volume || 0;
    if (candles[i].close > candles[i - 1].close)      result.push(prev + vol);
    else if (candles[i].close < candles[i - 1].close) result.push(prev - vol);
    else                                               result.push(prev);
  }
  return result;
};

// ── VWAP ──────────────────────────────────────────────────────────────────────
const vwap = (candles) => {
  let cumTPV = 0, cumVol = 0;
  return candles.map(c => {
    const tp = (c.high + c.low + c.close) / 3;
    cumTPV += tp * (c.volume || 0);
    cumVol += c.volume || 0;
    return cumVol ? cumTPV / cumVol : tp;
  });
};

// ── SUPERTREND ────────────────────────────────────────────────────────────────
const supertrend = (candles, period = 10, multiplier = 3) => {
  const atrVals = atr(candles, period);
  const result  = new Array(candles.length).fill(null);
  const dir     = new Array(candles.length).fill(1);
  let upperBand = 0, lowerBand = 0;
  for (let i = period; i < candles.length; i++) {
    const hl2  = (candles[i].high + candles[i].low) / 2;
    const atrV = atrVals[i] || 0;
    const newUpper = hl2 + multiplier * atrV;
    const newLower = hl2 - multiplier * atrV;
    upperBand = newUpper < upperBand || candles[i - 1].close > upperBand ? newUpper : upperBand;
    lowerBand = newLower > lowerBand || candles[i - 1].close < lowerBand ? newLower : lowerBand;
    if (candles[i].close > upperBand) dir[i] = 1;
    else if (candles[i].close < lowerBand) dir[i] = -1;
    else dir[i] = dir[i - 1];
    result[i] = dir[i] === 1 ? lowerBand : upperBand;
  }
  return { values: result, direction: dir };
};

// ── PARABOLIC SAR ─────────────────────────────────────────────────────────────
const parabolicSAR = (candles, start = 0.02, increment = 0.02, max = 0.2) => {
  const result = new Array(candles.length).fill(null);
  let bull = true, af = start, ep = candles[0].low, sar = candles[0].high;
  for (let i = 2; i < candles.length; i++) {
    sar = sar + af * (ep - sar);
    if (bull) {
      if (candles[i].low < sar) {
        bull = false; sar = ep; ep = candles[i].low; af = start;
      } else {
        if (candles[i].high > ep) { ep = candles[i].high; af = Math.min(af + increment, max); }
        sar = Math.min(sar, candles[i - 1].low, candles[i - 2].low);
      }
    } else {
      if (candles[i].high > sar) {
        bull = true; sar = ep; ep = candles[i].high; af = start;
      } else {
        if (candles[i].low < ep) { ep = candles[i].low; af = Math.min(af + increment, max); }
        sar = Math.max(sar, candles[i - 1].high, candles[i - 2].high);
      }
    }
    result[i] = parseFloat(sar.toFixed(5));
  }
  return result;
};

// ── CCI ───────────────────────────────────────────────────────────────────────
const cci = (candles, period = 20) => {
  const result = new Array(candles.length).fill(null);
  for (let i = period - 1; i < candles.length; i++) {
    const slice   = candles.slice(i - period + 1, i + 1);
    const tpSlice = slice.map(c => (c.high + c.low + c.close) / 3);
    const mean    = tpSlice.reduce((s, v) => s + v, 0) / period;
    const meanDev = tpSlice.reduce((s, v) => s + Math.abs(v - mean), 0) / period;
    result[i] = meanDev ? (tpSlice[tpSlice.length - 1] - mean) / (0.015 * meanDev) : 0;
  }
  return result;
};

// ── WILLIAMS %R ───────────────────────────────────────────────────────────────
const williamsR = (candles, period = 14) => {
  const result = new Array(candles.length).fill(null);
  for (let i = period - 1; i < candles.length; i++) {
    const slice    = candles.slice(i - period + 1, i + 1);
    const highestH = Math.max(...slice.map(c => c.high));
    const lowestL  = Math.min(...slice.map(c => c.low));
    result[i] = highestH === lowestL ? -50 : ((highestH - candles[i].close) / (highestH - lowestL)) * -100;
  }
  return result;
};

// ── FIBONACCI LEVELS ──────────────────────────────────────────────────────────
const fibonacci = (high, low) => {
  const diff = high - low;
  return {
    level0:   high,
    level236: high - diff * 0.236,
    level382: high - diff * 0.382,
    level500: high - diff * 0.5,
    level618: high - diff * 0.618,
    level786: high - diff * 0.786,
    level1:   low,
    level1272: low - diff * 0.272,
    level1618: low - diff * 0.618,
  };
};

// ── SUPPORT & RESISTANCE ──────────────────────────────────────────────────────
const supportResistance = (candles, lookback = 5) => {
  const supports    = [];
  const resistances = [];
  for (let i = lookback; i < candles.length - lookback; i++) {
    const c = candles[i];
    const windowHighs = candles.slice(i - lookback, i + lookback + 1).map(x => x.high);
    const windowLows  = candles.slice(i - lookback, i + lookback + 1).map(x => x.low);
    if (c.high === Math.max(...windowHighs)) resistances.push(c.high);
    if (c.low  === Math.min(...windowLows))  supports.push(c.low);
  }
  // Cluster nearby levels
  const cluster = (levels, threshold = 0.003) => {
    const sorted = [...levels].sort((a, b) => a - b);
    const clusters = [];
    let group = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
      if ((sorted[i] - sorted[i - 1]) / sorted[i - 1] < threshold) {
        group.push(sorted[i]);
      } else {
        clusters.push(group.reduce((s, v) => s + v, 0) / group.length);
        group = [sorted[i]];
      }
    }
    if (group.length) clusters.push(group.reduce((s, v) => s + v, 0) / group.length);
    return clusters;
  };
  return {
    supports:    cluster(supports).slice(-4).map(v => parseFloat(v.toFixed(2))),
    resistances: cluster(resistances).slice(-4).map(v => parseFloat(v.toFixed(2))),
  };
};

// ── PATTERN DETECTION ─────────────────────────────────────────────────────────
const detectPatterns = (candles) => {
  const patterns = [];
  const n = candles.length;
  if (n < 20) return patterns;

  const c = closes(candles);
  const h = highs(candles);
  const l = lows(candles);

  // Double Top
  const recent = candles.slice(-30);
  const recentH = highs(recent);
  const max1Idx = recentH.indexOf(Math.max(...recentH));
  const max2Idx = recentH.lastIndexOf(Math.max(...recentH.slice(max1Idx + 3)));
  if (max2Idx > max1Idx + 3 && Math.abs(recentH[max1Idx] - recentH[max2Idx]) / recentH[max1Idx] < 0.01) {
    patterns.push({ name: 'Double Top', confidence: 72, direction: 'Bearish' });
  }

  // Higher lows trend (Ascending Triangle)
  const recentLows = lows(candles.slice(-20));
  let ascLows = true;
  for (let i = 1; i < recentLows.length; i += 4) {
    if (recentLows[i] <= recentLows[i - 1]) { ascLows = false; break; }
  }
  if (ascLows) patterns.push({ name: 'Ascending Triangle', confidence: 65, direction: 'Bullish' });

  // Bullish engulfing (last 2 candles)
  if (n >= 2) {
    const prev = candles[n - 2];
    const curr = candles[n - 1];
    if (prev.close < prev.open && curr.close > curr.open &&
        curr.open < prev.close && curr.close > prev.open) {
      patterns.push({ name: 'Bullish Engulfing', confidence: 78, direction: 'Bullish' });
    }
    if (prev.close > prev.open && curr.close < curr.open &&
        curr.open > prev.close && curr.close < prev.open) {
      patterns.push({ name: 'Bearish Engulfing', confidence: 78, direction: 'Bearish' });
    }
  }

  // Doji
  if (n >= 1) {
    const last = candles[n - 1];
    const bodySize = Math.abs(last.close - last.open);
    const range    = last.high - last.low;
    if (range > 0 && bodySize / range < 0.1) {
      patterns.push({ name: 'Doji', confidence: 60, direction: 'Neutral' });
    }
  }

  return patterns.slice(0, 5);
};

// ── FULL ANALYSIS ENGINE ──────────────────────────────────────────────────────
const runFullAnalysis = (candles, symbol = '') => {
  if (!candles || candles.length < 30) return null;
  const cl = closes(candles);
  const n  = candles.length;
  const last = candles[n - 1];

  // Core indicators
  const rsi14      = rsi(cl, 14);
  const ema20      = ema(cl, 20);
  const ema50      = ema(cl, 50);
  const ema200     = ema(cl, 200);
  const { macdLine, signalLine, histogram } = macd(cl);
  const { upper: bbUp, middle: bbMid, lower: bbLow } = bollingerBands(cl);
  const atr14      = atr(candles, 14);
  const stochRSI   = stochasticRSI(cl);
  const { values: st, direction: stDir } = supertrend(candles);

  const curRSI     = rsi14[n - 1] || 50;
  const curMACD    = macdLine[n - 1] || 0;
  const curSignal  = signalLine[n - 1] || 0;
  const curHisto   = histogram[n - 1] || 0;
  const prevHisto  = histogram[n - 2] || 0;
  const curEma20   = ema20[n - 1] || last.close;
  const curEma50   = ema50[n - 1] || last.close;
  const curEma200  = ema200[n - 1] || last.close;
  const curATR     = atr14[n - 1] || 0;
  const curST      = stDir[n - 1] || 0;
  const curBBUp    = bbUp[n - 1] || last.close;
  const curBBLow   = bbLow[n - 1] || last.close;

  // Volume analysis
  const avgVol = candles.slice(-20).reduce((s, c) => s + (c.volume || 0), 0) / 20;
  const curVol = last.volume || 0;
  const volStatus = curVol > avgVol * 1.5 ? 'High' : curVol > avgVol * 0.8 ? 'Average' : 'Low';

  // Trend determination
  let bullPoints = 0, bearPoints = 0;
  if (last.close > curEma20)  bullPoints++; else bearPoints++;
  if (curEma20   > curEma50)  bullPoints++; else bearPoints++;
  if (curEma50   > curEma200) bullPoints++; else bearPoints++;
  if (curST === 1)            bullPoints++; else bearPoints++;
  if (curRSI > 50)            bullPoints++; else bearPoints++;
  if (curHisto > prevHisto)   bullPoints++; else bearPoints++;

  const totalPoints = bullPoints + bearPoints;
  const bullPct = (bullPoints / totalPoints) * 100;
  const trend = bullPct >= 67 ? 'Bullish' : bullPct <= 33 ? 'Bearish' : 'Neutral';
  const strength = Math.abs(bullPct - 50) > 20 ? 'Strong' : Math.abs(bullPct - 50) > 10 ? 'Moderate' : 'Weak';
  const bias = bullPct >= 55 ? 'Long' : bullPct <= 45 ? 'Short' : 'Neutral';
  const confidence = Math.round(Math.abs(bullPct - 50) * 2 + 50);

  // Risk level
  const bbWidth = (curBBUp - curBBLow) / curBBLow * 100;
  const riskLevel = bbWidth > 4 ? 'High' : bbWidth > 2 ? 'Medium' : 'Low';

  // MACD signal text
  const macdSignal = curHisto > 0 && curHisto > prevHisto ? 'Bullish Crossover' :
                     curHisto > 0 ? 'Bullish' :
                     curHisto < 0 && curHisto < prevHisto ? 'Bearish Crossover' : 'Bearish';

  // Support / Resistance
  const { supports, resistances } = supportResistance(candles);

  // Trading signal
  const slDist   = curATR * 1.5;
  const tgtDist  = slDist * 2;
  const signal = {
    type: bias === 'Long' ? 'LONG' : bias === 'Short' ? 'SHORT' : 'NEUTRAL',
    entry:    parseFloat(last.close.toFixed(5)),
    stopLoss: parseFloat((bias === 'Long' ? last.close - slDist : last.close + slDist).toFixed(5)),
    target1:  parseFloat((bias === 'Long' ? last.close + tgtDist : last.close - tgtDist).toFixed(5)),
    target2:  parseFloat((bias === 'Long' ? last.close + tgtDist * 1.5 : last.close - tgtDist * 1.5).toFixed(5)),
    rr:       2,
  };

  // Multi-timeframe mock (based on shifted periods)
  const mtfFrames = ['M15','H1','H4','D1','W1'];
  const mtf = mtfFrames.map((tf, i) => {
    const shift  = i * 3;
    const tRsi   = rsi14[Math.max(0, n - 1 - shift)] || 50;
    const tHisto = histogram[Math.max(0, n - 1 - shift)] || 0;
    const tPrev  = histogram[Math.max(0, n - 2 - shift)] || 0;
    const tTrend = tRsi > 55 ? 'Bullish' : tRsi < 45 ? 'Bearish' : 'Neutral';
    const tMacd  = tHisto > tPrev ? 'Bullish' : 'Bearish';
    const tScore = (tRsi > 50 ? 1 : 0) + (tHisto > 0 ? 1 : 0) + (tHisto > tPrev ? 1 : 0);
    const rec    = tScore === 3 ? 'Strong Buy' : tScore === 2 ? 'Buy' : tScore === 1 ? 'Neutral' : tScore === 0 ? 'Strong Sell' : 'Sell';
    return { timeframe: tf, trend: tTrend, rsi: parseFloat(tRsi.toFixed(1)), macd: tMacd, recommendation: rec };
  });

  // Patterns
  const patterns = detectPatterns(candles);

  // Sentiment (0-100 scale, based on indicators)
  const sentiment = Math.round(
    (curRSI / 100) * 30 +
    (bullPoints / totalPoints) * 40 +
    (curVol > avgVol ? 15 : 5) +
    (curHisto > 0 ? 15 : 0)
  );

  return {
    symbol,
    price: last.close,
    change: parseFloat(((last.close - candles[n - 2]?.close) / candles[n - 2]?.close * 100).toFixed(2)),
    trend, trendStrength: strength, bias, confidence,
    riskLevel, rsi: parseFloat(curRSI.toFixed(1)),
    macdSignal, volumeStatus: volStatus,
    sentiment,
    supportLevels: supports,
    resistanceLevels: resistances,
    signal,
    mtf,
    patterns,
    indicators: {
      ema20: parseFloat(curEma20.toFixed(5)),
      ema50: parseFloat(curEma50.toFixed(5)),
      ema200: parseFloat(curEma200.toFixed(5)),
      bbUpper: parseFloat(curBBUp.toFixed(5)),
      bbLower: parseFloat(curBBLow.toFixed(5)),
      atr: parseFloat(curATR.toFixed(5)),
      stochK: parseFloat((stochRSI.k[n - 1] || 50).toFixed(1)),
      supertrendBull: curST === 1,
    },
  };
};

module.exports = {
  sma, ema, wma, rsi, macd, bollingerBands, atr, stochasticRSI,
  obv, vwap, supertrend, parabolicSAR, cci, williamsR,
  fibonacci, supportResistance, detectPatterns, runFullAnalysis,
};
