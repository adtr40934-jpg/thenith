/**
 * config/pages/cardEditor.js
 * Configuration for the Card Editor (personal, contacts, links, etc.)
 */

export const CARD_EDITOR_CONFIG = {
  /** Tabs / sections inside the card editor */
  sections: ['personal', 'contacts', 'links', 'action'],

  /** Contact type constraints */
  contacts: {
    maxPerType: {
      phone: 2,
      whatsapp: 2,
      email: 5,
      location: 3,
      website: 5,
    },
  },

  /** Personal info field character limits */
  personal: {
    fullName: { maxLength: 60 },
    title: { maxLength: 80 },
    company: { maxLength: 80 },
    jobTitle: { maxLength: 80 },
    bio: { maxLength: 300 },
  },

  /** Link settings */
  links: {
    /** Maximum number of custom links per card */
    maxCustomLinks: 20,
    /** Characters allowed in a custom link name */
    nameMaxLength: 40,
  },
};
