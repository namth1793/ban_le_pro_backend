const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import middleware
const errorHandler = require('./src/middleware/errorHandler');
const { authenticate } = require('./src/middleware/auth');

// Import routes
const authRoutes = require('./src/modules/auth/auth.routes');
const productRoutes = require('./src/modules/products/products.routes');
const orderRoutes = require('./src/modules/orders/orders.routes');
const customerRoutes = require('./src/modules/customers/customers.routes');
const reportRoutes = require('./src/modules/reports/reports.routes');
const staffRoutes = require('./src/modules/staff/staff.routes');
const shopRoutes = require('./src/modules/shops/shops.routes');
const subscriptionRoutes = require('./src/modules/subscription/subscription.routes');
const userRoutes = require('./src/modules/users/users.routes');

const app = express();

// Middleware
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:8080', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/products', authenticate, productRoutes);
app.use('/api/orders', authenticate, orderRoutes);
app.use('/api/customers', authenticate, customerRoutes);
app.use('/api/reports', authenticate, reportRoutes);
app.use('/api/staff', authenticate, staffRoutes);
app.use('/api/shops', authenticate, shopRoutes);
app.use('/api/subscription', authenticate, subscriptionRoutes);
app.use('/api/users', authenticate, userRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling - PHẢI LÀ HÀM, KHÔNG PHẢI OBJECT
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database: ${process.env.DATABASE_URL}`);
});

module.exports = app;