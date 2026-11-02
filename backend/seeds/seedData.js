const bcrypt = require('bcryptjs');
const { query } = require('../config/db');

async function seedDatabase() {
  console.log('[MUSTmart Seed] Checking if database needs seeding...');

  const existingUsers = await query('SELECT count(*) as count FROM users');
  const count = parseInt(existingUsers.rows[0].count || existingUsers.rows[0].COUNT || 0, 10);
  
  if (count > 0) {
    console.log(`[MUSTmart Seed] Database already contains ${count} users. Skipping initial seed.`);
    return;
  }

  console.log('[MUSTmart Seed] Populating initial dataset (MUST Community, Pilot Businesses, WBS deliverables)...');

  // 1. Categories
  const categories = [
    'Fashion & thrift',
    'Food & catering',
    'Laundry & personal care',
    'Gifts & events',
    'Second-hand goods',
    'Land & real estate',
    'Hostels & rentals'
  ];

  for (const cat of categories) {
    await query('INSERT INTO categories (name) VALUES ($1)', [cat]);
  }

  // 2. Users (Group A & MUST Stakeholders)
  const defaultPasswordHash = await bcrypt.hash('mustmart123', 10);

  const usersData = [
    {
      name: 'Dr. Musinguzi (Dean/Admin)',
      email: 'admin@must.ac.ug',
      phone: '+256701112233',
      role: 'administrator',
      status: 'active'
    },
    {
      name: 'Dembe Brandon (Software Eng)',
      email: 'brandon.student@must.ac.ug',
      phone: '+256772123456',
      role: 'consumer',
      status: 'active'
    },
    {
      name: 'General MUST Student',
      email: 'student@must.ac.ug',
      phone: '+256782998877',
      role: 'consumer',
      status: 'active'
    },
    {
      name: 'Nsubuga Arafat (Hostel Prop)',
      email: 'arafat.owner@must.ac.ug',
      phone: '+256755443322',
      role: 'owner',
      status: 'active'
    },
    {
      name: 'Muggaga Rodgers (Tech Lead)',
      email: 'rodgers.owner@must.ac.ug',
      phone: '+256704987654',
      role: 'owner',
      status: 'active'
    },
    {
      name: 'Ninsiima Carol (Real Estate Agent)',
      email: 'carol.agent@must.ac.ug',
      phone: '+256773344556',
      role: 'agent',
      status: 'active'
    },
    {
      name: 'Mugisha Joel (Campus Baker)',
      email: 'joel.owner@must.ac.ug',
      phone: '+256781223344',
      role: 'owner',
      status: 'active'
    },
    {
      name: 'Lukaye Collins (Laundry Express)',
      email: 'collins.owner@must.ac.ug',
      phone: '+256708665544',
      role: 'owner',
      status: 'active'
    },
    {
      name: 'Bwambale Arafat (Vintage Thrift)',
      email: 'bwambale.thrift@must.ac.ug',
      phone: '+256750112244',
      role: 'owner',
      status: 'pending'
    }
  ];

  for (const u of usersData) {
    await query(
      'INSERT INTO users (full_name, email, phone, password_hash, role, account_status) VALUES ($1, $2, $3, $4, $5, $6)',
      [u.name, u.email, u.phone, defaultPasswordHash, u.role, u.status]
    );
  }

  // 3. Five Case-Study Businesses (WBS 1.5.3) + 1 Pending
  // Admin is user_id 1
  const businessesData = [
    {
      owner_id: 4, // Nsubuga Arafat
      name: 'Kihumuro Smart Hostels & Rentals',
      description: 'Premier student accommodations within 3 minutes walking distance to MUST Kihumuro Campus main gate. Verified water, electricity, high-speed Wi-Fi, and 24/7 guarded security.',
      location: 'Kihumuro, MUST Gate A',
      status: 'verified',
      verified_by: 1,
      verified_at: '2026-09-15 10:00:00'
    },
    {
      owner_id: 5, // Muggaga Rodgers
      name: 'MUST Tech Hub & Student Gadgets',
      description: 'Certified student laptops, smartphones, engineering calculators, chargers, and hardware repair services tailored for Computing and Engineering students.',
      location: 'MUST Town Campus Commercial Arcade, Shop 12',
      status: 'verified',
      verified_by: 1,
      verified_at: '2026-09-16 11:30:00'
    },
    {
      owner_id: 6, // Ninsiima Carol
      name: 'Mbarara Prime Plots & Student Real Estate',
      description: 'Verified residential plots, student hostel land investments, and property leasing around Kihumuro, Kakoba, and Rwebikona.',
      location: 'Rwebikona Plaza, 2nd Floor, Room 4',
      status: 'verified',
      verified_by: 1,
      verified_at: '2026-09-17 09:15:00'
    },
    {
      owner_id: 7, // Mugisha Joel
      name: 'Campus Fresh Bakes & Catering',
      description: 'Daily fresh pastries, student birthday cakes, hostel breakfast packs, and club event catering. Same-day delivery across MUST Kihumuro and Town campuses.',
      location: 'TASO Village, Near Kihumuro Stage',
      status: 'verified',
      verified_by: 1,
      verified_at: '2026-09-18 14:00:00'
    },
    {
      owner_id: 8, // Lukaye Collins
      name: 'Sparkle Student Laundry & Drycleaners',
      description: 'Affordable, reliable wash-dry-and-fold services for MUST students. Includes doorstep pickup and delivery to all registered hostels.',
      location: 'Kakoba Central, Opposite Valley Inn',
      status: 'verified',
      verified_by: 1,
      verified_at: '2026-09-19 16:20:00'
    },
    {
      owner_id: 9, // Bwambale Arafat
      name: 'Kakoba Vintage Thrift & Streetwear',
      description: 'Curated university fashion, thrift jackets, sneakers, and casual wear for students.',
      location: 'Kakoba Market Lane',
      status: 'pending',
      verified_by: null,
      verified_at: null
    }
  ];

  for (const b of businessesData) {
    await query(
      'INSERT INTO businesses (owner_id, name, description, location, verification_status, verified_by, verified_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [b.owner_id, b.name, b.description, b.location, b.status, b.verified_by, b.verified_at]
    );
  }

  // 4. Verification Documents (WBS 1.4.1)
  const docsData = [
    { business_id: 1, doc_type: 'national_id', file_path: 'national_id_arafat.jpg', review_status: 'approved', reviewer_note: 'Verified with MUST Staff records' },
    { business_id: 1, doc_type: 'proof_of_ownership', file_path: 'hostel_occupancy_permit.pdf', review_status: 'approved', reviewer_note: 'Hostel license authentic' },
    { business_id: 2, doc_type: 'student_id', file_path: 'student_id_rodgers.jpg', review_status: 'approved', reviewer_note: 'MUST SE Year 3 student card validated' },
    { business_id: 3, doc_type: 'agency_agreement', file_path: 'agency_accreditation.pdf', review_status: 'approved', reviewer_note: 'Land title search attached' },
    { business_id: 4, doc_type: 'business_permit', file_path: 'food_safety_health_cert.pdf', review_status: 'approved', reviewer_note: 'Health hygiene compliance checked' },
    { business_id: 5, doc_type: 'student_id', file_path: 'student_id_collins.jpg', review_status: 'approved', reviewer_note: 'Valid student ID' },
    { business_id: 6, doc_type: 'student_id', file_path: 'student_id_bwambale.jpg', review_status: 'pending', reviewer_note: 'Under administrative review' }
  ];

  for (const d of docsData) {
    await query(
      'INSERT INTO verification_documents (business_id, doc_type, file_path, review_status, reviewer_note) VALUES ($1, $2, $3, $4, $5)',
      [d.business_id, d.doc_type, d.file_path, d.review_status, d.reviewer_note]
    );
  }

  // 5. Listings (WBS 1.4.2 & 1.4.3)
  // Categories: 1: Fashion, 2: Food, 3: Laundry, 4: Gifts, 5: Second-hand, 6: Land, 7: Hostels
  const listingsData = [
    {
      business_id: 1, // Kihumuro Smart Hostels
      category_id: 7, // Hostels & rentals
      title: 'Kihumuro Executive Self-Contained Single Room',
      description: 'Spacious self-contained room with private balcony, study desk, 24/7 running water, backup solar power, and free high-speed Wi-Fi. Located 300m from MUST Kihumuro Campus main gate.',
      price_ugx: 750000,
      location: 'Kihumuro, Mbarara',
      status: 'live',
      featured_until: '2026-12-31',
      room_type: 'Self-contained Single',
      amenities: 'Private Bathroom, Free Wi-Fi, Water included, Security guard, Backup Solar',
      rooms_available: 4,
      photos: [
        'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80'
      ]
    },
    {
      business_id: 1, // Kihumuro Smart Hostels
      category_id: 7, // Hostels & rentals
      title: 'Kakoba Valley Modern Double Shared Room',
      description: 'Affordable double room for two students. Includes two study tables, wardrobes, free water, and night security guard. Walking distance to Town Campus shuttle stop.',
      price_ugx: 450000,
      location: 'Kakoba, Mbarara',
      status: 'live',
      featured_until: '2026-12-31',
      room_type: 'Double Shared',
      amenities: 'Water included, Security guard, Common kitchen, Shuttle access',
      rooms_available: 6,
      photos: [
        'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80'
      ]
    },
    {
      business_id: 2, // MUST Tech Hub
      category_id: 5, // Second-hand goods
      title: 'Dell Latitude 7490 Core i7 (16GB RAM, 512GB SSD)',
      description: 'Excellent condition laptop ideal for Software Engineering, Computer Science, and Data Science students. Clean battery life (over 5 hours), backlit keyboard, Windows 11 Pro pre-installed.',
      price_ugx: 1350000,
      location: 'MUST Town Campus Commercial Arcade',
      status: 'live',
      featured_until: '2026-12-31',
      photos: [
        'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80'
      ]
    },
    {
      business_id: 2, // MUST Tech Hub
      category_id: 5, // Second-hand goods
      title: 'Casio fx-991EX ClassWiz Scientific Calculator',
      description: 'Original Casio scientific calculator recommended for Engineering and Physics course modules. Barely used for one semester. Comes with protective hard case.',
      price_ugx: 95000,
      location: 'MUST Kihumuro Campus',
      status: 'live',
      featured_until: null,
      photos: [
        'https://images.unsplash.com/photo-1611125832047-1d7ad1e8e48f?auto=format&fit=crop&w=800&q=80'
      ]
    },
    {
      business_id: 3, // Mbarara Prime Plots
      category_id: 6, // Land & real estate
      title: '50x100 ft Residential/Hostel Plot near MUST Kihumuro Gate',
      description: 'Prime dry land with private mailo land title ready for transfer. Ideal for building student rental units or executive hostels. Ready electricity and national water connection nearby.',
      price_ugx: 35000000,
      location: 'Kihumuro Village, Mbarara',
      status: 'live',
      featured_until: '2026-12-31',
      plot_size: 50.00,
      size_unit: 'decimals',
      documents_checked: 1,
      photos: [
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80'
      ]
    },
    {
      business_id: 4, // Campus Fresh Bakes
      category_id: 2, // Food & catering
      title: 'Fresh Student Birthday Cake & Party Bites (2kg)',
      description: 'Delicious chocolate or vanilla sponge cake customized with birthday/congratulatory messaging. Includes free candles and delivered hot to your hostel room.',
      price_ugx: 65000,
      location: 'TASO Village & Kihumuro Deliveries',
      status: 'live',
      featured_until: '2026-12-31',
      photos: [
        'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80'
      ]
    },
    {
      business_id: 5, // Sparkle Student Laundry
      category_id: 3, // Laundry & personal care
      title: 'Full Basket Student Wash, Dry & Fold Express',
      description: 'Weekly student laundry package up to 10kg clothes. Detergent, fabric softener, and anti-bacterial steam press included. Picked up on Friday morning, delivered Saturday evening.',
      price_ugx: 25000,
      location: 'Kakoba & Kihumuro Pickups',
      status: 'live',
      featured_until: '2026-12-31',
      photos: [
        'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=800&q=80'
      ]
    },
    {
      business_id: 1, // Pending moderation listing (WBS 1.4.6 Demo)
      category_id: 7, // Hostels & rentals
      title: 'Kihumuro Hillside Self-Contained Bedsitter (Newly Built)',
      description: 'New building opening next semester with solar water heaters, tiled floor, private reading nook.',
      price_ugx: 600000,
      location: 'Kihumuro Hill, Mbarara',
      status: 'pending',
      featured_until: null,
      room_type: 'Bedsitter',
      amenities: 'Solar Water Heater, Balcony, Wi-Fi',
      rooms_available: 5,
      photos: [
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'
      ]
    },
    {
      business_id: 2, // Rejected listing with reason (Mockup O3 Demo)
      category_id: 5, // Second-hand goods
      title: 'Assorted Smartphone Screen Protectors & Powerbanks',
      description: 'Bulk phone accessories pack.',
      price_ugx: 40000,
      location: 'MUST Town Campus',
      status: 'rejected',
      featured_until: null,
      photos: [
        'https://images.unsplash.com/photo-1609081219090-a6d8173087ec?auto=format&fit=crop&w=800&q=80'
      ]
    }
  ];

  for (let i = 0; i < listingsData.length; i++) {
    const item = listingsData[i];
    const res = await query(
      `INSERT INTO listings (business_id, category_id, title, description, price_ugx, location, status, featured_until)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [item.business_id, item.category_id, item.title, item.description, item.price_ugx, item.location, item.status, item.featured_until]
    );

    const listingId = i + 1;

    // Photos
    if (item.photos && item.photos.length > 0) {
      for (let pIdx = 0; pIdx < item.photos.length; pIdx++) {
        await query(
          'INSERT INTO listing_photos (listing_id, file_path, sort_order) VALUES ($1, $2, $3)',
          [listingId, item.photos[pIdx], pIdx]
        );
      }
    }

    // Hostel details if applicable
    if (item.room_type) {
      await query(
        'INSERT INTO hostel_details (listing_id, room_type, amenities, rooms_available) VALUES ($1, $2, $3, $4)',
        [listingId, item.room_type, item.amenities || '', item.rooms_available || 1]
      );
    }

    // Land details if applicable
    if (item.plot_size) {
      await query(
        'INSERT INTO land_details (listing_id, plot_size, size_unit, documents_checked) VALUES ($1, $2, $3, $4)',
        [listingId, item.plot_size, item.size_unit || 'decimals', item.documents_checked || 0]
      );
    }
  }

  // 6. Reviews & Ratings (WBS 1.4.5, Mockup C5 & A3)
  // Review 1: Live review on Listing 1 (Kihumuro Hostel) by Student Brandon (User 2)
  await query(
    `INSERT INTO reviews (listing_id, reviewer_id, rating, comment, status)
     VALUES ($1, $2, $3, $4, $5)`,
    [1, 2, 5, 'Very clean hostel! Water was 100% reliable throughout last semester and the Wi-Fi was fast enough for SE coding assignments.', 'live']
  );

  // Review 2: Flagged review on Listing 1 (for Admin Review Moderation Queue demo in A3!)
  await query(
    `INSERT INTO reviews (listing_id, reviewer_id, rating, comment, status)
     VALUES ($1, $2, $3, $4, $5)`,
    [1, 3, 1, 'Suspicious review claiming price increased without notice. Requires administrative verification.', 'flagged']
  );

  // Review 3: Live review on Tech Hub laptop (Listing 3)
  await query(
    `INSERT INTO reviews (listing_id, reviewer_id, rating, comment, status)
     VALUES ($1, $2, $3, $4, $5)`,
    [3, 2, 5, 'The Dell Latitude laptop is super fast and battery lasts over 5 hours in lecture rooms. Great deal!', 'live']
  );

  // 7. Moderation Actions Log (ERD & Architecture)
  await query(
    `INSERT INTO moderation_actions (admin_id, target_type, target_id, action, reason)
     VALUES ($1, $2, $3, $4, $5)`,
    [1, 'business', 1, 'approve', 'Verified with MUST Staff records and verified ownership permit']
  );
  await query(
    `INSERT INTO moderation_actions (admin_id, target_type, target_id, action, reason)
     VALUES ($1, $2, $3, $4, $5)`,
    [1, 'listing', 9, 'reject', 'Listing rejected: Item photos did not clearly show serial numbers and warranty details. Returned to owner for resubmission.']
  );

  // 8. Buyer-Seller Conversation & Messages (WBS 1.4.4, Mockup C4)
  const conv = await query(
    'INSERT INTO conversations (listing_id, buyer_id) VALUES ($1, $2)',
    [1, 2] // Brandon (buyer) inquiring about Kihumuro Hostel (listing 1)
  );
  const conversationId = 1;

  await query(
    'INSERT INTO messages (conversation_id, sender_id, body) VALUES ($1, $2, $3)',
    [conversationId, 2, 'Hello Mr. Nsubuga, is the single executive room still open for booking next semester?']
  );

  await query(
    'INSERT INTO messages (conversation_id, sender_id, body) VALUES ($1, $2, $3)',
    [conversationId, 4, 'Hello Brandon! Yes, we have 4 rooms available. Power backup and water are fully functional. Feel free to come view it at Gate A anytime.']
  );

  // 9. Notifications (WBS 1.4.7, Mockup N1)
  const notifs = [
    {
      user_id: 2, // Dembe Brandon
      type: 'reply',
      reference_id: 1,
      text: 'Nsubuga Arafat replied about Kihumuro Executive Self-Contained Single Room',
      is_read: 0
    },
    {
      user_id: 4, // Nsubuga Arafat
      type: 'inquiry',
      reference_id: 1,
      text: 'Dembe Brandon asked about Kihumuro Executive Self-Contained Single Room',
      is_read: 1
    },
    {
      user_id: 4, // Nsubuga Arafat
      type: 'verification',
      reference_id: 1,
      text: 'Kihumuro Smart Hostels & Rentals: Approved with Verified Badge by Administrator',
      is_read: 1
    },
    {
      user_id: 5, // Rodgers
      type: 'listing_status',
      reference_id: 9,
      text: 'Assorted Smartphone Screen Protectors & Powerbanks: Rejected. Reason: Item photos did not clearly show warranty details.',
      is_read: 0
    }
  ];

  for (const n of notifs) {
    await query(
      'INSERT INTO notifications (user_id, type, reference_id, text, is_read) VALUES ($1, $2, $3, $4, $5)',
      [n.user_id, n.type, n.reference_id, n.text, n.is_read]
    );
  }

  console.log('[MUSTmart Seed] Initial dataset successfully inserted! (All 13 tables populated with authentic MUST data).');
}

module.exports = { seedDatabase };
