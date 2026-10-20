/**
 * Utility formatters for date, time, and contact values.
 */

export function formatEventDateTime(dateInput, locale = "en-US") {
  if (!dateInput) return { date: "", time: "" };
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return { date: "", time: "" };

  const date = d.toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const time = d.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return { date, time, full: `${date} ${time}` };
}

export function sanitizePhoneForLink(phone = "", type = "tel") {
  const clean = String(phone).trim();
  if (type === "whatsapp") {
    return clean.replace(/[^0-9]/g, "");
  }
  return clean.replace(/[^0-9+]/g, "");
}

export default { formatEventDateTime, sanitizePhoneForLink };
