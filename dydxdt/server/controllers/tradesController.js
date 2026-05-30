const Trade = require('../models/Trade');
const User = require('../models/User');
const {
  calcWinRate,
  calcProfitFactor,
  calcExpectancy,
  calcSharpeRatio,
  calcMaxDrawdown,
  calcEquityCurve,
  calcPeriodPnL,
  buildCalendarData,
  calcProfitLoss,
  calcRiskReward
} = require('../utils/analytics');

// Helper: update user's currentCapital
const syncCapital = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return;
  const trades = await Trade.find({ user: userId });
  const netPnL = trades.reduce((s, t) => s + (t.profitLoss || 0), 0);
  user.currentCapital = user.initialCapital + netPnL;
  await user.save({ validateBeforeSave: false });
};

// @GET /api/trades
exports.getTrades = async (req, res, next) => {
  try {
    const { symbol, result, strategy, marketType, direction,
            from, to, page = 1, limit = 50, sort = '-date' } = req.query;

    const filter = { user: req.user._id };
    if (symbol)     filter.symbol     = symbol.toUpperCase();
    if (result)     filter.result     = result;
    if (strategy)   filter.strategyUsed = strategy;
    if (marketType) filter.marketType = marketType;
    if (direction)  filter.direction  = direction;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to)   filter.date.$lte = new Date(to);
    }

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Trade.countDocuments(filter);
    const trades = await Trade.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      count: trades.length,
      total,
      pages: Math.ceil(total / limit),
      page: parseInt(page),
      data: trades
    });
  } catch (err) { next(err); }
};

// @POST /api/trades
exports.createTrade = async (req, res, next) => {
  try {
    const trade = await Trade.create({ ...req.body, user: req.user._id });
    await syncCapital(req.user._id);
    res.status(201).json({ success: true, data: trade });
  } catch (err) { next(err); }
};

// @GET /api/trades/:id
exports.getTrade = async (req, res, next) => {
  try {
    const trade = await Trade.findOne({ _id: req.params.id, user: req.user._id });
    if (!trade) return res.status(404).json({ success: false, message: 'Trade not found' });
    res.json({ success: true, data: trade });
  } catch (err) { next(err); }
};

// @PUT /api/trades/:id
exports.updateTrade = async (req, res, next) => {
  try {
    let trade = await Trade.findOne({ _id: req.params.id, user: req.user._id });
    if (!trade) return res.status(404).json({ success: false, message: 'Trade not found' });
    Object.assign(trade, req.body);
    await trade.save(); // triggers pre-save hooks
    await syncCapital(req.user._id);
    res.json({ success: true, data: trade });
  } catch (err) { next(err); }
};

// @DELETE /api/trades/:id
exports.deleteTrade = async (req, res, next) => {
  try {
    const trade = await Trade.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!trade) return res.status(404).json({ success: false, message: 'Trade not found' });
    await syncCapital(req.user._id);
    res.json({ success: true, message: 'Trade deleted' });
  } catch (err) { next(err); }
};

// @POST /api/trades/bulk
exports.bulkImportTrades = async (req, res, next) => {
  try {
    const { trades } = req.body;
    if (!Array.isArray(trades) || trades.length === 0) {
      return res.status(400).json({ success: false, message: 'trades array is required' });
    }
    if (trades.length > 2000) {
      return res.status(400).json({ success: false, message: 'Maximum 2000 trades per import' });
    }

    const docs = trades.map(t => {
  const profitLoss = calcProfitLoss(
    Number(t.entryPrice),
    Number(t.exitPrice),
    Number(t.quantity || 1),
    t.direction
  );

  return {
    ...t,
    user: req.user._id,
    profitLoss,
    result:
      Math.abs(profitLoss) < 0.01
        ? 'BE'
        : profitLoss > 0
        ? 'WIN'
        : 'LOSS',
    riskRewardRatio:
      t.stopLoss
        ? calcRiskReward(
            Number(t.entryPrice),
            Number(t.exitPrice),
            Number(t.stopLoss),
            t.direction
          )
        : 0
  };
});

    // insertMany with ordered:false so partial success is possible
    let imported = 0, failed = 0;
    try {
      const result = await Trade.insertMany(docs, { ordered: false });
      imported = result.length;
    } catch (bulkErr) {
      // mongoose BulkWriteError — some succeeded, some failed
      imported = bulkErr.result?.nInserted || 0;
      failed   = docs.length - imported;
    }

    await syncCapital(req.user._id);
    res.status(201).json({ success: true, imported, failed });
  } catch (err) { next(err); }
};

