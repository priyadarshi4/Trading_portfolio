/**
 * Core analytics calculation engine for Dy/Dx/Dt
 */

const calcWinRate = (trades) => {
  if (!trades.length) return 0;
  const wins = trades.filter(t => t.profitLoss > 0).length;
  return parseFloat(((wins / trades.length) * 100).toFixed(2));
};

const calcProfitFactor = (trades) => {
  const grossProfit = trades.filter(t => t.profitLoss > 0).reduce((s, t) => s + t.profitLoss, 0);
  const grossLoss   = Math.abs(trades.filter(t => t.profitLoss < 0).reduce((s, t) => s + t.profitLoss, 0));
  if (!grossLoss) return grossProfit > 0 ? 999 : 0;
  return parseFloat((grossProfit / grossLoss).toFixed(2));
};

const calcExpectancy = (trades) => {
  if (!trades.length) return 0;
  const wins   = trades.filter(t => t.profitLoss > 0);
  const losses = trades.filter(t => t.profitLoss < 0);
  const winRate   = wins.length / trades.length;
  const avgWin    = wins.length   ? wins.reduce((s, t) => s + t.profitLoss, 0) / wins.length : 0;
  const avgLoss   = losses.length ? Math.abs(losses.reduce((s, t) => s + t.profitLoss, 0) / losses.length) : 0;
  return parseFloat(((winRate * avgWin) - ((1 - winRate) * avgLoss)).toFixed(2));
};

const calcSharpeRatio = (trades, riskFreeRate = 0) => {
  if (trades.length < 2) return 0;
  const returns = trades.map(t => t.profitLossPercent || 0);
  const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
  const variance = returns.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / (returns.length - 1);
  const stdDev = Math.sqrt(variance);
  if (!stdDev) return 0;
  return parseFloat(((mean - riskFreeRate) / stdDev).toFixed(2));
};

const calcMaxDrawdown = (equityCurve) => {
  if (!equityCurve.length) return { maxDrawdown: 0, maxDrawdownPercent: 0 };
  let peak = equityCurve[0];
  let maxDD = 0;
  let maxDDPct = 0;
  for (const point of equityCurve) {
    if (point > peak) peak = point;
    const dd = peak - point;
    const ddPct = (dd / peak) * 100;
    if (dd > maxDD) { maxDD = dd; maxDDPct = ddPct; }
  }
  return {
    maxDrawdown: parseFloat(maxDD.toFixed(2)),
    maxDrawdownPercent: parseFloat(maxDDPct.toFixed(2))
  };
};

const calcEquityCurve = (trades, initialCapital) => {
  let equity = initialCapital;
  return trades
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(t => {
      equity += t.profitLoss || 0;
      return {
        date: t.date,
        equity: parseFloat(equity.toFixed(2)),
        tradeId: t._id,
        pnl: t.profitLoss
      };
    });
};

const calcRiskReward = (entry, exit, stopLoss, direction) => {
  if (!entry || !exit || !stopLoss) return 0;
  const risk   = Math.abs(entry - stopLoss);
  const reward = Math.abs(exit - entry);
  if (!risk) return 0;
  // Validate direction
  if (direction === 'LONG'  && exit < entry) return parseFloat((-reward / risk).toFixed(2));
  if (direction === 'SHORT' && exit > entry) return parseFloat((-reward / risk).toFixed(2));
  return parseFloat((reward / risk).toFixed(2));
};

const calcProfitLoss = (entry, exit, quantity, direction) => {
  if (!entry || !exit || !quantity) return 0;
  const raw = direction === 'LONG'
    ? (exit - entry) * quantity
    : (entry - exit) * quantity;
  return parseFloat(raw.toFixed(2));
};

const calcPositionSize = (capital, riskPercent, entryPrice, stopLoss) => {
  const riskAmount = capital * (riskPercent / 100);
  const slDistance = Math.abs(entryPrice - stopLoss);
  if (!slDistance) return 0;
  return parseFloat((riskAmount / slDistance).toFixed(4));
};

const calcPeriodPnL = (trades, period) => {
  const now = new Date();
  const cutoff = new Date();
  if      (period === 'day')   cutoff.setHours(0, 0, 0, 0);
  else if (period === 'week')  cutoff.setDate(now.getDate() - 7);
  else if (period === 'month') cutoff.setMonth(now.getMonth() - 1);
  else if (period === 'year')  cutoff.setFullYear(now.getFullYear() - 1);

  return trades
    .filter(t => new Date(t.date) >= cutoff)
    .reduce((s, t) => s + (t.profitLoss || 0), 0);
};

const buildCalendarData = (trades) => {
  const map = {};
  trades.forEach(t => {
    const key = new Date(t.date).toISOString().split('T')[0];
    if (!map[key]) map[key] = { date: key, pnl: 0, trades: 0, wins: 0 };
    map[key].pnl    += t.profitLoss || 0;
    map[key].trades += 1;
    if (t.profitLoss > 0) map[key].wins += 1;
  });
  return Object.values(map);
};

module.exports = {
  calcWinRate, calcProfitFactor, calcExpectancy, calcSharpeRatio,
  calcMaxDrawdown, calcEquityCurve, calcRiskReward, calcProfitLoss,
  calcPositionSize, calcPeriodPnL, buildCalendarData
};
