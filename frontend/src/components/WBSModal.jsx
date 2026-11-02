/**
 * @file WBSModal.jsx
 * @description Academic matrix modal presenting the Work Breakdown Structure alignment (SWE3103 Group A).
 * @module components/WBSModal
 * @see {@link SWE3103 Work Breakdown Structure}
 */

import React from 'react';
import { X, CheckCircle2, Database } from 'lucide-react';

/**
 * Definition of WBS Phase 1.4 Platform Development packages and their platform implementation.
 * @constant {Array.<Object>}
 */
const WBS_MODULES = [
  {
    code: '1.4.1',
    title: 'User Registration & Verification Module',
    activities: [
      '1.4.1.1 Registration forms & input validation',
      '1.4.1.2 Administrator verification queue (Screen A1)'
    ],
    status: 'Implemented',
    details: 'Role-based access control (consumer, owner, agent, admin). ID and proof of ownership/agency upload with admin approve/reject/request-info decisions.'
  },
  {
    code: '1.4.2',
    title: 'Listings Management Module',
    activities: [
      '1.4.2.1 Listing create/edit/delete/archive',
      '1.4.2.2 Photo upload & dynamic category fields (Screen O2)'
    ],
    status: 'Implemented',
    details: 'Dynamic category specifications for land (plot size/unit) and hostels (room type, amenities, rooms available), status lifecycle (pending, live, rejected, archived).'
  },
  {
    code: '1.4.3',
    title: 'Search & Discovery Module',
    activities: [
      '1.4.3.1 Keyword search functionality',
      '1.4.3.2 Category, location, price, and verified filters (Screens C1, C2)'
    ],
    status: 'Implemented',
    details: 'Multi-criteria search, campus location filtering (Kihumuro, Kakoba, Town Campus), verified seller toggle, and orientation-week picks.'
  },
  {
    code: '1.4.4',
    title: 'Buyer-Seller Messaging / Inquiry Module',
    activities: [
      '1.4.4.1 Inquiry/messaging interface (Screen C4)',
      '1.4.4.2 Notification triggers & direct messaging'
    ],
    status: 'Implemented',
    details: 'Direct inquiry channel with prominent payment disclaimer: "Payments are arranged directly between buyer and seller. MUSTmart does not process payments."'
  },
  {
    code: '1.4.5',
    title: 'Ratings & Reviews Module',
    activities: [
      '1.4.5.1 Review submission form (Screen C5)',
      '1.4.5.2 Average rating display & 1-review-per-listing rule'
    ],
    status: 'Implemented',
    details: 'Enforces strict flowchart rule (one review per listing per student). Community flagging mechanism routes suspicious reviews to admin moderation queue (A3).'
  },
  {
    code: '1.4.6',
    title: 'Administrator Dashboard & Moderation Tools',
    activities: [
      '1.4.6.1 Admin dashboard interface (Screens A1, A2, A3)',
      '1.4.6.2 Verification, listing, and review moderation with audit log'
    ],
    status: 'Implemented',
    details: 'Queue moderation with approve/reject/request-info and persistent audit logging in moderation_actions table for all decisions.'
  },
  {
    code: '1.4.7',
    title: 'Notification System',
    activities: [
      '1.4.7.1 In-app notification delivery (Screen N1)',
      '1.4.7.2 Alert triggers for inquiries, replies, verification, and listing decisions'
    ],
    status: 'Implemented',
    details: 'Real-time alert delivery with unread badge counter and mark-as-read tracking in the notifications table.'
  },
  {
    code: '1.4.8',
    title: 'Integrate All Platform Modules',
    activities: [
      '1.4.8.1 Full-stack integration (React + Express + Neon PostgreSQL)',
      '1.4.8.2 Resolving end-to-end user journeys'
    ],
    status: 'Implemented',
    details: 'Full 3-tier integration conforming to System Architecture Diagram and 13-table Entity-Relationship Model.'
  }
];

/**
 * WBS Modal Component.
 * Displays project deliverable matrix, university metadata, and ERD table mapping.
 *
 * @param {Object} props - Component properties.
 * @param {Function} props.onClose - Modal dismissal handler.
 * @returns {React.ReactElement} The rendered modal dialog.
 */
export default function WBSModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="wbs-modal-title">
      <div className="modal-sheet" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#064e3b', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px' }}>
              SWE3103 · GROUP A
            </span>
            <h3 id="wbs-modal-title" style={{ marginTop: '2px' }}>MUSTmart Work Breakdown Structure (WBS) Alignment</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ maxHeight: '74vh', overflowY: 'auto' }}>
          {/* Metadata Block */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '14px',
            marginBottom: '18px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '10px',
            fontSize: '12px'
          }}>
            <div>
              <span style={{ color: '#64748b' }}>Institution:</span>
              <strong style={{ display: 'block', color: '#0f172a' }}>Mbarara University (MUST)</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Faculty / Department:</span>
              <strong style={{ display: 'block', color: '#0f172a' }}>FCI · Software Engineering</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Group:</span>
              <strong style={{ display: 'block', color: '#0f172a' }}>Group A (7 members)</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Database Tier:</span>
              <strong style={{ display: 'block', color: '#064e3b' }}>Neon PostgreSQL (13 Tables)</strong>
            </div>
          </div>

          <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '10px', color: '#064e3b' }}>
            Phase 1.4: Platform Development Modules Breakdown
          </h4>

          {/* Module Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {WBS_MODULES.map((item) => (
              <div
                key={item.code}
                style={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '12px 14px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ background: '#064e3b', color: 'white', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '3px' }}>
                      WBS {item.code}
                    </span>
                    <strong style={{ fontSize: '14px' }}>{item.title}</strong>
                  </div>
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#059669',
                    fontSize: '11px',
                    fontWeight: 700
                  }}>
                    <CheckCircle2 size={13} aria-hidden="true" />
                    <span>{item.status}</span>
                  </span>
                </div>

                <div style={{ fontSize: '11px', color: '#475569', marginBottom: '4px' }}>
                  <strong>Activities:</strong> {item.activities.join(' · ')}
                </div>

                <p style={{ fontSize: '12px', color: '#334155', background: '#f8fafc', padding: '6px 10px', borderRadius: '4px' }}>
                  {item.details}
                </p>
              </div>
            ))}
          </div>

          {/* Database Schema Reference */}
          <div style={{ marginTop: '18px', padding: '14px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#064e3b', fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
              <Database size={15} aria-hidden="true" />
              <span>WBS 1.3.2 Database Schema Alignment (13 Tables)</span>
            </div>
            <p style={{ fontSize: '11px', color: '#064e3b', lineHeight: '1.4' }}>
              <code>users</code>, <code>businesses</code>, <code>verification_documents</code>, <code>categories</code>, <code>listings</code>, <code>listing_photos</code>, <code>land_details</code>, <code>hostel_details</code>, <code>reviews</code>, <code>moderation_actions</code>, <code>conversations</code>, <code>messages</code>, <code>notifications</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
