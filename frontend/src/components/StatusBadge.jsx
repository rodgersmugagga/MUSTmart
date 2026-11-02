/**
 * @file StatusBadge.jsx
 * @description Reusable status indicator component for verification, moderation, and listing states.
 * @module components/StatusBadge
 * @see {@link MUSTmart System Architecture Diagram.pdf}
 */

import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertTriangle, ShieldCheck, Archive } from 'lucide-react';

/**
 * Renders a standardized visual badge for entity lifecycle statuses.
 *
 * @param {Object} props - Component properties.
 * @param {string} props.status - The current status code ('live', 'verified', 'pending', 'rejected', 'info_requested', 'flagged', 'archived').
 * @param {string} [props.label] - Optional custom label text; defaults to capitalized status.
 * @param {string} [props.size='md'] - Sizing variant ('sm' or 'md').
 * @returns {React.ReactElement} The rendered badge element.
 */
export default function StatusBadge({ status, label, size = 'md' }) {
  // Normalize status string for consistent class matching
  const normalizedStatus = (status || 'pending').toLowerCase();

  /**
   * Resolves the appropriate status icon based on the normalized state.
   *
   * @param {string} state - The normalized status value.
   * @returns {React.ReactElement} Corresponding Lucide icon component.
   */
  const resolveIcon = (state) => {
    const iconSize = size === 'sm' ? 12 : 14;
    switch (state) {
      case 'live':
      case 'verified':
      case 'approved':
        return <CheckCircle2 size={iconSize} aria-hidden="true" />;
      case 'pending':
        return <Clock size={iconSize} aria-hidden="true" />;
      case 'rejected':
      case 'removed':
        return <XCircle size={iconSize} aria-hidden="true" />;
      case 'info_requested':
      case 'flagged':
        return <AlertTriangle size={iconSize} aria-hidden="true" />;
      case 'archived':
        return <Archive size={iconSize} aria-hidden="true" />;
      default:
        return <ShieldCheck size={iconSize} aria-hidden="true" />;
    }
  };

  /**
   * Generates readable display text when no explicit label is supplied.
   *
   * @param {string} state - The normalized status value.
   * @returns {string} Human-readable status title.
   */
  const resolveText = (state) => {
    if (label) return label;
    switch (state) {
      case 'live':
        return 'Live';
      case 'verified':
        return 'Verified';
      case 'pending':
        return 'Pending Review';
      case 'rejected':
        return 'Rejected';
      case 'info_requested':
        return 'Info Requested';
      case 'flagged':
        return 'Flagged';
      case 'archived':
        return 'Archived';
      default:
        return state.charAt(0).toUpperCase() + state.slice(1);
    }
  };

  return (
    <span className={`status-pill ${normalizedStatus} size-${size}`} role="status">
      {resolveIcon(normalizedStatus)}
      <span>{resolveText(normalizedStatus)}</span>
    </span>
  );
}
