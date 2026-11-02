/**
 * @file App.jsx
 * @description Root application component orchestrating responsive routing, modals, and navigation.
 * @module App
 * @institution Mbarara University of Science and Technology (MUST)
 * @course SWE3103 Software Project Management · Group A
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import ConsumerHome from './pages/ConsumerHome';
import SearchResults from './pages/SearchResults';
import InquiryChatModal from './pages/InquiryChatModal';
import BusinessRegistration from './pages/BusinessRegistration';
import OwnerDashboard from './pages/OwnerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ListingDetailModal from './pages/ListingDetailModal';
import WriteReviewModal from './pages/WriteReviewModal';
import NotificationsView from './pages/NotificationsView';
import WBSModal from './components/WBSModal';

/**
 * Main application shell managing tab states, search filters, and modal overlays.
 *
 * @returns {React.ReactElement} The rendered application component.
 */
function MainApp() {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'browse' | 'inbox' | 'business' | 'my-listings' | 'admin'

  // Search Results filtering state
  const [browseCategory, setBrowseCategory] = useState('Hostels & rentals');
  const [browseQuery, setBrowseQuery] = useState('');
  const [orientationOnly, setOrientationOnly] = useState(false);

  // Modal Dialog States
  const [activeListingId, setActiveListingId] = useState(null);
  const [reviewListing, setReviewListing] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showWbsModal, setShowWbsModal] = useState(false);
  const [initialInquiryListingId, setInitialInquiryListingId] = useState(null);

  /**
   * Opens the detailed view modal for a listing.
   *
   * @param {number} listingId - Primary key identifier of listing.
   */
  const handleSelectListing = (listingId) => {
    setActiveListingId(listingId);
  };

  /**
   * Filters the browse/search results by category and keyword query.
   *
   * @param {string} catName - Category title.
   * @param {string} [query=''] - Optional keyword query.
   */
  const handleFilterCategory = (catName, query = '') => {
    setBrowseCategory(catName);
    setBrowseQuery(query);
    setOrientationOnly(false);
    setActiveTab('browse');
  };

  /**
   * Activates the orientation-week picks filter in search results.
   */
  const handleSelectOrientation = () => {
    setBrowseCategory('all');
    setBrowseQuery('');
    setOrientationOnly(true);
    setActiveTab('browse');
  };

  /**
   * Opens inquiry chat directly from a listing detail modal.
   *
   * @param {number} listingId - Target listing primary key.
   */
  const handleStartInquiry = (listingId) => {
    setActiveListingId(null);
    setInitialInquiryListingId(listingId);
    setActiveTab('inbox');
  };

  /**
   * Initiates review modal for a specific listing.
   *
   * @param {Object} listing - Listing data record.
   */
  const handleWriteReview = (listing) => {
    setReviewListing(listing);
  };

  return (
    <div className="app-container">
      {/* Top Banner and Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenWbs={() => setShowWbsModal(true)}
        onOpenNotifications={() => setShowNotifications(true)}
      />

      {/* Main Content Area */}
      <main className="main-content" role="main">
        {activeTab === 'home' && (
          <ConsumerHome
            onSelectListing={handleSelectListing}
            onFilterCategory={handleFilterCategory}
            onSelectOrientation={handleSelectOrientation}
          />
        )}

        {activeTab === 'browse' && (
          <SearchResults
            initialCategory={browseCategory}
            initialQuery={browseQuery}
            orientationOnly={orientationOnly}
            onSelectListing={handleSelectListing}
          />
        )}

        {activeTab === 'inbox' && (
          <InquiryChatModal
            initialListingId={initialInquiryListingId}
            onBack={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'business' && (
          <BusinessRegistration
            onSuccess={() => {
              setActiveTab('my-listings');
            }}
          />
        )}

        {activeTab === 'my-listings' && (
          <OwnerDashboard
            onGoToVerification={() => setActiveTab('business')}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            onSelectListing={handleSelectListing}
          />
        )}
      </main>

      {/* Mobile-First Bottom Navigation Bar (Hidden on desktops >= 768px) */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNotifications={() => setShowNotifications(true)}
      />

      {/* C3 Listing Detail Modal */}
      {activeListingId && (
        <ListingDetailModal
          listingId={activeListingId}
          onClose={() => setActiveListingId(null)}
          onStartInquiry={handleStartInquiry}
          onWriteReview={handleWriteReview}
        />
      )}

      {/* C5 Write Review Modal */}
      {reviewListing && (
        <WriteReviewModal
          listing={reviewListing}
          onClose={() => setReviewListing(null)}
          onSuccess={() => {
            setReviewListing(null);
            if (activeListingId) {
              const current = activeListingId;
              setActiveListingId(null);
              setTimeout(() => setActiveListingId(current), 150);
            }
          }}
        />
      )}

      {/* N1 Notifications Center Modal */}
      {showNotifications && (
        <NotificationsView
          onClose={() => setShowNotifications(false)}
          onSelectInquiry={() => {
            setShowNotifications(false);
            setActiveTab('inbox');
          }}
        />
      )}

      {/* WBS Matrix Modal */}
      {showWbsModal && (
        <WBSModal
          onClose={() => setShowWbsModal(false)}
        />
      )}

      {/* Academic Footer */}
      <footer
        style={{
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          padding: '24px 16px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#64748b'
        }}
        role="contentinfo"
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div>
            <strong style={{ color: '#064e3b' }}>MUSTmart</strong> — Web-based Campus Marketplace Platform
          </div>
          <div>
            Mbarara University of Science and Technology · Faculty of Computing and Informatics · Department of Software Engineering
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            SWE3103 Software Project Management · Group A (Nsubuga A., Muggaga R., Dembe B., Bwambale A., Ninsiima C., Mugisha J., Lukaye C.)
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * Root Application Wrapper supplying AuthProvider.
 *
 * @returns {React.ReactElement} Application instance wrapped in AuthProvider.
 */
export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
