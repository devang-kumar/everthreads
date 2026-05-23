require('dotenv').config();
const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const morgan    = require('morgan');
const path      = require('path');
const rateLimit = require('express-rate-limit');

const app = express();

// ── Rate limiting ──
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500, message: 'Too many requests' });
app.use('/api/', limiter);

// ── CORS — allow all origins in production (Render serves frontend too) ──
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Razorpay webhook needs raw body for HMAC verification ──
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }), (req, res, next) => {
  if (Buffer.isBuffer(req.body)) req.body = JSON.parse(req.body.toString());
  next();
});

// ── Static files — serve React frontend build ──
// React build output is at ../client/dist relative to server/
const frontendPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(frontendPath));
console.log('Serving frontend from:', frontendPath);

// ── API Routes ──
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/products',  require('./routes/products'));
app.use('/api/orders',    require('./routes/orders'));
app.use('/api/users',     require('./routes/users'));
app.use('/api/admin',     require('./routes/admin'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/payment',   require('./routes/payment'));
app.use('/api/coupons',   require('./routes/coupons'));
app.use('/api/returns',   require('./routes/returns'));
app.use('/api/settings',  require('./routes/settings'));
app.use('/api/reviews',   require('./routes/reviews'));
app.use('/api/reports',   require('./routes/reports'));

// ── Health check ──
app.get('/api/health', (req, res) => res.json({
  status: 'ok', time: new Date(),
  env: process.env.NODE_ENV,
  db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
}));

// ── Serve frontend SPA for all non-API routes ──
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ message: 'API route not found' });
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ── Global error handler ──
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Server Error' });
});

// ── Connect DB & Start ──
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000
})
  .then(async () => {
    console.log('✅ MongoDB connected');

    // Auto-seed in production if no products exist
    if (process.env.NODE_ENV === 'production' || process.env.AUTO_SEED === 'true') {
      try {
        const Product  = require('./models/Product');
        const autoSeed = require('./seed-auto');
        const count    = await Product.countDocuments();
        if (count === 0) {
          console.log('🌱 No products found — running auto-seed...');
          await autoSeed();
        } else {
          console.log(`📦 ${count} products already in database — skipping seed`);
        }
      } catch (e) {
        console.error('Seed error:', e.message);
      }
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
