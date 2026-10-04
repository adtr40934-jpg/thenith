import { useState, useEffect } from "react";
import { Menu, X, Languages, LogOut, Moon, Sun } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export default function DashboardNav({
  t,
  language,
  toggleLanguage,
  theme,
  toggleTheme,
  navItems,
  activeTab,
  onChangeTab,
  onLogout,
}) {
  const isRtl = language === "ar";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Split items: home, cards, messages go in the main bottom bar
  const mainItemIds = ["home", "cards", "messages"];
  const mainItems = navItems.filter((item) => mainItemIds.includes(item.id));
  const moreItems = navItems.filter((item) => !mainItemIds.includes(item.id));

  // Check if current active tab is inside the "more" items
  const isMoreActive = moreItems.some((item) => item.id === activeTab);

  const handleTabChange = (id) => {
    onChangeTab(id);
    setIsMobileMenuOpen(false);
  };

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* ── Desktop Sidebar ──────────────────────────────────────────────── */}
      <aside className="hidden lg:col-span-3 lg:block">
        <nav className="sticky top-24 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-900 dark:bg-slate-950/45">
          <div className="px-4 pb-3 pt-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
            {t("navigation")}
          </div>
          <div className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onChangeTab(item.id)}
                  className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
                    active
                      ? "bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950"
                      : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  {!!item.badge && (
                    <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* ── Mobile Bottom Bar (Main items + More) ───────────────────────── */}
      <nav
        dir={isRtl ? "rtl" : "ltr"}
        className="fixed bottom-3 start-3 end-3 z-40 flex rounded-[26px] border border-slate-200 bg-white/95 px-2 py-2 shadow-2xl shadow-slate-950/15 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95 lg:hidden"
      >
        <div className="flex w-full items-center justify-around gap-1">
          {mainItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className="relative flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1"
              >
                <span
                  className={`flex h-9 w-12 items-center justify-center rounded-2xl transition-colors ${
                    active
                      ? "bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950"
                      : "text-slate-400"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span
                  className={`max-w-full truncate text-[10px] font-black ${
                    active ? "text-slate-900 dark:text-white" : "text-slate-400"
                  }`}
                >
                  {item.label}
                </span>
                {!!item.badge && (
                  <span className="absolute end-1 top-0 rounded-full bg-indigo-600 px-1.5 text-[9px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Settings / More button */}
          {(() => {
            const moreBadgeCount = moreItems.reduce((acc, item) => {
              if (typeof item.badge === 'number') return acc + item.badge;
              if (item.badge) return acc + 1;
              return acc;
            }, 0);

            return (
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="relative flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1"
              >
                <span
                  className={`flex h-9 w-12 items-center justify-center rounded-2xl transition-colors relative ${
                    isMoreActive
                      ? "bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950"
                      : "text-slate-400"
                  }`}
                >
                  <Menu className="h-5 w-5" />
                  {moreBadgeCount > 0 && (
                    <span className="absolute -end-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-950">
                      {moreBadgeCount}
                    </span>
                  )}
                </span>
                <span
                  className={`max-w-full truncate text-[10px] font-black ${
                    isMoreActive
                      ? "text-slate-900 dark:text-white"
                      : "text-slate-400"
                  }`}
                >
                  {t("more") || (isRtl ? "المزيد" : "More")}
                </span>
              </button>
            );
          })()}
        </div>
      </nav>

      {/* ── Mobile Sidebar Drawer ───────────────────────────────────────── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 lg:hidden"
            dir={isRtl ? "rtl" : "ltr"}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm dark:bg-slate-950/60"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: isRtl ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: isRtl ? "100%" : "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.35 }}
              className={`absolute top-0 bottom-0 ${
                isRtl ? "right-0" : "left-0"
              } w-4/5 max-w-xs bg-white dark:bg-slate-950 shadow-2xl flex flex-col`}
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-black text-slate-800 dark:text-white">
                  {t("navigation")}
                </h3>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1.5">
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={`flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-sm font-bold transition-colors ${
                        active
                          ? "bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950"
                          : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </span>
                      {!!item.badge && (
                        <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] text-white">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
