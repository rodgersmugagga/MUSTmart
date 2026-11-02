const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { query } = require('../config/db');
const { authenticateToken, optionalAuth, requireRole } = require('../middleware/auth');

// Multer storage for listing photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'listing-' + uniqueSuffix + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }
});

// GET /api/listings - Search & Discovery (Screens C1, C2 / WBS 1.4.3)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      q,
      category,
      location,
      minPrice,
      maxPrice,
      verifiedOnly,
      orientation,
      sort
    } = req.query;

    let sql = `
      SELECT 
        l.listing_id,
        l.business_id,
        l.category_id,
        l.title,
        l.description,
        l.price_ugx,
        l.location,
        l.status,
        l.featured_until,
        l.created_at,
        c.name as category_name,
        b.name as business_name,
        b.verification_status,
        u.full_name as owner_name,
        COALESCE(AVG(CASE WHEN r.status = 'live' THEN r.rating ELSE NULL END), 0) as avg_rating,
        COUNT(CASE WHEN r.status = 'live' THEN r.review_id ELSE NULL END) as review_count,
        (
          SELECT file_path FROM listing_photos lp 
          WHERE lp.listing_id = l.listing_id 
          ORDER BY lp.sort_order ASC, lp.photo_id ASC LIMIT 1
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
      LEFT JOIN reviews r ON l.listing_id = r.listing_id
      LEFT JOIN hostel_details hd ON l.listing_id = hd.listing_id
      LEFT JOIN land_details ld ON l.listing_id = ld.listing_id
      WHERE l.status = 'live'
    `;

    const params = [];
    let paramIndex = 1;

    // Search query filter
    if (q && q.trim()) {
      sql += ` AND (LOWER(l.title) LIKE LOWER($${paramIndex}) OR LOWER(l.description) LIKE LOWER($${paramIndex}) OR LOWER(b.name) LIKE LOWER($${paramIndex}))`;
      params.push(`%${q.trim()}%`);
      paramIndex++;
    }

    // Category filter
    if (category && category !== 'all') {
      if (isNaN(category)) {
        sql += ` AND LOWER(c.name) = LOWER($${paramIndex})`;
        params.push(category.trim());
      } else {
        sql += ` AND l.category_id = $${paramIndex}`;
        params.push(parseInt(category, 10));
      }
      paramIndex++;
    }

    // Location filter
    if (location && location.trim() && location !== 'all') {
      sql += ` AND LOWER(l.location) LIKE LOWER($${paramIndex})`;
      params.push(`%${location.trim()}%`);
      paramIndex++;
    }

    // Price range filter
    if (minPrice && !isNaN(minPrice)) {
      sql += ` AND l.price_ugx >= $${paramIndex}`;
      params.push(parseFloat(minPrice));
      paramIndex++;
    }
    if (maxPrice && !isNaN(maxPrice)) {
      sql += ` AND l.price_ugx <= $${paramIndex}`;
      params.push(parseFloat(maxPrice));
      paramIndex++;
    }

    // Verified only filter (Mockup C2)
    if (verifiedOnly === 'true' || verifiedOnly === true || verifiedOnly === '1') {
      sql += ` AND b.verification_status = 'verified'`;
    }

    // Orientation-week picks filter (Mockup C1 banner)
    if (orientation === 'true' || orientation === true) {
      sql += ` AND l.featured_until IS NOT NULL AND b.verification_status = 'verified'`;
    }

    sql += `
      GROUP BY 
        l.listing_id, l.business_id, l.category_id, l.title, l.description, 
        l.price_ugx, l.location, l.status, l.featured_until, l.created_at,
        c.name, b.name, b.verification_status, u.full_name,
        hd.room_type, hd.amenities, hd.rooms_available, ld.plot_size, ld.size_unit
    `;

    // Sort order
    if (sort === 'price_asc') {
      sql += ` ORDER BY l.price_ugx ASC`;
    } else if (sort === 'price_desc') {
      sql += ` ORDER BY l.price_ugx DESC`;
    } else if (sort === 'rating') {
      sql += ` ORDER BY avg_rating DESC, l.created_at DESC`;
    } else {
      sql += ` ORDER BY l.created_at DESC`;
    }

    const result = await query(sql, params);

    return res.json({
      success: true,
      count: result.rows.length,
      listings: result.rows.map(row => ({
        ...row,
        avg_rating: parseFloat(Number(row.avg_rating).toFixed(1)),
        review_count: parseInt(row.review_count, 10)
      }))
    });
  } catch (err) {
    console.error('Fetch listings error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve listings.' });
  }
});

