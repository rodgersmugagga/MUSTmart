const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// All admin routes require role 'administrator'
router.use(authenticateToken, requireRole(['administrator']));

// GET /api/admin/stats - Overview metrics
router.get('/stats', async (req, res) => {
  try {
    const pendingBiz = await query("SELECT COUNT(*) as count FROM businesses WHERE verification_status = 'pending'");
    const pendingListings = await query("SELECT COUNT(*) as count FROM listings WHERE status = 'pending'");
    const flaggedReviews = await query("SELECT COUNT(*) as count FROM reviews WHERE status = 'flagged'");
    const liveListings = await query("SELECT COUNT(*) as count FROM listings WHERE status = 'live'");
    const verifiedBusinesses = await query("SELECT COUNT(*) as count FROM businesses WHERE verification_status = 'verified'");
    const totalUsers = await query("SELECT COUNT(*) as count FROM users");

    return res.json({
      success: true,
      stats: {
        pending_verifications: parseInt(pendingBiz.rows[0]?.count || 0, 10),
        pending_listings: parseInt(pendingListings.rows[0]?.count || 0, 10),
        flagged_reviews: parseInt(flaggedReviews.rows[0]?.count || 0, 10),
        live_listings: parseInt(liveListings.rows[0]?.count || 0, 10),
        verified_businesses: parseInt(verifiedBusinesses.rows[0]?.count || 0, 10),
        total_users: parseInt(totalUsers.rows[0]?.count || 0, 10)
      }
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch admin stats.' });
  }
});

// GET /api/admin/verifications - Screen A1 Verification Queue
router.get('/verifications', async (req, res) => {
  try {
    const sql = `
      SELECT 
        b.business_id,
        b.name as business_name,
        b.description,
        b.location,
        b.verification_status,
        u.user_id as owner_id,
        u.full_name as applicant_name,
        u.email as applicant_email,
        u.phone as applicant_phone,
        u.role as applicant_role
      FROM businesses b
      JOIN users u ON b.owner_id = u.user_id
      WHERE b.verification_status IN ('pending', 'info_requested')
      ORDER BY b.business_id DESC
    `;

    const result = await query(sql);

    // Fetch documents for each business
    const items = [];
    for (const biz of result.rows) {
      const docsRes = await query(
        'SELECT document_id, doc_type, file_path, review_status, reviewer_note, uploaded_at FROM verification_documents WHERE business_id = $1',
        [biz.business_id]
      );
      items.push({
        ...biz,
        documents: docsRes.rows
      });
    }

    return res.json({ success: true, verifications: items });
  } catch (err) {
    console.error('Fetch verifications error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch verification queue.' });
  }
});

// POST /api/admin/verifications/:id/decision - Approve, Reject, or Request Info (Screen A1)
router.post('/verifications/:id/decision', async (req, res) => {
  try {
    const businessId = parseInt(req.params.id, 10);
    const { decision, reason } = req.body; // 'approve', 'reject', 'request_info'
    const adminId = req.user.user_id;

    if (!['approve', 'reject', 'request_info'].includes(decision)) {
      return res.status(400).json({ success: false, message: "Decision must be 'approve', 'reject', or 'request_info'." });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'A reason or note must be provided for every decision.' });
    }

    const bizRes = await query('SELECT * FROM businesses WHERE business_id = $1', [businessId]);
    if (!bizRes.rows || bizRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Business not found.' });
    }

    const business = bizRes.rows[0];

    let newStatus = 'pending';
    let notifText = '';

    if (decision === 'approve') {
      newStatus = 'verified';
      await query(
        `UPDATE businesses
         SET verification_status = 'verified', verified_by = $1, verified_at = CURRENT_TIMESTAMP
         WHERE business_id = $2`,
        [adminId, businessId]
      );
      notifText = `Verification decision: ${business.name} has been Approved with the Verified Badge! Your listings can now go live.`;
    } else if (decision === 'reject') {
      newStatus = 'rejected';
      await query("UPDATE businesses SET verification_status = 'rejected' WHERE business_id = $1", [businessId]);
      notifText = `Verification decision: ${business.name} was rejected. Reason: ${reason}`;
    } else if (decision === 'request_info') {
      newStatus = 'info_requested';
      await query("UPDATE businesses SET verification_status = 'info_requested' WHERE business_id = $1", [businessId]);
      notifText = `Verification decision: More information requested for ${business.name}. Note: ${reason}. Please update your documents.`;
    }

    // Save decision in moderation_actions table (Audit log)
    await query(
      `INSERT INTO moderation_actions (admin_id, target_type, target_id, action, reason)
       VALUES ($1, 'business', $2, $3, $4)`,
      [adminId, businessId, decision, reason.trim()]
    );

    // Notify owner (Mockup N1)
    await query(
      'INSERT INTO notifications (user_id, type, reference_id, text) VALUES ($1, $2, $3, $4)',
      [business.owner_id, 'verification', businessId, notifText]
    );

    return res.json({
      success: true,
      message: `Business status updated to ${newStatus}. Reason recorded in moderation audit log.`
    });
  } catch (err) {
    console.error('Verification decision error:', err);
    return res.status(500).json({ success: false, message: 'Failed to record verification decision.' });
  }
});

