/**
 * config/pages/messages.js
 * Configuration for the Messages / Inbox page.
 */

export const MESSAGES_CONFIG = {
  /** Inbox types that exist in the system */
  inboxTypes: ['requests', 'appointments'],

  /** Pagination — how many items per page when loading from backend */
  pagination: {
    pageSize: 20,
  },

  /** Auto-mark as read when the user opens the message detail */
  autoMarkRead: true,

  /** Days after which a read message can be auto-archived (0 = never) */
  autoArchiveDays: 0,
};
