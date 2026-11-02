/**
 * @file NotificationsView.jsx
 * @description In-app notification center modal conforming to UI Mockup N1.
 * @module pages/NotificationsView
 * @see {@link MUSTmart UI Mockups-1.pdf} Screen N1
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  MessageSquare,
  ShieldCheck,
  FileText,
  CheckCheck
} from 'lucide-react';

/**
 * Notifications Modal Component (Screen N1).
 * Displays categorised alerts: New inquiries, reply messages, business verification decisions,
 * and listing moderation decisions.
 *
 * @param {Object} props - Component properties.
 * @param {Function} props.onClose - Modal dismissal handler.
 * @param {Function} props.onSelectInquiry - Callback invoked when clicking an inquiry notification.
 * @returns {React.ReactElement} The rendered notifications center.
 */
export default function NotificationsView({ onClose, onSelectInquiry }) {
  const { user, refreshUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserNotifications();
  }, []);

  /**
   * Fetches latest notifications for the active authenticated user.
   *
   * @async
   * @function fetchUserNotifications
   */
  const fetchUserNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${localStorage.getItem('mustmart_token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error('[MUSTmart Notifications] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Marks an individual notification record as read.
   *
   * @async
   * @function handleMarkRead
   * @param {number} notifId - Primary key identifier of notification.
   */
  const handleMarkRead = async (notifId) => {
    try {
      await fetch(`/api/notifications/${notifId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${localStorage.getItem('mustmart_token')}` }
      });
      fetchUserNotifications();
      refreshUser();
    } catch (err) {
      console.error('[MUSTmart Notifications] Mark read error:', err);
    }
  };

  /**
   * Marks all user notifications as read in a single batch operation.
   *
   * @async
   * @function handleMarkAllRead
   */
  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${localStorage.getItem('mustmart_token')}` }
      });
      fetchUserNotifications();
      refreshUser();
    } catch (err) {
      console.error('[MUSTmart Notifications] Mark all read error:', err);
    }
  };

  /**
   * Resolves visual indicator icon corresponding to notification category.
   *
   * @param {string} type - Notification category code.
   * @returns {React.ReactElement} The Lucide icon component.
   */
  const resolveNotificationIcon = (type) => {
    switch (type) {
      case 'inquiry':
      case 'reply':
        return <MessageSquare size={15} color="#059669" aria-hidden="true" />;
      case 'verification':
      case 'verification_queue':
        return <ShieldCheck size={15} color="#0284c7" aria-hidden="true" />;
      case 'listing_decision':
      case 'listing_queue':
      case 'listing_status':
        return <FileText size={15} color="#d97706" aria-hidden="true" />;
      default:
        return <Bell size={15} color="#64748b" aria-hidden="true" />;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="notifications-title">
      <div className="modal-sheet" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#064e3b', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px' }}>
              N1 · ALL SIGNED-IN USERS
            </span>
            <h3 id="notifications-title" style={{ fontSize: '16px' }}>Notifications</h3>
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="btn-outline"
              style={{ fontSize: '11px', padding: '3px 8px', minHeight: '30px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <CheckCheck size={12} aria-hidden="true" />
              <span>Mark all read</span>
            </button>
            <button className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
              ✕
            </button>
          </div>
        </div>

        {/* Notifications Body (Mockup N1) */}
        <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '28px', color: '#64748b', fontSize: '13px' }}>
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
              <Bell size={24} style={{ margin: '0 auto 6px', opacity: 0.5 }} aria-hidden="true" />
              <p style={{ fontSize: '13px' }}>No notifications right now.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {notifications.map((n) => (
                <div
                  key={n.notification_id}
                  style={{
                    background: n.is_read ? '#ffffff' : '#ecfdf5',
                    border: `1px solid ${n.is_read ? '#e2e8f0' : '#a7f3d0'}`,
                    borderRadius: '6px',
                    padding: '10px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '10px',
                    cursor: n.reference_id && (n.type === 'inquiry' || n.type === 'reply') ? 'pointer' : 'default'
                  }}
                  onClick={() => {
                    if (!n.is_read) handleMarkRead(n.notification_id);
                    if (onSelectInquiry && (n.type === 'inquiry' || n.type === 'reply') && n.reference_id) {
                      onSelectInquiry(n.reference_id);
                      onClose();
                    }
                  }}
                >
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: n.is_read ? '#f1f5f9' : '#d1fae5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {resolveNotificationIcon(n.type)}
                    </div>

                    <div>
                      {!n.is_read && (
                        <span style={{
                          background: '#064e3b',
                          color: '#ffffff',
                          fontSize: '9px',
                          fontWeight: 800,
                          padding: '1px 4px',
                          borderRadius: '3px',
                          textTransform: 'uppercase',
                          marginRight: '6px'
                        }}>
                          New
                        </span>
                      )}
                      <span style={{ fontSize: '12px', fontWeight: n.is_read ? 500 : 700, color: '#0f172a' }}>
                        {n.text}
                      </span>
                      <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px' }}>
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {!n.is_read && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkRead(n.notification_id);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#064e3b',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        minHeight: 'auto'
                      }}
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
