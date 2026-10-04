import en from "./en.js";
import ar from "./ar.js";

export const translations = {
  en,
  ar,
};

export const defaultLanguage = "ar";

export const normalizeLanguage = (lang) => {
  if (lang === "ar" || lang === "en") return lang;
  return defaultLanguage;
};

export function getTranslation(language = defaultLanguage) {
  const dictionary =
    translations[normalizeLanguage(language)] || translations[defaultLanguage];

  return (key = "") => {
    if (!key) return "";
    const value = key.split(".").reduce((acc, part) => acc?.[part], dictionary);
    return value ?? key;
  };
}
