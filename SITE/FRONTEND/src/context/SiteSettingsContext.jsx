import React, { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../api/client.js";

const SiteSettingsContext = createContext({
  settings: {},
  refreshSettings: () => {},
  loading: true,
});

export const useSiteSettings = () => useContext(SiteSettingsContext);

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data } = await apiClient.get("/settings");
      setSettings(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SiteSettingsContext.Provider
      value={{ settings, refreshSettings: fetchSettings, loading }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
}
