const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

// @POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, initialCapital } = req.body;

    if (await User.findOne({ email })) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({
      name, email, password,
      initialCapital: initialCapital || 10000,
      currentCapital: initialCapital || 10000,
    });

    const token = generateToken(user._id);
    res.status(201).json({ success: true, token, user: user.toPublic() });
  } catch (err) {
    next(err);
  }
};

// @POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);
    res.json({ success: true, token, user: user.toPublic() });
  } catch (err) {
    next(err);
  }
};

// @GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    res.json({ success: true, user: req.user.toPublic() });
  } catch (err) { next(err); }
};

// @PUT /api/auth/me
exports.updateMe = async (req, res, next) => {
  try {
    const allowed = ['name', 'avatar', 'timezone', 'tradingStyle', 'preferredMarkets', 'broker'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, user: user.toPublic() });
  } catch (err) { next(err); }
};

// @PUT /api/auth/change-password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password incorrect' });
    }
    user.password = newPassword;
    await user.save();
    const token = generateToken(user._id);
    res.json({ success: true, token, message: 'Password updated' });
  } catch (err) { next(err); }
};