// GET /api/admin/listings - Screen A2 Listing Moderation Queue
router.get('/listings', async (req, res) => {
  try {
    const sql = `
      SELECT 
        l.*,
        c.name as category_name,
        b.name as business_name,
        b.verification_status,
        u.full_name as owner_name,
        u.email as owner_email,
        (
          SELECT file_path FROM listing_photos lp 
          WHERE lp.listing_id = l.listing_id 
          ORDER BY lp.sort_order ASC LIMIT 1
        ) as primary_photo,
        hd.room_type,
        hd.amenities,
        hd.rooms_available,
        ld.plot_size,
        ld.size_unit
      FROM listings l
      JOIN categories c ON l.category_id = c.category_id
      JOIN businesses b ON l.business_id = b.business_id
      JOIN users u ON b.owner_id = u.user_id
      LEFT JOIN hostel_details hd ON l.listing_id = hd.listing_id
      LEFT JOIN land_details ld ON l.listing_id = ld.listing_id
      WHERE l.status = 'pending'
      ORDER BY l.created_at ASC
    `;

    const result = await query(sql);
    return res.json({ success: true, listings: result.rows });
  } catch (err) {
    console.error('Fetch admin listings error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch listing moderation queue.' });
  }
});

// POST /api/admin/listings/:id/decision - Approve or Reject with reason (Screen A2)
router.post('/listings/:id/decision', async (req, res) => {
  try {
    const listingId = parseInt(req.params.id, 10);
    const { decision, reason } = req.body; // 'approve' or 'reject'
    const adminId = req.user.user_id;

    if (!['approve', 'reject'].includes(decision)) {
      return res.status(400).json({ success: false, message: "Decision must be 'approve' or 'reject'." });
    }

    if (decision === 'reject' && (!reason || !reason.trim())) {
      return res.status(400).json({ success: false, message: 'A rejection reason is required.' });
    }

    const listingRes = await query(
      `SELECT l.listing_id, l.title, b.owner_id, b.name as business_name
       FROM listings l
       JOIN businesses b ON l.business_id = b.business_id
       WHERE l.listing_id = $1`,
      [listingId]
    );

    if (!listingRes.rows || listingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    const listing = listingRes.rows[0];
    const newStatus = decision === 'approve' ? 'live' : 'rejected';
    const finalReason = reason && reason.trim() ? reason.trim() : 'Listing meets platform standards and has been approved.';

    // Update listing status
    await query(
      'UPDATE listings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE listing_id = $2',
      [newStatus, listingId]
    );

    // Save in moderation_actions table (Audit log)
    await query(
      `INSERT INTO moderation_actions (admin_id, target_type, target_id, action, reason)
       VALUES ($1, 'listing', $2, $3, $4)`,
      [adminId, listingId, decision, finalReason]
    );

    // Notify owner (Mockup N1: "Listing decision: [Listing title]: [Live or rejected, with reason]")
    const notifText = decision === 'approve'
      ? `Listing decision: "${listing.title}" is now Live and searchable on MUSTmart!`
      : `Listing decision: "${listing.title}" was Rejected. Reason: ${finalReason}`;

    await query(
      'INSERT INTO notifications (user_id, type, reference_id, text) VALUES ($1, $2, $3, $4)',
      [listing.owner_id, 'listing_decision', listingId, notifText]
    );

    return res.json({
      success: true,
      message: `Listing is now ${newStatus}. Decision recorded in moderation log.`
    });
  } catch (err) {
    console.error('Listing decision error:', err);
    return res.status(500).json({ success: false, message: 'Failed to record listing decision.' });
  }
});

// GET /api/admin/reviews - Screen A3 Review Moderation Queue
router.get('/reviews', async (req, res) => {
  try {
    const sql = `
      SELECT 
        r.*,
        l.title as listing_title,
        b.name as business_name,
        u.full_name as reviewer_name,
        u.email as reviewer_email
      FROM reviews r
      JOIN listings l ON r.listing_id = l.listing_id
      JOIN businesses b ON l.business_id = b.business_id
      JOIN users u ON r.reviewer_id = u.user_id
      WHERE r.status = 'flagged'
      ORDER BY r.created_at ASC
    `;

    const result = await query(sql);
    return res.json({ success: true, reviews: result.rows });
  } catch (err) {
    console.error('Fetch flagged reviews error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch review moderation queue.' });
  }
});

