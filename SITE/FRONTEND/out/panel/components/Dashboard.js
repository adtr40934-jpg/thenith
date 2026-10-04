import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  BadgeDollarSign,
  CreditCard,
  Home,
  Headset,
  Mail,
  ShoppingBag,
  User
} from "lucide-react";
import { isFeatureEnabled } from "../config/features.js";
import { useDashboardData } from "../hooks/useDashboardData.js";
import { useLanguage } from "../hooks/useLanguage.jsx";
import { useTheme } from "../hooks/useTheme.jsx";
import DashboardHeader from "./dashboard/DashboardHeader.jsx";
import DashboardNav from "./dashboard/DashboardNav.jsx";
import HomePage from "./dashboard/HomePage.jsx";
import CardsPage from "./dashboard/CardsPage.jsx";
import CardEditor from "./dashboard/CardEditor.jsx";
import MessagesPage from "./dashboard/MessagesPage.jsx";
import ProfilePage from "./dashboard/ProfilePage.jsx";
import ProductsPage from "./dashboard/ProductsPage.jsx";
import SubscriptionsPage from "./dashboard/SubscriptionsPage.jsx";
import PanelCart from "./dashboard/PanelCart.jsx";
import PanelCheckout from "./dashboard/PanelCheckout.jsx";
import SupportPage from "./dashboard/SupportPage.jsx";
import { checkUsername } from "../services/authApi.js";
import { useCart } from "../../context/CartContext.jsx";
import api from "../../api/index.js";
import { toast } from "react-hot-toast";
export default function Dashboard({ onLogout, onDeleteAccount }) {
  const { language, toggleLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const dashboard = useDashboardData();
  const { cart } = useCart();
  const [isUploading, setIsUploading] = useState(false);
  const uploadCallbacks = {
    onUploadStart: () => setIsUploading(true),
    onUploadEnd: () => setIsUploading(false)
  };
  const [editSection, setEditSection] = useState("personal");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showContactMenu, setShowContactMenu] = useState(false);
  const [showLinkPicker, setShowLinkPicker] = useState(false);
  const [customLinkOpen, setCustomLinkOpen] = useState(false);
  const [linkDraft, setLinkDraft] = useState({ name: "", url: "" });
  const [supportUnreadEventCount, setSupportUnreadEventCount] = useState(0);
  const searchParams = new URLSearchParams(window.location.search);
  const initialTab = searchParams.get("tab") || "home";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [dragItem, setDragItem] = useState(null);
  const [pendingPayment, setPendingPayment] = useState(null);
  const [cancelingPayment, setCancelingPayment] = useState(false);
  const [supportNotifications, setSupportNotifications] = useState([]);
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const notifs = await api.notifications.getAll();
        setSupportNotifications(notifs);
      } catch (err) {
      }
    };
    loadNotifications();
  }, []);
  const supportUnread = Math.max(supportUnreadEventCount, supportNotifications.filter((n) => n.type === "support_message").length);
  const unreadToastShownRef = useRef(false);
  useEffect(() => {
    if (supportUnread > 0 && !unreadToastShownRef.current) {
      unreadToastShownRef.current = true;
      const msgTitle = language === "ar" ? "\u0644\u062F\u064A\u0643 \u0631\u0633\u0627\u0626\u0644 \u063A\u064A\u0631 \u0645\u0642\u0631\u0648\u0621\u0629 \u0645\u0646 \u0627\u0644\u062F\u0639\u0645 \u0627\u0644\u0641\u0646\u064A" : "You have unread support messages";
      toast.custom((t2) => /* @__PURE__ */ React.createElement("div", { className: `${t2.visible ? "animate-enter" : "animate-leave"} max-w-sm w-full bg-white dark:bg-slate-900 shadow-xl border border-indigo-100 dark:border-indigo-900 rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 relative overflow-hidden`, style: { marginTop: "65px" } }, /* @__PURE__ */ React.createElement("div", { className: "absolute top-0 start-0 w-1.5 h-full bg-indigo-500" }), /* @__PURE__ */ React.createElement("div", { className: "flex-1 w-0 p-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-start" }, /* @__PURE__ */ React.createElement("div", { className: "flex-shrink-0 pt-0.5" }, /* @__PURE__ */ React.createElement("div", { className: "w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center" }, /* @__PURE__ */ React.createElement(Headset, { className: "w-5 h-5 text-indigo-600 dark:text-indigo-400" }))), /* @__PURE__ */ React.createElement("div", { className: "ms-3 flex-1" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-bold text-slate-900 dark:text-white mt-2" }, msgTitle)))), /* @__PURE__ */ React.createElement("div", { className: "flex border-s border-slate-100 dark:border-slate-800" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => {
            toast.dismiss(t2.id);
            changeMainTab("support");
          },
          className: "w-full border border-transparent rounded-none rounded-e-2xl p-4 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        },
        language === "ar" ? "\u0639\u0631\u0636" : "View"
      ))), { duration: 5e3, position: "top-right" });
    }
  }, [supportUnread, language]);
  useEffect(() => {
    const handleSupportUnread = (e) => setSupportUnreadEventCount(e.detail);
    const handleSupportNewMessage = async (e) => {
      unreadToastShownRef.current = true;
      const msgTitle = language === "ar" ? "\u0631\u0633\u0627\u0644\u0629 \u062C\u062F\u064A\u062F\u0629 \u0645\u0646 \u0627\u0644\u062F\u0639\u0645 \u0627\u0644\u0641\u0646\u064A" : "New message from Support";
      toast.custom((t2) => /* @__PURE__ */ React.createElement("div", { className: `${t2.visible ? "animate-enter" : "animate-leave"} max-w-sm w-full bg-white dark:bg-slate-900 shadow-xl border border-indigo-100 dark:border-indigo-900 rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 relative overflow-hidden`, style: { marginTop: "65px" } }, /* @__PURE__ */ React.createElement("div", { className: "absolute top-0 start-0 w-1.5 h-full bg-indigo-500" }), /* @__PURE__ */ React.createElement("div", { className: "flex-1 w-0 p-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-start" }, /* @__PURE__ */ React.createElement("div", { className: "flex-shrink-0 pt-0.5" }, /* @__PURE__ */ React.createElement("div", { className: "w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center" }, /* @__PURE__ */ React.createElement(Headset, { className: "w-5 h-5 text-indigo-600 dark:text-indigo-400" }))), /* @__PURE__ */ React.createElement("div", { className: "ms-3 flex-1" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-bold text-slate-900 dark:text-white" }, msgTitle), /* @__PURE__ */ React.createElement("p", { className: "mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2" }, e.detail.content)))), /* @__PURE__ */ React.createElement("div", { className: "flex border-s border-slate-100 dark:border-slate-800" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => {
            toast.dismiss(t2.id);
            setActiveTab("support");
          },
          className: "w-full border border-transparent rounded-none rounded-e-2xl p-4 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        },
        language === "ar" ? "\u0639\u0631\u0636" : "View"
      ))), { duration: 5e3, position: "top-right" });
      try {
        const notif = await api.notifications.create({
          type: "support_message",
          title: msgTitle,
          message: e.detail.content
        });
        setSupportNotifications((prev) => [notif, ...prev]);
      } catch (err) {
      }
    };
    const handleAdminPushNotification = async (e) => {
      const notif = e.detail;
      toast(notif.title, {
        icon: "\u{1F514}",
        duration: 5e3,
        position: "top-right",
        style: {
          marginTop: "65px",
          marginRight: language === "ar" ? "0px" : "30px",
          marginLeft: language === "ar" ? "30px" : "0px",
          borderRadius: "12px",
          background: "#4f46e5",
          color: "#fff",
          fontSize: "14px"
        }
      });
      if (notif.notifId) {
        setSupportNotifications((prev) => [
          {
            _id: notif.notifId,
            type: "admin_push",
            title: notif.title,
            message: notif.message || "",
            timestamp: notif.timestamp,
            read: false
          },
          ...prev
        ]);
      } else {
        try {
          const all = await api.notifications.getAll();
          setSupportNotifications(all);
        } catch (err) {
        }
      }
    };
    const handleDashboardAction = async (e) => {
      const { title, type = "action", message: msg = "" } = e.detail || {};
      if (!title) return;
      try {
        const notif = await api.notifications.create({ type, title, message: msg });
        setSupportNotifications((prev) => [notif, ...prev]);
      } catch (err) {
      }
    };
    window.addEventListener("support-unread", handleSupportUnread);
    window.addEventListener("support-new-message", handleSupportNewMessage);
    window.addEventListener("admin-push-notification", handleAdminPushNotification);
    window.addEventListener("dashboard-action", handleDashboardAction);
    return () => {
      window.removeEventListener("support-unread", handleSupportUnread);
      window.removeEventListener("support-new-message", handleSupportNewMessage);
      window.removeEventListener("admin-push-notification", handleAdminPushNotification);
      window.removeEventListener("dashboard-action", handleDashboardAction);
    };
  }, [language]);
  useEffect(() => {
    const url = new URL(window.location);
    if (url.searchParams.get("tab") !== activeTab) {
      url.searchParams.set("tab", activeTab);
      window.history.replaceState({}, "", url);
    }
    if (activeTab === "support") {
      setSupportUnreadEventCount(0);
      setSupportNotifications((prev) => {
        const supportNotifs = prev.filter((n) => n.type === "support_message");
        if (supportNotifs.length > 0) {
          supportNotifs.forEach((n) => {
            const id = n._id || n.id;
            if (id) {
              api.notifications.deleteOne(id).catch(() => {
              });
            }
          });
        }
        return prev.filter((n) => n.type !== "support_message");
      });
    }
  }, [activeTab]);
  const handleCancelPending = async () => {
    if (!pendingPayment?.transaction?.intentKey) return;
    setCancelingPayment(true);
    try {
      await api.payment.cancel(pendingPayment.transaction.intentKey);
      setPendingPayment(null);
    } catch (err) {
    } finally {
      setCancelingPayment(false);
    }
  };
  const navItems = [
    { id: "home", label: t("home"), icon: Home, feature: "analytics" },
    { id: "cards", label: t("cards"), icon: CreditCard, feature: "cards" },
    {
      id: "messages",
      label: t("messages"),
      icon: Mail,
      badge: dashboard?.totalInboxCount || 0,
      feature: "messages"
    },
    {
      id: "products",
      label: t("products"),
      icon: ShoppingBag,
      feature: "products"
    },
    {
      id: "subscriptions",
      label: t("subscriptions"),
      icon: BadgeDollarSign,
      feature: "subscriptions"
    },
    { id: "profile", label: t("profile"), icon: User, feature: "profile" },
    { id: "support", label: t("support"), icon: Headset, badge: supportUnread > 0 ? supportUnread : void 0 },
    ...cart.length > 0 ? [
      {
        id: "cart",
        label: language === "ar" ? "\u0627\u0644\u0633\u0644\u0629" : "Cart",
        icon: ShoppingBag,
        badge: cart.length,
        feature: "products"
      }
    ] : []
  ].filter((item) => isFeatureEnabled(item.feature));
  const screenTitle = activeTab === "cardEdit" && dashboard?.activeCard ? `${t("editCard")} - ${dashboard.activeCard.name}` : activeTab === "messages" && dashboard?.selectedMessageCard ? dashboard.selectedMessageCard.name : navItems.find((item) => item.id === activeTab)?.label || t("appName");
  useEffect(() => {
    const titleBase = `Thenith | ${screenTitle}`;
    document.title = supportUnread > 0 ? `(${supportUnread}) ${titleBase}` : titleBase;
  }, [screenTitle, supportUnread]);
  if (dashboard.status === "loading") {
    return /* @__PURE__ */ React.createElement(LoadingScreen, { label: t("loading") });
  }
  if (dashboard.status === "error" || !dashboard.hasRemoteData) {
    return /* @__PURE__ */ React.createElement(
      LoadingScreen,
      {
        label: t("dashboardLoadError"),
        actionLabel: t("logout"),
        onAction: onLogout
      }
    );
  }
  const openCardEditor = (cardId, section = "personal") => {
    dashboard.setActiveCardId(cardId);
    setEditSection(section);
    setActiveTab("cardEdit");
  };
  const addCard = async () => {
    const card = await dashboard.addCard();
    if (card) {
      setEditSection("personal");
      setActiveTab("cardEdit");
    }
    return card;
  };
  const changeMainTab = (tabId) => {
    if (tabId === "messages") dashboard.setSelectedMessageCardId(null);
    setActiveTab(tabId);
  };
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      dir: language === "ar" ? "rtl" : "ltr",
      className: "min-h-screen overflow-x-hidden bg-slate-100 pb-28 text-slate-900 dark:bg-[#03070c] dark:text-slate-100 lg:bg-slate-50 lg:pb-10"
    },
    /* @__PURE__ */ React.createElement(
      DashboardHeader,
      {
        t,
        language,
        toggleLanguage,
        theme,
        toggleTheme,
        title: screenTitle,
        entitlements: dashboard.entitlements,
        notifications: [...supportNotifications, ...dashboard.notifications || []],
        showNotifications,
        onToggleNotifications: () => setShowNotifications((value) => !value),
        onCloseNotifications: () => setShowNotifications(false),
        onNotificationClick: (item) => {
          const id = item._id || item.id;
          if (id) {
            api.notifications.deleteOne(id).catch((err) => );
            setSupportNotifications((prev) => prev.filter((x) => (x._id || x.id) !== id));
          }
          if (item.type === "support_message") {
            changeMainTab("support");
            setShowNotifications(false);
          } else if (item.type === "subscription_created" || item.type === "subscription_cancelled") {
            changeMainTab("subscriptions");
            setShowNotifications(false);
          } else if (item.type === "order_created" || item.type === "order_cancelled") {
            changeMainTab("orders");
            setShowNotifications(false);
          }
        },
        onLogout
      }
    ),
    /* @__PURE__ */ React.createElement("div", { className: "mx-auto grid max-w-7xl grid-cols-1 gap-3 px-1.5 pt-3 sm:gap-4 sm:px-4 md:px-8 md:pt-6 lg:grid-cols-12 lg:gap-6" }, /* @__PURE__ */ React.createElement(
      DashboardNav,
      {
        t,
        language,
        toggleLanguage,
        theme,
        toggleTheme,
        navItems,
        activeTab,
        onChangeTab: changeMainTab,
        onLogout
      }
    ), /* @__PURE__ */ React.createElement("main", { className: "relative min-w-0 rounded-[20px] bg-slate-50 px-0 py-1 shadow-[0_18px_45px_rgba(15,23,42,0.08)] dark:bg-slate-950/20 sm:rounded-[28px] sm:px-1 sm:py-2 md:rounded-none md:bg-transparent md:p-0 md:shadow-none lg:col-span-9" }, /* @__PURE__ */ React.createElement(AnimatePresence, { mode: "wait" }, activeTab === "home" && isFeatureEnabled("analytics") && /* @__PURE__ */ React.createElement(
      motion.div,
      {
        key: "home",
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -12 }
      },
      /* @__PURE__ */ React.createElement(
        HomePage,
        {
          t,
          language,
          permissions: dashboard.permissions,
          entitlements: dashboard.entitlements,
          metrics: dashboard.metrics,
          visits: dashboard.visits,
          notifications: [...supportNotifications, ...dashboard.notifications || []],
          cards: dashboard.cards,
          activeCardLink: dashboard.activeCardLink,
          activeCardId: dashboard.activeCardId
        }
      )
    ), activeTab === "cards" && isFeatureEnabled("cards") && /* @__PURE__ */ React.createElement(
      motion.div,
      {
        key: "cards",
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -12 }
      },
      /* @__PURE__ */ React.createElement(
        CardsPage,
        {
          t,
          cards: dashboard.cards,
          activeCardId: dashboard.activeCardId,
          activeCardLink: dashboard.activeCardLink,
          ownerUsername: dashboard.owner?.username || "",
          maxCards: dashboard.permissions?.maxCards,
          entitlements: dashboard.entitlements,
          onSelectCard: dashboard.setActiveCardId,
          onEditCard: openCardEditor,
          onAddCard: addCard,
          onDeleteCard: dashboard.deleteCard,
          isSwitchingCard: dashboard.isSwitchingCard,
          onUpgrade: () => changeMainTab("subscriptions")
        }
      )
    ), activeTab === "cardEdit" && /* @__PURE__ */ React.createElement(
      motion.div,
      {
        key: `card-edit-${editSection}`,
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -12 }
      },
      /* @__PURE__ */ React.createElement(
        CardEditor,
        {
          t,
          language,
          card: dashboard.activeCard,
          section: editSection,
          dragItem,
          linkDraft,
          showContactMenu,
          showLinkPicker,
          customLinkOpen,
          permissions: dashboard.permissions,
          entitlements: dashboard.entitlements,
          onUpgrade: () => changeMainTab("subscriptions"),
          onBack: () => setActiveTab("cards"),
          onChangeSection: setEditSection,
          onSetDragItem: setDragItem,
          onToggleContactMenu: setShowContactMenu,
          onToggleLinkPicker: setShowLinkPicker,
          onToggleCustomLink: setCustomLinkOpen,
          onSetLinkDraft: setLinkDraft,
          onUpdateCard: dashboard.updateActiveCard,
          onSaveCard: dashboard.saveActiveCard,
          onUpdatePersonal: dashboard.updatePersonal,
          onUpdateContact: dashboard.updateContact,
          onAddContact: dashboard.addContact,
          onDeleteContact: dashboard.deleteContact,
          onAddLink: dashboard.addLink,
          onUpdateLink: dashboard.updateLink,
          onDeleteLink: dashboard.deleteLink,
          onReorderItems: dashboard.reorderCardItems,
          hasCardChanges: dashboard.hasCardChanges,
          isUploading,
          uploadCallbacks
        }
      )
    ), activeTab === "messages" && isFeatureEnabled("messages") && /* @__PURE__ */ React.createElement(
      motion.div,
      {
        key: "messages",
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -12 }
      },
      /* @__PURE__ */ React.createElement(
        MessagesPage,
        {
          t,
          language,
          cards: dashboard.cards,
          selectedCard: dashboard.selectedMessageCard,
          onOpenCard: (cardId) => {
            dashboard.setSelectedMessageCardId(cardId);
            dashboard.setActiveCardId(cardId);
          },
          onBack: () => dashboard.setSelectedMessageCardId(null),
          onDeleteMessage: dashboard.deleteInboxItem,
          onToggleRead: dashboard.toggleInboxItemRead,
          onMarkRead: dashboard.markInboxItemRead
        }
      )
    ), activeTab === "products" && isFeatureEnabled("products") && /* @__PURE__ */ React.createElement(
      motion.div,
      {
        key: "products",
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -12 }
      },
      /* @__PURE__ */ React.createElement(
        ProductsPage,
        {
          t,
          personal: dashboard.dashboardData?.owner || {},
          onOpenCart: () => setActiveTab("cart"),
          onOrder: (order) => dashboard.updateDashboard((current) => ({
            ...current,
            owner: {
              ...current.owner || {},
              orders: [order, ...current.owner?.orders || []]
            }
          }))
        }
      )
    ), activeTab === "subscriptions" && isFeatureEnabled("subscriptions") && /* @__PURE__ */ React.createElement(
      motion.div,
      {
        key: "subscriptions",
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -12 }
      },
      /* @__PURE__ */ React.createElement(
        SubscriptionsPage,
        {
          t,
          subscription: dashboard.dashboardData?.subscription,
          user: dashboard.dashboardData?.user,
          onNavigateToProfile: () => setActiveTab("profile")
        }
      )
    ), activeTab === "profile" && isFeatureEnabled("profile") && /* @__PURE__ */ React.createElement(
      motion.div,
      {
        key: "profile",
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -12 }
      },
      /* @__PURE__ */ React.createElement(
        ProfilePage,
        {
          t,
          language,
          personal: dashboard.owner || {},
          permissions: dashboard.permissions,
          entitlements: dashboard.entitlements,
          onUpgrade: () => changeMainTab("subscriptions"),
          onCheckUsername: checkUsername,
          onUpdate: (data) => dashboard.updateDashboard((current) => ({
            ...current,
            owner: { ...current.owner, ...data }
          })),
          onPersistedUpdate: dashboard.updatePersistedOwner,
          onDeleteAccount,
          onSaveProfile: dashboard.saveOwner,
          isUploading,
          hasOwnerChanges: dashboard.hasOwnerChanges
        }
      )
    ), activeTab === "cart" && /* @__PURE__ */ React.createElement(
      motion.div,
      {
        key: "cart",
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -12 }
      },
      /* @__PURE__ */ React.createElement(PanelCart, { t, onCheckout: () => setActiveTab("checkout") })
    ), activeTab === "checkout" && /* @__PURE__ */ React.createElement(
      motion.div,
      {
        key: "checkout",
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -12 }
      },
      /* @__PURE__ */ React.createElement(PanelCheckout, { t, onBack: () => setActiveTab("cart") })
    )), /* @__PURE__ */ React.createElement("div", { className: activeTab === "support" ? "block animate-in fade-in duration-300 slide-in-from-bottom-2" : "hidden" }, /* @__PURE__ */ React.createElement(SupportPage, { t, language, isVisible: activeTab === "support" }))))
  );
}
function LoadingScreen({ label, actionLabel, onAction }) {
  useEffect(() => {
    document.body.classList.add("loading-screen-active");
    return () => document.body.classList.remove("loading-screen-active");
  }, []);
  return /* @__PURE__ */ React.createElement("div", { className: "flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-700 dark:bg-slate-950 dark:text-slate-200" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center gap-4 text-center" }, !onAction && /* @__PURE__ */ React.createElement("span", { className: "h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" }), /* @__PURE__ */ React.createElement("p", { className: "max-w-sm text-sm font-bold" }, label), onAction && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: onAction,
      className: "rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
    },
    actionLabel
  )));
}
