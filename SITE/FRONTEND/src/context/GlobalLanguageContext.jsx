import { createContext, useContext, useEffect, useState } from "react";
import {
  defaultLanguage,
  getTranslation,
  normalizeLanguage,
  translations,
} from "../i18n/index.js";

const readCookie = (name) => {
  if (typeof document === "undefined") return "";
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [key, ...rest] = cookie.split("=");
    if (key?.trim() === name) {
      const value = rest.join("=");
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
  }
  return "";
};

const writeCookie = (name, value, options = {}) => {
  if (typeof document === "undefined") return;
  const expires = options.expires;
  const secure = options.secure ? "; Secure" : "";
  const sameSite = options.sameSite ? `; SameSite=${options.sameSite}` : "";
  const path = options.path ? `; path=${options.path}` : "; path=/";
  const maxAge =
    typeof options.maxAge === "number" ? `; max-age=${options.maxAge}` : "";
  const expiresPart =
    typeof expires === "number"
      ? `; expires=${new Date(Date.now() + expires * 86400000).toUTCString()}`
      : "";

  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}${path}${maxAge}${expiresPart}${sameSite}${secure}`;
};

const GlobalLanguageContext = createContext(undefined);

const getDeviceLanguage = () => {
  const languages = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  const hasArabic = languages.some((lang) =>
    lang?.toLowerCase().startsWith("ar"),
  );
  return hasArabic ? "ar" : "en";
};

const cookieOptions = {
  expires: 365,
  sameSite: "Lax",
  secure: window.location.protocol === "https:",
  path: "/",
  maxAge: 365 * 24 * 60 * 60,
};

const resolveInitialLanguage = () => {
  try {
    const cookieValue = readCookie("global_lang");
    if (cookieValue) {
      return normalizeLanguage(cookieValue);
    }

    const saved = localStorage.getItem("global_lang");
    if (saved) {
      writeCookie("global_lang", saved, cookieOptions);
      return normalizeLanguage(saved);
    }

    const detected = getDeviceLanguage();
    writeCookie("global_lang", detected, cookieOptions);
    return detected;
  } catch {
    return getDeviceLanguage();
  }
};

export const GlobalLanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => resolveInitialLanguage());

  const activeLanguage = normalizeLanguage(language);

  const setLanguage = (lang) => {
    const nextLanguage = normalizeLanguage(lang);
    setLanguageState(nextLanguage);
    writeCookie("global_lang", nextLanguage, cookieOptions);
    localStorage.setItem("global_lang", nextLanguage);
  };

  useEffect(() => {
    const root = document.documentElement;
    const direction = activeLanguage === "ar" ? "rtl" : "ltr";

    root.setAttribute("dir", direction);
    root.setAttribute("lang", activeLanguage);
  }, [activeLanguage]);

  return (
    <GlobalLanguageContext.Provider
      value={{
        language: activeLanguage,
        setLanguage,
        t: getTranslation(activeLanguage),
        tObj: translations[activeLanguage] || translations[defaultLanguage],
      }}
    >
      {children}
    </GlobalLanguageContext.Provider>
  );
};

export const useGlobalLanguage = () => {
  const context = useContext(GlobalLanguageContext);
  if (!context) {
    throw new Error(
      "useGlobalLanguage must be used within a GlobalLanguageProvider",
    );
  }
  return context;
};
