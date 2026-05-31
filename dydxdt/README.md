# Dy/Dx/Dt — Trader Analytics Platform

> **Founded by Priyadarshi Prince**
> A production-grade MERN stack trading journal and analytics platform for TradingView Replay traders.

---

## 🏗️ Tech Stack

| Layer      | Technology |
|------------|-----------|
| Frontend   | React 18 + Vite + Tailwind CSS + Framer Motion + Recharts |
| State      | Zustand + TanStack Query |
| Backend    | Node.js + Express.js |
| Database   | MongoDB + Mongoose |
| Auth       | JWT (stateless) |
| Deploy FE  | Vercel |
| Deploy BE  | Render |
| DB Host    | MongoDB Atlas |

---

## 📁 Project Structure

```
dydxdt/
├── server/
│   ├── index.js                 # Express entry point
│   ├── models/
│   │   ├── User.js              # User schema
│   │   ├── Trade.js             # Trade schema (auto-calculates P&L, RR)
│   │   └── index.js             # Strategy, Journal, Performance schemas
│   ├── controllers/
│   │   ├── authController.js    # Register, login, profile
│   │   ├── tradesController.js  # Full CRUD + 5 analytics endpoints
│   │   ├── strategiesController.js
│   │   ├── journalController.js
│   │   └── settingsController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── trades.js
│   │   ├── strategies.js
│   │   ├── journal.js
│   │   ├── analytics.js
│   │   └── settings.js
│   ├── middleware/
│   │   └── auth.js              # JWT protect + generateToken
│   └── utils/
│       ├── db.js                # MongoDB connection
│       └── analytics.js        # All calculation functions
│
└── client/
    ├── src/
    │   ├── api/
    │   │   ├── client.js        # Axios instance with interceptors
    │   │   └── hooks.js         # All React Query hooks
    │   ├── store/
    │   │   └── authStore.js     # Zustand auth store (persisted)
    │   ├── components/
    │   │   ├── layout/
    │   │   │   └── Layout.jsx   # Sidebar + topbar shell
    │   │   └── ui/
    │   │       └── index.jsx    # KPICard, Card, Btn, Badge, Input, etc.
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── Dashboard.jsx    # Main overview with all KPIs
    │   │   ├── TradesPage.jsx   # Trade list with filters + pagination
    │   │   ├── AddTrade.jsx     # Trade form with live R:R calculator
    │   │   ├── EditTrade.jsx
    │   │   ├── AnalyticsPage.jsx
    │   │   ├── EquityPage.jsx
    │   │   ├── CalendarPage.jsx # P&L calendar heatmap
    │   │   ├── JournalPage.jsx  # Daily trading journal
    │   │   ├── StrategiesPage.jsx
    │   │   ├── RiskPage.jsx     # Position sizing calculator
    │   │   └── SettingsPage.jsx
    │   ├── App.jsx
    │   └── main.jsx
    └── index.html
```

---

## ⚡ Quick Start (Local)

### 1. Clone and install

```bash
git clone <your-repo>
cd dydxdt

# Install root + both packages
npm run install:all
```

### 2. Configure backend

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/dydxdt
JWT_SECRET=change_this_to_at_least_32_random_characters
CLIENT_URL=http://localhost:5173
```

### 3. Configure frontend

```bash
cd client
cp .env.example .env
```

`client/.env` already has:
```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Run dev servers

```bash
# From root — starts both concurrently
npm run dev
```

- Frontend: http://localhost:5173
- Backend:  http://localhost:5000/api/health

---

## 🚀 Deployment

### MongoDB Atlas
1. Create free cluster at mongodb.com/atlas
2. Create database user
3. Whitelist `0.0.0.0/0` for Render
4. Copy connection string → `MONGODB_URI`

### Backend → Render
1. Push code to GitHub
2. New Web Service on render.com
3. Root directory: `server`
4. Build command: `npm install`
5. Start command: `node index.js`
6. Add all env vars from `.env`
7. Copy the Render URL (e.g. `https://dydxdt-api.onrender.com`)

### Frontend → Vercel
1. New project on vercel.com
2. Root directory: `client`
3. Add env variable:
   ```
   VITE_API_URL=https://dydxdt-api.onrender.com/api
   ```
4. Deploy — Vercel detects Vite automatically

---

## 📡 API Reference

### Auth
```
POST /api/auth/register   { name, email, password, initialCapital }
POST /api/auth/login      { email, password }
GET  /api/auth/me         → current user
PUT  /api/auth/me         update profile
PUT  /api/auth/password   { currentPassword, newPassword }
```

