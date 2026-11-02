/**
 * @file api.js
 * @description Centralized API base URL configuration for MUSTmart frontend.
 * In development, Vite proxy handles /api routes to localhost:5000.
 * In production, this resolves to the deployed Render backend URL.
 * @module config/api
 */

/**
 * Base URL prefix for all backend API calls.
 * Uses VITE_API_URL environment variable in production (set on Vercel).
 * Falls back to empty string in development (Vite proxy handles routing).
 * @constant {string}
 */
const API_BASE = import.meta.env.VITE_API_URL || '';

export default API_BASE;
