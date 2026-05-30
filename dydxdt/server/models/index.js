const mongoose = require('mongoose');

// ── STRATEGY ─────────────────────────────────────────────────────────────────
const strategySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, maxlength: 1000 },
  rules: [{ type: String }],
  timeframes: [{ type: String }],
  markets: [{ type: String }],
  color: { type: String, default: '#e8ff00' },
  isActive: { type: Boolean, default: true },

  // Auto-computed (updated by analytics controller)
  totalTrades: { type: Number, default: 0 },
  winRate: { type: Number, default: 0 },
  netProfit: { type: Number, default: 0 },
  avgRR: { type: Number, default: 0 },
  profitFactor: { type: Number, default: 0 },
  expectancy: { type: Number, default: 0 },
  maxDrawdown: { type: Number, default: 0 },
}, { timestamps: true });

strategySchema.index({ user: 1, name: 1 }, { unique: true });

// ── JOURNAL ───────────────────────────────────────────────────────────────────
const journalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true, default: Date.now },

  mood: {
    type: String,
    enum: ['excellent', 'good', 'neutral', 'bad', 'terrible'],
    default: 'neutral'
  },
  confidenceScore: { type: Number, min: 1, max: 10 },

  // Reflection fields
  wentWell: { type: String, maxlength: 1000 },
  mistakes: { type: String, maxlength: 1000 },
  followedRules: { type: Boolean },
  emotionalState: { type: String, maxlength: 500 },
  lessons: { type: String, maxlength: 1000 },
  planForTomorrow: { type: String, maxlength: 1000 },
  remarks: { type: String, maxlength: 500 },

  screenshots: [{ url: String, publicId: String }],
  tags: [String],
}, { timestamps: true });

journalSchema.index({ user: 1, date: -1 });

// ── PERFORMANCE SNAPSHOT (daily aggregate) ────────────────────────────────────
const performanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },

  // Aggregated from trades
  tradesCount: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  dailyPnL: { type: Number, default: 0 },
  equity: { type: Number, default: 0 },

  // Running totals (updated on each trade)
  winRate: { type: Number, default: 0 },
  profitFactor: { type: Number, default: 0 },
  expectancy: { type: Number, default: 0 },
  sharpeRatio: { type: Number, default: 0 },
  maxDrawdown: { type: Number, default: 0 },
  maxDrawdownPercent: { type: Number, default: 0 },
}, { timestamps: true });

performanceSchema.index({ user: 1, date: -1 }, { unique: true });

module.exports = {
  Strategy: mongoose.model('Strategy', strategySchema),
  Journal: mongoose.model('Journal', journalSchema),
  Performance: mongoose.model('Performance', performanceSchema),
};
