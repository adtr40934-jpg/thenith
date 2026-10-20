/**
 * src/hooks/useSeo.js
 * React hook to synchronize document title, meta tags, Open Graph, and JSON-LD.
 */

import { useEffect } from "react";
import { applyPageSeo, removeJsonLd } from "../utils/seo.js";

export function useSeo(seoData) {
  useEffect(() => {
    if (!seoData) return;

    applyPageSeo(seoData);

    return () => {
      if (seoData.jsonLdId) {
        removeJsonLd(seoData.jsonLdId);
      }
    };
  }, [
    seoData?.title,
    seoData?.description,
    seoData?.canonicalUrl,
    seoData?.robots,
    seoData?.lang,
    seoData?.dir,
  ]);
}

export default useSeo;
