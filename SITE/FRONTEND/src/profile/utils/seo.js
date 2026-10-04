const setMeta = (selector, attribute, value) => {
  if (!value) return;

  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    const nameMatch = selector.match(/\[name="(.+)"\]/);
    const propertyMatch = selector.match(/\[property="(.+)"\]/);
    if (nameMatch) element.setAttribute("name", nameMatch[1]);
    if (propertyMatch) element.setAttribute("property", propertyMatch[1]);
    document.head.appendChild(element);
  }

  element.setAttribute(attribute, value);
};

export function applyProfileSeo(profile) {
  if (!profile) return;

  const title =
    profile.seo?.title || `${profile.name}${profile.role ? ` - ${profile.role}` : ""}`;
  const description = profile.seo?.description || profile.bio;
  const image = profile.seo?.image || profile.avatar;
  const url = profile.profileUrl || window.location.href;
  const keywords = Array.isArray(profile.seo?.keywords)
    ? profile.seo.keywords.join(", ")
    : profile.seo?.keywords;

  document.title = title;
  setMeta('meta[name="description"]', "content", description);
  setMeta('meta[name="keywords"]', "content", keywords);
  setMeta('meta[name="robots"]', "content", "index, follow");
  setMeta('meta[property="og:title"]', "content", title);
  setMeta('meta[property="og:description"]', "content", description);
  setMeta('meta[property="og:type"]', "content", "profile");
  setMeta('meta[property="og:url"]', "content", url);
  setMeta('meta[property="og:image"]', "content", image);
  setMeta('meta[name="twitter:card"]', "content", "summary_large_image");
  setMeta('meta[name="twitter:title"]', "content", title);
  setMeta('meta[name="twitter:description"]', "content", description);
  setMeta('meta[name="twitter:image"]', "content", image);
}
