const express = require('express');
const router = express.Router();
const { query } = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT category_id, name FROM categories ORDER BY category_id ASC');
    return res.json({ success: true, categories: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
  }
});

module.exports = router;
