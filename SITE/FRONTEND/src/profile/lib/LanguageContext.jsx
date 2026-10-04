import { createContext, useContext, useEffect, useState } from "react";
import { useGlobalLanguage } from "../../context/GlobalLanguageContext.jsx";

const LanguageContext = createContext(undefined);

export const LanguageProvider = ({ children }) => {
  const { language, setLanguage, tObj } = useGlobalLanguage();

  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem("portfolio_theme");
    return saved === "dark" || saved === "light" ? saved : "light";
  });

  const setTheme = (nextTheme) => {
    setThemeState(nextTheme);
    localStorage.setItem("portfolio_theme", nextTheme);
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        theme,
        t: tObj?.profile || tObj?.panel || {},
        setLanguage,
        setTheme,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
