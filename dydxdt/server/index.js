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
