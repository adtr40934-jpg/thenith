/**
 * config/pages/home.js
 * Configuration for the Home (Dashboard) page.
 * All data that appears here should come from the backend API.
 * Static fallbacks are EMPTY — no hardcoded demo data.
 */

export const HOME_CONFIG = {
  /** Metric cards shown at the top of the home page.
   *  Values come from GET /dashboard/metrics  */
  metrics: {
    // The keys here match the API response fields
    keys: ['visits', 'linkClicks', 'directContacts'],
    // Fallback labels (translations should override via i18n)
    fallbackLabels: {
      visits: 'Total Visits',
      linkClicks: 'Link Clicks',
      directContacts: 'Direct Contacts',
    },
  },

  /** Analytics chart configuration */
  chart: {
    /** Periods available in the period switcher */
    periods: ['week', 'month', 'year'],
    defaultPeriod: 'week',
  },

  /** Recent notifications panel */
  notifications: {
    /** Maximum number of notifications to keep in memory */
    maxItems: 10,
  },
};
