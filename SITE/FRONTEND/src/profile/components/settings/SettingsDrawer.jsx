import { AnimatePresence, motion } from "motion/react";
import { Globe, Moon, Settings, Sun, X } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext.jsx";
import { usePortfolio } from "../../lib/PortfolioContext.jsx";
import SettingsOptionGroup from "./SettingsOptionGroup.jsx";
import SettingsSegmentButton from "./SettingsSegmentButton.jsx";
import SettingsTriggerButton from "./SettingsTriggerButton.jsx";

export default function SettingsDrawer({ isOpen, setIsOpen }) {
  const { language, theme, t, setLanguage, setTheme } = useLanguage();
  const { profile } = usePortfolio();

  const isDefaultTheme = !profile?.theme || profile.theme === "default" || profile.theme === "01";

  return (
    <>
      <SettingsTriggerButton onOpen={() => setIsOpen(true)} />

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              id="settings-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-xs z-50 cursor-pointer"
            />

            <motion.div
              id="settings-drawer"
              initial={{ x: language === "ar" ? "-100%" : "100%" }}
              animate={{ x: 0 }}
              exit={{ x: language === "ar" ? "-100%" : "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed top-0 bottom-0 end-0 rtl:right-auto rtl:left-0 w-full max-w-sm bg-white dark:bg-slate-900 shadow-2xl border-s rtl:border-l-0 rtl:border-r border-slate-100 dark:border-slate-800 z-50 flex flex-col h-full overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                    <Settings className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {t.settingsTitle}
                  </h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
                <SettingsOptionGroup
                  icon={<Globe className="w-4.5 h-4.5 text-slate-400" />}
                  label={t.settingsLanguage}
                >
                  <SettingsSegmentButton
                    active={language === "en"}
                    label="English"
                    onClick={() => setLanguage("en")}
                  />
                  <SettingsSegmentButton
                    active={language === "ar"}
                    label="Arabic"
                    onClick={() => setLanguage("ar")}
                  />
                </SettingsOptionGroup>

                {isDefaultTheme && (
                  <SettingsOptionGroup
                    icon={
                      theme === "dark" ? (
                        <Moon className="w-4.5 h-4.5 text-slate-400" />
                      ) : (
                        <Sun className="w-4.5 h-4.5 text-slate-400" />
                      )
                    }
                    label={t.settingsTheme}
                  >
                    <SettingsSegmentButton
                      active={theme === "light"}
                      icon={Sun}
                      label={t.settingsLightMode}
                      onClick={() => setTheme("light")}
                    />
                    <SettingsSegmentButton
                      active={theme === "dark"}
                      icon={Moon}
                      label={t.settingsDarkMode}
                      onClick={() => setTheme("dark")}
                    />
                  </SettingsOptionGroup>
                )}
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
                <div className="text-center text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  &copy; Thenith Agency. All rights reserved.{" "}
                  {new Date().getFullYear()}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
