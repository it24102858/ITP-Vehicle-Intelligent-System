const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ success: false, message: 'User not found' });
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  res.status(403).json({ success: false, message: 'Admin access required' });
};

const sellerOnly = (req, res, next) => {
  if (req.user && ['seller', 'admin'].includes(req.user.role)) return next();
  res.status(403).json({ success: false, message: 'Seller access required' });
};

const serviceRoleOnly = (req, res, next) => {
  const allowed = ['admin', 'service_provider', 'delivery_management', 'insurance'];
  if (req.user && allowed.includes(req.user.role)) return next();
  res.status(403).json({ success: false, message: 'Service role access required' });
};

module.exports = { protect, adminOnly, sellerOnly, serviceRoleOnly };