// GET /api/listings/my - Owner's listings (Screen O3)
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const bizRes = await query('SELECT business_id, verification_status FROM businesses WHERE owner_id = $1', [req.user.user_id]);
    if (!bizRes.rows || bizRes.rows.length === 0) {
      return res.json({ success: true, listings: [] });
    }

    const businessId = bizRes.rows[0].business_id;

    const sql = `
      SELECT 
        l.*,
        c.name as category_name,
        b.name as business_name,
        (
          SELECT file_path FROM listing_photos lp 
          WHERE lp.listing_id = l.listing_id 
          ORDER BY lp.sort_order ASC, lp.photo_id ASC LIMIT 1
        ) as primary_photo,
        (
          SELECT reason FROM moderation_actions ma
          WHERE ma.target_type = 'listing' AND ma.target_id = l.listing_id AND ma.action = 'reject'
          ORDER BY ma.created_at DESC LIMIT 1
        ) as rejection_reason,
        hd.room_type,
        hd.amenities,
        hd.rooms_available,
        ld.plot_size,
        ld.size_unit
      FROM listings l
      JOIN categories c ON l.category_id = c.category_id
      JOIN businesses b ON l.business_id = b.business_id
      LEFT JOIN hostel_details hd ON l.listing_id = hd.listing_id
      LEFT JOIN land_details ld ON l.listing_id = ld.listing_id
      WHERE l.business_id = $1
      ORDER BY l.created_at DESC
    `;

    const result = await query(sql, [businessId]);
    return res.json({ success: true, listings: result.rows });
  } catch (err) {
    console.error('Fetch my listings error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch owner listings.' });
  }
});

// GET /api/listings/:id - Listing detail (Screen C3)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const listingId = parseInt(req.params.id, 10);
    if (isNaN(listingId)) {
      return res.status(400).json({ success: false, message: 'Invalid listing ID.' });
    }

    const sql = `
      SELECT 
        l.*,
        c.name as category_name,
        b.name as business_name,
        b.description as business_description,
        b.verification_status,
        u.user_id as owner_id,
        u.full_name as owner_name,
        u.phone as owner_phone,
        u.email as owner_email,
        hd.room_type,
        hd.amenities,
        hd.rooms_available,
        ld.plot_size,
        ld.size_unit,
        ld.documents_checked
      FROM listings l
      JOIN categories c ON l.category_id = c.category_id
      JOIN businesses b ON l.business_id = b.business_id
      JOIN users u ON b.owner_id = u.user_id
      LEFT JOIN hostel_details hd ON l.listing_id = hd.listing_id
      LEFT JOIN land_details ld ON l.listing_id = ld.listing_id
      WHERE l.listing_id = $1
    `;

    const result = await query(sql, [listingId]);
    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    const listing = result.rows[0];

    // Fetch photos
    const photosRes = await query(
      'SELECT photo_id, file_path, sort_order FROM listing_photos WHERE listing_id = $1 ORDER BY sort_order ASC, photo_id ASC',
      [listingId]
    );

    // Fetch live reviews
    const reviewsRes = await query(
      `SELECT r.review_id, r.rating, r.comment, r.status, r.created_at, u.full_name as reviewer_name, u.user_id as reviewer_id
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.user_id
       WHERE r.listing_id = $1 AND r.status = 'live'
       ORDER BY r.created_at DESC`,
      [listingId]
    );

    // Average rating
    const avgRating = reviewsRes.rows.length > 0
      ? reviewsRes.rows.reduce((sum, rev) => sum + rev.rating, 0) / reviewsRes.rows.length
      : 0;

    // Check if current user has already reviewed this listing (Flowchart rule)
    let userHasReviewed = false;
    if (req.user) {
      const userRev = await query(
        'SELECT review_id FROM reviews WHERE listing_id = $1 AND reviewer_id = $2',
        [listingId, req.user.user_id]
      );
      userHasReviewed = userRev.rows && userRev.rows.length > 0;
    }

    return res.json({
      success: true,
      listing: {
        ...listing,
        photos: photosRes.rows,
        reviews: reviewsRes.rows,
        avg_rating: parseFloat(avgRating.toFixed(1)),
        review_count: reviewsRes.rows.length,
        userHasReviewed
      }
    });
  } catch (err) {
    console.error('Fetch listing detail error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch listing detail.' });
  }
});