### Trades
```
GET    /api/trades                   ?symbol,result,strategy,from,to,page,limit
POST   /api/trades                   create trade (auto-calculates P&L, RR)
GET    /api/trades/:id
PUT    /api/trades/:id
DELETE /api/trades/:id

GET /api/trades/stats/summary        all KPIs + equity curve + calendar
GET /api/trades/stats/by-strategy    grouped by strategy
GET /api/trades/stats/by-symbol      grouped by instrument
GET /api/trades/stats/monthly        monthly P&L aggregation
GET /api/trades/stats/by-session     session breakdown
```

### Strategies
```
GET    /api/strategies
POST   /api/strategies
PUT    /api/strategies/:id
DELETE /api/strategies/:id
POST   /api/strategies/:id/sync   sync stats from actual trades
```

### Journal
```
GET    /api/journal   ?from,to,page,limit
POST   /api/journal   (upsert per day)
GET    /api/journal/:id
PUT    /api/journal/:id
DELETE /api/journal/:id
```

### Settings
```
GET /api/settings
PUT /api/settings   { riskPercent, broker, tradingStyle, preferredMarkets, initialCapital }
```

---

## 📊 Calculated Metrics

All calculations happen server-side in `server/utils/analytics.js`:

| Metric | Formula |
|--------|---------|
| Win Rate | wins / total × 100 |
| Profit Factor | gross profit / gross loss |
| Expectancy | (winRate × avgWin) − (lossRate × avgLoss) |
| Sharpe Ratio | (mean return − riskFree) / stdDev |
| Max Drawdown | peak-to-trough from equity curve |
| R:R Ratio | reward distance / risk distance |
| P&L | (exit − entry) × quantity (direction-aware) |
| Position Size | riskAmount / SL distance |

---

## 🔒 Security

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens (30-day expiry, configurable)
- Helmet.js security headers
- CORS restricted to CLIENT_URL
- Rate limiting: 200 req / 15 min per IP
- All trade routes require valid JWT
- Users can only access their own data

---

## 🎨 Design System

```
Background:  #030303
Surface:     rgba(10,10,10,0.9)
Acid Yellow: #e8ff00   ← primary accent
Neon Green:  #00ffb3   ← profit / positive
Violet:      #a78bfa   ← analytics / secondary
Danger Red:  #ff3366   ← loss / negative
Font Display: Bebas Neue (headings)
Font Mono:    Space Mono (data / labels)
```

---

## 📈 Features

- [x] JWT Authentication (register/login)
- [x] Trade logging with auto P&L and RR calculation
- [x] Equity curve chart
- [x] Win rate, profit factor, expectancy, Sharpe ratio
- [x] Strategy tracking with performance sync
- [x] Session analysis (London, NY, Asian, Overlap)
- [x] Monthly P&L bar chart
- [x] Instrument heat map
- [x] Interactive P&L calendar
- [x] Daily trading journal with mood tracking
- [x] Risk / position size calculator
- [x] Trade filtering (symbol, result, direction, date range)
- [x] Pagination
- [x] Settings (capital, risk %, broker, style, markets)
- [x] Responsive mobile layout
- [x] Grungy Gen-Z dark aesthetic
// ============================================================
// MODIFIED FILE: server/index.js
// Changes:
//   1. Import http module and setupSocket
//   2. Create http.createServer(app)
//   3. Register /api/club route
//   4. app.get('io') setter for controllers
//   5. Listen on httpServer instead of app
// ============================================================

require('dotenv').config();
const http    = require('http');
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB   = require('./utils/db');
const setupSocket = require('./utils/socket');   // ← NEW

const app = express();
const httpServer = http.createServer(app);       // ← NEW

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging (dev only)
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// Routes
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/trades',     require('./routes/trades'));
app.use('/api/strategies', require('./routes/strategies'));
app.use('/api/journal',    require('./routes/journal'));
app.use('/api/analytics',  require('./routes/analytics'));
app.use('/api/settings',   require('./routes/settings'));
app.use('/api/export',     require('./routes/export'));
app.use('/api',            require('./routes/market/index'));
app.use('/api/club',       require('./routes/club/index'));    // ← NEW

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// 404
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Setup Socket.IO and attach io to app                        ← NEW
const io = setupSocket(httpServer);
app.set('io', io);

// Use httpServer instead of app.listen                        ← NEW
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`🚀 Dy/Dx/Dt server running on port ${PORT}`));

---

*Built with ❤️ by Priyadarshi Prince — Dy/Dx/Dt Trader Analytics*
