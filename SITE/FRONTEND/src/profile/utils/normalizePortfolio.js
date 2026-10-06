/* eslint-disable import/no-unresolved */
// normalizePortfolio.js – builds a complete profile object from API data.
// It no longer relies on a static `defaultPortfolio` fallback; missing fields are
// replaced with sensible empty defaults.

// No import of defaultPortfolio – we use empty placeholders instead.

const compact = (items) => items.filter(Boolean);

const withProtocol = (url = "") => {
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
};

function normalizeContactMethods(contact = {}) {
  if (Array.isArray(contact.methods)) {
    return contact.methods
      .filter((item) => item?.value)
      .map((item) => ({
        type: item.type || "link",
        labelKey: item.labelKey,
        label: item.label,
        value: item.value,
        href: item.href,
        copyable: item.copyable ?? true,
        isLtr: item.isLtr ?? ["phone", "email", "website"].includes(item.type),
      }));
  }

  return compact([
    contact.phone && {
      type: "phone",
      labelKey: "phoneLabel",
      value: contact.phone,
      href: `tel:${String(contact.phone).replace(/\s+/g, "")}`,
      copyable: true,
      isLtr: true,
    },
    contact.email && {
      type: "email",
      labelKey: "emailLabel",
      value: contact.email,
      href: `mailto:${contact.email}`,
      copyable: true,
      isLtr: true,
    },
    contact.website && {
      type: "website",
      labelKey: "websiteLabel",
      value: contact.website,
      href: withProtocol(contact.website),
      copyable: true,
      isLtr: true,
    },
    contact.location && {
      type: "location",
      labelKey: "locationLabel",
      value: contact.location,
      href: `https://maps.google.com/?q=${encodeURIComponent(contact.location)}`,
      copyable: true,
      isLtr: false,
    },
  ]);
}

/**
 * Normalizes a raw portfolio payload from the back‑end into the shape expected
 * by the UI components. Missing optional sections are replaced with empty
 * defaults so the UI never crashes.
 */
export function normalizePortfolio(data = {}) {
  // The backend may wrap the actual payload inside a `card` object.
  const payload = data.card || data;

  const emptyContact = {};
  const emptySocials = [];
  const emptySeo = {};

  const contactsArr = payload.contacts || [];

  // Find primary phone, fallback to first phone
  const phoneContact =
    contactsArr.find(
      (c) =>
        c.primary && (c.type === "phone" || c.label?.toLowerCase() === "phone"),
    ) ||
    contactsArr.find(
      (c) => c.type === "phone" || c.label?.toLowerCase() === "phone",
    );

  // Find primary whatsapp, fallback to first whatsapp, or use primary phone
  const whatsappContact =
    contactsArr.find(
      (c) =>
        c.primary &&
        (c.type === "whatsapp" || c.label?.toLowerCase() === "whatsapp"),
    ) ||
    contactsArr.find(
      (c) => c.type === "whatsapp" || c.label?.toLowerCase() === "whatsapp",
    ) ||
    contactsArr.find(
      (c) =>
        c.primary && (c.type === "phone" || c.label?.toLowerCase() === "phone"),
    );

  // Build a contact object compatible with UI expectations.
  const contact = {
    ...emptyContact,
    phone: phoneContact ? phoneContact.value : "",
    whatsapp: whatsappContact ? whatsappContact.value : "",
    ...(payload.contacts ? { methods: payload.contacts } : {}),
  };

  const personal = {
    fullName: payload.personal?.fullName || "",
    title: payload.personal?.title || "",
    company: payload.personal?.company || "",
    jobTitle: payload.personal?.jobTitle || "",
    bio: payload.personal?.bio || "",
    avatar: payload.personal?.avatar || "",
    coverImage: payload.personal?.coverImage || "",
  };

  const subscription =
    payload.subscription ||
    (payload.amountPaid || payload.isPaid || payload.paid || payload.amount > 0
      ? "paid"
      : "free");

  // Core profile fields, with fallbacks.
  const profile = {
    ...payload,
    id: payload.id || payload.publicId || "",
    theme: payload.theme || "default", // EXPLICITLY SET THEME
    avatar: personal.avatar || payload.avatar || "",
    coverImage: personal.coverImage || payload.coverImage || "",
    name: personal.fullName || "",
    role: personal.title || "",
    company: personal.company || "",
    jobTitle: personal.jobTitle || "",
    bio: personal.bio || "",
    isVerified: Boolean(
      payload.verifiedBadge ||
      payload.amountPaid ||
      payload.isPaid ||
      payload.paid ||
      payload.amount > 0 ||
      (payload.subscription &&
        payload.subscription.plan &&
        payload.subscription.plan !== "free"),
    ),
    // preserve extra data
    actionType: payload.actionType || "",
    contact,
    socials: Array.isArray(payload.links) ? payload.links : emptySocials,
    seo: {
      ...emptySeo,
      ...(payload.seo || {}),
    },
    // expose raw arrays for UI if needed
    contacts: payload.contacts || [],
    links: payload.links || [],
    personal,
    subscription,
  };

  // Explicit URL handling.
  profile.profileUrl =
    payload.profileUrl || payload.link || payload.url || payload.shareUrl || "";

  // Use all contacts (including primary) for the contact list
  const nonPrimaryContacts = payload.contacts || [];

  // Convert contacts array to `contactMethods` format expected by UI.
  profile.contactMethods = nonPrimaryContacts.map((c) => {
    let defaultHref = "";
    if (c.type === "phone" || c.label?.toLowerCase() === "phone") {
      defaultHref = `tel:${String(c.value).replace(/\\s+/g, "")}`;
    } else if (c.type === "whatsapp" || c.label?.toLowerCase() === "whatsapp") {
      defaultHref = `https://wa.me/${String(c.value).replace(/[^0-9]/g, "")}`;
    } else if (c.type === "email") {
      defaultHref = `mailto:${c.value}`;
    }

    return {
      type: c.type,
      label: c.label,
      value: c.value,
      href: c.href || defaultHref,
      copyable: true,
      primary: c.primary,
    };
  });

  return profile;
}