// POST /api/listings - Create listing (Screen O2)
router.post('/', authenticateToken, upload.array('photos', 5), async (req, res) => {
  try {
    const {
      title,
      category_id,
      price_ugx,
      location,
      description,
      plot_size,
      size_unit,
      documents_checked,
      room_type,
      amenities,
      rooms_available,
      photo_urls
    } = req.body;

    if (!title || !category_id || !price_ugx || !location) {
      return res.status(400).json({ success: false, message: 'Title, category, price, and location are required.' });
    }

    // Find user's business
    const bizRes = await query('SELECT business_id, verification_status FROM businesses WHERE owner_id = $1', [req.user.user_id]);
    if (!bizRes.rows || bizRes.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'You must first register your business before creating a listing.'
      });
    }

    const business = bizRes.rows[0];

    // Status: Pending review per flowchart and mockup
    const initialStatus = 'pending';

    const insertRes = await query(
      `INSERT INTO listings (business_id, category_id, title, description, price_ugx, location, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [business.business_id, parseInt(category_id, 10), title, description || '', parseFloat(price_ugx), location, initialStatus]
    );

    // Retrieve created listing ID
    const fetched = await query(
      'SELECT listing_id FROM listings WHERE business_id = $1 ORDER BY listing_id DESC LIMIT 1',
      [business.business_id]
    );
    const listingId = fetched.rows[0].listing_id;

    // Save uploaded photos
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        await query(
          'INSERT INTO listing_photos (listing_id, file_path, sort_order) VALUES ($1, $2, $3)',
          [listingId, req.files[i].filename, i]
        );
      }
    } else if (photo_urls) {
      // Support array or comma separated string of sample/external image URLs
      const urls = Array.isArray(photo_urls) ? photo_urls : photo_urls.split(',');
      for (let i = 0; i < urls.length; i++) {
        const u = urls[i].trim();
        if (u) {
          await query(
            'INSERT INTO listing_photos (listing_id, file_path, sort_order) VALUES ($1, $2, $3)',
            [listingId, u, i]
          );
        }
      }
    }

    // Category-specific fields: Land
    const categoryIdNum = parseInt(category_id, 10);
    if (plot_size || categoryIdNum === 6) {
      await query(
        `INSERT INTO land_details (listing_id, plot_size, size_unit, documents_checked)
         VALUES ($1, $2, $3, $4)`,
        [listingId, parseFloat(plot_size) || 0, size_unit || 'decimals', documents_checked ? 1 : 0]
      );
    }

    // Category-specific fields: Hostels & rentals
    if (room_type || categoryIdNum === 7) {
      await query(
        `INSERT INTO hostel_details (listing_id, room_type, amenities, rooms_available)
         VALUES ($1, $2, $3, $4)`,
        [listingId, room_type || 'Single Room', amenities || '', parseInt(rooms_available, 10) || 1]
      );
    }

    // Notify admins of new pending listing
    const admins = await query("SELECT user_id FROM users WHERE role = 'administrator'");
    if (admins.rows) {
      for (const admin of admins.rows) {
        await query(
          'INSERT INTO notifications (user_id, type, reference_id, text) VALUES ($1, $2, $3, $4)',
          [admin.user_id, 'listing_queue', listingId, `New listing submitted for review: "${title}"`]
        );
      }
    }

    // Notify owner
    await query(
      'INSERT INTO notifications (user_id, type, reference_id, text) VALUES ($1, $2, $3, $4)',
      [req.user.user_id, 'listing_status', listingId, `Listing "${title}" submitted. Status: Pending review by administrator.`]
    );

    return res.status(201).json({
      success: true,
      message: 'Listing submitted for administrative review!',
      listing_id: listingId
    });
  } catch (err) {
    console.error('Create listing error:', err);
    return res.status(500).json({ success: false, message: 'Server error creating listing.' });
  }
});

// PUT /api/listings/:id - Edit listing / Resubmit (Screen O3)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const listingId = parseInt(req.params.id, 10);
    const { title, category_id, price_ugx, location, description, room_type, amenities, rooms_available, plot_size, size_unit } = req.body;

    // Verify ownership
    const checkRes = await query(
      `SELECT l.listing_id, l.business_id, b.owner_id
       FROM listings l
       JOIN businesses b ON l.business_id = b.business_id
       WHERE l.listing_id = $1`,
      [listingId]
    );

    if (!checkRes.rows || checkRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    if (checkRes.rows[0].owner_id !== req.user.user_id && req.user.role !== 'administrator') {
      return res.status(403).json({ success: false, message: 'Unauthorized to modify this listing.' });
    }

    // Update listing and reset status to 'pending' for review if it was rejected
    await query(
      `UPDATE listings
       SET title = COALESCE($1, title),
           category_id = COALESCE($2, category_id),
           price_ugx = COALESCE($3, price_ugx),
           location = COALESCE($4, location),
           description = COALESCE($5, description),
           status = 'pending',
           updated_at = CURRENT_TIMESTAMP
       WHERE listing_id = $6`,
      [title, category_id, price_ugx, location, description, listingId]
    );

    // Update hostel details if provided
    if (room_type || amenities || rooms_available) {
      const existingHostel = await query('SELECT listing_id FROM hostel_details WHERE listing_id = $1', [listingId]);
      if (existingHostel.rows && existingHostel.rows.length > 0) {
        await query(
          `UPDATE hostel_details
           SET room_type = COALESCE($1, room_type), amenities = COALESCE($2, amenities), rooms_available = COALESCE($3, rooms_available)
           WHERE listing_id = $4`,
          [room_type, amenities, rooms_available, listingId]
        );
      } else {
        await query(
          'INSERT INTO hostel_details (listing_id, room_type, amenities, rooms_available) VALUES ($1, $2, $3, $4)',
          [listingId, room_type || 'Single', amenities || '', rooms_available || 1]
        );
      }
    }

    // Update land details if provided
    if (plot_size || size_unit) {
      const existingLand = await query('SELECT listing_id FROM land_details WHERE listing_id = $1', [listingId]);
      if (existingLand.rows && existingLand.rows.length > 0) {
        await query(
          `UPDATE land_details
           SET plot_size = COALESCE($1, plot_size), size_unit = COALESCE($2, size_unit)
           WHERE listing_id = $3`,
          [plot_size, size_unit, listingId]
        );
      } else {
        await query(
          'INSERT INTO land_details (listing_id, plot_size, size_unit, documents_checked) VALUES ($1, $2, $3, 0)',
          [listingId, plot_size || 0, size_unit || 'decimals']
        );
      }
    }

    return res.json({
      success: true,
      message: 'Listing updated and resubmitted for admin review!'
    });
  } catch (err) {
    console.error('Update listing error:', err);
    return res.status(500).json({ success: false, message: 'Server error updating listing.' });
  }
});

// POST /api/listings/:id/archive - Archive listing (Screen O3)
router.post('/:id/archive', authenticateToken, async (req, res) => {
  try {
    const listingId = parseInt(req.params.id, 10);
    const checkRes = await query(
      `SELECT l.listing_id, b.owner_id
       FROM listings l
       JOIN businesses b ON l.business_id = b.business_id
       WHERE l.listing_id = $1`,
      [listingId]
    );

    if (!checkRes.rows || checkRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    if (checkRes.rows[0].owner_id !== req.user.user_id && req.user.role !== 'administrator') {
      return res.status(403).json({ success: false, message: 'Unauthorized to archive this listing.' });
    }

    await query("UPDATE listings SET status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE listing_id = $1", [listingId]);

    return res.json({ success: true, message: 'Listing has been archived.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to archive listing.' });
  }
});

module.exports = router;
