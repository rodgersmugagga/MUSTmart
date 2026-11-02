/**
 * @file OwnerDashboard.jsx
 * @description Owner and agent management dashboard conforming to UI Mockup O3.
 * @module pages/OwnerDashboard
 * @see {@link MUSTmart UI Mockups-1.pdf} Screen O3
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import CreateListingModal from './CreateListingModal';
import InquiryChatModal from './InquiryChatModal';
import API_BASE from '../config/api';
import {
  Plus,
  Edit2,
  Archive,
  Building2,
  FileText,
  MessageSquare
} from 'lucide-react';

/**
 * Owner Dashboard (Screen O3).
 * Provides listings status oversight (Live, Pending review, Rejected with admin reason, Archived),
 * listing creation, editing/resubmission, and customer inquiry communication.
 *
 * @param {Object} props - Component properties.
 * @param {Function} props.onGoToVerification - Callback to route to business verification screen.
 * @returns {React.ReactElement} The rendered owner dashboard.
 */
export default function OwnerDashboard({ onGoToVerification }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('listings'); // 'listings' | 'inbox'
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [business, setBusiness] = useState(null);

  useEffect(() => {
    fetchOwnerOverview();
  }, []);

  /**
   * Fetches the owner's listings and business entity records concurrently.
   *
   * @async
   * @function fetchOwnerOverview
   */
  const fetchOwnerOverview = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('mustmart_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [listingsResponse, businessResponse] = await Promise.all([
        fetch(`${API_BASE}/api/listings/my`, { headers }),
        fetch(`${API_BASE}/api/businesses/my-business`, { headers })
      ]);

      const listingsPayload = await listingsResponse.json();
      const businessPayload = await businessResponse.json();

      if (listingsPayload.success) setListings(listingsPayload.listings);
      if (businessPayload.success) setBusiness(businessPayload.business);
    } catch (err) {
      console.error('[MUSTmart OwnerDashboard] Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Archives an active or rejected listing.
   *
   * @async
   * @function handleArchive
   * @param {number} listingId - Primary key identifier of the listing to archive.
   */
  const handleArchive = async (listingId) => {
    if (!confirm('Are you sure you want to archive this listing?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/listings/${listingId}/archive`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('mustmart_token')}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchOwnerOverview();
      }
    } catch (err) {
      console.error('[MUSTmart OwnerDashboard] Archive error:', err);
    }
  };

  return (
    <div className="owner-dashboard-page" style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Header Row */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#064e3b', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px' }}>
              O3 · BUSINESS OWNER / AGENT
            </span>
            <h2 style={{ fontSize: '22px', marginTop: '2px' }}>My listings and inbox</h2>
            {business && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                <span>Entity: <strong>{business.name}</strong></span>
                <span aria-hidden="true">·</span>
                <StatusBadge status={business.verification_status} size="sm" />
              </div>
            )}
          </div>

          <button
            type="button"
            className="btn-primary-action"
            style={{ width: 'auto', padding: '8px 14px', fontSize: '13px' }}
            onClick={() => {
              setEditingListing(null);
              setShowCreateModal(true);
            }}
          >
            <Plus size={15} aria-hidden="true" />
            <span>New listing</span>
          </button>
        </div>
      </div>

      {/* Tabs (Mockup O3: Listings | Inbox [n]) */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '16px' }}>
        <button
          type="button"
          className={`tab-link ${activeTab === 'listings' ? 'active' : ''}`}
          onClick={() => setActiveTab('listings')}
        >
          <FileText size={15} aria-hidden="true" />
          <span>Listings ({listings.length})</span>
        </button>
        <button
          type="button"
          className={`tab-link ${activeTab === 'inbox' ? 'active' : ''}`}
          onClick={() => setActiveTab('inbox')}
        >
          <MessageSquare size={15} aria-hidden="true" />
          <span>Inbox</span>
        </button>
      </div>

      {/* Tab 1: Listings Stream (Mockup O3) */}
      {activeTab === 'listings' && (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '36px', color: '#64748b', fontSize: '14px' }}>
              Loading your listings...
            </div>
          ) : listings.length === 0 ? (
            <div style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '40px 16px',
              textAlign: 'center',
              color: '#64748b'
            }}>
              <Building2 size={32} color="#94a3b8" style={{ margin: '0 auto 8px' }} aria-hidden="true" />
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>You have no registered listings yet.</p>
              <p style={{ fontSize: '13px', marginTop: '4px' }}>Submit your student hostel, item, or services to begin connecting with MUST scholars.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {listings.map((item) => (
                <div
                  key={item.listing_id}
                  style={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <img
                      src={
                        item.primary_photo?.startsWith('http')
                          ? item.primary_photo
                          : item.primary_photo
                          ? `/uploads/${item.primary_photo}`
                          : 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=120&q=80'
                      }
                      alt={item.title}
                      style={{ width: '60px', height: '60px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }}
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=120&q=80';
                      }}
                    />

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '2px' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: 700 }}>{item.title}</h4>
                        <StatusBadge status={item.status} size="sm" />
                      </div>

                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        <span>{item.category_name}</span> ·{' '}
                        <strong style={{ color: '#064e3b' }}>
                          UGX {Number(item.price_ugx).toLocaleString()}
                        </strong>
                      </div>

                      {/* Display reason if rejected (Mockup O3: Reason: [admin reason]) */}
                      {item.status === 'rejected' && (
                        <div style={{
                          marginTop: '6px',
                          background: '#fef2f2',
                          border: '1px solid #fecaca',
                          padding: '6px 10px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          color: '#b91c1c'
                        }}>
                          <strong>Reason:</strong> {item.rejection_reason || 'Incomplete details or documentation required.'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions matching Mockup O3 */}
                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                    <button
                      type="button"
                      className="btn-outline"
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '12px' }}
                      onClick={() => {
                        setEditingListing(item);
                        setShowCreateModal(true);
                      }}
                    >
                      <Edit2 size={13} aria-hidden="true" />
                      <span>{item.status === 'rejected' ? 'Edit and resubmit' : 'Edit'}</span>
                    </button>

                    {item.status !== 'archived' && (
                      <button
                        type="button"
                        className="btn-outline"
                        style={{ color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '12px' }}
                        onClick={() => handleArchive(item.listing_id)}
                      >
                        <Archive size={13} aria-hidden="true" />
                        <span>Archive</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Inbox (Mockup O3 / C4) */}
      {activeTab === 'inbox' && (
        <InquiryChatModal />
      )}

      {/* Create / Edit Modal Dialog */}
      {showCreateModal && (
        <CreateListingModal
          initialListing={editingListing}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchOwnerOverview();
          }}
        />
      )}
    </div>
  );
}
