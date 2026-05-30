/**
 * Seed script — populates the DB with realistic demo trades
 * Run: node seed.js (from server/ directory with .env configured)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Trade = require('./models/Trade');
const { Strategy, Journal } = require('./models/index');

const SYMBOLS = ['XAUUSD','NQ','EURUSD','GBPUSD','ES','USDJPY','XAGUSD','CL'];
const STRATEGIES = ['BOS+OB','FVG Fill','Liquidity Grab','ICT MSS','Breaker Block'];
const SESSIONS = ['London','New York','London/NY Overlap','Asian'];
const TIMEFRAMES = ['M15','H1','H4','D1'];
const MARKETS = { XAUUSD:'Commodities', NQ:'Futures', ES:'Futures', CL:'Futures', EURUSD:'Forex', GBPUSD:'Forex', USDJPY:'Forex', XAGUSD:'Commodities' };

const rand = (min, max) => Math.random() * (max - min) + min;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear existing demo user
  const existing = await User.findOne({ email: 'demo@dydxdt.com' });
  if (existing) {
    await Trade.deleteMany({ user: existing._id });
    await Strategy.deleteMany({ user: existing._id });
    await Journal.deleteMany({ user: existing._id });
    await User.deleteOne({ _id: existing._id });
    console.log('Cleared existing demo data');
  }

  // Create demo user
  const user = await User.create({
    name: 'Demo Trader',
    email: 'demo@dydxdt.com',
    password: 'demo123',
    initialCapital: 10000,
    currentCapital: 10000,
    riskPercent: 1,
    broker: 'MetaTrader 5',
    tradingStyle: 'Intraday',
    preferredMarkets: ['Forex', 'Futures', 'Commodities'],
  });
  console.log(`Created demo user: demo@dydxdt.com / demo123`);

  // Create strategies
  const stratDocs = await Strategy.insertMany(
    STRATEGIES.map((name, i) => ({
      user: user._id, name,
      description: `${name} — confluence-based setup`,
      rules: ['Identify structure', 'Mark key levels', 'Wait for entry signal', 'Execute with defined SL/TP'],
      color: ['#e8ff00','#00ffb3','#a78bfa','#ff3366','#38bdf8'][i],
      timeframes: ['H1','H4'],
      markets: ['Forex','Futures'],
    }))
  );
  console.log(`Created ${stratDocs.length} strategies`);

  // Generate 120 trades over the past 120 days
  const trades = [];
  let equity = 10000;
  const today = new Date();

  for (let i = 119; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Skip weekends
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue;

    // 0-3 trades per day
    const numTrades = Math.floor(Math.random() * 4);
    for (let t = 0; t < numTrades; t++) {
      const symbol = pick(SYMBOLS);
      const strategy = pick(STRATEGIES);
      const direction = Math.random() > 0.5 ? 'LONG' : 'SHORT';
      const session = pick(SESSIONS);
      const timeframe = pick(TIMEFRAMES);

      // Realistic prices per symbol
      const basePrices = { XAUUSD: 2300, NQ: 17500, ES: 5200, CL: 78, EURUSD: 1.09, GBPUSD: 1.27, USDJPY: 157, XAGUSD: 27 };
      const base = basePrices[symbol];
      const volatility = base * 0.003;

      const entryPrice  = parseFloat((base + rand(-volatility, volatility)).toFixed(symbol.includes('USD') && !symbol.startsWith('XAU') && !symbol.startsWith('XAG') ? 4 : 2));
      const slDist      = parseFloat((base * rand(0.001, 0.003)).toFixed(symbol.includes('USD') && !symbol.startsWith('XAU') ? 4 : 2));
      const stopLoss    = direction === 'LONG'
        ? parseFloat((entryPrice - slDist).toFixed(symbol.includes('USD') && !symbol.startsWith('XAU') ? 4 : 2))
        : parseFloat((entryPrice + slDist).toFixed(symbol.includes('USD') && !symbol.startsWith('XAU') ? 4 : 2));

      // Win bias: 62% win rate
      const isWin = Math.random() < 0.62;
      const rrMultiple = isWin ? rand(1.2, 3.5) : rand(-1, -0.3);
      const exitDist = Math.abs(slDist * rrMultiple);
      const exitPrice = direction === 'LONG'
        ? parseFloat((entryPrice + (isWin ? exitDist : -exitDist)).toFixed(symbol.includes('USD') && !symbol.startsWith('XAU') ? 4 : 2))
        : parseFloat((entryPrice - (isWin ? exitDist : -exitDist)).toFixed(symbol.includes('USD') && !symbol.startsWith('XAU') ? 4 : 2));

      // Position size based on 1% risk
      const quantity = parseFloat((100 / slDist).toFixed(2));

      trades.push({
        user: user._id,
        symbol, direction, session, timeframe, date,
        marketType: MARKETS[symbol] || 'Forex',
        entryPrice, exitPrice, stopLoss, quantity,
        takeProfit: direction === 'LONG'
          ? parseFloat((entryPrice + slDist * 2).toFixed(4))
          : parseFloat((entryPrice - slDist * 2).toFixed(4)),
        strategyUsed: strategy,
        notes: isWin
          ? 'Clean setup, followed rules, took partial at 1R'
          : 'Setup was valid but got stopped out, market structure shifted',
        followedRules: isWin ? true : Math.random() > 0.3,
        mood: isWin ? Math.ceil(rand(3, 5)) : Math.ceil(rand(1, 3)),
        tags: [strategy.toLowerCase().replace(/[^a-z]/g,'-'), session.toLowerCase().replace(' ','-')],
      });
    }
  }

  // Bulk insert — pre-save hooks don't fire with insertMany, so calculate manually
  const { calcProfitLoss, calcRiskReward } = require('./utils/analytics');
  const processed = trades.map(t => {
    const pnl = calcProfitLoss(t.entryPrice, t.exitPrice, t.quantity, t.direction);
    const rr  = calcRiskReward(t.entryPrice, t.exitPrice, t.stopLoss, t.direction);
    return {
      ...t,
      profitLoss: pnl,
      riskRewardRatio: rr,
      result: Math.abs(pnl) < 0.01 ? 'BE' : pnl > 0 ? 'WIN' : 'LOSS',
    };
  });

  await Trade.insertMany(processed);
  console.log(`Created ${processed.length} trades`);

  // Update capital
  const netPnL = processed.reduce((s, t) => s + t.profitLoss, 0);
  user.currentCapital = user.initialCapital + netPnL;
  await user.save({ validateBeforeSave: false });
  console.log(`Capital updated to $${user.currentCapital.toFixed(2)}`);

  // Create 14 journal entries
  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i * 7);
    await Journal.create({
      user: user._id, date,
      mood: pick(['excellent','good','neutral','bad']),
      confidenceScore: Math.ceil(rand(5, 10)),
      wentWell: 'Waited patiently for high-probability setups. Respected my risk levels.',
      mistakes: 'Moved SL to breakeven too early on one trade.',
      lessons: 'Let winners run — do not cut profits early out of fear.',
      planForTomorrow: 'Focus on London session XAUUSD and NQ setups only.',
      followedRules: Math.random() > 0.3,
      remarks: 'Consistent execution is the goal.',
    });
  }
  console.log('Created 14 journal entries');

  console.log('\n✅ Seed complete!');
  console.log('   Login: demo@dydxdt.com');
  console.log('   Pass:  demo123');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
