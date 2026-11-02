-- ====================================================================
-- MUSTmart: Campus Marketplace Platform for Mbarara University of Science and Technology
-- Department of Software Engineering · SWE3103 · Group A
-- WBS 1.3.2 Database Schema (Neon PostgreSQL Relational Schema)
-- 13 Tables as defined in the MUSTmart Entity-Relationship Diagram
-- ====================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(30) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('consumer', 'owner', 'agent', 'administrator')),
    account_status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'pending')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. BUSINESSES TABLE
CREATE TABLE IF NOT EXISTS businesses (
    business_id SERIAL PRIMARY KEY,
    owner_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    location VARCHAR(150) NOT NULL,
    verification_status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'info_requested')),
    verified_by INT REFERENCES users(user_id) ON DELETE SET NULL,
    verified_at TIMESTAMP
);

-- 3. VERIFICATION DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS verification_documents (
    document_id SERIAL PRIMARY KEY,
    business_id INT NOT NULL REFERENCES businesses(business_id) ON DELETE CASCADE,
    doc_type VARCHAR(50) NOT NULL CHECK (doc_type IN ('national_id', 'student_id', 'proof_of_ownership', 'agency_agreement', 'business_permit', 'other')),
    file_path VARCHAR(255) NOT NULL,
    review_status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected', 'info_requested')),
    reviewer_note VARCHAR(255),
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- 5. LISTINGS TABLE
CREATE TABLE IF NOT EXISTS listings (
    listing_id SERIAL PRIMARY KEY,
    business_id INT NOT NULL REFERENCES businesses(business_id) ON DELETE CASCADE,
    category_id INT NOT NULL REFERENCES categories(category_id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    price_ugx NUMERIC(12, 2) NOT NULL,
    location VARCHAR(150) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'live', 'rejected', 'archived')),
    featured_until DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. LISTING PHOTOS TABLE
CREATE TABLE IF NOT EXISTS listing_photos (
    photo_id SERIAL PRIMARY KEY,
    listing_id INT NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
    file_path VARCHAR(255) NOT NULL,
    sort_order SMALLINT NOT NULL DEFAULT 0
);

-- 7. LAND DETAILS TABLE (Category-specific for Land & Real Estate)
CREATE TABLE IF NOT EXISTS land_details (
    listing_id INT PRIMARY KEY REFERENCES listings(listing_id) ON DELETE CASCADE,
    plot_size NUMERIC(10, 2) NOT NULL,
    size_unit VARCHAR(50) NOT NULL DEFAULT 'decimals',
    documents_checked SMALLINT NOT NULL DEFAULT 0
);

-- 8. HOSTEL DETAILS TABLE (Category-specific for Hostels & Rentals)
CREATE TABLE IF NOT EXISTS hostel_details (
    listing_id INT PRIMARY KEY REFERENCES listings(listing_id) ON DELETE CASCADE,
    room_type VARCHAR(100) NOT NULL,
    amenities TEXT,
    rooms_available SMALLINT NOT NULL DEFAULT 1
);

-- 9. REVIEWS TABLE (Enforces 1 review per listing per consumer)
CREATE TABLE IF NOT EXISTS reviews (
    review_id SERIAL PRIMARY KEY,
    listing_id INT NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
    reviewer_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'live' CHECK (status IN ('live', 'flagged', 'removed')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_listing_reviewer UNIQUE (listing_id, reviewer_id)
);

-- 10. MODERATION ACTIONS TABLE (Audit log for admin decisions)
CREATE TABLE IF NOT EXISTS moderation_actions (
    action_id SERIAL PRIMARY KEY,
    admin_id INT NOT NULL REFERENCES users(user_id),
    target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('business', 'listing', 'review', 'user')),
    target_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    reason VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 11. CONVERSATIONS TABLE (Buyer-Seller Inquiry Channel)
CREATE TABLE IF NOT EXISTS conversations (
    conversation_id SERIAL PRIMARY KEY,
    listing_id INT NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
    buyer_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 12. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS messages (
    message_id SERIAL PRIMARY KEY,
    conversation_id INT NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    sender_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- 13. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    reference_id INT,
    text VARCHAR(255) NOT NULL,
    is_read SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_location ON listings(location);
CREATE INDEX IF NOT EXISTS idx_reviews_listing ON reviews(listing_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);
