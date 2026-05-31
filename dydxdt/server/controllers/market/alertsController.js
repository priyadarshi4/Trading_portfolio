const { Alert } = require('../../models/market/index');

// @GET /api/alerts
exports.getAlerts = async (req, res, next) => {
  try {
    const data = await Alert.find({ user: req.user._id }).sort('-createdAt');
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// @POST /api/alerts
exports.createAlert = async (req, res, next) => {
  try {
    const { symbol, type, targetValue, targetValue2, timeframe, message, notifyEmail } = req.body;
    if (!symbol || !type) return res.status(400).json({ success: false, message: 'symbol and type required' });
    const alert = await Alert.create({
      user: req.user._id, symbol: symbol.toUpperCase(),
      type, targetValue, targetValue2, timeframe, message, notifyEmail,
    });
    res.status(201).json({ success: true, data: alert });
  } catch (err) { next(err); }
};

// @PUT /api/alerts/:id
exports.updateAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id }, req.body, { new: true }
    );
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    res.json({ success: true, data: alert });
  } catch (err) { next(err); }
};

// @DELETE /api/alerts/:id
exports.deleteAlert = async (req, res, next) => {
  try {
    await Alert.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true, message: 'Alert deleted' });
  } catch (err) { next(err); }
};

// @GET /api/alerts/active
exports.getActiveAlerts = async (req, res, next) => {
  try {
    const data = await Alert.find({ user: req.user._id, isActive: true }).sort('symbol');
    res.json({ success: true, data });
  } catch (err) { next(err); }
};
