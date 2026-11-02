/**
 * @file ListingCard.jsx
 * @description Standardized, responsive listing card component conforming to UI Mockup C1 and C2.
 * @module components/ListingCard
 * @see {@link MUSTmart UI Mockups-1.pdf} Screen C1 & C2
 */

import React from 'react';
import { ShieldCheck, MapPin, Star } from 'lucide-react';

/**
 * Renders an accessible, touch-optimized card representation of a marketplace listing.
 *
 * @param {Object} props - Component properties.
 * @param {Object} props.listing - Listing record data model.
 * @param {Function} props.onClick - Click event handler triggered on selection.
 * @returns {React.ReactElement} The rendered listing card element.
 */
export default function ListingCard({ listing, onClick }) {
  // Resolve primary image source with absolute or relative fallback
  const resolvePhotoUrl = () => {
    if (!listing.primary_photo) {
      return 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80';
    }
    if (listing.primary_photo.startsWith('http')) {
      return listing.primary_photo;
    }
    return `/uploads/${listing.primary_photo}`;
  };

  return (
    <article
      className="listing-card"
      onClick={() => onClick && onClick(listing.listing_id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick && onClick(listing.listing_id);
        }
      }}
      aria-label={`${listing.title}, UGX ${Number(listing.price_ugx).toLocaleString()}`}
    >
      {/* Media container */}
      <div className="listing-image-box">
        <img
          src={resolvePhotoUrl()}
          alt={listing.title}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80';
          }}
        />

        {/* Verification badge overlay */}
        {listing.verification_status === 'verified' && (
          <div className="verified-badge-pill" aria-label="Verified Seller">
            <ShieldCheck size={12} aria-hidden="true" />
            <span>Verified</span>
          </div>
        )}

        {/* Category tag */}
        <div className="category-tag-pill">
          {listing.category_name}
        </div>
      </div>

      {/* Content body */}
      <div className="listing-content">
        <h4 className="listing-title">{listing.title}</h4>

        {/* Metadata row: location and category-specific specs */}
        <div className="listing-meta">
          <MapPin size={13} aria-hidden="true" />
          <span>{listing.location}</span>
          {listing.room_type && (
            <>
              <span aria-hidden="true">·</span>
              <span className="spec-highlight">{listing.room_type}</span>
            </>
          )}
          {listing.plot_size && (
            <>
              <span aria-hidden="true">·</span>
              <span className="spec-highlight">{listing.plot_size} {listing.size_unit}</span>
            </>
          )}
        </div>

        {/* Pricing and rating footer */}
        <div className="listing-price-row">
          <div>
            <span className="price-val">
              UGX {Number(listing.price_ugx).toLocaleString()}
            </span>
            {listing.category_name === 'Hostels & rentals' && (
              <span className="price-period">/ semester</span>
            )}
          </div>

          {listing.avg_rating > 0 && (
            <div className="rating-badge" aria-label={`Rated ${listing.avg_rating} out of 5 stars`}>
              <Star size={13} fill="currentColor" aria-hidden="true" />
              <span>{listing.avg_rating}</span>
              <span className="review-count">({listing.review_count})</span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
