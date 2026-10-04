/**
 * config/pages/profile.js
 * Configuration for the Profile page.
 */

export const PROFILE_CONFIG = {
  /** Username constraints */
  username: {
    /** Regex applied to every keystroke — only a-z 0-9 _ - allowed */
    allowedPattern: /^[a-z0-9_-]*$/,
    maxLength: 30,
    /** Public profile URL template — {username} is replaced at runtime */
    urlTemplate: 'https://thenith.com/{username}',
  },

  /** Orders section */
  orders: {
    /** Statuses that allow the customer to cancel */
    cancellableStatuses: ['Processing', 'قيد التنفيذ'],

    /** Map of status → style token (resolved in the component) */
    statusStyles: {
      Processing: 'warning',
      'قيد التنفيذ': 'warning',
      Shipped: 'info',
      'تم الشحن': 'info',
      Delivered: 'success',
      'تم التوصيل': 'success',
      Cancelled: 'danger',
      'ملغي': 'danger',
    },
  },

  /** Personal info form field limits */
  fields: {
    fullName: { maxLength: 60 },
    email: { maxLength: 100 },
    phone: { maxLength: 20 },
    address: { maxLength: 250 },
  },
};
