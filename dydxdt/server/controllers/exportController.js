const Trade = require('../models/Trade');
const User = require('../models/User');
const {
  calcWinRate, calcProfitFactor, calcExpectancy,
  calcSharpeRatio, calcMaxDrawdown, calcEquityCurve
} = require('../utils/analytics');

// @GET /api/export/trades.csv
exports.exportCSV = async (req, res, next) => {
  try {
    const trades = await Trade.find({ user: req.user._id }).sort('date').lean();

    const headers = [
      'Date','Symbol','Direction','Market','Entry','Exit','StopLoss','TakeProfit',
      'Quantity','Timeframe','Session','Strategy','P&L','P&L%','R:R','Result',
      'FollowedRules','Tags','Notes'
    ];

    const rows = trades.map(t => [
      new Date(t.date).toISOString().split('T')[0],
      t.symbol,
      t.direction,
      t.marketType,
      t.entryPrice,
      t.exitPrice,
      t.stopLoss || '',
      t.takeProfit || '',
      t.quantity,
      t.timeframe,
      t.session,
      t.strategyUsed || '',
      t.profitLoss?.toFixed(2) || '0',
      t.profitLossPercent?.toFixed(2) || '0',
      t.riskRewardRatio?.toFixed(2) || '0',
      t.result,
      t.followedRules === true ? 'YES' : t.followedRules === false ? 'NO' : '',
      (t.tags || []).join(';'),
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="dydxdt-trades-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) { next(err); }
};

// @GET /api/export/report.json  — full performance report
exports.exportReport = async (req, res, next) => {
  try {
    const trades = await Trade.find({ user: req.user._id }).sort('date').lean();
    const user   = await User.findById(req.user._id);

    const equityCurve  = calcEquityCurve(trades, user.initialCapital);
    const equityValues = equityCurve.map(e => e.equity);
    const { maxDrawdown, maxDrawdownPercent } = calcMaxDrawdown(equityValues);

    const wins   = trades.filter(t => t.result === 'WIN');
    const losses = trades.filter(t => t.result === 'LOSS');

    // Group by strategy
    const byStrategy = {};
    trades.forEach(t => {
      const s = t.strategyUsed || 'Untagged';
      if (!byStrategy[s]) byStrategy[s] = [];
      byStrategy[s].push(t);
    });

    // Group by symbol
    const bySymbol = {};
    trades.forEach(t => {
      if (!bySymbol[t.symbol]) bySymbol[t.symbol] = [];
      bySymbol[t.symbol].push(t);
    });

    // Group by month
    const byMonth = {};
    trades.forEach(t => {
      const key = new Date(t.date).toISOString().slice(0, 7);
      if (!byMonth[key]) byMonth[key] = [];
      byMonth[key].push(t);
    });

    const report = {
      generated: new Date().toISOString(),
      trader: user.name,
      period: {
        from: trades[0]?.date,
        to:   trades[trades.length - 1]?.date,
      },
      summary: {
        initialCapital: user.initialCapital,
        currentCapital: user.currentCapital,
        netProfit: trades.reduce((s, t) => s + (t.profitLoss || 0), 0),
        totalTrades: trades.length,
        wins: wins.length,
        losses: losses.length,
        winRate: calcWinRate(trades),
        profitFactor: calcProfitFactor(trades),
        expectancy: calcExpectancy(trades),
        sharpeRatio: calcSharpeRatio(trades),
        maxDrawdown,
        maxDrawdownPercent,
        avgWin:  wins.length   ? wins.reduce((s, t) => s + t.profitLoss, 0) / wins.length : 0,
        avgLoss: losses.length ? Math.abs(losses.reduce((s, t) => s + t.profitLoss, 0) / losses.length) : 0,
        avgRR:   trades.filter(t => t.riskRewardRatio > 0).reduce((s, t) => s + t.riskRewardRatio, 0) /
                 (trades.filter(t => t.riskRewardRatio > 0).length || 1),
      },
      byStrategy: Object.entries(byStrategy).map(([name, ts]) => ({
        name,
        trades:  ts.length,
        winRate: calcWinRate(ts),
        netProfit: ts.reduce((s, t) => s + (t.profitLoss || 0), 0),
        profitFactor: calcProfitFactor(ts),
        expectancy: calcExpectancy(ts),
      })).sort((a, b) => b.netProfit - a.netProfit),
      bySymbol: Object.entries(bySymbol).map(([sym, ts]) => ({
        symbol: sym,
        trades: ts.length,
        winRate: calcWinRate(ts),
        netProfit: ts.reduce((s, t) => s + (t.profitLoss || 0), 0),
      })).sort((a, b) => b.netProfit - a.netProfit),
      byMonth: Object.entries(byMonth).map(([month, ts]) => ({
        month,
        trades: ts.length,
        wins: ts.filter(t => t.result === 'WIN').length,
        pnl: ts.reduce((s, t) => s + (t.profitLoss || 0), 0),
        winRate: calcWinRate(ts),
      })).sort((a, b) => a.month.localeCompare(b.month)),
      equityCurve,
      trades: trades.map(t => ({
        date: t.date, symbol: t.symbol, direction: t.direction,
        entry: t.entryPrice, exit: t.exitPrice, sl: t.stopLoss,
        qty: t.quantity, rr: t.riskRewardRatio, pnl: t.profitLoss,
        result: t.result, strategy: t.strategyUsed, session: t.session,
      })),
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="dydxdt-report-${Date.now()}.json"`);
    res.json(report);
  } catch (err) { next(err); }
};
