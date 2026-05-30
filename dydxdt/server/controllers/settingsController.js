const User = require('../models/User');

exports.getSettings = async (req, res, next) => {
  try {
    const user = req.user;
    res.json({
      success: true,
      data: {
        initialCapital: user.initialCapital,
        currentCapital: user.currentCapital,
        riskPercent: user.riskPercent,
        broker: user.broker,
        tradingStyle: user.tradingStyle,
        preferredMarkets: user.preferredMarkets,
        timezone: user.timezone,
      }
    });
  } catch (err) { next(err); }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const allowed = ['riskPercent', 'broker', 'tradingStyle', 'preferredMarkets', 'timezone', 'initialCapital'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, data: user.toPublic() });
  } catch (err) { next(err); }
};
