const mongoose = require('mongoose');
const User = require('../models/User');

const ensureDefaultAdmin = async () => {
  const adminEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const adminPassword = String(process.env.ADMIN_PASSWORD || '');

  if (!adminEmail || !adminPassword) {
    console.warn('ADMIN_EMAIL/ADMIN_PASSWORD not set. Skipping default admin bootstrap.');
    return;
  }

  const existingAdmin = await User.findOne({ email: adminEmail });
  if (existingAdmin) return;

  await User.create({
    name: 'System Administrator',
    email: adminEmail,
    password: adminPassword,
    role: 'admin',
    isActive: true
  });

  console.log(`Default admin created: ${adminEmail}`);
};

const connectDB = async () => {
  // Accept both MONGO_URI and MONGODB_URI so either .env format works
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!uri || uri.includes('<username>') || uri.includes('<password>')) {
    console.error('MongoDB URI is missing or still has placeholder values.');
    console.error('Open backend/.env and set MONGO_URI to your Atlas connection string.');
    throw new Error('MongoDB URI is not configured correctly.');
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await ensureDefaultAdmin();
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Failed: ${error.message}`);
    console.error('Atlas checklist:');
    console.error('1) Atlas > Network Access: allow your current public IP (or 0.0.0.0/0 for dev)');
    console.error('2) Atlas > Database Access: verify username/password and roles');
    console.error('3) Ensure password special characters are URL-encoded');
    throw error;
  }
};

module.exports = connectDB;