// @GET /api/trades/stats/summary
exports.getSummary = async (req, res, next) => {
  try {
    const trades  = await Trade.find({ user: req.user._id }).lean();
    const user    = await User.findById(req.user._id);
    const equityCurve = calcEquityCurve(trades, user.initialCapital);
    const equityValues = equityCurve.map(e => e.equity);
    const { maxDrawdown, maxDrawdownPercent } = calcMaxDrawdown(equityValues);

    const wins   = trades.filter(t => t.result === 'WIN');
    const losses = trades.filter(t => t.result === 'LOSS');

    res.json({
      success: true,
      data: {
        totalTrades: trades.length,
        wins: wins.length,
        losses: losses.length,
        breakEven: trades.filter(t => t.result === 'BE').length,
        winRate: calcWinRate(trades),
        profitFactor: calcProfitFactor(trades),
        expectancy: calcExpectancy(trades),
        sharpeRatio: calcSharpeRatio(trades),
        maxDrawdown,
        maxDrawdownPercent,
        netProfit: trades.reduce((s, t) => s + (t.profitLoss || 0), 0),
        grossProfit: wins.reduce((s, t) => s + t.profitLoss, 0),
        grossLoss: Math.abs(losses.reduce((s, t) => s + t.profitLoss, 0)),
        avgWin: wins.length ? wins.reduce((s, t) => s + t.profitLoss, 0) / wins.length : 0,
        avgLoss: losses.length ? Math.abs(losses.reduce((s, t) => s + t.profitLoss, 0) / losses.length) : 0,
        avgRR: trades.filter(t => t.riskRewardRatio > 0).reduce((s, t) => s + t.riskRewardRatio, 0) /
               (trades.filter(t => t.riskRewardRatio > 0).length || 1),
        todayPnL: calcPeriodPnL(trades, 'day'),
        weeklyPnL: calcPeriodPnL(trades, 'week'),
        monthlyPnL: calcPeriodPnL(trades, 'month'),
        initialCapital: user.initialCapital,
        currentCapital: user.currentCapital,
        equityCurve,
        calendar: buildCalendarData(trades),
      }
    });
  } catch (err) { next(err); }
};

// @GET /api/trades/stats/by-strategy
exports.getByStrategy = async (req, res, next) => {
  try {
    const results = await Trade.aggregate([
      { $match: { user: req.user._id, strategyUsed: { $ne: null } } },
      { $group: {
        _id: '$strategyUsed',
        totalTrades:  { $sum: 1 },
        wins:         { $sum: { $cond: [{ $eq: ['$result', 'WIN'] }, 1, 0] } },
        netProfit:    { $sum: '$profitLoss' },
        avgRR:        { $avg: '$riskRewardRatio' },
        avgPnL:       { $avg: '$profitLoss' },
      }},
      { $addFields: {
        winRate: { $multiply: [{ $divide: ['$wins', '$totalTrades'] }, 100] }
      }},
      { $sort: { netProfit: -1 } }
    ]);
    res.json({ success: true, data: results });
  } catch (err) { next(err); }
};

// @GET /api/trades/stats/by-symbol
exports.getBySymbol = async (req, res, next) => {
  try {
    const results = await Trade.aggregate([
      { $match: { user: req.user._id } },
      { $group: {
        _id: '$symbol',
        totalTrades: { $sum: 1 },
        wins:        { $sum: { $cond: [{ $eq: ['$result', 'WIN'] }, 1, 0] } },
        netProfit:   { $sum: '$profitLoss' },
        avgRR:       { $avg: '$riskRewardRatio' },
      }},
      { $addFields: {
        winRate: { $multiply: [{ $divide: ['$wins', '$totalTrades'] }, 100] }
      }},
      { $sort: { netProfit: -1 } }
    ]);
    res.json({ success: true, data: results });
  } catch (err) { next(err); }
};

// @GET /api/trades/stats/monthly
exports.getMonthly = async (req, res, next) => {
  try {
    const results = await Trade.aggregate([
      { $match: { user: req.user._id } },
      { $group: {
        _id: { year: { $year: '$date' }, month: { $month: '$date' } },
        pnl:    { $sum: '$profitLoss' },
        trades: { $sum: 1 },
        wins:   { $sum: { $cond: [{ $eq: ['$result', 'WIN'] }, 1, 0] } },
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    res.json({ success: true, data: results });
  } catch (err) { next(err); }
};

// @GET /api/trades/stats/by-session
exports.getBySession = async (req, res, next) => {
  try {
    const results = await Trade.aggregate([
      { $match: { user: req.user._id } },
      { $group: {
        _id: '$session',
        totalTrades: { $sum: 1 },
        wins:        { $sum: { $cond: [{ $eq: ['$result', 'WIN'] }, 1, 0] } },
        netProfit:   { $sum: '$profitLoss' },
      }},
      { $addFields: {
        winRate: { $multiply: [{ $divide: ['$wins', '$totalTrades'] }, 100] }
      }}
    ]);
    res.json({ success: true, data: results });
  } catch (err) { next(err); }
};
