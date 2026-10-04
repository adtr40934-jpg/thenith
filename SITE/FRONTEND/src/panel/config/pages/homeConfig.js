export const homeConfig = {
  features: {
    analytics: true,
    notifications: true,
  },
  metrics: [
    {
      id: "visits",
      labelKey: "metrics.totalVisits",
      hintKey: "metrics.visitsHint",
    },
    {
      id: "linkClicks",
      labelKey: "metrics.linkClicks",
      hintKey: "metrics.linksHint",
    },
    {
      id: "directContacts",
      labelKey: "metrics.directContacts",
      hintKey: "metrics.contactsHint",
    },
  ],
};
