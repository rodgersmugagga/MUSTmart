const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/notifications - List notifications for signed-in user (Screen N1)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT notification_id, user_id, type, reference_id, text, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.user_id]
    );

    return res.json({
      success: true,
      notifications: result.rows
    });
  } catch (err) {
    console.error('Fetch notifications error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
});

// PUT /api/notifications/:id/read - Mark single notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notifId = parseInt(req.params.id, 10);
    await query(
      'UPDATE notifications SET is_read = 1 WHERE notification_id = $1 AND user_id = $2',
      [notifId, req.user.user_id]
    );

    return res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
});

// PUT /api/notifications/read-all - Mark all user notifications as read
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    await query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = $1',
      [req.user.user_id]
    );

    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to mark all as read.' });
  }
});

module.exports = router;
