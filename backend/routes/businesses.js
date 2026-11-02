const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { query } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Setup multer for document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'doc-' + uniqueSuffix + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// GET all verified businesses (public directory)
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT b.*, u.full_name as owner_name, u.phone as owner_phone, u.email as owner_email
       FROM businesses b
       JOIN users u ON b.owner_id = u.user_id
       WHERE b.verification_status = 'verified'
       ORDER BY b.business_id ASC`
    );
    return res.json({ success: true, businesses: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch businesses.' });
  }
});

// GET current user's business
router.get('/my-business', authenticateToken, async (req, res) => {
  try {
    const bizRes = await query('SELECT * FROM businesses WHERE owner_id = $1', [req.user.user_id]);
    if (!bizRes.rows || bizRes.rows.length === 0) {
      return res.json({ success: true, business: null });
    }

    const business = bizRes.rows[0];
    const docsRes = await query(
      'SELECT * FROM verification_documents WHERE business_id = $1 ORDER BY uploaded_at DESC',
      [business.business_id]
    );

    return res.json({
      success: true,
      business: {
        ...business,
        documents: docsRes.rows
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch business.' });
  }
});

// POST register and verify business (Screen O1 / WBS 1.4.1)
router.post(
  '/register',
  authenticateToken,
  upload.fields([
    { name: 'id_document', maxCount: 1 },
    { name: 'ownership_document', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const { business_name, description, location, phone, id_type } = req.body;

      if (!business_name || !location) {
        return res.status(400).json({ success: false, message: 'Business name and location are required.' });
      }

      // Update phone on user if changed
      if (phone) {
        await query('UPDATE users SET phone = $1 WHERE user_id = $2', [phone, req.user.user_id]);
      }

      // Ensure user role is owner or agent
      if (req.user.role === 'consumer') {
        await query("UPDATE users SET role = 'owner' WHERE user_id = $1", [req.user.user_id]);
      }

      // Check if business already exists for this owner
      const existingBiz = await query('SELECT business_id, verification_status FROM businesses WHERE owner_id = $1', [req.user.user_id]);
      
      let businessId;
      if (existingBiz.rows && existingBiz.rows.length > 0) {
        businessId = existingBiz.rows[0].business_id;
        await query(
          `UPDATE businesses
           SET name = $1, description = $2, location = $3, verification_status = 'pending'
           WHERE business_id = $4`,
          [business_name, description || '', location, businessId]
        );
      } else {
        const insertRes = await query(
          `INSERT INTO businesses (owner_id, name, description, location, verification_status)
           VALUES ($1, $2, $3, $4, 'pending')`,
          [req.user.user_id, business_name, description || '', location]
        );
        const fetched = await query('SELECT business_id FROM businesses WHERE owner_id = $1 ORDER BY business_id DESC LIMIT 1', [req.user.user_id]);
        businessId = fetched.rows[0].business_id;
      }

      // Process uploaded ID document
      if (req.files && req.files['id_document']) {
        const file = req.files['id_document'][0];
        const docType = id_type || 'student_id';
        await query(
          `INSERT INTO verification_documents (business_id, doc_type, file_path, review_status, reviewer_note)
           VALUES ($1, $2, $3, 'pending', 'Submitted for identity verification')`,
          [businessId, docType, file.filename]
        );
      }

      // Process uploaded Ownership or Agency document
      if (req.files && req.files['ownership_document']) {
        const file = req.files['ownership_document'][0];
        await query(
          `INSERT INTO verification_documents (business_id, doc_type, file_path, review_status, reviewer_note)
           VALUES ($1, 'proof_of_ownership', $2, 'pending', 'Proof of ownership or agency document')`,
          [businessId, file.filename]
        );
      }

      // Notify administrators
      const admins = await query("SELECT user_id FROM users WHERE role = 'administrator'");
      if (admins.rows) {
        for (const admin of admins.rows) {
          await query(
            'INSERT INTO notifications (user_id, type, reference_id, text) VALUES ($1, $2, $3, $4)',
            [admin.user_id, 'verification_queue', businessId, `New business verification request from ${business_name}`]
          );
        }
      }

      // Notify owner that verification is pending review
      await query(
        'INSERT INTO notifications (user_id, type, reference_id, text) VALUES ($1, $2, $3, $4)',
        [req.user.user_id, 'verification', businessId, `${business_name}: Verification submitted. An administrator is reviewing your documents.`]
      );

      return res.status(201).json({
        success: true,
        message: 'Business verification documents submitted successfully! Admin will review your application.',
        business_id: businessId
      });
    } catch (err) {
      console.error('Business verification registration error:', err);
      return res.status(500).json({ success: false, message: 'Server error during business registration.' });
    }
  }
);

module.exports = router;
