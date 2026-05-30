const { Journal } = require('../models/index');

exports.getEntries = async (req, res, next) => {
  try {
    const { from, to, page = 1, limit = 20 } = req.query;
    const filter = { user: req.user._id };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to)   filter.date.$lte = new Date(to);
    }
    const skip  = (page - 1) * limit;
    const total = await Journal.countDocuments(filter);
    const data  = await Journal.find(filter).sort('-date').skip(skip).limit(parseInt(limit));
    res.json({ success: true, total, data });
  } catch (err) { next(err); }
};

exports.createEntry = async (req, res, next) => {
  try {
    // Only one entry per day
    const dayStart = new Date(req.body.date || Date.now());
    dayStart.setHours(0,0,0,0);
    const dayEnd = new Date(dayStart); dayEnd.setHours(23,59,59,999);
    const existing = await Journal.findOne({ user: req.user._id, date: { $gte: dayStart, $lte: dayEnd } });
    if (existing) {
      Object.assign(existing, req.body);
      await existing.save();
      return res.json({ success: true, data: existing });
    }
    const entry = await Journal.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, data: entry });
  } catch (err) { next(err); }
};

exports.getEntry = async (req, res, next) => {
  try {
    const entry = await Journal.findOne({ _id: req.params.id, user: req.user._id });
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    res.json({ success: true, data: entry });
  } catch (err) { next(err); }
};

exports.updateEntry = async (req, res, next) => {
  try {
    const entry = await Journal.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id }, req.body, { new: true }
    );
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    res.json({ success: true, data: entry });
  } catch (err) { next(err); }
};

exports.deleteEntry = async (req, res, next) => {
  try {
    await Journal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
};
