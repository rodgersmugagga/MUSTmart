/**
 * @file ConsumerHome.jsx
 * @description Consumer home and search view corresponding to UI Mockup C1.
 * @module pages/ConsumerHome
 * @see {@link MUSTmart UI Mockups-1.pdf} Screen C1
 */

import React, { useState, useEffect } from 'react';
import ListingCard from '../components/ListingCard';
import API_BASE from '../config/api';
import {
  Search,
  Sparkles,
  Compass,
  Shirt,
  Utensils,
  Shirt as LaundryIcon,
  Gift,
  Laptop,
  LandPlot,
  Building2
} from 'lucide-react';

/**
 * Mapping of canonical category titles to descriptive Lucide icon components.
 * @constant {Object.<string, React.ComponentType>}
 */
const CATEGORY_ICON_MAP = {
  'Fashion & thrift': Shirt,
  'Food & catering': Utensils,
  'Laundry & personal care': LaundryIcon,
  'Gifts & events': Gift,
  'Second-hand goods': Laptop,
  'Land & real estate': LandPlot,
  'Hostels & rentals': Building2
};

/**
 * Consumer Home Page (Screen C1).
 * Features keyword search, category quick navigation chips, orientation-week picks banner, and featured listings.
 *
 * @param {Object} props - Component properties.
 * @param {Function} props.onSelectListing - Handler invoked when a listing is clicked.
 * @param {Function} props.onFilterCategory - Handler to route to search results for a category.
 * @param {Function} props.onSelectOrientation - Handler to route to orientation-week picks.
 * @returns {React.ReactElement} The rendered consumer home view.
 */
export default function ConsumerHome({
  onSelectListing,
  onFilterCategory,
  onSelectOrientation
}) {
  const [categories, setCategories] = useState([]);
  const [featuredListings, setFeaturedListings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Initialize data on component mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  /**
   * Fetches categories and initial featured live listings concurrently.
   *
   * @async
   * @function fetchInitialData
   */
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [catResponse, listResponse] = await Promise.all([
        fetch(`${API_BASE}/api/categories`),
        fetch(`${API_BASE}/api/listings?limit=8`)
      ]);

      const catPayload = await catResponse.json();
      const listPayload = await listResponse.json();

      if (catPayload.success) setCategories(catPayload.categories);
      if (listPayload.success) setFeaturedListings(listPayload.listings);
    } catch (err) {
      console.error('[MUSTmart Home] Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles user submission of the hero search form.
   *
   * @param {React.FormEvent} e - Form submission event.
   */
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onFilterCategory('all', searchQuery.trim());
    }
  };

  return (
    <div className="consumer-home-page">
      {/* Search Hero (Mockup C1) */}
      <section className="search-hero" aria-labelledby="home-search-heading">
        <h2 id="home-search-heading">Home and Search</h2>
        <p>Verified student hostels, study gadgets, catering, and services across MUST Kihumuro and Town Campuses.</p>

        <form onSubmit={handleSearchSubmit} className="search-input-box" role="search">
          <input
            type="text"
            placeholder="Search hostels, laptops, plots, cakes, laundry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search campus listings"
          />
          <button type="submit" aria-label="Submit search">
            <Search size={16} aria-hidden="true" />
            <span>Search</span>
          </button>
        </form>
      </section>

      {/* Categories Row (Mockup C1) */}
      <section className="categories-section" aria-labelledby="categories-heading">
        <div className="section-title-row">
          <h3 id="categories-heading" className="section-title">Campus Categories</h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>WBS 1.4.3 Discovery</span>
        </div>

        <div className="category-chips-grid">
          {categories.map((cat) => {
            const IconComponent = CATEGORY_ICON_MAP[cat.name] || Compass;
            return (
              <div
                key={cat.category_id}
                className="category-chip"
                onClick={() => onFilterCategory(cat.name)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onFilterCategory(cat.name);
                }}
                aria-label={`Filter by ${cat.name}`}
              >
                <div className="category-chip-icon" aria-hidden="true">
                  <IconComponent size={18} />
                </div>
                <span>{cat.name}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Orientation-Week Picks Banner (Mockup C1 & WBS 1.6.4) */}
      <section className="orientation-banner" aria-labelledby="orientation-picks-heading">
        <div className="orientation-content">
          <div className="orientation-icon-box" aria-hidden="true">
            <Sparkles size={22} />
          </div>
          <div className="orientation-text">
            <h3 id="orientation-picks-heading">New to MUST?</h3>
            <p>Orientation-week picks from verified student businesses and authenticated campus providers.</p>
          </div>
        </div>
        <button
          type="button"
          className="btn-orientation"
          onClick={onSelectOrientation}
        >
          See orientation picks →
        </button>
      </section>

      {/* Featured Listings (Mockup C1) */}
      <section className="featured-listings-section" aria-labelledby="featured-heading">
        <div className="section-title-row">
          <h3 id="featured-heading" className="section-title">Featured Listings</h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Verified campus sellers</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '36px', color: '#64748b', fontSize: '14px' }}>
            Loading MUSTmart listings...
          </div>
        ) : (
          <div className="listings-grid">
            {featuredListings.map((listingItem) => (
              <ListingCard
                key={listingItem.listing_id}
                listing={listingItem}
                onClick={onSelectListing}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
