import React from "react";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";

export default function GlobalLogo({ className = "" }) {
  const { settings, loading } = useSiteSettings();

  if (loading) {
    return <div className={`animate-pulse bg-slate-200 rounded h-8 w-24 ${className}`}></div>;
  }

  const type = settings.site_logo_type || "text";
  const text = settings.site_logo_text || "Thenith";
  const url = settings.site_logo_url;

  if (type === "image" && url) {
    return <img src={url} alt={text} className={`object-contain max-h-12 ${className}`} />;
  }

  return (
    <span className={`font-bold text-xl tracking-tight text-slate-800 dark:text-white ${className}`}>
      {text}
    </span>
  );
}
