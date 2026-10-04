import React from "react";
import { Bell, Languages, LogOut, Moon, Sparkles, Sun } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import ThenithLogo from "../ThenithLogo.jsx";
export default function DashboardHeader({
  t,
  language,
  toggleLanguage,
  theme,
  toggleTheme,
  title,
  entitlements,
  notifications,
  showNotifications,
  onToggleNotifications,
  onCloseNotifications,
  onLogout,
  onNotificationClick
}) {
  const isPro = entitlements?.plan === "pro";
  const dropdownRef = React.useRef(null);
  const bellRef = React.useRef(null);
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && dropdownRef.current && !dropdownRef.current.contains(event.target) && bellRef.current && !bellRef.current.contains(event.target)) {
        onCloseNotifications && onCloseNotifications();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications, onCloseNotifications]);
  return /* @__PURE__ */ React.createElement("header", { className: "sticky top-0 z-40 border-b border-slate-100 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-md dark:border-slate-900 dark:bg-slate-950/90 md:px-8 lg:bg-white/85 lg:shadow-none" }, /* @__PURE__ */ React.createElement("div", { className: "mx-auto flex max-w-7xl items-center justify-between" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement(ThenithLogo, { size: "md", showBadge: false }), isPro && /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-200 to-yellow-400 px-2.5 py-0.5 text-[10px] font-black text-amber-900 shadow-sm" }, /* @__PURE__ */ React.createElement(Sparkles, { className: "h-3 w-3" }), "PRO")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: toggleTheme,
      className: "flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
      title: theme === "dark" ? "Light mode" : "Dark mode",
      "aria-label": theme === "dark" ? "Light mode" : "Dark mode"
    },
    theme === "dark" ? /* @__PURE__ */ React.createElement(Sun, { className: "h-5 w-5" }) : /* @__PURE__ */ React.createElement(Moon, { className: "h-5 w-5" })
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: toggleLanguage,
      className: "flex h-10 min-w-10 items-center justify-center gap-1 rounded-xl border border-indigo-100 bg-indigo-50 px-2 text-xs font-black text-indigo-600 hover:bg-indigo-100 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300",
      title: language === "ar" ? "English" : "\u0627\u0644\u0639\u0631\u0628\u064A\u0629"
    },
    /* @__PURE__ */ React.createElement(Languages, { className: "h-4 w-4" }),
    language === "ar" ? "EN" : "AR"
  ), /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      ref: bellRef,
      onClick: onToggleNotifications,
      className: "relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
      title: t("recentNotifications")
    },
    /* @__PURE__ */ React.createElement(Bell, { className: "h-5 w-5" }),
    notifications?.length > 0 && /* @__PURE__ */ React.createElement("span", { className: "absolute end-2 top-2 h-2 w-2 rounded-full bg-rose-500 animate-pulse" })
  ), /* @__PURE__ */ React.createElement(AnimatePresence, null, showNotifications && /* @__PURE__ */ React.createElement(
    motion.div,
    {
      ref: dropdownRef,
      initial: { opacity: 0, y: 8, scale: 0.95 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: 8, scale: 0.95 },
      transition: { duration: 0.15 },
      className: "absolute end-0 top-12 z-50 w-72 sm:w-80 rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-950"
    },
    /* @__PURE__ */ React.createElement("h3", { className: "mb-3 text-sm font-bold text-slate-800 dark:text-white" }, t("recentNotifications")),
    /* @__PURE__ */ React.createElement("div", { className: "flex flex-col divide-y divide-slate-100 dark:divide-slate-900" }, notifications?.length > 0 ? notifications.map((item, idx) => {
      let title2 = item.title;
      if (!title2) {
        if (item.type === "new_request") title2 = language === "ar" ? `\u0631\u0633\u0627\u0644\u0629 \u062C\u062F\u064A\u062F\u0629 \u0645\u0646 ${item.payload?.name}` : `New message from ${item.payload?.name}`;
        else if (item.type === "new_appointment") title2 = language === "ar" ? `\u062D\u062C\u0632 \u062C\u062F\u064A\u062F \u0645\u0646 ${item.payload?.name}` : `New booking from ${item.payload?.name}`;
        else if (item.type === "card_updated") title2 = language === "ar" ? "\u062A\u0645 \u062A\u0639\u062F\u064A\u0644 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0643\u0627\u0631\u062A \u0628\u0646\u062C\u0627\u062D" : "Card details updated successfully";
        else if (item.type === "order_created") title2 = language === "ar" ? "\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0637\u0644\u0628 \u062C\u062F\u064A\u062F \u0628\u0646\u062C\u0627\u062D" : "New order recorded successfully";
        else if (item.type === "order_cancelled") title2 = language === "ar" ? "\u062A\u0645 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0637\u0644\u0628 \u0628\u0646\u062C\u0627\u062D" : "Order cancelled successfully";
        else if (item.type === "subscription_created") title2 = language === "ar" ? "\u062A\u0645 \u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643 \u0628\u0646\u062C\u0627\u062D" : "Subscription activated successfully";
        else if (item.type === "subscription_cancelled") title2 = language === "ar" ? "\u062A\u0645 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643 \u0628\u0646\u062C\u0627\u062D" : "Subscription cancelled successfully";
        else title2 = language === "ar" ? "\u0625\u0634\u0639\u0627\u0631 \u062C\u062F\u064A\u062F" : "New notification";
      }
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: item.id || item.payload?.id || idx,
          onClick: () => onNotificationClick && onNotificationClick(item),
          className: `py-2 text-xs font-medium text-slate-600 first:pt-0 last:pb-0 dark:text-slate-300 ${onNotificationClick ? "cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400" : ""}`
        },
        /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-start gap-2" }, /* @__PURE__ */ React.createElement("div", null, title2, item.message && /* @__PURE__ */ React.createElement("p", { className: "mt-1 text-slate-500 font-normal line-clamp-1 dark:text-slate-400" }, item.message)), item.type === "support_message" && /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1" }))
      );
    }) : /* @__PURE__ */ React.createElement("p", { className: "py-4 text-center text-xs text-slate-400" }, t("noItems") || "\u0644\u0627 \u062A\u0648\u062C\u062F \u0625\u0634\u0639\u0627\u0631\u0627\u062A"))
  ))), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: onLogout,
      className: "flex h-10 w-10 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-500 transition-colors hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/40",
      title: "Logout"
    },
    /* @__PURE__ */ React.createElement(LogOut, { className: "h-5 w-5" })
  ))));
}
