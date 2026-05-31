const mongoose = require('mongoose');

// ── WATCHLIST ─────────────────────────────────────────────────────────────────
const watchlistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, default: 'My Watchlist' },
  symbols: [{
    symbol:     { type: String, required: true, uppercase: true },
    name:       { type: String, default: '' },
    category:   { type: String, enum: ['Indices','Forex','Crypto','Commodities','Indian Stocks','US Stocks','ETFs'], default: 'Forex' },
    exchange:   { type: String, default: '' },
    addedAt:    { type: Date, default: Date.now },
    isFavorite: { type: Boolean, default: false },
    notes:      { type: String, default: '' },
  }],
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

watchlistSchema.index({ user: 1 });

// ── ALERT ─────────────────────────────────────────────────────────────────────
const alertSchema = new mongoose.Schema({
  user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symbol: { type: String, required: true, uppercase: true },
  name:   { type: String, default: '' },

  type: {
    type: String,
    required: true,
    enum: ['PRICE_ABOVE','PRICE_BELOW','RSI_ABOVE','RSI_BELOW',
           'MACD_CROSSOVER','EMA_CROSSOVER','VOLUME_SPIKE','PERCENT_CHANGE'],
  },

  // Condition values
  targetValue:  { type: Number },  // price level / RSI value
  targetValue2: { type: Number },  // second value for crossovers
  timeframe:    { type: String, default: 'D1' },
  message:      { type: String, default: '' },

  // State
  isActive:     { type: Boolean, default: true },
  isTriggered:  { type: Boolean, default: false },
  triggeredAt:  { type: Date },
  triggeredPrice: { type: Number },

  // Notify
  notifyEmail:  { type: Boolean, default: false },
  notifyPush:   { type: Boolean, default: false },
}, { timestamps: true });

alertSchema.index({ user: 1, symbol: 1 });
alertSchema.index({ user: 1, isActive: 1 });

// ── ANALYSIS HISTORY ──────────────────────────────────────────────────────────
const analysisHistorySchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symbol:    { type: String, required: true, uppercase: true },
  timeframe: { type: String, default: 'D1' },

  // Computed analysis snapshot
  trend:        { type: String, enum: ['Bullish','Bearish','Neutral','Sideways'] },
  trendStrength:{ type: String, enum: ['Strong','Moderate','Weak'] },
  bias:         { type: String, enum: ['Long','Short','Neutral'] },
  confidence:   { type: Number, min: 0, max: 100 },
  riskLevel:    { type: String, enum: ['Low','Medium','High','Very High'] },

  // Indicator snapshots
  rsi:          { type: Number },
  macdSignal:   { type: String },
  volumeStatus: { type: String },
  sentiment:    { type: Number, min: 0, max: 100 },  // 0=extreme fear, 100=extreme greed

  // Levels
  supportLevels:    [{ type: Number }],
  resistanceLevels: [{ type: Number }],

  // Signal
  signal: {
    type: { type: String, enum: ['LONG','SHORT','NEUTRAL'] },
    entry:    { type: Number },
    stopLoss: { type: Number },
    target1:  { type: Number },
    target2:  { type: Number },
    rr:       { type: Number },
  },

  // Detected patterns
  patterns: [{ name: String, confidence: Number, direction: String }],

  // MTF summary
  mtf: [{
    timeframe:       String,
    trend:           String,
    rsi:             Number,
    macd:            String,
    recommendation:  String,
  }],

  raw: { type: mongoose.Schema.Types.Mixed },  // full raw data for replay
}, { timestamps: true });

analysisHistorySchema.index({ user: 1, symbol: 1, createdAt: -1 });

module.exports = {
  Watchlist:       mongoose.model('Watchlist',       watchlistSchema),
  Alert:           mongoose.model('Alert',           alertSchema),
  AnalysisHistory: mongoose.model('AnalysisHistory', analysisHistorySchema),
};
