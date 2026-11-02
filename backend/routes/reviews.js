const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// POST /api/reviews - Submit a review (Screen C5 & Flowchart WBS 1.3.4 / 1.4.5)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { listing_id, rating, comment } = req.body;
    const reviewerId = req.user.user_id;

    if (!listing_id || !rating) {
      return res.status(400).json({ success: false, message: 'Listing ID and rating are required.' });
    }

    const ratingVal = parseInt(rating, 10);
    if (ratingVal < 1 || ratingVal > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5 stars.' });
    }

    // Step 1: Flowchart condition - Check if already reviewed this listing
    const existingRev = await query(
      'SELECT review_id FROM reviews WHERE listing_id = $1 AND reviewer_id = $2',
      [listing_id, reviewerId]
    );

    if (existingRev.rows && existingRev.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Review blocked: You have already reviewed this listing. Only one review per listing is permitted.'
      });
    }

    // Step 2: Save review with status 'live' (immediately visible per flowchart)
    await query(
      `INSERT INTO reviews (listing_id, reviewer_id, rating, comment, status)
       VALUES ($1, $2, $3, $4, 'live')`,
      [listing_id, reviewerId, ratingVal, comment ? comment.trim() : '']
    );

    // Retrieve listing and owner to send notification
    const listingRes = await query(
      `SELECT l.title, b.owner_id
       FROM listings l
       JOIN businesses b ON l.business_id = b.business_id
       WHERE l.listing_id = $1`,
      [listing_id]
    );

    if (listingRes.rows && listingRes.rows.length > 0) {
      const ownerId = listingRes.rows[0].owner_id;
      const listingTitle = listingRes.rows[0].title;
      // Notify owner about new review
      await query(
        'INSERT INTO notifications (user_id, type, reference_id, text) VALUES ($1, $2, $3, $4)',
        [ownerId, 'review', listing_id, `New ${ratingVal}-star review received on "${listingTitle}" from ${req.user.full_name}`]
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Your review has been published!'
    });
  } catch (err) {
    console.error('Submit review error:', err);
    return res.status(500).json({ success: false, message: 'Server error while submitting review.' });
  }
});

// POST /api/reviews/:id/flag - Flag a review for administrative moderation
router.post('/:id/flag', authenticateToken, async (req, res) => {
  try {
    const reviewId = parseInt(req.params.id, 10);
    const { reason } = req.body;

    const reviewRes = await query('SELECT review_id, listing_id, status FROM reviews WHERE review_id = $1', [reviewId]);
    if (!reviewRes.rows || reviewRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    // Update status to 'flagged' (admin queue)
    await query("UPDATE reviews SET status = 'flagged' WHERE review_id = $1", [reviewId]);

    // Notify administrators
    const admins = await query("SELECT user_id FROM users WHERE role = 'administrator'");
    if (admins.rows) {
      for (const admin of admins.rows) {
        await query(
          'INSERT INTO notifications (user_id, type, reference_id, text) VALUES ($1, $2, $3, $4)',
          [admin.user_id, 'review_flagged', reviewId, `A review on listing #${reviewRes.rows[0].listing_id} has been flagged for moderation.`]
        );
      }
    }

    return res.json({
      success: true,
      message: 'Review flagged successfully. It has been routed to the administrator moderation queue.'
    });
  } catch (err) {
    console.error('Flag review error:', err);
    return res.status(500).json({ success: false, message: 'Failed to flag review.' });
  }
});

module.exports = router;
