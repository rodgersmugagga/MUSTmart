/**
 * @file AdminDashboard.jsx
 * @description Administrator verification queue and moderation views conforming to UI Mockups A1, A2, A3.
 * @module pages/AdminDashboard
 * @see {@link MUSTmart UI Mockups-1.pdf} Screens A1, A2, A3
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import RatingStars from '../components/RatingStars';
import {
  ShieldCheck,
  CheckCircle,
  FileText,
  Eye,
  AlertTriangle,
  ListOrdered,
  FileCheck
} from 'lucide-react';

/**
 * Administrator Dashboard (Screens A1, A2, A3).
 * Governs the business verification queue, pending listing approvals, flagged reviews,
 * and immutable moderation actions logging.
 *
 * @param {Object} props - Component properties.
 * @param {Function} [props.onSelectListing] - Callback invoked when a listing title is inspected.
 * @returns {React.ReactElement} The rendered administrator portal.
 */
export default function AdminDashboard({ onSelectListing }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('verifications'); // 'verifications' | 'listings' | 'reviews' | 'log'
  const [stats, setStats] = useState(null);

  const [verifications, setVerifications] = useState([]);
  const [pendingListings, setPendingListings] = useState([]);
  const [flaggedReviews, setFlaggedReviews] = useState([]);
  const [moderationLog, setModerationLog] = useState([]);
  const [loading, setLoading] = useState(true);

  // Administrative Decision Dialog State
  const [decisionModal, setDecisionModal] = useState({
    isOpen: false,
    type: '', // 'verification' | 'listing' | 'review'
    id: null,
    decision: '',
    title: '',
    reason: ''
  });

  // Document Inspection Viewer State
  const [viewDocsModal, setViewDocsModal] = useState({
    isOpen: false,
    businessName: '',
    documents: []
  });

  useEffect(() => {
    fetchAdminDatasets();
  }, [activeTab]);

  /**
   * Retrieves summary metrics and active queue records based on current tab.
   *
   * @async
   * @function fetchAdminDatasets
   */
  const fetchAdminDatasets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('mustmart_token');
      const headers = { Authorization: `Bearer ${token}` };

      // Load overview statistics
      const statsResponse = await fetch('/api/admin/stats', { headers });
      const statsPayload = await statsResponse.json();
      if (statsPayload.success) setStats(statsPayload.stats);

      // Load targeted queue
      if (activeTab === 'verifications') {
        const res = await fetch('/api/admin/verifications', { headers });
        const data = await res.json();
        if (data.success) setVerifications(data.verifications);
      } else if (activeTab === 'listings') {
        const res = await fetch('/api/admin/listings', { headers });
        const data = await res.json();
        if (data.success) setPendingListings(data.listings);
      } else if (activeTab === 'reviews') {
        const res = await fetch('/api/admin/reviews', { headers });
        const data = await res.json();
        if (data.success) setFlaggedReviews(data.reviews);
      } else if (activeTab === 'log') {
        const res = await fetch('/api/admin/moderation-log', { headers });
        const data = await res.json();
        if (data.success) setModerationLog(data.log);
      }
    } catch (err) {
      console.error('[MUSTmart Admin] Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Submits an administrative decision along with an immutable rationale.
   *
   * @async
   * @function handleDecisionSubmit
   * @param {React.FormEvent} e - Form submission event.
   */
  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('mustmart_token');
    const { type, id, decision, reason } = decisionModal;

    try {
      let endpoint = '';
      if (type === 'verification') endpoint = `/api/admin/verifications/${id}/decision`;
      else if (type === 'listing') endpoint = `/api/admin/listings/${id}/decision`;
      else if (type === 'review') endpoint = `/api/admin/reviews/${id}/decision`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ decision, reason })
      });

      const data = await res.json();
      if (data.success) {
        setDecisionModal({ isOpen: false, type: '', id: null, decision: '', title: '', reason: '' });
        fetchAdminDatasets();
      } else {
        alert(data.message || 'Action failed.');
      }
    } catch (err) {
      console.error('[MUSTmart Admin] Decision error:', err);
    }
  };

  return (
    <div className="admin-dashboard-page" style={{ maxWidth: '1080px', margin: '0 auto' }}>
      {/* Portal Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#064e3b', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px' }}>
            ADMINISTRATOR PORTAL
          </span>
          <h2 style={{ fontSize: '22px', marginTop: '2px' }}>
            {user?.full_name || 'Administrator'} · Verification & Moderation
          </h2>
          <p style={{ fontSize: '12px', color: '#64748b' }}>
            SWE3103 WBS 1.4.6 · Every decision is recorded in the moderation audit log.
          </p>
        </div>

        {/* Real-time Queue Counters */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#064e3b' }}>{stats.pending_verifications}</div>
              <div style={{ fontSize: '10px', color: '#064e3b', fontWeight: 700 }}>Verifications</div>
            </div>
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#b45309' }}>{stats.pending_listings}</div>
              <div style={{ fontSize: '10px', color: '#b45309', fontWeight: 700 }}>Listings</div>
            </div>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#b91c1c' }}>{stats.flagged_reviews}</div>
              <div style={{ fontSize: '10px', color: '#b91c1c', fontWeight: 700 }}>Flagged Reviews</div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs (Mockups A1, A2, A3) */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '16px', overflowX: 'auto', gap: '4px' }}>
        <button
          type="button"
          className={`tab-link ${activeTab === 'verifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('verifications')}
        >
          <FileCheck size={14} aria-hidden="true" />
          <span>Verification queue (A1)</span>
        </button>

        <button
          type="button"
          className={`tab-link ${activeTab === 'listings' ? 'active' : ''}`}
          onClick={() => setActiveTab('listings')}
        >
          <FileText size={14} aria-hidden="true" />
          <span>Listing moderation (A2)</span>
        </button>

        <button
          type="button"
          className={`tab-link ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          <AlertTriangle size={14} aria-hidden="true" />
          <span>Review moderation (A3)</span>
        </button>

        <button
          type="button"
          className={`tab-link ${activeTab === 'log' ? 'active' : ''}`}
          onClick={() => setActiveTab('log')}
        >
          <ListOrdered size={14} aria-hidden="true" />
          <span>Moderation Audit Log</span>
        </button>
      </div>

      {/* TAB A1: Verification Queue (Mockup A1: Applicant, Business, Category, Documents, Decision) */}
      {activeTab === 'verifications' && (
        <div className="admin-table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Business</th>
                <th>Location</th>
                <th>Documents</th>
                <th>Decision</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    Loading verification queue...
                  </td>
                </tr>
              ) : verifications.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: '#059669' }}>
                    <CheckCircle size={20} style={{ margin: '0 auto 6px', display: 'block' }} aria-hidden="true" />
                    Verification queue clear. All business credentials reviewed.
                  </td>
                </tr>
              ) : (
                verifications.map((biz) => (
                  <tr key={biz.business_id}>
                    <td>
                      <strong>{biz.applicant_name}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{biz.applicant_phone}</div>
                    </td>
                    <td>
                      <strong>{biz.name}</strong>
                      <div style={{ fontSize: '11px', color: '#475569' }}>{biz.description?.slice(0, 60)}...</div>
                    </td>
                    <td style={{ fontSize: '12px' }}>{biz.location}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-outline"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', minHeight: '34px' }}
                        onClick={() => setViewDocsModal({
                          isOpen: true,
                          businessName: biz.name,
                          documents: biz.documents || []
                        })}
                      >
                        <Eye size={12} aria-hidden="true" />
                        <span>View files ({biz.documents?.length || 0})</span>
                      </button>
                    </td>
                    <td>
                      <div className="action-btns-group">
                        <button
                          type="button"
                          className="btn-approve"
                          onClick={() => setDecisionModal({
                            isOpen: true,
                            type: 'verification',
                            id: biz.business_id,
                            decision: 'approve',
                            title: `Approve Verified Badge: ${biz.name}`,
                            reason: 'Student credentials and agency documents authenticated.'
                          })}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="btn-info"
                          onClick={() => setDecisionModal({
                            isOpen: true,
                            type: 'verification',
                            id: biz.business_id,
                            decision: 'request_info',
                            title: `Request More Info: ${biz.name}`,
                            reason: 'Please upload a clearer copy of your student card or tenancy contract.'
                          })}
                        >
                          Request info
                        </button>
                        <button
                          type="button"
                          className="btn-reject"
                          onClick={() => setDecisionModal({
                            isOpen: true,
                            type: 'verification',
                            id: biz.business_id,
                            decision: 'reject',
                            title: `Reject Business: ${biz.name}`,
                            reason: 'Unable to verify authenticity of credentials.'
                          })}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB A2: Listing Moderation (Mockup A2: Preview, Listing, Business, Category, Submitted, Decision) */}
      {activeTab === 'listings' && (
        <div className="admin-table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Preview</th>
                <th>Listing</th>
                <th>Business</th>
                <th>Category</th>
                <th>Submitted</th>
                <th>Decision</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    Loading listing moderation queue...
                  </td>
                </tr>
              ) : pendingListings.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#059669' }}>
                    <CheckCircle size={20} style={{ margin: '0 auto 6px', display: 'block' }} aria-hidden="true" />
                    Listing queue clear. No items pending moderation.
                  </td>
                </tr>
              ) : (
                pendingListings.map((item) => (
                  <tr key={item.listing_id}>
                    <td>
                      <img
                        src={
                          item.primary_photo?.startsWith('http')
                            ? item.primary_photo
                            : item.primary_photo
                            ? `/uploads/${item.primary_photo}`
                            : 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=120&q=80'
                        }
                        alt="Preview"
                        style={{ width: '44px', height: '44px', borderRadius: '4px', objectFit: 'cover' }}
                      />
                    </td>
                    <td>
                      <strong>{item.title}</strong>
                      <div style={{ fontSize: '12px', color: '#064e3b', fontWeight: 700 }}>
                        UGX {Number(item.price_ugx).toLocaleString()}
                      </div>
                    </td>
                    <td>
                      <strong>{item.business_name}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Owner: {item.owner_name}</div>
                    </td>
                    <td>
                      <span className="category-tag-pill" style={{ position: 'static' }}>
                        {item.category_name}
                      </span>
                    </td>
                    <td style={{ fontSize: '11px', color: '#64748b' }}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="action-btns-group">
                        <button
                          type="button"
                          className="btn-approve"
                          onClick={() => setDecisionModal({
                            isOpen: true,
                            type: 'listing',
                            id: item.listing_id,
                            decision: 'approve',
                            title: `Approve Listing: "${item.title}"`,
                            reason: 'Listing conforms to MUSTmart community guidelines.'
                          })}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="btn-reject"
                          onClick={() => setDecisionModal({
                            isOpen: true,
                            type: 'listing',
                            id: item.listing_id,
                            decision: 'reject',
                            title: `Reject Listing: "${item.title}"`,
                            reason: 'Item photos or descriptions require verified specifications.'
                          })}
                        >
                          Reject with reason
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB A3: Review Moderation (Mockup A3: Review, Listing, Reviewer, Flagged Date, Decision) */}
      {activeTab === 'reviews' && (
        <div className="admin-table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Review</th>
                <th>Listing</th>
                <th>Reviewer</th>
                <th>Flagged Date</th>
                <th>Decision</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    Loading review moderation queue...
                  </td>
                </tr>
              ) : flaggedReviews.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: '#059669' }}>
                    <CheckCircle size={20} style={{ margin: '0 auto 6px', display: 'block' }} aria-hidden="true" />
                    No flagged reviews in moderation queue.
                  </td>
                </tr>
              ) : (
                flaggedReviews.map((rev) => (
                  <tr key={rev.review_id}>
                    <td>
                      <div style={{ marginBottom: '3px' }}>
                        <RatingStars rating={rev.rating} size={11} />
                      </div>
                      <p style={{ fontSize: '12px', color: '#334155' }}>"{rev.comment}"</p>
                    </td>
                    <td>
                      <strong>{rev.listing_title}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{rev.business_name}</div>
                    </td>
                    <td>
                      <strong>{rev.reviewer_name}</strong>
                    </td>
                    <td style={{ fontSize: '11px', color: '#64748b' }}>
                      {new Date(rev.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="action-btns-group">
                        <button
                          type="button"
                          className="btn-approve"
                          onClick={() => setDecisionModal({
                            isOpen: true,
                            type: 'review',
                            id: rev.review_id,
                            decision: 'keep',
                            title: 'Keep Flagged Review',
                            reason: 'Feedback confirmed as genuine verified student assessment.'
                          })}
                        >
                          Keep
                        </button>
                        <button
                          type="button"
                          className="btn-reject"
                          onClick={() => setDecisionModal({
                            isOpen: true,
                            type: 'review',
                            id: rev.review_id,
                            decision: 'remove',
                            title: 'Remove Flagged Review',
                            reason: 'Violates platform code of conduct or contains unverified claims.'
                          })}
                        >
                          Remove with reason
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB A4: Moderation Audit Log */}
      {activeTab === 'log' && (
        <div className="admin-table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Target Type</th>
                <th>Action</th>
                <th>Reason / Justification</th>
                <th>Moderator</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {moderationLog.map((log) => (
                <tr key={log.action_id}>
                  <td>#{log.action_id}</td>
                  <td><span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{log.target_type}</span></td>
                  <td><StatusBadge status={log.action} size="sm" /></td>
                  <td style={{ fontSize: '12px', color: '#334155' }}>{log.reason}</td>
                  <td><strong>{log.admin_name}</strong></td>
                  <td style={{ fontSize: '11px', color: '#64748b' }}>{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Decision Rationale Modal */}
      {decisionModal.isOpen && (
        <div className="modal-overlay" onClick={() => setDecisionModal({ ...decisionModal, isOpen: false })}>
          <div className="modal-sheet" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '15px' }}>{decisionModal.title}</h3>
            </div>
            <form onSubmit={handleDecisionSubmit} className="modal-body">
              <div className="form-row">
                <label className="form-label" htmlFor="decision-reason">
                  Administrative Reason (Recorded in Audit Log)
                </label>
                <textarea
                  id="decision-reason"
                  className="form-control form-textarea"
                  rows={3}
                  value={decisionModal.reason}
                  onChange={(e) => setDecisionModal({ ...decisionModal, reason: e.target.value })}
                  placeholder="Record clear justification for this moderation decision..."
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '14px' }}>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setDecisionModal({ ...decisionModal, isOpen: false })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={decisionModal.decision === 'reject' || decisionModal.decision === 'remove' ? 'btn-reject' : 'btn-approve'}
                >
                  Confirm Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Viewer Modal (Mockup A1 [View files]) */}
      {viewDocsModal.isOpen && (
        <div className="modal-overlay" onClick={() => setViewDocsModal({ ...viewDocsModal, isOpen: false })}>
          <div className="modal-sheet" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '15px' }}>Documents: {viewDocsModal.businessName}</h3>
            </div>
            <div className="modal-body">
              {viewDocsModal.documents.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '13px' }}>No documents uploaded for this business.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {viewDocsModal.documents.map((doc) => (
                    <div
                      key={doc.document_id}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        padding: '10px 12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '13px', textTransform: 'capitalize' }}>
                          {doc.doc_type?.replace(/_/g, ' ')}
                        </strong>
                        <p style={{ fontSize: '11px', color: '#64748b' }}>
                          File: <code>{doc.file_path}</code>
                        </p>
                      </div>

                      <a
                        href={doc.file_path?.startsWith('http') ? doc.file_path : `/uploads/${doc.file_path}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-outline"
                        style={{ fontSize: '11px', padding: '4px 8px', minHeight: '30px' }}
                      >
                        Inspect
                      </a>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                className="btn-outline"
                style={{ width: '100%', marginTop: '16px' }}
                onClick={() => setViewDocsModal({ ...viewDocsModal, isOpen: false })}
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
