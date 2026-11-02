/**
 * @file WriteReviewModal.jsx
 * @description Review submission dialog conforming to UI Mockup C5 and Review Moderation Flowchart.
 * @module pages/WriteReviewModal
 * @see {@link MUSTmart Review Submission and Moderation Flowchart.pdf}
 */

import React, { useState } from 'react';
import RatingStars from '../components/RatingStars';
import { X, AlertCircle } from 'lucide-react';
import API_BASE from '../config/api';

/**
 * Write Review Modal (Screen C5).
 * Validates single review submission per consumer and triggers live publication with community flagging workflow.
 *
 * @param {Object} props - Component properties.
 * @param {Object} props.listing - Listing record data being reviewed.
 * @param {Function} props.onClose - Modal dismissal handler.
 * @param {Function} props.onSuccess - Success callback fired upon review creation.
 * @returns {React.ReactElement|null} Rendered modal dialog.
 */
export default function WriteReviewModal({ listing, onClose, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!listing) return null;

  /**
   * Dispatches review submission payload to backend API.
   *
   * @async
   * @function handleSubmit
   * @param {React.FormEvent} e - Form submission event.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!rating || rating < 1 || rating > 5) {
      setErrorMsg('Please select a star rating between 1 and 5.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('mustmart_token')}`
        },
        body: JSON.stringify({
          listing_id: listing.listing_id,
          rating,
          comment: comment.trim()
        })
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
      } else {
        setErrorMsg(data.message || 'Failed to submit review.');
      }
    } catch (err) {
      setErrorMsg('Network error while submitting review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="write-review-title">
      <div className="modal-sheet" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#064e3b', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px' }}>
              C5 · CONSUMER
            </span>
            <h3 id="write-review-title" style={{ marginTop: '2px' }}>Write a review</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="modal-body">
          {/* Header Preview (Mockup C5) */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid #e2e8f0' }}>
            <img
              src={
                listing.photos && listing.photos.length > 0
                  ? (listing.photos[0].file_path?.startsWith('http') ? listing.photos[0].file_path : `/uploads/${listing.photos[0].file_path}`)
                  : 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=120&q=80'
              }
              alt={listing.title}
              style={{ width: '54px', height: '54px', borderRadius: '6px', objectFit: 'cover' }}
            />
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700 }}>{listing.title}</h4>
              <p style={{ fontSize: '12px', color: '#64748b' }}>
                Seller: <strong>{listing.owner_name || listing.business_name}</strong>
              </p>
            </div>
          </div>

          {errorMsg && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              padding: '10px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#b91c1c',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <AlertCircle size={16} aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Interactive Star Rating (Mockup C5) */}
          <div style={{ marginBottom: '16px' }}>
            <label className="form-label">Your rating</label>
            <div style={{ padding: '4px 0' }}>
              <RatingStars
                rating={rating}
                interactive={true}
                onChange={(newRating) => setRating(newRating)}
                size={28}
              />
            </div>
          </div>

          {/* Written Comment Textarea */}
          <div className="form-row">
            <label className="form-label" htmlFor="review-comment">Your comment</label>
            <textarea
              id="review-comment"
              className="form-control form-textarea"
              rows={4}
              placeholder="Share your experience regarding room condition, item quality, transaction punctuality, or customer service..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
          </div>

          {/* Policy Note from Flowchart & Mockup C5 */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '11px',
            color: '#64748b',
            marginBottom: '16px',
            lineHeight: '1.4'
          }}>
            One review per listing. An administrator checks flagged reviews.
          </div>

          <button type="submit" className="btn-primary-action" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit review'}
          </button>
        </form>
      </div>
    </div>
  );
}
