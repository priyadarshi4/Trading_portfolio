const mongoose = require('mongoose');
const { calcRiskReward, calcProfitLoss } = require('../utils/analytics');

const tradeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  // Instrument
  symbol: { type: String, required: [true, 'Symbol is required'], uppercase: true, trim: true },
  marketType: {
    type: String,
    enum: ['Forex', 'Futures', 'Commodities', 'Indices', 'Crypto', 'Stocks'],
    default: 'Forex'
  },

  // Execution
  date: { type: Date, required: [true, 'Trade date is required'], index: true },
  direction: { type: String, enum: ['LONG', 'SHORT'], required: true },
  entryPrice: { type: Number, required: [true, 'Entry price is required'] },
  exitPrice: { type: Number, required: [true, 'Exit price is required'] },
  stopLoss: { type: Number },
  takeProfit: { type: Number },
  quantity: { type: Number, required: [true, 'Quantity is required'], min: 0 },
  timeframe: {
    type: String,
    enum: ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1'],
    default: 'H1'
  },
  session: {
    type: String,
    enum: ['Asian', 'London', 'New York', 'London/NY Overlap', 'Other'],
    default: 'London'
  },

  // Strategy & analysis
  strategyUsed: { type: String, trim: true },
  notes: { type: String, maxlength: 2000 },
  tags: [{ type: String, trim: true, lowercase: true }],
  screenshots: [{
    url: String,
    label: { type: String, enum: ['before', 'during', 'after'], default: 'after' },
    publicId: String
  }],

  // Calculated (auto-set in pre-save)
  profitLoss: { type: Number, default: 0 },
  profitLossPercent: { type: Number, default: 0 },
  riskRewardRatio: { type: Number, default: 0 },
  result: { type: String, enum: ['WIN', 'LOSS', 'BE'], default: 'LOSS' },

  // Emotion / review
  mood: { type: Number, min: 1, max: 5 },
  followedRules: { type: Boolean },
  mistakes: [{ type: String }],

}, { timestamps: true });

// Auto-calculate before save
tradeSchema.pre('save', function(next) {
  this.profitLoss = calcProfitLoss(this.entryPrice, this.exitPrice, this.quantity, this.direction);
  if (this.stopLoss) {
    this.riskRewardRatio = calcRiskReward(this.entryPrice, this.exitPrice, this.stopLoss, this.direction);
  }
  if (Math.abs(this.profitLoss) < 0.01) this.result = 'BE';
  else this.result = this.profitLoss > 0 ? 'WIN' : 'LOSS';
  next();
});

// Indexes
tradeSchema.index({ user: 1, date: -1 });
tradeSchema.index({ user: 1, symbol: 1 });
tradeSchema.index({ user: 1, strategyUsed: 1 });
tradeSchema.index({ user: 1, result: 1 });

module.exports = mongoose.model('Trade', tradeSchema);
