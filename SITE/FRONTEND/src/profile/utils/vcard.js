const escapeVcardValue = (value = "") =>
  String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,");

const splitName = (name = "") => {
  const parts = name.trim().split(/\s+/);
  const firstName = parts.shift() || "";
  const lastName = parts.join(" ");
  return { firstName, lastName };
};

export function createVcard(profile) {
  const { firstName, lastName } = splitName(profile.name);
  const company = profile.personal?.company || profile.organization || "";
  const title = profile.personal?.jobTitle || profile.role || "";
  const contactMethods = profile.contactMethods || profile.contacts || [];

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escapeVcardValue(lastName)};${escapeVcardValue(firstName)};;;`,
    `FN:${escapeVcardValue(profile.name)}`,
    company && `ORG:${escapeVcardValue(company)}`,
    title && `TITLE:${escapeVcardValue(title)}`,
    profile.bio && `NOTE:${escapeVcardValue(profile.bio)}`,
    profile.avatar && `PHOTO;VALUE=URI:${escapeVcardValue(profile.avatar)}`,
  ];

  contactMethods.forEach((c) => {
    if (!c.value) return;
    const val = escapeVcardValue(c.value);
    if (c.type === "phone") {
      const cleanPhone = String(c.value).replace(/\s+/g, "");
      lines.push(`TEL;TYPE=CELL:${escapeVcardValue(cleanPhone)}`);
    } else if (c.type === "whatsapp") {
      const cleanPhone = String(c.value).replace(/\s+/g, "");
      // Add as WORK phone to differentiate, or just CELL. WhatsApp is often saved as mobile.
      lines.push(`TEL;TYPE=WORK,CELL:${escapeVcardValue(cleanPhone)}`);
    } else if (c.type === "email") {
      lines.push(`EMAIL;TYPE=INTERNET:${val}`);
    } else if (c.type === "website" || c.type === "link") {
      lines.push(`URL:${val}`);
    } else if (c.type === "location") {
      lines.push(`ADR;TYPE=WORK:;;${val};;;;`);
    }
  });

  // Fallbacks if no contactMethods are present (for older data structures)
  if (contactMethods.length === 0 && profile.contact) {
    const contact = profile.contact;
    const cleanPhone = String(contact.phone || "").replace(/\s+/g, "");
    if (cleanPhone) lines.push(`TEL;TYPE=CELL:${escapeVcardValue(cleanPhone)}`);
    if (contact.email)
      lines.push(`EMAIL;TYPE=PREF,INTERNET:${escapeVcardValue(contact.email)}`);
    if (contact.website) lines.push(`URL:${escapeVcardValue(contact.website)}`);
    if (contact.location)
      lines.push(`ADR;TYPE=WORK:;;${escapeVcardValue(contact.location)};;;;`);
  }

  // Include social links
  const socials = profile.socials || [];
  socials.forEach((social) => {
    if (social.url) {
      lines.push(`URL:${escapeVcardValue(social.url)}`);
    }
  });

  lines.push("END:VCARD");

  return lines.filter(Boolean).join("\n");
}

export function downloadVcard(profile) {
  const blob = new Blob([createVcard(profile)], {
    type: "text/vcard;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute(
    "download",
    `${profile.name.replace(/\s+/g, "_")}_Contact.vcf`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
