/**
 * @file server.js
 * @description Main application server entrypoint for MUSTmart API.
 * @module server
 * @institution Mbarara University of Science and Technology (MUST)
 * @course SWE3103 Software Project Management · Group A
 * @see {@link MUSTmart System Architecture Diagram.pdf}
 */

const path = require('path');

// Load environment configuration from local backend and root workspace
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const { initDb, getIsPostgres } = require('./config/db');
const { seedDatabase } = require('./seeds/seedData');

// Route controllers (WBS 1.4 Platform Development)
const authRoutes = require('./routes/auth');
const categoriesRoutes = require('./routes/categories');
const businessesRoutes = require('./routes/businesses');
const listingsRoutes = require('./routes/listings');
const reviewsRoutes = require('./routes/reviews');
const conversationsRoutes = require('./routes/conversations');
const adminRoutes = require('./routes/admin');
const notificationsRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing (CORS) for client applications
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers for JSON and URL-encoded forms
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static asset delivery for user-uploaded documents and listing photos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/**
 * Health check and university metadata endpoint.
 * @route GET /api/health
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    project: 'MUSTmart Campus Marketplace',
    institution: 'Mbarara University of Science and Technology (MUST)',
    faculty: 'Faculty of Computing and Informatics',
    department: 'Department of Software Engineering',
    course: 'SWE3103 - Software Project Management',
    group: 'Group A',
    databaseEngine: getIsPostgres() ? 'Neon PostgreSQL' : 'Local SQLite Storage Engine (Neon-compatible)',
    timestamp: new Date().toISOString()
  });
});

// Mount platform modules aligned with WBS 1.4
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/businesses', businessesRoutes);
app.use('/api/listings', listingsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/conversations', conversationsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationsRoutes);

// Global unhandled error middleware
app.use((err, req, res, next) => {
  console.error('[MUSTmart Server Error]:', err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error occurred.'
  });
});

/**
 * Initializes the database tier, validates seed records, and begins listening on designated port.
 *
 * @async
 * @function startServer
 */
async function startServer() {
  try {
    console.log('[MUSTmart Server] Initializing database schema (13 tables)...');
    await initDb();
    console.log('[MUSTmart Server] Validating baseline dataset...');
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`MUSTmart API Server online on port ${PORT}`);
      console.log(`Endpoint: http://localhost:${PORT}`);
      console.log(`Institution: Mbarara University of Science and Technology`);
      console.log(`Database: ${getIsPostgres() ? 'Neon PostgreSQL' : 'Neon-compatible Local Engine'}`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('[MUSTmart Server] Startup failure:', err);
    process.exit(1);
  }
}

startServer();
