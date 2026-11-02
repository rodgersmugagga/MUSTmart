/**
 * @file CreateListingModal.jsx
 * @description Modal form for creating and editing listings conforming to UI Mockup O2.
 * @module pages/CreateListingModal
 * @see {@link MUSTmart UI Mockups-1.pdf} Screen O2
 */

import React, { useState, useEffect } from 'react';
import { X, Building2, LandPlot, AlertCircle } from 'lucide-react';

/**
 * Create/Edit Listing Modal (Screen O2).
 * Handles listing title, category selection, price in UGX, location, description,
 * dynamic category fields (land plot size or hostel room type/amenities), and photo attachments.
 *
 * @param {Object} props - Component properties.
 * @param {Function} props.onClose - Modal dismissal callback.
 * @param {Function} props.onSuccess - Callback invoked after successful submission.
 * @param {Object} [props.initialListing] - Pre-existing listing model for edit & resubmit workflows.
 * @returns {React.ReactElement} The rendered listing creation modal.
 */
export default function CreateListingModal({ onClose, onSuccess, initialListing }) {
  const [categories, setCategories] = useState([]);
  const [title, setTitle] = useState(initialListing?.title || '');
  const [categoryId, setCategoryId] = useState(initialListing?.category_id || '');
  const [priceUgx, setPriceUgx] = useState(initialListing?.price_ugx || '');
  const [location, setLocation] = useState(initialListing?.location || 'Kihumuro, Mbarara');
  const [description, setDescription] = useState(initialListing?.description || '');

  // Dynamic Category Specific Fields (Mockup O2)
  const [roomType, setRoomType] = useState(initialListing?.room_type || 'Single Self-Contained');
  const [amenities, setAmenities] = useState(initialListing?.amenities || 'Water, Free Wi-Fi, Security Guard, Solar backup');
  const [roomsAvailable, setRoomsAvailable] = useState(initialListing?.rooms_available || 2);
  const [plotSize, setPlotSize] = useState(initialListing?.plot_size || '');
  const [sizeUnit, setSizeUnit] = useState(initialListing?.size_unit || 'decimals');

  // Media
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoFiles, setPhotoFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch category list on mount
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCategories(data.categories);
          if (!categoryId && data.categories.length > 0) {
            setCategoryId(data.categories[6]?.category_id || data.categories[0].category_id);
          }
        }
      })
      .catch((err) => console.error('[MUSTmart CreateListing] Categories error:', err));
  }, []);

  const selectedCategory = categories.find((c) => c.category_id === parseInt(categoryId, 10));
  const isHostelCategory = selectedCategory?.name === 'Hostels & rentals';
  const isLandCategory = selectedCategory?.name === 'Land & real estate';

  /**
   * Dispatches create or update payload to the backend REST endpoint.
   *
   * @async
   * @function handleSubmit
   * @param {React.FormEvent} e - Form submission event.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!title || !priceUgx || !location || !categoryId) {
      setErrorMessage('Title, category, price, and location are required.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category_id', categoryId);
      formData.append('price_ugx', priceUgx);
      formData.append('location', location);
      formData.append('description', description);

      if (isHostelCategory) {
        formData.append('room_type', roomType);
        formData.append('amenities', amenities);
        formData.append('rooms_available', roomsAvailable);
      }

      if (isLandCategory) {
        formData.append('plot_size', plotSize || '50');
        formData.append('size_unit', sizeUnit);
        formData.append('documents_checked', '1');
      }

      if (photoUrl.trim()) {
        formData.append('photo_urls', photoUrl.trim());
      }

      for (let i = 0; i < photoFiles.length; i++) {
        formData.append('photos', photoFiles[i]);
      }

      const endpoint = initialListing ? `/api/listings/${initialListing.listing_id}` : '/api/listings';
      const method = initialListing ? 'PUT' : 'POST';

      const headers = {
        Authorization: `Bearer ${localStorage.getItem('mustmart_token')}`
      };

      let requestBody;
      if (initialListing) {
        headers['Content-Type'] = 'application/json';
        requestBody = JSON.stringify({
          title,
          category_id: categoryId,
          price_ugx: priceUgx,
          location,
          description,
          room_type: isHostelCategory ? roomType : undefined,
          amenities: isHostelCategory ? amenities : undefined,
          rooms_available: isHostelCategory ? roomsAvailable : undefined,
          plot_size: isLandCategory ? plotSize : undefined,
          size_unit: isLandCategory ? sizeUnit : undefined
        });
      } else {
        requestBody = formData;
      }

      const response = await fetch(endpoint, {
        method,
        headers,
        body: requestBody
      });

      const payload = await response.json();
      if (payload.success) {
        onSuccess();
      } else {
        setErrorMessage(payload.message || 'Failed to submit listing.');
      }
    } catch (err) {
      setErrorMessage('Network error while processing listing submission.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="create-listing-title">
      <div className="modal-sheet" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#064e3b', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px' }}>
              O2 · BUSINESS OWNER / AGENT
            </span>
            <h3 id="create-listing-title" style={{ marginTop: '2px' }}>
              {initialListing ? 'Edit & Resubmit Listing' : 'Create listing'}
            </h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="modal-body">
          {errorMessage && (
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
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="form-row">
            <label className="form-label" htmlFor="listing-title">Title</label>
            <input
              id="listing-title"
              type="text"
              className="form-control"
              placeholder="e.g. Kihumuro Executive Single Room, HP Pavilion i5..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }} className="form-row">
            <div>
              <label className="form-label" htmlFor="listing-category">Category</label>
              <select
                id="listing-category"
                className="filter-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label" htmlFor="listing-price">Price (UGX)</label>
              <input
                id="listing-price"
                type="number"
                className="form-control"
                placeholder="e.g. 750000"
                value={priceUgx}
                onChange={(e) => setPriceUgx(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <label className="form-label" htmlFor="listing-location">Location</label>
            <input
              id="listing-location"
              type="text"
              className="form-control"
              placeholder="e.g. Kihumuro Gate A, Kakoba, Town Campus Arcade..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <label className="form-label" htmlFor="listing-description">Description</label>
            <textarea
              id="listing-description"
              className="form-control form-textarea"
              rows={3}
              placeholder="Provide key details regarding condition, study features, or terms..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Dynamic Category Fields: Hostels & rentals (Mockup O2) */}
          {isHostelCategory && (
            <div style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px', color: '#064e3b', fontWeight: 700, fontSize: '12px' }}>
                <Building2 size={14} aria-hidden="true" />
                <span>Category fields: Hostels & rentals</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', marginBottom: '8px' }}>
                <div>
                  <label className="form-label" htmlFor="room-type">Room Type</label>
                  <select
                    id="room-type"
                    className="filter-select"
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value)}
                  >
                    <option value="Single Self-Contained">Single Self-Contained</option>
                    <option value="Single Standard">Single Standard</option>
                    <option value="Double Shared">Double Shared</option>
                    <option value="Bedsitter / Studio">Bedsitter / Studio</option>
                    <option value="1-Bedroom Flat">1-Bedroom Flat</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" htmlFor="rooms-available">Rooms Available</label>
                  <input
                    id="rooms-available"
                    type="number"
                    className="form-control"
                    value={roomsAvailable}
                    onChange={(e) => setRoomsAvailable(e.target.value)}
                    min={1}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" htmlFor="room-amenities">Amenities</label>
                <input
                  id="room-amenities"
                  type="text"
                  className="form-control"
                  placeholder="Water included, Free Wi-Fi, Security Guard, Shuttle, Backup Power..."
                  value={amenities}
                  onChange={(e) => setAmenities(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Dynamic Category Fields: Land & real estate (Mockup O2) */}
          {isLandCategory && (
            <div style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px', color: '#92400e', fontWeight: 700, fontSize: '12px' }}>
                <LandPlot size={14} aria-hidden="true" />
                <span>Category fields: Land & real estate</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label className="form-label" htmlFor="plot-size">Plot Size</label>
                  <input
                    id="plot-size"
                    type="number"
                    className="form-control"
                    placeholder="e.g. 50"
                    value={plotSize}
                    onChange={(e) => setPlotSize(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label" htmlFor="plot-unit">Size Unit</label>
                  <select
                    id="plot-unit"
                    className="filter-select"
                    value={sizeUnit}
                    onChange={(e) => setSizeUnit(e.target.value)}
                  >
                    <option value="decimals">Decimals</option>
                    <option value="acres">Acres</option>
                    <option value="sq meters">Square Meters</option>
                    <option value="ft (50x100)">Feet (50x100ft)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Add Photos (Mockup O2) */}
          <div className="form-row">
            <label className="form-label">Add photos</label>
            <input
              type="file"
              className="form-control"
              multiple
              accept="image/*"
              onChange={(e) => setPhotoFiles(Array.from(e.target.files))}
              style={{ marginBottom: '6px' }}
              aria-label="Upload photos"
            />
            <input
              type="url"
              className="form-control"
              placeholder="Or paste image URL (e.g. Unsplash URL)..."
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              aria-label="Photo URL"
            />
          </div>

          <button type="submit" className="btn-primary-action" disabled={submitting}>
            {submitting ? 'Submitting for review...' : 'Submit for review'}
          </button>
        </form>
      </div>
    </div>
  );
}
