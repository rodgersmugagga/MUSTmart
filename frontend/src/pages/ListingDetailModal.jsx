/**
 * @file ListingDetailModal.jsx
 * @description Detailed listing view and review inspector conforming to UI Mockup C3.
 * @module pages/ListingDetailModal
 * @see {@link MUSTmart UI Mockups-1.pdf} Screen C3
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import RatingStars from '../components/RatingStars';
import StatusBadge from '../components/StatusBadge';
import API_BASE from '../config/api';
import {
  X,
  ShieldCheck,
  MapPin,
  MessageSquare,
  Bookmark,
  Flag,
  Edit3,
  Phone,
  Mail,
  AlertCircle
} from 'lucide-react';

/**
 * Listing Detail Modal (Screen C3).
 * Renders photos, specifications, verified seller card, reviews stream, inquiry launcher, and bookmarking.
 *
 * @param {Object} props - Component properties.
 * @param {number} props.listingId - Primary key identifier of the listing to inspect.
 * @param {Function} props.onClose - Modal dismissal handler.
 * @param {Function} props.onStartInquiry - Handler to start buyer-seller inquiry chat (C4).
 * @param {Function} props.onWriteReview - Handler to open review submission form (C5).
 * @returns {React.ReactElement|null} Rendered modal dialog.
 */
