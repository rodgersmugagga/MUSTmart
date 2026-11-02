/**
 * @file AuthContext.jsx
 * @description Authentication and actor session context conforming to SWE3103 specifications.
 * @module context/AuthContext
 * @see {@link MUSTmart System Architecture Diagram.pdf}
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import API_BASE from '../config/api';

/**
 * React Context instance for application-wide authentication state.
 * @type {React.Context}
 */
const AuthContext = createContext();

/**
 * Authentication Provider Component.
 * Supplies user profile, JWT token, demo accounts for evaluator switching,
 * and notification badge metrics to downstream components.
 *
 * @param {Object} props - Component properties.
 * @param {React.ReactNode} props.children - Child component tree.
 * @returns {React.ReactElement} The Context Provider element.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('mustmart_token') || null);
  const [demoUsers, setDemoUsers] = useState([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load demo personas for evaluator role switching
  useEffect(() => {
    fetchDemoUsers();
    if (token) {
      fetchUserProfile(token);
    } else {
      // Auto-assign Dembe Brandon (Student Consumer) by default for evaluator preview
      fetch(`${API_BASE}/api/auth/demo-users`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.users.length > 0) {
            const defaultUser = data.users.find((u) => u.email === 'brandon.student@must.ac.ug') || data.users[1];
            if (defaultUser) {
              setToken(defaultUser.token);
              setUser(defaultUser);
              localStorage.setItem('mustmart_token', defaultUser.token);
            }
          }
        })
        .catch((err) => console.error('[MUSTmart Auth] Auto-assign error:', err))
        .finally(() => setLoading(false));
    }
  }, []);

  /**
   * Retrieves seeded demo personas with pre-signed JWT tokens for testing.
   *
   * @async
   * @function fetchDemoUsers
   */
  const fetchDemoUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/demo-users`);
      const data = await res.json();
      if (data.success) {
        setDemoUsers(data.users);
      }
    } catch (err) {
      console.error('[MUSTmart Auth] Fetch demo users error:', err);
    }
  };

  /**
   * Validates active JWT token and retrieves authenticated user profile.
   *
   * @async
   * @function fetchUserProfile
   * @param {string} activeToken - Bearer JWT token.
   */
  const fetchUserProfile = async (activeToken) => {
    if (!activeToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setUnreadNotifs(data.unreadNotifications || 0);
      } else {
        localStorage.removeItem('mustmart_token');
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error('[MUSTmart Auth] Profile fetch error:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Authenticates user with email and password credentials.
   *
   * @async
   * @function login
   * @param {string} email - User email address.
   * @param {string} password - User plain text password.
   * @returns {Promise<{success: boolean, message?: string}>} Authentication result.
   */
  const login = async (email, password) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('mustmart_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    }
    return { success: false, message: data.message };
  };

  /**
   * Registers a new student or vendor account.
   *
   * @async
   * @function register
   * @param {Object} userData - Registration parameters.
   * @returns {Promise<{success: boolean, message?: string}>} Registration result.
   */
  const register = async (userData) => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('mustmart_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    }
    return { success: false, message: data.message };
  };

  /**
   * Clears the current session and token from storage.
   *
   * @function logout
   */
  const logout = () => {
    localStorage.removeItem('mustmart_token');
    setToken(null);
    setUser(null);
  };

  /**
   * Switches the active actor persona immediately using pre-signed demo tokens.
   *
   * @function switchUser
   * @param {number|string} targetUserId - Target user primary key.
   */
  const switchUser = (targetUserId) => {
    const target = demoUsers.find((u) => u.user_id === parseInt(targetUserId, 10));
    if (target) {
      localStorage.setItem('mustmart_token', target.token);
      setToken(target.token);
      setUser(target);
      fetchUserProfile(target.token);
    }
  };

  /**
   * Refreshes user profile and unread counts from server.
   *
   * @function refreshUser
   */
  const refreshUser = () => {
    if (token) fetchUserProfile(token);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'consumer',
        token,
        loading,
        demoUsers,
        unreadNotifs,
        login,
        register,
        logout,
        switchUser,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook providing convenient access to AuthContext.
 *
 * @returns {Object} Authentication context state and operations.
 */
export const useAuth = () => useContext(AuthContext);
