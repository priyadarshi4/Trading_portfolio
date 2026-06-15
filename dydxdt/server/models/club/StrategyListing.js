const mongoose = require('mongoose');

const STRATEGY_CATEGORIES = [
  'All Strategies',
  'Oscillator Strategies',
  'Day Trading Strategies',
  'Seasonal Strategies',
  'Swing Trading Strategies',
  'Overnight Strategies',
  'Short Strategies',
  'Trend-Following Strategies',
  'Breakout Strategies',
  'Mean Reversion Strategies',
  'Momentum & Volatility Strategies',
  'Combination Strategies',
  'Rotation Strategies',
  'Options Strategies',
  'Crypto Strategies',
  'Futures Strategies',
  'Scalping Strategies',
  'Price Action Strategies',
  'ICT / Smart Money',
  'Strategy Bundles',
];

const marketSchema = new mongoose.Schema({
  symbol:   { type: String, uppercase: true, trim: true, default: '' },
  exchange: { type: String, default: '' },  // NSE, NYSE, CRYPTO, etc.
});

const strategyListingSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  // Core info
  title:       { type: String, required: true, trim: true, maxlength: 150 },
  tagline:     { type: String, trim: true, maxlength: 200, default: '' },
  description: { type: String, required: true, maxlength: 8000 },
  category:    { type: String, required: true, enum: STRATEGY_CATEGORIES, default: 'Swing Trading Strategies' },

  // Instrument / market
  markets:     [marketSchema],  // e.g. [{symbol:'SPY', exchange:'NYSE'}]
  assetClass:  { type: String, enum: ['Stocks','Forex','Futures','Crypto','Commodities','Indices','Options','Mixed'], default: 'Stocks' },

  // Strategy stats (headline numbers on the card)
  stats: {
    totalTrades:        { type: Number, default: 0 },
    avgGainPerTrade:    { type: Number, default: 0 },   // percent
    winRate:            { type: Number, default: 0 },   // percent 0-100
    profitFactor:       { type: Number, default: 0 },
    annualReturn:       { type: Number, default: 0 },   // percent
    maxDrawdown:        { type: Number, default: 0 },   // percent
    sharpeRatio:        { type: Number, default: 0 },
    backtestPeriod:     { type: String, default: '' },  // e.g. '2010-2024'
    avgHoldingDays:     { type: Number, default: 0 },
  },

  // Media
  coverImage:  { url: String, publicId: String },
  images:      [{ url: String, caption: String, publicId: String }],
  equityCurveImage: { url: String, publicId: String },

  // Rules / content
  entryRules:  [{ type: String }],
  exitRules:   [{ type: String }],
  riskRules:   [{ type: String }],
  indicators:  [{ type: String }],     // ['RSI','EMA 20','Volume']
  timeframes:  [{ type: String }],     // ['Daily','Weekly']
  tags:        [{ type: String, lowercase: true, trim: true }],

  // Pricing (free / paid)
  isFree:      { type: Boolean, default: true },
  price:       { type: Number, default: 0 },       // USD
  currency:    { type: String, default: 'USD' },

  // Engagement counters
  viewsCount:  { type: Number, default: 0 },
  likesCount:  { type: Number, default: 0 },
  savesCount:  { type: Number, default: 0 },
  commentsCount:{ type: Number, default: 0 },

  // Status
  isPublished: { type: Boolean, default: true },
  isDeleted:   { type: Boolean, default: false },
  isFeatured:  { type: Boolean, default: false },
  isVerified:  { type: Boolean, default: false },  // admin-verified

  // Difficulty
  difficulty:  { type: String, enum: ['Beginner','Intermediate','Advanced','Expert'], default: 'Intermediate' },

}, { timestamps: true });

// Indexes
strategyListingSchema.index({ author: 1, createdAt: -1 });
strategyListingSchema.index({ category: 1, createdAt: -1 });
strategyListingSchema.index({ category: 1, likesCount: -1 });
strategyListingSchema.index({ tags: 1 });
strategyListingSchema.index({ isPublished: 1, isDeleted: 1 });
strategyListingSchema.index({ 'stats.winRate': -1 });
strategyListingSchema.index({ isFeatured: -1, createdAt: -1 });

// Text search
strategyListingSchema.index({
  title: 'text', description: 'text', tags: 'text',
  'markets.symbol': 'text', indicators: 'text',
});

module.exports = {
  StrategyListing: mongoose.model('StrategyListing', strategyListingSchema),
  STRATEGY_CATEGORIES,
};
