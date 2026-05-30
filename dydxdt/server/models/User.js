const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 60 },
  email: {
    type: String, required: [true, 'Email is required'],
    unique: true, lowercase: true, trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  avatar: { type: String, default: '' },
  googleId: { type: String, select: false },

  // Trading profile
  initialCapital: { type: Number, default: 10000, min: 0 },
  currentCapital: { type: Number, default: 10000 },
  riskPercent: { type: Number, default: 1, min: 0.1, max: 10 },
  broker: { type: String, default: '' },
  tradingStyle: { type: String, enum: ['Intraday', 'Swing', 'Scalp', 'Position', 'Mixed'], default: 'Intraday' },
  preferredMarkets: [{ type: String, enum: ['Forex', 'Futures', 'Commodities', 'Indices', 'Crypto'] }],
  timezone: { type: String, default: 'UTC' },

  isEmailVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date }
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function(entered) {
  return bcrypt.compare(entered, this.password);
};

userSchema.methods.toPublic = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.googleId;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
