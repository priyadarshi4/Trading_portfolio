const { Strategy } = require('../models/index');
const Trade = require('../models/Trade');
const { calcWinRate, calcProfitFactor, calcExpectancy, calcMaxDrawdown, calcEquityCurve } = require('../utils/analytics');

exports.getStrategies = async (req, res, next) => {
  try {
    const strategies = await Strategy.find({ user: req.user._id }).lean();
    res.json({ success: true, data: strategies });
  } catch (err) { next(err); }
};

exports.createStrategy = async (req, res, next) => {
  try {
    const strategy = await Strategy.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, data: strategy });
  } catch (err) { next(err); }
};

exports.updateStrategy = async (req, res, next) => {
  try {
    const strategy = await Strategy.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!strategy) return res.status(404).json({ success: false, message: 'Strategy not found' });
    res.json({ success: true, data: strategy });
  } catch (err) { next(err); }
};

exports.deleteStrategy = async (req, res, next) => {
  try {
    await Strategy.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true, message: 'Strategy deleted' });
  } catch (err) { next(err); }
};

// Sync strategy stats from actual trades
exports.syncStrategyStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const strategy = await Strategy.findOne({ _id: id, user: req.user._id });
    if (!strategy) return res.status(404).json({ success: false, message: 'Not found' });

    const trades = await Trade.find({ user: req.user._id, strategyUsed: strategy.name }).lean();
    const equityVals = calcEquityCurve(trades, 0).map(e => e.equity);
    const { maxDrawdown } = calcMaxDrawdown(equityVals);

    strategy.totalTrades  = trades.length;
    strategy.winRate      = calcWinRate(trades);
    strategy.netProfit    = trades.reduce((s, t) => s + (t.profitLoss || 0), 0);
    strategy.profitFactor = calcProfitFactor(trades);
    strategy.expectancy   = calcExpectancy(trades);
    strategy.maxDrawdown  = maxDrawdown;
    strategy.avgRR = trades.filter(t => t.riskRewardRatio > 0)
      .reduce((s, t) => s + t.riskRewardRatio, 0) /
      (trades.filter(t => t.riskRewardRatio > 0).length || 1);

    await strategy.save();
    res.json({ success: true, data: strategy });
  } catch (err) { next(err); }
};
