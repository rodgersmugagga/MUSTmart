/**
 * @file InquiryChatModal.jsx
 * @description Buyer-seller direct messaging channel conforming to UI Mockup C4.
 * @module pages/InquiryChatModal
 * @see {@link MUSTmart UI Mockups-1.pdf} Screen C4
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Send, AlertTriangle, ShieldCheck, ArrowLeft, MessageSquare } from 'lucide-react';
import API_BASE from '../config/api';

/**
 * Inquiry Chat Component (Screen C4).
 * Real-time inquiry messaging with auto-scroll, thread selection, and compulsory transaction safety disclaimer.
 *
 * @param {Object} props - Component properties.
 * @param {number} [props.activeConversationId] - Preset conversation ID.
 * @param {number} [props.initialListingId] - Listing ID to automatically initialize inquiry thread.
 * @param {Function} [props.onBack] - Handler to navigate back to preceding view.
 * @returns {React.ReactElement} The rendered inquiry chat view.
 */
export default function InquiryChatModal({
  activeConversationId,
  initialListingId,
  onBack
}) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [currentConvId, setCurrentConvId] = useState(activeConversationId);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Mobile state: whether viewing conversation list or active chat
  const [mobileViewChat, setMobileViewChat] = useState(!!(activeConversationId || initialListingId));

  const messagesEndRef = useRef(null);

  /**
   * Scrolls message viewport smoothly to latest incoming communication.
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initialize inquiry or conversation list
  useEffect(() => {
    if (initialListingId) {
      startListingInquiry(initialListingId);
    } else {
      loadConversations();
    }
  }, [initialListingId]);

  // Polling / message synchronization
  useEffect(() => {
    if (currentConvId) {
      fetchMessages(currentConvId);
      const pollInterval = setInterval(() => {
        fetchMessages(currentConvId, true);
      }, 4000);
      return () => clearInterval(pollInterval);
    }
  }, [currentConvId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Initiates or resumes inquiry for a specific listing.
   *
   * @async
   * @function startListingInquiry
   * @param {number} listingId - Targeted listing ID.
   */
  const startListingInquiry = async (listingId) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/conversations/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('mustmart_token')}`
        },
        body: JSON.stringify({ listing_id: listingId })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentConvId(data.conversation_id);
        setMobileViewChat(true);
        loadConversations();
      }
    } catch (err) {
      console.error('[MUSTmart Chat] Start inquiry error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Retrieves conversation threads associated with authenticated user.
   *
   * @async
   * @function loadConversations
   */
  const loadConversations = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/conversations`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('mustmart_token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations);
        if (!currentConvId && data.conversations.length > 0) {
          setCurrentConvId(data.conversations[0].conversation_id);
        }
      }
    } catch (err) {
      console.error('[MUSTmart Chat] Load conversations error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetches messages for an active conversation thread.
   *
   * @async
   * @function fetchMessages
   * @param {number} convId - Conversation thread ID.
   * @param {boolean} [silent=false] - Whether to suppress loading indicator during background polling.
   */
  const fetchMessages = async (convId, silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch(`${API_BASE}/api/conversations/${convId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('mustmart_token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setCurrentConversation(data.conversation);
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('[MUSTmart Chat] Fetch messages error:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  /**
   * Dispatches a new message payload to the server.
   *
   * @async
   * @function handleSendMessage
   * @param {React.FormEvent} e - Form submission event.
   */
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentConvId) return;

    try {
      setSending(true);
      const outgoing = newMessage;
      setNewMessage('');

      const res = await fetch(`${API_BASE}/api/conversations/${currentConvId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('mustmart_token')}`
        },
        body: JSON.stringify({ body: outgoing })
      });

      const data = await res.json();
      if (data.success) {
        fetchMessages(currentConvId, true);
        loadConversations();
      }
    } catch (err) {
      console.error('[MUSTmart Chat] Send error:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="inquiry-chat-page" style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#064e3b', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px' }}>
            C4 · INQUIRY CHAT
          </span>
          <h2 style={{ fontSize: '20px', marginTop: '2px' }}>Buyer-Seller Direct Messaging</h2>
        </div>

        {mobileViewChat ? (
          <button
            type="button"
            className="btn-outline"
            onClick={() => setMobileViewChat(false)}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
          >
            <ArrowLeft size={14} aria-hidden="true" />
            <span>Threads</span>
          </button>
        ) : (
          onBack && (
            <button
              type="button"
              className="btn-outline"
              onClick={onBack}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
            >
              <ArrowLeft size={14} aria-hidden="true" />
              <span>Back</span>
            </button>
          )
        )}
      </div>

      {/* Responsive layout: on phones, toggle between thread list and chat; on desktop, dual columns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '280px 1fr',
        gap: '16px'
      }}>
        {/* Conversation list (shown on desktop or when mobileViewChat is false) */}
        {(!mobileViewChat || window.innerWidth >= 768) && (
          <aside style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '72vh'
          }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 700, fontSize: '13px' }}>
              Inquiry Threads ({conversations.length})
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {conversations.length === 0 ? (
                <div style={{ padding: '24px 14px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                  No active conversations yet. Click "Send Inquiry" on any listing to start chat.
                </div>
              ) : (
                conversations.map((c) => {
                  const isSelected = c.conversation_id === currentConvId;
                  const counterpart = user?.user_id === c.buyer_id ? c.seller_name : c.buyer_name;
                  return (
                    <div
                      key={c.conversation_id}
                      onClick={() => {
                        setCurrentConvId(c.conversation_id);
                        setMobileViewChat(true);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setCurrentConvId(c.conversation_id);
                          setMobileViewChat(true);
                        }
                      }}
                      style={{
                        padding: '10px 14px',
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        background: isSelected ? '#ecfdf5' : 'transparent',
                        borderLeft: isSelected ? '4px solid #064e3b' : '4px solid transparent'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                        <strong style={{ fontSize: '13px', color: isSelected ? '#064e3b' : '#0f172a' }}>
                          {counterpart}
                        </strong>
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                          {c.last_message_time ? new Date(c.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p style={{ fontSize: '11px', color: '#064e3b', fontWeight: 600, margin: '1px 0' }}>
                        {c.listing_title}
                      </p>
                      <p style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.last_message || 'Inquiry created'}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        )}

        {/* Active Chat Column (shown on desktop or when mobileViewChat is true) */}
        {(mobileViewChat || window.innerWidth >= 768) && (
          <main className="chat-container">
            {currentConversation ? (
              <>
                {/* Chat Header Summary (Mockup C4) */}
                <div className="chat-header">
                  <div className="chat-listing-summary">
                    <img
                      src={
                        currentConversation.listing_photo?.startsWith('http')
                          ? currentConversation.listing_photo
                          : currentConversation.listing_photo
                          ? `/uploads/${currentConversation.listing_photo}`
                          : 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=120&q=80'
                      }
                      alt="Thumbnail"
                      className="chat-thumb"
                    />
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 700 }}>
                        {user?.user_id === currentConversation.buyer_id
                          ? currentConversation.seller_name
                          : currentConversation.buyer_name}
                      </h4>
                      <p style={{ fontSize: '11px', color: '#64748b' }}>
                        Re: <strong>{currentConversation.listing_title}</strong> (UGX {Number(currentConversation.price_ugx).toLocaleString()})
                      </p>
                    </div>
                  </div>

                  {currentConversation.verification_status === 'verified' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#064e3b', fontWeight: 700 }}>
                      <ShieldCheck size={13} aria-hidden="true" />
                      <span>Verified</span>
                    </div>
                  )}
                </div>

                {/* Message Log */}
                <div className="chat-messages-area" role="log" aria-live="polite">
                  {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', margin: 'auto', color: '#94a3b8', fontSize: '13px' }}>
                      Send an inquiry message to discuss availability, specifications, or arranging campus viewing.
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.sender_id === user?.user_id;
                      return (
                        <div
                          key={m.message_id}
                          className={`message-bubble ${isMe ? 'buyer' : 'seller'}`}
                        >
                          <div style={{ fontSize: '10px', opacity: 0.8, marginBottom: '2px', fontWeight: 700 }}>
                            {isMe ? 'You' : m.sender_name}
                          </div>
                          <div>{m.body}</div>
                          <div className="message-time">
                            {new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Mandatory Transaction Disclaimer (Mockup C4 & Architecture) */}
                <div className="disclaimer-banner">
                  <AlertTriangle size={14} color="#b45309" aria-hidden="true" />
                  <span>
                    Payments are arranged directly between buyer and seller. MUSTmart does not process payments.
                  </span>
                </div>

                {/* Input Bar */}
                <form onSubmit={handleSendMessage} className="chat-input-bar">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    aria-label="Message text"
                  />
                  <button type="submit" disabled={sending} aria-label="Send message">
                    <Send size={15} aria-hidden="true" />
                    <span>Send</span>
                  </button>
                </form>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '13px' }}>
                Select a conversation thread to view inquiries.
              </div>
            )}
          </main>
        )}
      </div>
    </div>
  );
}
