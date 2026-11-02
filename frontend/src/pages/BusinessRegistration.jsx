/**
 * @file BusinessRegistration.jsx
 * @description Business onboarding and credential verification view conforming to UI Mockup O1.
 * @module pages/BusinessRegistration
 * @see {@link mustmart_flowchart.html} & {@link MUSTmart UI Mockups-1.pdf} Screen O1
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import API_BASE from '../config/api';
import {
  Building2,
  Upload,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

/**
 * Business Registration and Verification Form (Screen O1).
 * Captures enterprise credentials, student ID verification, and proofs of ownership/agency.
 *
 * @param {Object} props - Component properties.
 * @param {Function} [props.onSuccess] - Callback executed upon successful submission.
 * @returns {React.ReactElement} The rendered business registration form.
 */
export default function BusinessRegistration({ onSuccess }) {
  const { user, refreshUser } = useAuth();
  const [existingBiz, setExistingBiz] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [location, setLocation] = useState('Kihumuro, MUST Gate A');
  const [description, setDescription] = useState('');
  const [idType, setIdType] = useState('student_id');

  // Document File Handles
  const [idFile, setIdFile] = useState(null);
  const [ownershipFile, setOwnershipFile] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    fetchCurrentBusiness();
  }, []);

  /**
   * Loads current user's existing business entity if already registered.
   *
   * @async
   * @function fetchCurrentBusiness
   */
  const fetchCurrentBusiness = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/businesses/my-business`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('mustmart_token')}` }
      });
      const data = await res.json();
      if (data.success && data.business) {
        setExistingBiz(data.business);
        setBusinessName(data.business.name);
        setLocation(data.business.location);
        setDescription(data.business.description || '');
      }
    } catch (err) {
      console.error('[MUSTmart Business] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Submits business profile and verification documents to backend.
   *
   * @async
   * @function handleSubmit
   * @param {React.FormEvent} e - Form submission event.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    if (!businessName || !phone || !location) {
      setFeedback({ type: 'error', message: 'Business name, phone, and campus location are required.' });
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('business_name', businessName);
      formData.append('full_name', fullName);
      formData.append('phone', phone);
      formData.append('location', location);
      formData.append('description', description);
      formData.append('id_type', idType);

      if (idFile) formData.append('id_document', idFile);
      if (ownershipFile) formData.append('ownership_document', ownershipFile);

      const res = await fetch(`${API_BASE}/api/businesses/register`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('mustmart_token')}`
        },
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: data.message });
        fetchCurrentBusiness();
        refreshUser();
        if (onSuccess) onSuccess();
      } else {
        setFeedback({ type: 'error', message: data.message || 'Registration failed.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Network error submitting verification.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-card" style={{ maxWidth: '680px', margin: '0 auto' }}>
      {/* Module Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#064e3b', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px' }}>
          O1 · BUSINESS OWNER / AGENT
        </span>
        <span style={{ color: '#64748b', fontSize: '12px' }}>WBS 1.3.4 & 1.4.1</span>
      </div>

      <h2 className="form-title">Register and verify your business</h2>
      <p className="form-subtitle">
        An administrator reviews your documents before any listing goes live.
      </p>

      {/* Verification Status Card if entity exists */}
      {existingBiz && (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '14px',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '14px' }}>{existingBiz.name}</strong>
            <StatusBadge status={existingBiz.verification_status} />
          </div>
          <p style={{ fontSize: '12px', color: '#64748b' }}>
            Location: {existingBiz.location} · Review Queue: WBS 1.4.1
          </p>
        </div>
      )}

      {feedback.message && (
        <div style={{
          background: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
          border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
          padding: '10px 14px',
          borderRadius: '6px',
          fontSize: '13px',
          color: feedback.type === 'success' ? '#064e3b' : '#b91c1c',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          {feedback.type === 'success' ? <CheckCircle2 size={16} aria-hidden="true" /> : <AlertCircle size={16} aria-hidden="true" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Form Controls (Mockup O1) */}
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <label className="form-label" htmlFor="biz-fullname">Full name</label>
          <input
            id="biz-fullname"
            type="text"
            className="form-control"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Nsubuga Arafat"
            required
          />
        </div>

        <div className="form-row">
          <label className="form-label" htmlFor="biz-name">Business name</label>
          <input
            id="biz-name"
            type="text"
            className="form-control"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. Kihumuro Smart Hostels, MUST Tech Hub..."
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }} className="form-row">
          <div>
            <label className="form-label" htmlFor="biz-phone">Phone</label>
            <input
              id="biz-phone"
              type="text"
              className="form-control"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+256 701 234 567"
              required
            />
          </div>

          <div>
            <label className="form-label" htmlFor="biz-location">Campus / Premises Location</label>
            <input
              id="biz-location"
              type="text"
              className="form-control"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Kihumuro Gate A, Town Campus Shop 4..."
              required
            />
          </div>
        </div>

        <div className="form-row">
          <label className="form-label" htmlFor="biz-description">Business Description</label>
          <textarea
            id="biz-description"
            className="form-control form-textarea"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your student business, hostel services, or products..."
          />
        </div>

        {/* Upload ID document (Mockup O1) */}
        <div className="form-row">
          <label className="form-label">ID document</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <select
              className="filter-select"
              value={idType}
              onChange={(e) => setIdType(e.target.value)}
              aria-label="Select ID type"
            >
              <option value="student_id">MUST Student ID</option>
              <option value="national_id">National ID (NIRA)</option>
            </select>
            <input
              type="file"
              className="form-control"
              accept="image/*,application/pdf"
              onChange={(e) => setIdFile(e.target.files[0])}
              aria-label="Upload ID Document"
            />
          </div>
        </div>

        {/* Upload proof of ownership or agency (Mockup O1) */}
        <div className="form-row">
          <label className="form-label">
            Proof of ownership or agency (land, hostel, rental)
          </label>
          <input
            type="file"
            className="form-control"
            accept="image/*,application/pdf"
            onChange={(e) => setOwnershipFile(e.target.files[0])}
            aria-label="Upload proof of ownership or agency"
          />
        </div>

        {/* Institutional notice from Mockup O1 & Flowchart */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          padding: '10px 12px',
          fontSize: '11px',
          color: '#475569',
          margin: '16px 0',
          lineHeight: '1.4'
        }}>
          An admin reviews your documents before any listing goes live.
        </div>

        <button type="submit" className="btn-primary-action" disabled={submitting}>
          <Upload size={16} aria-hidden="true" />
          <span>{submitting ? 'Submitting...' : 'Submit for verification'}</span>
        </button>
      </form>
    </div>
  );
}
