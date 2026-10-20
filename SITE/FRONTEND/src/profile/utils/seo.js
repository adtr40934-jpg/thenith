/**
 * src/profile/utils/seo.js
 * Profile SEO adapter - delegates to the central SEO utility.
 */

import {
  applyProfileSeo as centralApplyProfileSeo,
  getProfileSeoData,
  applyPageSeo,
  getNotFoundSeoData,
} from "../../utils/seo.js";

export function applyProfileSeo(profile, options = {}) {
  centralApplyProfileSeo(profile, options);
}

export { getProfileSeoData, applyPageSeo, getNotFoundSeoData };
export default { applyProfileSeo, getProfileSeoData, applyPageSeo, getNotFoundSeoData };
