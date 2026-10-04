export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || "/api",
  dataSource: "api",
  endpoints: {
    dashboard: "/dashboard",
    dashboardStream: "/dashboard/stream",
    cards: "/cards",
    card: (cardId) => `/cards/${cardId}`,
    messages: (cardId) => `/cards/${cardId}/messages`,
    settings: "/settings",
    plans: "/plans",
    subscription: "/subscription",
  },
};

export const shouldUseBackend = () => true;
