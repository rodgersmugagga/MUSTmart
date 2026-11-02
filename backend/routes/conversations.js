const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/conversations - List conversations for signed-in user (buyer or seller)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;

    // Join conversations where user is buyer OR user is the owner of the listing's business
    const sql = `
      SELECT 
        c.conversation_id,
        c.listing_id,
        c.buyer_id,
        c.created_at,
        l.title as listing_title,
        l.price_ugx,
        (
          SELECT file_path FROM listing_photos lp 
          WHERE lp.listing_id = l.listing_id 
          ORDER BY lp.sort_order ASC LIMIT 1
        ) as listing_photo,
        b.name as business_name,
        b.owner_id as seller_id,
        seller.full_name as seller_name,
        buyer.full_name as buyer_name,
        (
          SELECT body FROM messages m 
          WHERE m.conversation_id = c.conversation_id 
          ORDER BY m.sent_at DESC LIMIT 1
        ) as last_message,
        (
          SELECT sent_at FROM messages m 
          WHERE m.conversation_id = c.conversation_id 
          ORDER BY m.sent_at DESC LIMIT 1
        ) as last_message_time,
        (
          SELECT COUNT(*) FROM messages m 
          WHERE m.conversation_id = c.conversation_id 
            AND m.sender_id != $1 
            AND m.read_at IS NULL
        ) as unread_count
      FROM conversations c
      JOIN listings l ON c.listing_id = l.listing_id
      JOIN businesses b ON l.business_id = b.business_id
      JOIN users seller ON b.owner_id = seller.user_id
      JOIN users buyer ON c.buyer_id = buyer.user_id
      WHERE c.buyer_id = $1 OR b.owner_id = $1
      ORDER BY last_message_time DESC NULLS LAST, c.created_at DESC
    `;

    const result = await query(sql, [userId]);
    return res.json({ success: true, conversations: result.rows });
  } catch (err) {
    console.error('Fetch conversations error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve conversations.' });
  }
});

// POST /api/conversations/start - Start or find existing conversation for a listing
router.post('/start', authenticateToken, async (req, res) => {
  try {
    const { listing_id, initial_message } = req.body;
    const buyerId = req.user.user_id;

    if (!listing_id) {
      return res.status(400).json({ success: false, message: 'Listing ID is required.' });
    }

    // Check listing and owner
    const listingRes = await query(
      `SELECT l.listing_id, l.title, b.owner_id, b.name as business_name, u.full_name as seller_name
       FROM listings l
       JOIN businesses b ON l.business_id = b.business_id
       JOIN users u ON b.owner_id = u.user_id
       WHERE l.listing_id = $1`,
      [listing_id]
    );

    if (!listingRes.rows || listingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    const listing = listingRes.rows[0];

    // Prevent seller from starting conversation with themselves
    if (listing.owner_id === buyerId) {
      return res.status(400).json({ success: false, message: 'You cannot send an inquiry on your own listing.' });
    }

    // Check if conversation already exists between this buyer and listing
    let convRes = await query(
      'SELECT conversation_id FROM conversations WHERE listing_id = $1 AND buyer_id = $2',
      [listing_id, buyerId]
    );

    let conversationId;
    if (convRes.rows && convRes.rows.length > 0) {
      conversationId = convRes.rows[0].conversation_id;
    } else {
      await query(
        'INSERT INTO conversations (listing_id, buyer_id) VALUES ($1, $2)',
        [listing_id, buyerId]
      );
      const fetched = await query(
        'SELECT conversation_id FROM conversations WHERE listing_id = $1 AND buyer_id = $2 ORDER BY conversation_id DESC LIMIT 1',
        [listing_id, buyerId]
      );
      conversationId = fetched.rows[0].conversation_id;
    }

    // Send initial message if provided
    if (initial_message && initial_message.trim()) {
      await query(
        'INSERT INTO messages (conversation_id, sender_id, body) VALUES ($1, $2, $3)',
        [conversationId, buyerId, initial_message.trim()]
      );

      // Trigger notification for seller (Mockup N1: "New inquiry: [Buyer name] asked about [Listing title]")
      await query(
        'INSERT INTO notifications (user_id, type, reference_id, text) VALUES ($1, $2, $3, $4)',
        [listing.owner_id, 'inquiry', conversationId, `${req.user.full_name} asked about "${listing.title}"`]
      );
    }

    return res.status(201).json({
      success: true,
      conversation_id: conversationId,
      listing_title: listing.title
    });
  } catch (err) {
    console.error('Start conversation error:', err);
    return res.status(500).json({ success: false, message: 'Failed to initiate inquiry.' });
  }
});

// GET /api/conversations/:id - Get conversation details & messages (Screen C4)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const conversationId = parseInt(req.params.id, 10);
    const userId = req.user.user_id;

    const convRes = await query(
      `SELECT 
        c.*,
        l.title as listing_title,
        l.price_ugx,
        l.location as listing_location,
        b.name as business_name,
        b.owner_id as seller_id,
        b.verification_status,
        seller.full_name as seller_name,
        buyer.full_name as buyer_name,
        (
          SELECT file_path FROM listing_photos lp 
          WHERE lp.listing_id = l.listing_id 
          ORDER BY lp.sort_order ASC LIMIT 1
        ) as listing_photo
       FROM conversations c
       JOIN listings l ON c.listing_id = l.listing_id
       JOIN businesses b ON l.business_id = b.business_id
       JOIN users seller ON b.owner_id = seller.user_id
       JOIN users buyer ON c.buyer_id = buyer.user_id
       WHERE c.conversation_id = $1`,
      [conversationId]
    );

    if (!convRes.rows || convRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    const conversation = convRes.rows[0];

    // Ensure current user is either buyer, seller, or administrator
    if (conversation.buyer_id !== userId && conversation.seller_id !== userId && req.user.role !== 'administrator') {
      return res.status(403).json({ success: false, message: 'Access denied to this conversation.' });
    }

    // Mark unread messages as read for this user
    await query(
      'UPDATE messages SET read_at = CURRENT_TIMESTAMP WHERE conversation_id = $1 AND sender_id != $2 AND read_at IS NULL',
      [conversationId, userId]
    );

    // Fetch messages
    const messagesRes = await query(
      `SELECT m.*, u.full_name as sender_name, u.role as sender_role
       FROM messages m
       JOIN users u ON m.sender_id = u.user_id
       WHERE m.conversation_id = $1
       ORDER BY m.sent_at ASC`,
      [conversationId]
    );

    return res.json({
      success: true,
      conversation,
      messages: messagesRes.rows,
      payment_disclaimer: 'Payments are arranged directly between buyer and seller. MUSTmart does not process payments.'
    });
  } catch (err) {
    console.error('Get conversation detail error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve conversation thread.' });
  }
});

