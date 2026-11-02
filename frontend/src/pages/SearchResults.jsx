/**
 * @file SearchResults.jsx
 * @description Search results and multi-filter discovery view conforming to UI Mockup C2.
 * @module pages/SearchResults
 * @see {@link MUSTmart UI Mockups-1.pdf} Screen C2
 */

import React, { useState, useEffect } from 'react';
import ListingCard from '../components/ListingCard';
import { Filter, ArrowUpDown, ShieldCheck, X } from 'lucide-react';

/**
 * Search results page with responsive, mobile-collapsible filters and sorting.
 *
 * @param {Object} props - Component properties.
 * @param {string} [props.initialCategory='Hostels & rentals'] - Default category filter.
 * @param {string} [props.initialQuery=''] - Initial keyword query string.
 * @param {boolean} [props.orientationOnly=false] - Whether to filter strictly for orientation picks.
 * @param {Function} props.onSelectListing - Handler invoked when a listing card is clicked.
 * @returns {React.ReactElement} The rendered search results view.
 */
export default function SearchResults({
  initialCategory = 'Hostels & rentals',
  initialQuery = '',
  orientationOnly = false,
  onSelectListing
}) {
  const [category, setCategory] = useState(initialCategory);
  const [categories, setCategories] = useState([]);
  const [location, setLocation] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [sort, setSort] = useState('newest');

  // Mobile drawer collapse state
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load category definitions
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCategories(data.categories);
      })
      .catch((err) => console.error('[MUSTmart Search] Category load error:', err));
  }, []);

  // Synchronize state when navigation triggers new category or query
  useEffect(() => {
    if (initialCategory) setCategory(initialCategory);
    if (initialQuery) setSearchQuery(initialQuery);
  }, [initialCategory, initialQuery]);

  // Re-fetch data whenever any filter parameter changes
  useEffect(() => {
    fetchFilteredListings();
  }, [category, location, minPrice, maxPrice, verifiedOnly, searchQuery, sort, orientationOnly]);

  /**
   * Executes filtered search query against the backend REST endpoint.
   *
   * @async
   * @function fetchFilteredListings
   */
  const fetchFilteredListings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (category && category !== 'all') params.append('category', category);
      if (location && location !== 'all') params.append('location', location);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (verifiedOnly) params.append('verifiedOnly', 'true');
      if (orientationOnly) params.append('orientation', 'true');
      if (searchQuery) params.append('q', searchQuery);
      if (sort) params.append('sort', sort);

      const response = await fetch(`/api/listings?${params.toString()}`);
      const payload = await response.json();
      if (payload.success) {
        setListings(payload.listings);
      }
    } catch (err) {
      console.error('[MUSTmart Search] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clears all active filters back to baseline defaults.
   */
  const handleResetFilters = () => {
    setSearchQuery('');
    setLocation('all');
    setMinPrice('');
    setMaxPrice('');
    setVerifiedOnly(false);
    setCategory('all');
    setShowMobileFilters(false);
  };

  return (
    <div className="search-results-page">
      {/* Results Header */}
      <div className="results-header" style={{ marginBottom: '16px' }}>
        <div>
          <h2>
            {orientationOnly ? 'Orientation-Week Picks' : `Search results: ${category === 'all' ? 'All Categories' : category}`}
          </h2>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>
            Verified accommodations, items, and services at MUST.
          </p>
        </div>

        {/* Sort selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowUpDown size={14} color="#64748b" aria-hidden="true" />
          <select
            className="filter-select"
            style={{ width: 'auto', minHeight: '36px', fontSize: '12px' }}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort listings"
          >
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Mobile Filter Toggle Button (Small Phones) */}
      <button
        type="button"
        className="mobile-filter-toggle-btn"
        onClick={() => setShowMobileFilters(!showMobileFilters)}
        aria-expanded={showMobileFilters}
      >
        <Filter size={15} aria-hidden="true" />
        <span>{showMobileFilters ? 'Hide Filters' : 'Filter Results'}</span>
        {verifiedOnly && <span className="status-pill verified" style={{ fontSize: '10px' }}>Verified</span>}
      </button>

      <div className="search-results-layout">
        {/* Filter Sidebar (Mockup C2: Location, Price, Verified only) */}
        <aside className={`filters-sidebar ${!showMobileFilters ? 'collapsed-mobile' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={16} color="#064e3b" aria-hidden="true" />
              <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Filters</h3>
            </div>
            {showMobileFilters && (
              <button
                type="button"
                onClick={() => setShowMobileFilters(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748b' }}
                aria-label="Close filters"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Keyword filter */}
          <div className="filter-group">
            <label className="filter-label" htmlFor="filter-keyword">Search Keyword</label>
            <input
              id="filter-keyword"
              type="text"
              className="filter-input"
              placeholder="e.g. Kihumuro, single room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category filter */}
          <div className="filter-group">
            <label className="filter-label" htmlFor="filter-category">Category</label>
            <select
              id="filter-category"
              className="filter-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Location filter */}
          <div className="filter-group">
            <label className="filter-label" htmlFor="filter-location">Location</label>
            <select
              id="filter-location"
              className="filter-select"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="all">Any Location</option>
              <option value="Kihumuro">Kihumuro Campus Area</option>
              <option value="Kakoba">Kakoba</option>
              <option value="Town Campus">Town Campus / Town</option>
              <option value="TASO">TASO Village</option>
              <option value="Rwebikona">Rwebikona</option>
            </select>
          </div>

          {/* Price Range */}
          <div className="filter-group">
            <label className="filter-label">Price Range (UGX)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <input
                type="number"
                className="filter-input"
                placeholder="Min UGX"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                aria-label="Minimum price in UGX"
              />
              <input
                type="number"
                className="filter-input"
                placeholder="Max UGX"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                aria-label="Maximum price in UGX"
              />
            </div>
          </div>

          {/* Verified Only Checkbox (Mockup C2) */}
          <div className="filter-group">
            <label className="verified-checkbox-row">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
              />
              <span>Verified only</span>
              <ShieldCheck size={16} color="#059669" aria-hidden="true" />
            </label>
          </div>

          <button
            type="button"
            className="btn-outline"
            style={{ width: '100%', marginTop: '8px' }}
            onClick={handleResetFilters}
          >
            Reset Filters
          </button>
        </aside>

        {/* Results Stream */}
        <main className="results-main">
          <div style={{ marginBottom: '12px', fontSize: '13px', color: '#64748b' }}>
            Showing <strong>{listings.length}</strong> {listings.length === 1 ? 'result' : 'results'}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '14px' }}>
              Filtering listings...
            </div>
          ) : listings.length === 0 ? (
            <div style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '40px 16px',
              textAlign: 'center',
              color: '#64748b'
            }}>
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>No listings matched your criteria.</p>
              <p style={{ fontSize: '13px', marginTop: '4px' }}>Try broadening your search or resetting filters.</p>
            </div>
          ) : (
            <div className="listings-grid">
              {listings.map((item) => (
                <ListingCard
                  key={item.listing_id}
                  listing={item}
                  onClick={onSelectListing}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