export default function ListingDetailModal({
  listingId,
  onClose,
  onStartInquiry,
  onWriteReview
}) {
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [flagFeedback, setFlagFeedback] = useState('');

  // Fetch listing details whenever listingId changes
  useEffect(() => {
    if (listingId) {
      fetchListingDetails();
    }
  }, [listingId]);

  /**
   * Loads complete listing specifications, photos, and live reviews.
   *
   * @async
   * @function fetchListingDetails
   */
  const fetchListingDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/listings/${listingId}`);
      const data = await res.json();
      if (data.success) {
        setListing(data.listing);
      }
    } catch (err) {
      console.error('[MUSTmart Detail] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Submits a community moderation flag against an inappropriate or inaccurate review.
   *
   * @async
   * @function handleFlagReview
   * @param {number} reviewId - Primary key identifier of the review being flagged.
   */
  const handleFlagReview = async (reviewId) => {
    if (!confirm('Flag this review for administrator moderation review?')) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/reviews/${reviewId}/flag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('mustmart_token')}`
        },
        body: JSON.stringify({ reason: 'Reported by community user for moderation.' })
      });
      const data = await res.json();
      if (data.success) {
        setFlagFeedback('Review submitted to the administrator moderation queue (A3).');
        fetchListingDetails();
      }
    } catch (err) {
      console.error('[MUSTmart Detail] Flag review error:', err);
    }
  };

  if (!listingId) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-listing-title">
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#064e3b', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px' }}>
              C3 · LISTING DETAIL
            </span>
            <span style={{ color: '#64748b', fontSize: '12px' }}>WBS 1.4.3</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '14px' }}>
              Loading listing specifications...
            </div>
          ) : !listing ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#dc2626', fontSize: '14px' }}>
              Listing details could not be retrieved.
            </div>
          ) : (
            <>
              {/* Photo Gallery (Mockup C3) */}
              <div className="detail-gallery">
                <img
                  src={
                    listing.photos && listing.photos.length > 0
                      ? (listing.photos[activePhotoIdx]?.file_path?.startsWith('http')
                          ? listing.photos[activePhotoIdx].file_path
                          : `/uploads/${listing.photos[activePhotoIdx].file_path}`)
                      : 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80'
                  }
                  alt={listing.title}
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80';
                  }}
                />
              </div>

              {/* Photo Thumbnails */}
              {listing.photos && listing.photos.length > 1 && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {listing.photos.map((p, idx) => (
                    <img
                      key={p.photo_id}
                      src={p.file_path.startsWith('http') ? p.file_path : `/uploads/${p.file_path}`}
                      alt="Thumbnail"
                      style={{
                        width: '54px',
                        height: '54px',
                        borderRadius: '6px',
                        objectFit: 'cover',
                        cursor: 'pointer',
                        border: activePhotoIdx === idx ? '2px solid #064e3b' : '1px solid #e2e8f0',
                        flexShrink: 0
                      }}
                      onClick={() => setActivePhotoIdx(idx)}
                    />
                  ))}
                </div>
              )}

              {/* Title & Price Header */}
              <div className="detail-header-row">
                <div>
                  <h2 id="modal-listing-title" style={{ fontSize: '20px', marginBottom: '4px' }}>
                    {listing.title}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{listing.category_name}</span>
                    <span aria-hidden="true">·</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <MapPin size={13} aria-hidden="true" /> {listing.location}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="detail-price">
                    UGX {Number(listing.price_ugx).toLocaleString()}
                  </div>
                  {listing.category_name === 'Hostels & rentals' && (
                    <span style={{ fontSize: '11px', color: '#64748b' }}>per semester</span>
                  )}
                </div>
              </div>

              {/* Verified Seller Badge (Mockup C3) */}
              {listing.verification_status === 'verified' && (
                <div style={{ margin: '12px 0' }}>
                  <StatusBadge status="verified" label="Verified Seller & Authenticated Business" />
                </div>
              )}

              {/* Category-Specific Specifications: Hostels & rentals */}
              {listing.room_type && (
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  margin: '14px 0'
                }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#064e3b' }}>
                    Hostel & Accommodation Details
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '6px', fontSize: '12px' }}>
                    <div><strong>Room Type:</strong> {listing.room_type}</div>
                    <div><strong>Vacancies:</strong> {listing.rooms_available}</div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <strong>Amenities:</strong> {listing.amenities || 'Water, security, study spaces'}
                    </div>
                  </div>
                </div>
              )}

              {/* Category-Specific Specifications: Land & real estate */}
              {listing.plot_size && (
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  margin: '14px 0'
                }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#064e3b' }}>
                    Land & Title Verification
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '6px', fontSize: '12px' }}>
                    <div><strong>Plot Size:</strong> {listing.plot_size} {listing.size_unit}</div>
                    <div>
                      <strong>Title Checked:</strong> {listing.documents_checked ? 'Yes (Registry Search Done)' : 'Pending Inspection'}
                    </div>
                  </div>
                </div>
              )}

              {/* Description Body */}
              <div style={{ margin: '16px 0' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>Description</h4>
                <p style={{ color: '#334155', fontSize: '13px', whiteSpace: 'pre-line', lineHeight: '1.5' }}>
                  {listing.description || 'No additional description provided.'}
                </p>
              </div>

              {/* Seller / Agent Information Card (Mockup C3) */}
              <div className="detail-seller-card">
                <div className="seller-info-left">
                  <div className="seller-avatar" aria-hidden="true">
                    {listing.owner_name?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700 }}>{listing.owner_name}</h4>
                    <p style={{ fontSize: '12px', color: '#064e3b', fontWeight: 600 }}>{listing.business_name}</p>
                    <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: '#64748b', marginTop: '3px', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Phone size={11} aria-hidden="true" /> {listing.owner_phone}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Mail size={11} aria-hidden="true" /> {listing.owner_email}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    className="btn-primary-action"
                    style={{ margin: 0, padding: '10px 16px', width: '100%' }}
                    onClick={() => onStartInquiry(listing.listing_id, listing.title)}
                  >
                    <MessageSquare size={15} aria-hidden="true" />
                    <span>Send Inquiry</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons: Save & Review */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', margin: '16px 0' }}>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setIsSaved(!isSaved)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Bookmark size={15} color={isSaved ? '#059669' : '#64748b'} fill={isSaved ? '#059669' : 'none'} aria-hidden="true" />
                  <span>{isSaved ? 'Saved' : 'Save'}</span>
                </button>

                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => onWriteReview(listing)}
                  disabled={listing.userHasReviewed}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Edit3 size={15} aria-hidden="true" />
                  <span>{listing.userHasReviewed ? 'Reviewed' : 'Write Review'}</span>
                </button>
              </div>

              {/* Reviews Stream (Mockup C3 & WBS 1.4.5) */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 700 }}>
                    Reviews ({listing.reviews?.length || 0})
                  </h4>
                  {listing.avg_rating > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <RatingStars rating={Math.round(listing.avg_rating)} size={13} />
                      <strong style={{ fontSize: '12px', color: '#b45309' }}>{listing.avg_rating}</strong>
                    </div>
                  )}
                </div>

                {flagFeedback && (
                  <div style={{
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#92400e',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <AlertCircle size={14} aria-hidden="true" />
                    <span>{flagFeedback}</span>
                  </div>
                )}

                {listing.reviews && listing.reviews.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {listing.reviews.map((rev) => (
                      <div
                        key={rev.review_id}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          padding: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <RatingStars rating={rev.rating} size={12} />
                            <strong style={{ fontSize: '12px' }}>{rev.reviewer_name}</strong>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                              {new Date(rev.created_at).toLocaleDateString()}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleFlagReview(rev.review_id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                padding: '2px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px',
                                fontSize: '10px',
                                minHeight: 'auto'
                              }}
                              title="Flag review for administrator moderation"
                            >
                              <Flag size={11} aria-hidden="true" />
                              <span>Flag</span>
                            </button>
                          </div>
                        </div>

                        <p style={{ fontSize: '12px', color: '#334155', lineHeight: '1.4' }}>
                          {rev.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '12px', color: '#64748b' }}>
                    No reviews yet. First review will establish the seller rating.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
