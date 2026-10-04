import { useGlobalLanguage } from "../../context/GlobalLanguageContext.jsx";
import { useMemo } from "react";

export function LanguageProvider({ children }) {
  return <>{children}</>;
}

export function useLanguage() {
  const { language, setLanguage, tObj } = useGlobalLanguage();

  const t = useMemo(() => {
    const dict = tObj.panel || {};
    return (key) => key.split('.').reduce((value, part) => value?.[part], dict) || key;
  }, [tObj.panel]);

  const toggleLanguage = () => setLanguage(language === "ar" ? "en" : "ar");

  return {
    language,
    setLanguage,
    toggleLanguage,
    t,
    direction: language === "ar" ? "rtl" : "ltr",
  };
}
