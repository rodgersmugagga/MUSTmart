/**
 * @file Header.jsx
 * @description Master navigation header conforming to SWE3103 Group A specifications.
 * @module components/Header
 * @see {@link MUSTmart System Architecture Diagram.pdf}
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingBag,
  Bell,
  ShieldCheck,
  Home,
  Grid,
  Store,
  FileText,
  PlusCircle,
  HelpCircle
} from 'lucide-react';

/**
 * Global header displaying institutional identity, interactive role switcher, and responsive navigation tabs.
 *
 * @param {Object} props - Component properties.
 * @param {string} props.activeTab - Currently active navigation tab.
 * @param {Function} props.setActiveTab - Handler to update the active tab.
 * @param {Function} props.onOpenWbs - Handler to open the WBS modal.
 * @param {Function} props.onOpenNotifications - Handler to open the notifications modal.
 * @returns {React.ReactElement} The rendered header element.
 */
export default function Header({
  activeTab,
  setActiveTab,
  onOpenWbs,
  onOpenNotifications
}) {
  const { user, role, demoUsers, switchUser, unreadNotifs } = useAuth();

  /**
   * Resolves a concise, professional role badge for the demo switcher.
   *
   * @param {Object} demoUser - Demo user record.
   * @returns {string} Human-readable role indicator.
   */
  const resolveRoleLabel = (demoUser) => {
    if (demoUser.role === 'administrator') return 'Admin';
    if (demoUser.email.includes('arafat.owner')) return 'Hostel Owner';
    if (demoUser.email.includes('rodgers.owner')) return 'Tech Owner';
    return 'Student';
  };

  return (
    <header className="header-wrapper" role="banner">
      {/* Institutional identification banner */}
      <div className="header-topbar">
        <div className="uni-badge">
          <strong>Mbarara University of Science and Technology (MUST)</strong>
          <span>· Faculty of Computing and Informatics · Software Engineering (SWE3103)</span>
        </div>
        <div>
          <button
            type="button"
            onClick={onOpenWbs}
            className="btn-outline"
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#ffffff',
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '4px',
              minHeight: '26px'
            }}
          >
            WBS & Architecture Specs
          </button>
        </div>
      </div>

      {/* Main branding and actor switcher */}
      <div className="header-main">
        <div className="header-inner">
          {/* Logo brand */}
          <div
            className="brand-logo"
            onClick={() => setActiveTab('home')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setActiveTab('home');
            }}
            aria-label="MUSTmart Home"
          >
            <div className="logo-icon-box" aria-hidden="true">
              <ShoppingBag size={20} />
            </div>
            <div className="brand-text">
              <h1>MUST<span>mart</span></h1>
              <p>Campus Marketplace</p>
            </div>
          </div>

          {/* Actor switcher for evaluation */}
          <div className="role-switcher-bar" role="toolbar" aria-label="Actor Persona Switcher">
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', padding: '0 4px' }}>
              ACTOR:
            </span>
            {demoUsers.slice(0, 4).map((u) => {
              const isActive = user?.user_id === u.user_id;
              return (
                <button
                  key={u.user_id}
                  type="button"
                  className={`role-pill-btn ${isActive ? 'active' : ''}`}
                  onClick={() => switchUser(u.user_id)}
                  title={`Switch to ${u.full_name} (${u.role})`}
                  aria-pressed={isActive}
                >
                  {resolveRoleLabel(u)}
                </button>
              );
            })}
          </div>

          {/* Quick action buttons */}
          <div className="nav-actions">
            <button
              type="button"
              className="nav-icon-btn"
              onClick={onOpenNotifications}
              aria-label={`Notifications, ${unreadNotifs} unread`}
            >
              <Bell size={16} aria-hidden="true" />
              <span>Alerts</span>
              {unreadNotifs > 0 && (
                <span className="badge-counter">{unreadNotifs}</span>
              )}
            </button>

            {['owner', 'agent'].includes(role) && (
              <button
                type="button"
                className="nav-icon-btn primary"
                onClick={() => setActiveTab('my-listings')}
                aria-label="Manage My Listings"
              >
                <PlusCircle size={15} aria-hidden="true" />
                <span>My Listings</span>
              </button>
            )}

            {role === 'administrator' && (
              <button
                type="button"
                className="nav-icon-btn primary"
                onClick={() => setActiveTab('admin')}
                style={{ background: '#0f766e', borderColor: '#0f766e' }}
                aria-label="Administrator Moderation Queue"
              >
                <ShieldCheck size={16} aria-hidden="true" />
                <span>Admin Queue</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop sub-navigation tabs (Mockups C1, O3, A1) */}
      <nav className="subnav-tabs" aria-label="Desktop Sub Navigation">
        <div className="subnav-inner">
          <button
            type="button"
            className={`tab-link ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            <Home size={15} aria-hidden="true" />
            <span>Home & Search (C1)</span>
          </button>

          <button
            type="button"
            className={`tab-link ${activeTab === 'browse' ? 'active' : ''}`}
            onClick={() => setActiveTab('browse')}
          >
            <Grid size={15} aria-hidden="true" />
            <span>Search Results & Hostels (C2)</span>
          </button>

          <button
            type="button"
            className={`tab-link ${activeTab === 'inbox' ? 'active' : ''}`}
            onClick={() => setActiveTab('inbox')}
          >
            <FileText size={15} aria-hidden="true" />
            <span>Inquiry Chat (C4)</span>
          </button>

          <button
            type="button"
            className={`tab-link ${activeTab === 'business' ? 'active' : ''}`}
            onClick={() => setActiveTab('business')}
          >
            <Store size={15} aria-hidden="true" />
            <span>Register & Verify Business (O1)</span>
          </button>

          {['owner', 'agent'].includes(role) && (
            <button
              type="button"
              className={`tab-link ${activeTab === 'my-listings' ? 'active' : ''}`}
              onClick={() => setActiveTab('my-listings')}
            >
              <FileText size={15} aria-hidden="true" />
              <span>Owner Listings (O3)</span>
            </button>
          )}

          {role === 'administrator' && (
            <button
              type="button"
              className={`tab-link ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
              style={{ color: '#0f766e' }}
            >
              <ShieldCheck size={15} aria-hidden="true" />
              <span>Admin Moderation Dashboard (A1-A3)</span>
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
