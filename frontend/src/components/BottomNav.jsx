/**
 * @file BottomNav.jsx
 * @description Ergonomic, mobile-first bottom navigation bar for small smart phones (screen widths <= 768px).
 * @module components/BottomNav
 * @see {@link MUSTmart UI Mockups-1.pdf}
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Home, Search, MessageSquare, Store, ShieldCheck, Bell } from 'lucide-react';

/**
 * Mobile bottom navigation component adhering to mobile-first ergonomics and touch target standards (>= 44px).
 *
 * @param {Object} props - Component properties.
 * @param {string} props.activeTab - Currently active navigation tab identifier.
 * @param {Function} props.setActiveTab - State dispatch handler to change the active tab.
 * @param {Function} props.onOpenNotifications - Handler to trigger the notification modal.
 * @returns {React.ReactElement} The rendered bottom navigation bar.
 */
export default function BottomNav({ activeTab, setActiveTab, onOpenNotifications }) {
  const { role, unreadNotifs } = useAuth();

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Bottom Navigation">
      {/* Home tab (Mockup C1) */}
      <button
        type="button"
        className={`bottom-nav-item ${activeTab === 'home' ? 'active' : ''}`}
        onClick={() => setActiveTab('home')}
        aria-label="Home"
      >
        <Home size={20} aria-hidden="true" />
        <span className="bottom-nav-label">Home</span>
      </button>

      {/* Browse tab (Mockup C2) */}
      <button
        type="button"
        className={`bottom-nav-item ${activeTab === 'browse' ? 'active' : ''}`}
        onClick={() => setActiveTab('browse')}
        aria-label="Search and Browse Hostels"
      >
        <Search size={20} aria-hidden="true" />
        <span className="bottom-nav-label">Browse</span>
      </button>

      {/* Inquiry inbox tab (Mockup C4) */}
      <button
        type="button"
        className={`bottom-nav-item ${activeTab === 'inbox' ? 'active' : ''}`}
        onClick={() => setActiveTab('inbox')}
        aria-label="Chat and Messages"
      >
        <MessageSquare size={20} aria-hidden="true" />
        <span className="bottom-nav-label">Inbox</span>
      </button>

      {/* Business or listings tab based on role (Mockup O1 & O3) */}
      {['owner', 'agent'].includes(role) ? (
        <button
          type="button"
          className={`bottom-nav-item ${activeTab === 'my-listings' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-listings')}
          aria-label="My Listings Dashboard"
        >
          <Store size={20} aria-hidden="true" />
          <span className="bottom-nav-label">My Listings</span>
        </button>
      ) : (
        <button
          type="button"
          className={`bottom-nav-item ${activeTab === 'business' ? 'active' : ''}`}
          onClick={() => setActiveTab('business')}
          aria-label="Register Business"
        >
          <Store size={20} aria-hidden="true" />
          <span className="bottom-nav-label">Business</span>
        </button>
      )}

      {/* Admin tab (Mockups A1-A3) if administrator */}
      {role === 'administrator' && (
        <button
          type="button"
          className={`bottom-nav-item ${activeTab === 'admin' ? 'active' : ''}`}
          onClick={() => setActiveTab('admin')}
          aria-label="Admin Moderation"
        >
          <ShieldCheck size={20} aria-hidden="true" />
          <span className="bottom-nav-label">Admin</span>
        </button>
      )}

      {/* Notifications trigger (Mockup N1) */}
      <button
        type="button"
        className="bottom-nav-item"
        onClick={onOpenNotifications}
        aria-label={`Notifications, ${unreadNotifs} unread`}
      >
        <div className="bottom-nav-icon-wrapper">
          <Bell size={20} aria-hidden="true" />
          {unreadNotifs > 0 && (
            <span className="mobile-badge-dot" aria-hidden="true" />
          )}
        </div>
        <span className="bottom-nav-label">Alerts</span>
      </button>
    </nav>
  );
}