// POST /api/admin/reviews/:id/decision - Keep or Remove with reason (Screen A3 & Flowchart)
router.post('/reviews/:id/decision', async (req, res) => {
  try {
    const reviewId = parseInt(req.params.id, 10);
    const { decision, reason } = req.body; // 'keep' or 'remove'
    const adminId = req.user.user_id;

    if (!['keep', 'remove'].includes(decision)) {
      return res.status(400).json({ success: false, message: "Decision must be 'keep' or 'remove'." });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'A reason must be recorded for every review moderation action.' });
    }

    const reviewRes = await query('SELECT * FROM reviews WHERE review_id = $1', [reviewId]);
    if (!reviewRes.rows || reviewRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    const review = reviewRes.rows[0];
    const newStatus = decision === 'keep' ? 'live' : 'removed';

    // Update review status
    await query('UPDATE reviews SET status = $1 WHERE review_id = $2', [newStatus, reviewId]);

    // Record decision in moderation_actions (Audit log)
    await query(
      `INSERT INTO moderation_actions (admin_id, target_type, target_id, action, reason)
       VALUES ($1, 'review', $2, $3, $4)`,
      [adminId, reviewId, decision, reason.trim()]
    );

    return res.json({
      success: true,
      message: `Review ${decision === 'keep' ? 'flag cleared and kept live' : 'removed'}. Reason saved to moderation log.`
    });
  } catch (err) {
    console.error('Review decision error:', err);
    return res.status(500).json({ success: false, message: 'Failed to record review decision.' });
  }
});

// GET /api/admin/moderation-log - Full Audit Log from moderation_actions table
router.get('/moderation-log', async (req, res) => {
  try {
    const sql = `
      SELECT 
        ma.*,
        u.full_name as admin_name
      FROM moderation_actions ma
      JOIN users u ON ma.admin_id = u.user_id
      ORDER BY ma.created_at DESC
      LIMIT 100
    `;

    const result = await query(sql);
    return res.json({ success: true, log: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch moderation log.' });
  }
});

module.exports = router;
