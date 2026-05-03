const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

// REGISTER 
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const normalizedPhone = String(phone || '').trim().replace(/[\s\-()]/g, '');
    const isSriLankanPhone = /^(?:\+94|94|0)7\d{8}$/.test(normalizedPhone);

    if (role === 'admin') {
      return res.status(400).json({ success: false, message: 'Admin accounts cannot be created via registration' });
    }
    if (!normalizedPhone) {
      return res.status(400).json({ success: false, message: 'Sri Lanka phone number is required' });
    }
    if (!isSriLankanPhone) {
      return res.status(400).json({ success: false, message: 'Use valid Sri Lanka mobile (0771234567 or +94771234567)' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    const user = await User.create({ name, email, password, role: role || 'buyer', phone: normalizedPhone });
    const token = generateToken(user._id);
    res.status(201).json({
      success: true, message: 'Registration successful', token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, createdAt: user.createdAt }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── LOGIN ─────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account deactivated' });
    }
    const token = generateToken(user._id);
    res.json({
      success: true, message: 'Login successful', token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, createdAt: user.createdAt }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── ME ────────────────────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// Change password for logged-in users (including service roles).
router.post('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── SEED ADMIN ────────────────────────────────────────────────────────────────
router.post('/seed-admin', async (req, res) => {
  try {
    const existing = await User.findOne({ email: 'admin@vehicle.com' });
    if (existing) {
      return res.json({ success: true, message: 'Admin already exists', email: existing.email });
    }
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@vehicle.com',
      password: 'Admin123!',
      role: 'admin',
      isActive: true,
    });
    res.status(201).json({ success: true, message: 'Admin created', email: admin.email });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── RESET ADMIN ───────────────────────────────────────────────────────────────
// Uses MongoDB insertOne directly — completely bypasses Mongoose pre-save hook
// This prevents the password from being double-hashed
router.post('/reset-admin', async (req, res) => {
  try {
    const plainPassword = 'Admin123!';

    // Hash once manually
    const hashedPassword = await bcrypt.hash(plainPassword, 12);

    // Verify the hash is correct before saving
    const verified = await bcrypt.compare(plainPassword, hashedPassword);
    if (!verified) {
      return res.status(500).json({ success: false, message: 'Hash verification failed' });
    }

    // Delete all existing admins
    await User.deleteMany({ role: 'admin' });

    // Insert directly into MongoDB — bypasses ALL Mongoose middleware
    const collection = User.collection;
    await collection.insertOne({
      name:      'System Administrator',
      email:     'admin@vehicle.com',
      password:  hashedPassword,
      role:      'admin',
      phone:     '',
      avatar:    '',
      isActive:  true,
      createdAt: new Date(),
    });

    // Verify we can read back and compare
    const saved = await User.findOne({ email: 'admin@vehicle.com' }).select('+password');
    const canLogin = await bcrypt.compare(plainPassword, saved.password);

    res.json({
      success:       true,
      message:       canLogin ? 'Admin reset — login verified OK' : 'Admin reset but login verify failed',
      email:         'admin@vehicle.com',
      password:      'Admin123!',
      loginVerified: canLogin,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── CHECK ADMIN ───────────────────────────────────────────────────────────────
router.get('/check-admin', async (req, res) => {
  try {
    const admin = await User.findOne({ role: 'admin' }).select('-password');
    if (!admin) {
      return res.json({ success: false, message: 'No admin found in database' });
    }
    res.json({ success: true, email: admin.email, role: admin.role, isActive: admin.isActive });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── TEST ADMIN LOGIN ──────────────────────────────────────────────────────────
router.post('/test-admin-login', async (req, res) => {
  try {
    const email    = 'admin@vehicle.com';
    const password = 'Admin123!';

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.json({ step: 'FIND_USER', result: 'FAIL — not found in DB. Run /reset-admin first.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.json({ step: 'PASSWORD', result: 'FAIL — password mismatch. Run /reset-admin.' });
    }

    const token = generateToken(user._id);
    res.json({
      step:   'COMPLETE',
      result: 'SUCCESS — admin login works',
      token,
      user:   { name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ step: 'ERROR', message: error.message });
  }
});

module.exports = router;
