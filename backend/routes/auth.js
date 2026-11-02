const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, phone, password, role } = req.body;

    if (!full_name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Role validation (consumer, owner, agent) - administrator cannot self-register directly
    const assignedRole = ['owner', 'agent'].includes(role) ? role : 'consumer';

    // Check if email already exists
    const existing = await query('SELECT user_id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows && existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (full_name, email, phone, password_hash, role, account_status)
       VALUES ($1, $2, $3, $4, $5, 'active')`,
      [full_name.trim(), email.toLowerCase().trim(), phone.trim(), password_hash, assignedRole]
    );

    // Retrieve created user
    const userRes = await query('SELECT user_id, full_name, email, phone, role, account_status, created_at FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    const user = userRes.rows[0];

    const token = jwt.sign({ user_id: user.user_id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    // Create welcome notification
    await query(
      'INSERT INTO notifications (user_id, type, text) VALUES ($1, $2, $3)',
      [user.user_id, 'system', `Welcome to MUSTmart, ${user.full_name}! Browse verified student deals or register your business.`]
    );

    return res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const result = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (!result.rows || result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.account_status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended.' });
    }

    const token = jwt.sign({ user_id: user.user_id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    delete user.password_hash;

    return res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// Get current logged-in user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // If user is owner or agent, fetch business info if available
    let business = null;
    if (['owner', 'agent'].includes(req.user.role)) {
      const bizRes = await query('SELECT * FROM businesses WHERE owner_id = $1', [req.user.user_id]);
      if (bizRes.rows && bizRes.rows.length > 0) {
        business = bizRes.rows[0];
      }
    }

    // Get unread notifications count
    const notifRes = await query('SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = 0', [req.user.user_id]);
    const unreadNotifications = parseInt(notifRes.rows[0]?.count || 0, 10);

    return res.json({
      success: true,
      user: req.user,
      business,
      unreadNotifications
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve profile.' });
  }
});

// Demo helper: Get pre-configured users for quick role switching in the evaluation UI
router.get('/demo-users', async (req, res) => {
  try {
    const result = await query(
      `SELECT user_id, full_name, email, role, phone, account_status
       FROM users
       ORDER BY user_id ASC`
    );

    // Generate valid tokens for each demo user so user can switch seamlessly with 1 click
    const usersWithTokens = result.rows.map(u => ({
      ...u,
      token: jwt.sign({ user_id: u.user_id, role: u.role }, JWT_SECRET, { expiresIn: '7d' })
    }));

    return res.json({
      success: true,
      users: usersWithTokens
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to load demo accounts.' });
  }
});

module.exports = router;
