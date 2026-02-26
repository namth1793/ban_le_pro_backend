// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        userShops: {
          where: { shopId: decoded.shopId }
        }
      }
    });

    if (!user || !user.userShops.length) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    req.user = {
      id: user.id,
      role: user.userShops[0].role
    };
    req.shopId = decoded.shopId;
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};

module.exports = { authenticate, authorize };  // Export object chứa các hàm