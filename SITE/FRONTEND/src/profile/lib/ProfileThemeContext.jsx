import { createContext, useContext, useEffect, useState } from "react";
import { usePortfolio } from "./PortfolioContext.jsx";

const ProfileThemeContext = createContext(null);

// ─── Theme Definitions ────────────────────────────────────────────────────────
// Each theme injects CSS variables onto :root inside `.profile-themed`.
// "default" = the original design, no overrides → uses existing Tailwind classes.
export const PROFILE_THEMES = {
  default: {
    id: "default",
    nameEn: "Default", nameAr: "الافتراضي",
    preview: null,
    vars: {},
  },

  glass_dark: {
    id: "glass_dark",
    nameEn: "Appearance 3", nameAr: "المظهر 3",
    preview: "glass-dark",
    vars: {
      // Page background
      "--pt-page-bg": "linear-gradient(135deg,#0a0f1e 0%,#0f172a 40%,#0d1225 100%)",
      // Card surfaces
      "--pt-card-bg": "rgba(255,255,255,0.04)",
      "--pt-card-border": "rgba(255,255,255,0.10)",
      "--pt-card-shadow": "0 24px 64px rgba(0,0,0,0.60)",
      "--pt-card-blur": "20px",
      "--pt-card-radius": "28px",
      // Primary action button (Call)
      "--pt-btn-primary-bg": "rgba(99,102,241,0.85)",
      "--pt-btn-primary-border": "rgba(139,92,246,0.40)",
      "--pt-btn-primary-text": "#ffffff",
      "--pt-btn-primary-hover-bg": "rgba(79,70,229,0.90)",
      // Secondary button (WhatsApp)
      "--pt-btn-secondary-bg": "rgba(16,185,129,0.12)",
      "--pt-btn-secondary-border": "rgba(16,185,129,0.30)",
      "--pt-btn-secondary-text": "#34d399",
      "--pt-btn-secondary-hover-bg": "rgba(16,185,129,0.22)",
      // Save contact button
      "--pt-btn-save-bg": "rgba(255,255,255,0.07)",
      "--pt-btn-save-border": "rgba(255,255,255,0.12)",
      "--pt-btn-save-text": "rgba(255,255,255,0.80)",
      "--pt-btn-save-hover-bg": "rgba(255,255,255,0.12)",
      // Tab active indicator
      "--pt-tab-active-bg": "rgba(255,255,255,0.10)",
      "--pt-tab-active-text": "#ffffff",
      "--pt-tab-inactive-text": "rgba(255,255,255,0.45)",
      // Nav bar (mobile)
      "--pt-nav-bg": "rgba(10,15,30,0.85)",
      "--pt-nav-border": "rgba(255,255,255,0.08)",
      // Text colours
      "--pt-text-primary": "#f1f5f9",
      "--pt-text-secondary": "rgba(241,245,249,0.55)",
      "--pt-divider": "rgba(255,255,255,0.08)",
    },
  },

  glass_light: {
    id: "glass_light",
    nameEn: "Appearance 4", nameAr: "المظهر 4",
    preview: "glass-light",
    vars: {
      "--pt-page-bg": "linear-gradient(135deg,#dde8f8 0%,#eaf0fb 50%,#f0f4ff 100%)",
      "--pt-card-bg": "rgba(255,255,255,0.60)",
      "--pt-card-border": "rgba(255,255,255,0.90)",
      "--pt-card-shadow": "0 16px 48px rgba(100,116,139,0.14)",
      "--pt-card-blur": "20px",
      "--pt-card-radius": "28px",
      "--pt-btn-primary-bg": "rgba(99,102,241,0.90)",
      "--pt-btn-primary-border": "rgba(99,102,241,0.20)",
      "--pt-btn-primary-text": "#ffffff",
      "--pt-btn-primary-hover-bg": "rgba(79,70,229,1)",
      "--pt-btn-secondary-bg": "rgba(16,185,129,0.10)",
      "--pt-btn-secondary-border": "rgba(16,185,129,0.30)",
      "--pt-btn-secondary-text": "#059669",
      "--pt-btn-secondary-hover-bg": "rgba(16,185,129,0.20)",
      "--pt-btn-save-bg": "rgba(255,255,255,0.70)",
      "--pt-btn-save-border": "rgba(100,116,139,0.20)",
      "--pt-btn-save-text": "#475569",
      "--pt-btn-save-hover-bg": "rgba(241,245,249,0.90)",
      "--pt-tab-active-bg": "rgba(255,255,255,0.80)",
      "--pt-tab-active-text": "#1e293b",
      "--pt-tab-inactive-text": "#64748b",
      "--pt-nav-bg": "rgba(255,255,255,0.75)",
      "--pt-nav-border": "rgba(100,116,139,0.15)",
      "--pt-text-primary": "#1e293b",
      "--pt-text-secondary": "#64748b",
      "--pt-divider": "rgba(100,116,139,0.12)",
    },
  },

  stormy_morning: {
    "id": "stormy_morning",
    "nameEn": "Stormy Morning",
    "nameAr": "صباح عاصف",
    "preview": "stormy_morning",
    "vars": {
      "--pt-page-bg": "#ECEFF1",
      "--pt-card-bg": "#FFFFFF",
      "--pt-card-border": "#CFD8DC",
      "--pt-card-shadow": "0 10px 40px rgba(96,125,139,0.1)",
      "--pt-card-blur": "0px",
      "--pt-card-radius": "24px",
      "--pt-btn-primary-bg": "#3F51B5",
      "--pt-btn-primary-border": "transparent",
      "--pt-btn-primary-text": "#FFFFFF",
      "--pt-btn-primary-hover-bg": "#303F9F",
      "--pt-btn-secondary-bg": "#E8EAF6",
      "--pt-btn-secondary-border": "transparent",
      "--pt-btn-secondary-text": "#3F51B5",
      "--pt-btn-secondary-hover-bg": "#C5CAE9",
      "--pt-btn-save-bg": "#FFFFFF",
      "--pt-btn-save-border": "#CFD8DC",
      "--pt-btn-save-text": "#455A64",
      "--pt-btn-save-hover-bg": "#ECEFF1",
      "--pt-tab-active-bg": "#3F51B5",
      "--pt-tab-active-text": "#FFFFFF",
      "--pt-tab-inactive-text": "#90A4AE",
      "--pt-nav-bg": "#FFFFFF",
      "--pt-nav-border": "#CFD8DC",
      "--pt-text-primary": "#263238",
      "--pt-text-secondary": "#546E7A",
      "--pt-divider": "#ECEFF1"
    }
  },
  material_emerald: {
    "id": "material_emerald",
    "nameEn": "Emerald Forest",
    "nameAr": "غابة الزمرد",
    "preview": "material_emerald",
    "vars": {
      "--pt-page-bg": "#E8F5E9",
      "--pt-card-bg": "#FFFFFF",
      "--pt-card-border": "#C8E6C9",
      "--pt-card-shadow": "0 10px 40px rgba(76,175,80,0.1)",
      "--pt-card-blur": "0px",
      "--pt-card-radius": "24px",
      "--pt-btn-primary-bg": "#2E7D32",
      "--pt-btn-primary-border": "transparent",
      "--pt-btn-primary-text": "#FFFFFF",
      "--pt-btn-primary-hover-bg": "#1B5E20",
      "--pt-btn-secondary-bg": "#E8F5E9",
      "--pt-btn-secondary-border": "transparent",
      "--pt-btn-secondary-text": "#2E7D32",
      "--pt-btn-secondary-hover-bg": "#C8E6C9",
      "--pt-btn-save-bg": "#FFFFFF",
      "--pt-btn-save-border": "#C8E6C9",
      "--pt-btn-save-text": "#388E3C",
      "--pt-btn-save-hover-bg": "#F1F8E9",
      "--pt-tab-active-bg": "#2E7D32",
      "--pt-tab-active-text": "#FFFFFF",
      "--pt-tab-inactive-text": "#81C784",
      "--pt-nav-bg": "#FFFFFF",
      "--pt-nav-border": "#C8E6C9",
      "--pt-text-primary": "#1B5E20",
      "--pt-text-secondary": "#4CAF50",
      "--pt-divider": "#E8F5E9"
    }
  },
  royal_purple: {
    "id": "royal_purple",
    "nameEn": "Royal Amethyst",
    "nameAr": "الجمشت الملكي",
    "preview": "royal_purple",
    "vars": {
      "--pt-page-bg": "#F3E5F5",
      "--pt-card-bg": "#FFFFFF",
      "--pt-card-border": "#E1BEE7",
      "--pt-card-shadow": "0 10px 40px rgba(156,39,176,0.1)",
      "--pt-card-blur": "0px",
      "--pt-card-radius": "24px",
      "--pt-btn-primary-bg": "#6A1B9A",
      "--pt-btn-primary-border": "transparent",
      "--pt-btn-primary-text": "#FFFFFF",
      "--pt-btn-primary-hover-bg": "#4A148C",
      "--pt-btn-secondary-bg": "#F3E5F5",
      "--pt-btn-secondary-border": "transparent",
      "--pt-btn-secondary-text": "#6A1B9A",
      "--pt-btn-secondary-hover-bg": "#E1BEE7",
      "--pt-btn-save-bg": "#FFFFFF",
      "--pt-btn-save-border": "#E1BEE7",
      "--pt-btn-save-text": "#7B1FA2",
      "--pt-btn-save-hover-bg": "#F3E5F5",
      "--pt-tab-active-bg": "#6A1B9A",
      "--pt-tab-active-text": "#FFFFFF",
      "--pt-tab-inactive-text": "#BA68C8",
      "--pt-nav-bg": "#FFFFFF",
      "--pt-nav-border": "#E1BEE7",
      "--pt-text-primary": "#4A148C",
      "--pt-text-secondary": "#9C27B0",
      "--pt-divider": "#F3E5F5"
    }
  },
  crimson_red: {
    "id": "crimson_red",
    "nameEn": "Crimson Night",
    "nameAr": "ليلة قرمزية",
    "preview": "crimson_red",
    "vars": {
      "--pt-page-bg": "#FFEBEE",
      "--pt-card-bg": "#FFFFFF",
      "--pt-card-border": "#FFCDD2",
      "--pt-card-shadow": "0 10px 40px rgba(244,67,54,0.1)",
      "--pt-card-blur": "0px",
      "--pt-card-radius": "24px",
      "--pt-btn-primary-bg": "#C62828",
      "--pt-btn-primary-border": "transparent",
      "--pt-btn-primary-text": "#FFFFFF",
      "--pt-btn-primary-hover-bg": "#B71C1C",
      "--pt-btn-secondary-bg": "#FFEBEE",
      "--pt-btn-secondary-border": "transparent",
      "--pt-btn-secondary-text": "#C62828",
      "--pt-btn-secondary-hover-bg": "#FFCDD2",
      "--pt-btn-save-bg": "#FFFFFF",
      "--pt-btn-save-border": "#FFCDD2",
      "--pt-btn-save-text": "#D32F2F",
      "--pt-btn-save-hover-bg": "#FFEBEE",
      "--pt-tab-active-bg": "#C62828",
      "--pt-tab-active-text": "#FFFFFF",
      "--pt-tab-inactive-text": "#E57373",
      "--pt-nav-bg": "#FFFFFF",
      "--pt-nav-border": "#FFCDD2",
      "--pt-text-primary": "#B71C1C",
      "--pt-text-secondary": "#F44336",
      "--pt-divider": "#FFEBEE"
    }
  },
  sunset_orange: {
    "id": "sunset_orange",
    "nameEn": "Sunset Glow",
    "nameAr": "وهج الغروب",
    "preview": "sunset_orange",
    "vars": {
      "--pt-page-bg": "#FFF3E0",
      "--pt-card-bg": "#FFFFFF",
      "--pt-card-border": "#FFE0B2",
      "--pt-card-shadow": "0 10px 40px rgba(255,152,0,0.1)",
      "--pt-card-blur": "0px",
      "--pt-card-radius": "24px",
      "--pt-btn-primary-bg": "#EF6C00",
      "--pt-btn-primary-border": "transparent",
      "--pt-btn-primary-text": "#FFFFFF",
      "--pt-btn-primary-hover-bg": "#E65100",
      "--pt-btn-secondary-bg": "#FFF3E0",
      "--pt-btn-secondary-border": "transparent",
      "--pt-btn-secondary-text": "#EF6C00",
      "--pt-btn-secondary-hover-bg": "#FFE0B2",
      "--pt-btn-save-bg": "#FFFFFF",
      "--pt-btn-save-border": "#FFE0B2",
      "--pt-btn-save-text": "#F57C00",
      "--pt-btn-save-hover-bg": "#FFF3E0",
      "--pt-tab-active-bg": "#EF6C00",
      "--pt-tab-active-text": "#FFFFFF",
      "--pt-tab-inactive-text": "#FFB74D",
      "--pt-nav-bg": "#FFFFFF",
      "--pt-nav-border": "#FFE0B2",
      "--pt-text-primary": "#E65100",
      "--pt-text-secondary": "#FF9800",
      "--pt-divider": "#FFF3E0"
    }
  },
  ocean_blue: {
    "id": "ocean_blue",
    "nameEn": "Ocean Blue",
    "nameAr": "أزرق المحيط",
    "preview": "ocean_blue",
    "vars": {
      "--pt-page-bg": "#E1F5FE",
      "--pt-card-bg": "#FFFFFF",
      "--pt-card-border": "#B3E5FC",
      "--pt-card-shadow": "0 10px 40px rgba(3,169,244,0.1)",
      "--pt-card-blur": "0px",
      "--pt-card-radius": "24px",
      "--pt-btn-primary-bg": "#0288D1",
      "--pt-btn-primary-border": "transparent",
      "--pt-btn-primary-text": "#FFFFFF",
      "--pt-btn-primary-hover-bg": "#01579B",
      "--pt-btn-secondary-bg": "#E1F5FE",
      "--pt-btn-secondary-border": "transparent",
      "--pt-btn-secondary-text": "#0288D1",
      "--pt-btn-secondary-hover-bg": "#B3E5FC",
      "--pt-btn-save-bg": "#FFFFFF",
      "--pt-btn-save-border": "#B3E5FC",
      "--pt-btn-save-text": "#0288D1",
      "--pt-btn-save-hover-bg": "#E1F5FE",
      "--pt-tab-active-bg": "#0288D1",
      "--pt-tab-active-text": "#FFFFFF",
      "--pt-tab-inactive-text": "#4FC3F7",
      "--pt-nav-bg": "#FFFFFF",
      "--pt-nav-border": "#B3E5FC",
      "--pt-text-primary": "#01579B",
      "--pt-text-secondary": "#03A9F4",
      "--pt-divider": "#E1F5FE"
    }
  },
  teal_breeze: {
    "id": "teal_breeze",
    "nameEn": "Teal Breeze",
    "nameAr": "نسيم الصنوبر",
    "preview": "teal_breeze",
    "vars": {
      "--pt-page-bg": "#E0F2F1",
      "--pt-card-bg": "#FFFFFF",
      "--pt-card-border": "#B2DFDB",
      "--pt-card-shadow": "0 10px 40px rgba(0,150,136,0.1)",
      "--pt-card-blur": "0px",
      "--pt-card-radius": "24px",
      "--pt-btn-primary-bg": "#00796B",
      "--pt-btn-primary-border": "transparent",
      "--pt-btn-primary-text": "#FFFFFF",
      "--pt-btn-primary-hover-bg": "#004D40",
      "--pt-btn-secondary-bg": "#E0F2F1",
      "--pt-btn-secondary-border": "transparent",
      "--pt-btn-secondary-text": "#00796B",
      "--pt-btn-secondary-hover-bg": "#B2DFDB",
      "--pt-btn-save-bg": "#FFFFFF",
      "--pt-btn-save-border": "#B2DFDB",
      "--pt-btn-save-text": "#00897B",
      "--pt-btn-save-hover-bg": "#E0F2F1",
      "--pt-tab-active-bg": "#00796B",
      "--pt-tab-active-text": "#FFFFFF",
      "--pt-tab-inactive-text": "#4DB6AC",
      "--pt-nav-bg": "#FFFFFF",
      "--pt-nav-border": "#B2DFDB",
      "--pt-text-primary": "#004D40",
      "--pt-text-secondary": "#009688",
      "--pt-divider": "#E0F2F1"
    }
  },
  rose_gold: {
    "id": "rose_gold",
    "nameEn": "Cherry Blossom",
    "nameAr": "زهر الكرز",
    "preview": "rose_gold",
    "vars": {
      "--pt-page-bg": "#FCE4EC",
      "--pt-card-bg": "#FFFFFF",
      "--pt-card-border": "#F8BBD0",
      "--pt-card-shadow": "0 10px 40px rgba(233,30,99,0.1)",
      "--pt-card-blur": "0px",
      "--pt-card-radius": "24px",
      "--pt-btn-primary-bg": "#C2185B",
      "--pt-btn-primary-border": "transparent",
      "--pt-btn-primary-text": "#FFFFFF",
      "--pt-btn-primary-hover-bg": "#880E4F",
      "--pt-btn-secondary-bg": "#FCE4EC",
      "--pt-btn-secondary-border": "transparent",
      "--pt-btn-secondary-text": "#C2185B",
      "--pt-btn-secondary-hover-bg": "#F8BBD0",
      "--pt-btn-save-bg": "#FFFFFF",
      "--pt-btn-save-border": "#F8BBD0",
      "--pt-btn-save-text": "#D81B60",
      "--pt-btn-save-hover-bg": "#FCE4EC",
      "--pt-tab-active-bg": "#C2185B",
      "--pt-tab-active-text": "#FFFFFF",
      "--pt-tab-inactive-text": "#F06292",
      "--pt-nav-bg": "#FFFFFF",
      "--pt-nav-border": "#F8BBD0",
      "--pt-text-primary": "#880E4F",
      "--pt-text-secondary": "#E91E63",
      "--pt-divider": "#FCE4EC"
    }
  },
  midnight_amber: {
    "id": "midnight_amber",
    "nameEn": "Midnight Gold",
    "nameAr": "ذهب منتصف الليل",
    "preview": "midnight_amber",
    "vars": {
      "--pt-page-bg": "#1a1a1a",
      "--pt-card-bg": "#2a2a2a",
      "--pt-card-border": "#3a3a3a",
      "--pt-card-shadow": "0 10px 40px rgba(0,0,0,0.6)",
      "--pt-card-blur": "0px",
      "--pt-card-radius": "24px",
      "--pt-btn-primary-bg": "#F59E0B",
      "--pt-btn-primary-border": "transparent",
      "--pt-btn-primary-text": "#1a1a1a",
      "--pt-btn-primary-hover-bg": "#D97706",
      "--pt-btn-secondary-bg": "rgba(245,158,11,0.12)",
      "--pt-btn-secondary-border": "rgba(245,158,11,0.30)",
      "--pt-btn-secondary-text": "#FCD34D",
      "--pt-btn-secondary-hover-bg": "rgba(245,158,11,0.22)",
      "--pt-btn-save-bg": "rgba(255,255,255,0.06)",
      "--pt-btn-save-border": "rgba(255,255,255,0.12)",
      "--pt-btn-save-text": "#E5E7EB",
      "--pt-btn-save-hover-bg": "rgba(255,255,255,0.12)",
      "--pt-tab-active-bg": "#F59E0B",
      "--pt-tab-active-text": "#1a1a1a",
      "--pt-tab-inactive-text": "#9CA3AF",
      "--pt-nav-bg": "#2a2a2a",
      "--pt-nav-border": "#3a3a3a",
      "--pt-text-primary": "#F9FAFB",
      "--pt-text-secondary": "#D1D5DB",
      "--pt-divider": "#3a3a3a"
    }
  },
  slate_dark: {
    "id": "slate_dark",
    "nameEn": "Slate Minimal",
    "nameAr": "داكن معدني",
    "preview": "slate_dark",
    "vars": {
      "--pt-page-bg": "#0f172a",
      "--pt-card-bg": "#1e293b",
      "--pt-card-border": "#334155",
      "--pt-card-shadow": "0 10px 40px rgba(0,0,0,0.5)",
      "--pt-card-blur": "0px",
      "--pt-card-radius": "24px",
      "--pt-btn-primary-bg": "#22D3EE",
      "--pt-btn-primary-border": "transparent",
      "--pt-btn-primary-text": "#0f172a",
      "--pt-btn-primary-hover-bg": "#06B6D4",
      "--pt-btn-secondary-bg": "rgba(34,211,238,0.10)",
      "--pt-btn-secondary-border": "rgba(34,211,238,0.25)",
      "--pt-btn-secondary-text": "#67E8F9",
      "--pt-btn-secondary-hover-bg": "rgba(34,211,238,0.20)",
      "--pt-btn-save-bg": "rgba(255,255,255,0.05)",
      "--pt-btn-save-border": "rgba(255,255,255,0.10)",
      "--pt-btn-save-text": "#E2E8F0",
      "--pt-btn-save-hover-bg": "rgba(255,255,255,0.10)",
      "--pt-tab-active-bg": "#22D3EE",
      "--pt-tab-active-text": "#0f172a",
      "--pt-tab-inactive-text": "#94A3B8",
      "--pt-nav-bg": "#1e293b",
      "--pt-nav-border": "#334155",
      "--pt-text-primary": "#F1F5F9",
      "--pt-text-secondary": "#CBD5E1",
      "--pt-divider": "#334155"
    }
  }
};
// ─── Apply / remove CSS vars on the profile root element ─────────────────────
function applyTheme(themeId) {
  const el = document.getElementById("profile-themed-root");
  if (!el) return;

  const theme = PROFILE_THEMES[themeId] || PROFILE_THEMES.default;

  // Remove all previous theme vars
  Object.keys(PROFILE_THEMES).forEach((key) => {
    if (key === "default") return;
    const t = PROFILE_THEMES[key];
    Object.keys(t.vars).forEach((v) => el.style.removeProperty(v));
  });

  // Remove previous data-theme and force classes
  el.removeAttribute("data-profile-theme");
  el.classList.remove("force-dark", "force-light");

  if (themeId && themeId !== "default" && themeId !== "default_dark") {
    el.setAttribute("data-profile-theme", themeId);
    Object.entries(theme.vars).forEach(([k, v]) => el.style.setProperty(k, v));
  }

  // Force profile components to ignore global html.dark
  if (["midnight_amber", "slate_dark", "glass_dark", "default_dark"].includes(themeId)) {
    el.classList.add("force-dark");
  } else if (themeId !== "default") {
    el.classList.add("force-light");
  }
}

// ─── Provider ────────────────────────────────────────────────────────────────
export function ProfileThemeProvider({ children }) {
  const { profile } = usePortfolio();

  // Support overriding theme via URL (for live previews in the editor)
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const previewTheme = params ? params.get("preview_theme") : null;

  const initialThemeId = previewTheme || profile?.theme || "default";

  const [activeTheme, setActiveTheme] = useState(initialThemeId);

  // Sync if profile theme or URL changes
  useEffect(() => {
    setActiveTheme(initialThemeId);
  }, [initialThemeId]);

  // Listen to postMessage from dashboard for instant preview without reload
  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data?.type === "CHANGE_THEME" && e.data?.theme) {
        setActiveTheme(e.data.theme);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    applyTheme(activeTheme);
    return () => {
      // Clean up on unmount
      const el = document.getElementById("profile-themed-root");
      if (el) el.removeAttribute("data-profile-theme");
    };
  }, [activeTheme]);

  return (
    <ProfileThemeContext.Provider value={{ themeId: activeTheme }}>
      {children}
    </ProfileThemeContext.Provider>
  );
}

export function useProfileTheme() {
  return useContext(ProfileThemeContext);
}
