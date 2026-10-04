/**
 * config/pages/products.js
 * Configuration for the Products / Shop page.
 * Product catalogue should come from GET /products.
 * This file only contains UI/UX settings — no hardcoded product data.
 */

export const PRODUCTS_CONFIG = {
  /** When true the products grid is populated from the API.
   *  When false (local dev) it falls back to the seed catalogue. */
  useApiCatalogue: false, // flip to true when backend is ready

  /** API endpoint for the product catalogue */
  endpoint: '/products',

  /** Checkout / ordering */
  order: {
    /** Fields required in the user's profile before they can place an order */
    requiredProfileFields: ['address', 'phone'],

    /** Status assigned to a new order on creation */
    initialStatus: 'Processing',
  },

  /** Product grid layout */
  grid: {
    /** Tailwind column classes at each breakpoint */
    columns: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  },
};
