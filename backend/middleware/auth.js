const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'mustmart_swe3103_secret_key_2026';

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied: No authentication token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await query('SELECT user_id, full_name, email, phone, role, account_status FROM users WHERE user_id = $1', [decoded.user_id]);
    
    if (!result.rows || result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid token: User does not exist.' });
    }

    const user = result.rows[0];
    if (user.account_status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Account is suspended. Please contact administrator.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
  }
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    query('SELECT user_id, full_name, email, phone, role, account_status FROM users WHERE user_id = $1', [decoded.user_id])
      .then(result => {
        if (result.rows && result.rows.length > 0) {
          req.user = result.rows[0];
        } else {
          req.user = null;
        }
        next();
      })
      .catch(() => {
        req.user = null;
        next();
      });
  } catch (err) {
    req.user = null;
    next();
  }
}

function requireRole(roles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const allowed = Array.isArray(roles) ? roles : [roles];
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Requires one of the following roles: ${allowed.join(', ')}. Current role is '${req.user.role}'.`
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole,
  JWT_SECRET
};