// POST /api/conversations/:id/messages - Send a message (Screen C4)
router.post('/:id/messages', authenticateToken, async (req, res) => {
  try {
    const conversationId = parseInt(req.params.id, 10);
    const { body } = req.body;
    const senderId = req.user.user_id;

    if (!body || !body.trim()) {
      return res.status(400).json({ success: false, message: 'Message body cannot be empty.' });
    }

    // Check conversation participants
    const convRes = await query(
      `SELECT c.conversation_id, c.buyer_id, b.owner_id as seller_id, l.title as listing_title
       FROM conversations c
       JOIN listings l ON c.listing_id = l.listing_id
       JOIN businesses b ON l.business_id = b.business_id
       WHERE c.conversation_id = $1`,
      [conversationId]
    );

    if (!convRes.rows || convRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    const conv = convRes.rows[0];
    if (conv.buyer_id !== senderId && conv.seller_id !== senderId && req.user.role !== 'administrator') {
      return res.status(403).json({ success: false, message: 'You are not a participant in this conversation.' });
    }

    // Insert message
    await query(
      'INSERT INTO messages (conversation_id, sender_id, body) VALUES ($1, $2, $3)',
      [conversationId, senderId, body.trim()]
    );

    // Determine recipient
    const recipientId = senderId === conv.buyer_id ? conv.seller_id : conv.buyer_id;

    // Trigger notification (Mockup N1: Reply received or new inquiry)
    const notifText = senderId === conv.buyer_id
      ? `${req.user.full_name} asked about "${conv.listing_title}"`
      : `${req.user.full_name} replied about "${conv.listing_title}"`;

    await query(
      'INSERT INTO notifications (user_id, type, reference_id, text) VALUES ($1, $2, $3, $4)',
      [recipientId, 'reply', conversationId, notifText]
    );

    return res.status(201).json({
      success: true,
      message: 'Message delivered successfully!'
    });
  } catch (err) {
    console.error('Send message error:', err);
    return res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
});

module.exports = router;
