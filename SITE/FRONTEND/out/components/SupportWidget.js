import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useGlobalLanguage } from "../context/GlobalLanguageContext.jsx";
import {
  MessageCircle,
  X,
  Send,
  User as UserIcon,
  ShieldCheck,
  ArrowUp
} from "lucide-react";
import { getAccessToken } from "../panel/services/authApi.js";
import api from "../api/index.js";
import { API_BASE_URL } from "../config/runtime.js";
import io from "socket.io-client";
import { useAuth } from "../context/AuthContext.jsx";
export default function SupportWidget({ embedded = false, isVisible = true }) {
  const [isOpen, setIsOpen] = useState(embedded);
  const location = useLocation();
  const { t } = useGlobalLanguage();
  const { user, isAuthenticated } = useAuth();
  const isPanelRoute = location.pathname.startsWith("/u/");
  useEffect(() => {
    if (embedded || isPanelRoute) return void 0;
    const handleOpenWidget = (e) => {
      e.preventDefault();
      setIsOpen(true);
    };
    window.addEventListener("open-support-widget", handleOpenWidget);
    return () => window.removeEventListener("open-support-widget", handleOpenWidget);
  }, [embedded, isPanelRoute]);
  const [guestId, setGuestId] = useState(null);
  const [name, setName] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadTabCount, setUnreadTabCount] = useState(0);
  const messagesEndRef = useRef(null);
  const isOpenRef = useRef(isOpen);
  const hasAutoStarted = useRef(false);
  const isVisibleRef = useRef(isVisible);
  useEffect(() => {
    isVisibleRef.current = isVisible;
  }, [isVisible]);
  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen && isVisible) {
      setUnreadCount(0);
    }
  }, [isOpen, isVisible]);
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("support-unread", { detail: unreadCount }));
  }, [unreadCount]);
  useEffect(() => {
    if (unreadTabCount > 0) {
      const currentTitle = document.title.replace(/^\(\d+\)\s*/, "");
      document.title = `(${unreadTabCount}) ${currentTitle}`;
    } else {
      document.title = document.title.replace(/^\(\d+\)\s*/, "");
    }
  }, [unreadTabCount]);
  useEffect(() => {
    const handleFocus = () => setUnreadTabCount(0);
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);
  useEffect(() => {
    if (isOpen && isAuthenticated && user && !ticket && !loading && !hasAutoStarted.current) {
      hasAutoStarted.current = true;
      startChat(null, user.name || user.fullName);
    }
  }, [isOpen, isAuthenticated, user, ticket, loading]);
  useEffect(() => {
    if (!embedded && isPanelRoute) return void 0;
    let storedId = localStorage.getItem("thenith_support_guest_id");
    if (!storedId) {
      storedId = "guest_" + Math.random().toString(36).substr(2, 9);
      localStorage.setItem("thenith_support_guest_id", storedId);
    }
    setGuestId(storedId);
    const socketUrl = API_BASE_URL === "/api" ? void 0 : API_BASE_URL.replace(/\/api\/?$/, "");
    const token = getAccessToken();
    const newSocket = io(socketUrl, {
      path: "/socket.io",
      withCredentials: true,
      autoConnect: true,
      auth: {
        guestId: storedId,
        token
      }
    });
    setSocket(newSocket);
    newSocket.on("newMessage", (msg) => {
      setMessages((prev) => {
        if (!prev.find((m) => m._id === msg._id)) {
          return [...prev, msg];
        }
        return prev;
      });
      if (msg.senderModel === "System" || msg.senderModel === "Owner" || msg.senderModel === "Admin") {
        const effectivelyHidden = document.hidden || !isVisibleRef.current;
        if (effectivelyHidden) {
          setUnreadTabCount((prev) => prev + 1);
          window.dispatchEvent(
            new CustomEvent("support-new-message", {
              detail: { content: msg.content, sender: msg.senderModel }
            })
          );
        }
        if (!isOpenRef.current || effectivelyHidden) {
          setUnreadCount((prev) => prev + 1);
          try {
            const mainAudio = document.getElementById("user-notify-main");
            if (mainAudio) {
              mainAudio.play().catch(() => {
              });
            }
          } catch (e) {
          }
        } else if (msg.senderModel !== "System" && (msg.senderModel === "Owner" || msg.senderModel === "Admin")) {
          try {
            const inChatAudio = document.getElementById("user-notify-inchat");
            if (inChatAudio) {
              inChatAudio.play().catch(() => {
              });
            }
          } catch (e) {
          }
        }
      }
    });
    newSocket.on("ticketStatusChanged", (updatedTicket) => {
      if (updatedTicket.status === "resolved") {
        setTicket(null);
        setMessages([]);
        if (!embedded) setIsOpen(false);
        if (!getAccessToken()) {
          localStorage.removeItem("thenith_support_guest_id");
          setGuestId(null);
        }
      } else {
        setTicket(updatedTicket);
      }
    });
    newSocket.on("connect", () => {
      newSocket.emit("joinUserRoom");
    });
    newSocket.emit("joinUserRoom");
    newSocket.on("adminNotification", (notif) => {
      window.dispatchEvent(new CustomEvent("admin-push-notification", { detail: notif }));
      window.dispatchEvent(new CustomEvent("admin-push-toast", { detail: notif }));
    });
    return () => newSocket.disconnect();
  }, [embedded, isPanelRoute]);
  useEffect(() => {
    if (guestId && !ticket && (embedded || !isPanelRoute)) {
      resumeChat();
    }
  }, [guestId, embedded, isPanelRoute, ticket]);
  useEffect(() => {
    if (!socket || !ticket) return;
    const joinRoom = () => {
      socket.emit("joinTicket", ticket._id);
    };
    joinRoom();
    socket.on("connect", joinRoom);
    return () => {
      socket.off("connect", joinRoom);
    };
  }, [socket, ticket]);
  useEffect(() => {
    if (isVisible) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [messages, isOpen, isVisible]);
  const resumeChat = async () => {
    if (!guestId) return;
    try {
      setLoading(true);
      const restoredTicket = await api.support.init({ guestId });
      if (restoredTicket && !restoredTicket.error && restoredTicket._id) {
        setTicket(restoredTicket);
        fetchMessages(restoredTicket._id);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };
  const startChat = async (e, autoName) => {
    if (e) e.preventDefault();
    const chatName = autoName || user?.name || user?.fullName || name;
    if (!chatName) return;
    try {
      setLoading(true);
      let currentGuestId = guestId;
      if (!currentGuestId) {
        currentGuestId = "guest_" + Math.random().toString(36).substr(2, 9);
        localStorage.setItem("thenith_support_guest_id", currentGuestId);
        setGuestId(currentGuestId);
      }
      const createdTicket = await api.support.init({
        name: chatName,
        guestId: currentGuestId,
        subject: t("support.newInquiry")
      });
      if (createdTicket && !createdTicket.error && createdTicket._id) {
        setTicket(createdTicket);
        fetchMessages(createdTicket._id);
      }
    } catch (e2) {
    } finally {
      setLoading(false);
    }
  };
  const fetchMessages = async (ticketId) => {
    try {
      const data = await api.support.getMessages(ticketId, guestId || "");
      setMessages(data);
    } catch (e) {
    }
  };
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !ticket) return;
    const content = newMessage;
    setNewMessage("");
    try {
      const sentMessage = await api.support.sendMessage(ticket._id, content);
      setMessages((prev) => {
        if (!prev.find((m) => m._id === sentMessage._id)) {
          return [...prev, sentMessage];
        }
        return prev;
      });
    } catch (error) {
      setNewMessage(content);
    }
  };
  const shellClass = embedded ? "font-sans relative flex h-[min(72vh,760px)] min-h-[460px] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/50 shadow-sm dark:border-slate-800 dark:bg-slate-950/45" : "font-sans fixed bottom-[86px] end-4 md:bottom-[96px] md:end-7 w-[calc(100vw-24px)] md:w-[380px] h-[600px] max-h-[75vh] bg-white/50 backdrop-blur-[40px] rounded-[32px] shadow-[0_30px_60px_rgba(0,0,0,0.15)] border border-white/80 flex flex-col overflow-hidden origin-bottom-right transition-all duration-300 z-[100]";
  return /* @__PURE__ */ React.createElement("div", { className: "global-support-widget" }, /* @__PURE__ */ React.createElement("style", null, `
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          .animate-blob { animation: blob 12s infinite alternate ease-in-out; }
          .animation-delay-2000 { animation-delay: 4s; }
          .animation-delay-4000 { animation-delay: 8s; }
        `), isOpen && /* @__PURE__ */ React.createElement("div", { className: shellClass }, /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-30" }, /* @__PURE__ */ React.createElement("div", { className: "absolute top-[-20%] start-[-20%] w-[80%] h-[80%] bg-indigo-200/40 rounded-full mix-blend-normal blur-[60px] animate-blob" }), /* @__PURE__ */ React.createElement("div", { className: "absolute top-[-20%] end-[-20%] w-[80%] h-[80%] bg-rose-200/40 rounded-full mix-blend-normal blur-[60px] animate-blob animation-delay-2000" }), /* @__PURE__ */ React.createElement("div", { className: "absolute bottom-[-20%] start-[10%] w-[80%] h-[80%] bg-sky-200/40 rounded-full mix-blend-normal blur-[60px] animate-blob animation-delay-4000" })), /* @__PURE__ */ React.createElement("div", { className: "bg-white/30 text-[#1d1d1f] p-6 pb-6 flex flex-col relative border-b border-white/50 shrink-0 z-10 backdrop-blur-md" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-start mb-0 relative z-10" }, /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-xl flex items-center gap-2 " }, t("support.title")), !embedded && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setIsOpen(false),
      "aria-label": t("support.title"),
      className: "text-slate-500 hover:text-slate-900 transition-colors bg-white/50 hover:bg-white/80 rounded-full p-2 backdrop-blur-md shadow-sm"
    },
    /* @__PURE__ */ React.createElement(X, { className: "w-5 h-5" })
  )), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-slate-600 font-medium relative z-10 " }, t("support.subtitle"), ".")), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-y-auto scrollbar-hide bg-transparent flex flex-col relative p-4 z-10" }, !ticket ? /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col justify-center max-w-[320px] mx-auto w-full" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white/60 backdrop-blur-xl p-6 rounded-[24px] shadow-sm border border-white/80" }, loading ? /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center justify-center gap-3 py-6 text-slate-600" }, /* @__PURE__ */ React.createElement("div", { className: "h-10 w-10 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin" }), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-medium" }, t("support.loading"))) : /* @__PURE__ */ React.createElement(
    "form",
    {
      onSubmit: (e) => startChat(e, user?.name || user?.fullName),
      className: "space-y-4"
    },
    /* @__PURE__ */ React.createElement("h4", { className: "font-bold text-[#1d1d1f] mb-2 text-lg" }, t("support.welcome")),
    /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-500 mb-6 leading-relaxed" }, t("support.welcomeDesc"), "."),
    !user && /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        required: true,
        placeholder: t("support.name"),
        value: name,
        onChange: (e) => setName(e.target.value),
        className: "w-full bg-white text-[#1d1d1f] border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
      }
    ),
    /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "submit",
        disabled: loading,
        className: "w-full bg-[#1d1d1f] text-white font-bold rounded-xl px-4 py-3 text-sm hover:bg-black transition-colors shadow-lg disabled:opacity-50"
      },
      t("support.startChat")
    )
  ))) : /* @__PURE__ */ React.createElement("div", { className: "space-y-4 pb-4" }, /* @__PURE__ */ React.createElement("div", { className: "text-center text-[11px] text-slate-400 font-bold my-4" }, t("support.chatActive")), messages.map((msg, i) => {
    const isGuest = msg.senderModel === "Guest" || msg.senderModel === "User";
    const isSystem = msg.senderModel === "System";
    if (isSystem) {
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: msg._id || i,
          className: "flex justify-center my-3"
        },
        /* @__PURE__ */ React.createElement("div", { className: "bg-slate-200/50 text-slate-500 px-3 py-1 rounded-full text-[10px] font-bold border border-slate-200" }, msg.content)
      );
    }
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: msg._id || i,
        className: `flex ${isGuest ? "justify-start" : "justify-end"} mb-2 w-full`
      },
      /* @__PURE__ */ React.createElement(
        "div",
        {
          className: `max-w-[85%] p-3.5 text-sm flex flex-col ${isGuest ? "bg-[#1d1d1f] text-white rounded-[20px] rounded-se-[4px] shadow-md" : "bg-white/80 backdrop-blur-sm text-slate-800 rounded-[20px] rounded-ss-[4px] border border-slate-200/60 shadow-sm"}`
        },
        /* @__PURE__ */ React.createElement(
          "p",
          {
            className: "whitespace-pre-wrap break-words leading-relaxed text-start",
            dir: "auto"
          },
          msg.content
        ),
        /* @__PURE__ */ React.createElement(
          "div",
          {
            className: `text-[10px] mt-1.5 font-medium ${isGuest ? "text-slate-400 text-start" : "text-slate-500 text-end"}`
          },
          new Date(
            msg.createdAt || Date.now()
          ).toLocaleTimeString("ar-EG-u-nu-latn", {
            hour: "2-digit",
            minute: "2-digit"
          })
        )
      )
    );
  }), /* @__PURE__ */ React.createElement("div", { ref: messagesEndRef }))), ticket && /* @__PURE__ */ React.createElement("div", { className: "p-4 bg-white/40 border-t border-slate-200/50 shrink-0 backdrop-blur-md relative z-10" }, /* @__PURE__ */ React.createElement(
    "form",
    {
      onSubmit: sendMessage,
      className: "flex gap-2 bg-white/80 backdrop-blur-xl rounded-full p-1 ps-4 border border-slate-200 shadow-sm"
    },
    /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        placeholder: t("support.typeMessage"),
        value: newMessage,
        onChange: (e) => setNewMessage(e.target.value),
        className: "flex-1 bg-transparent text-[#1d1d1f] text-sm outline-none placeholder:text-slate-400"
      }
    ),
    /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "submit",
        disabled: !newMessage.trim(),
        className: "bg-[#1d1d1f] text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black transition-colors disabled:opacity-50 shrink-0"
      },
      /* @__PURE__ */ React.createElement(ArrowUp, { className: "w-4 h-4" })
    )
  ))), !embedded && !location.pathname.startsWith("/u") && !location.pathname.startsWith("/login") && !location.pathname.startsWith("/signup") && !(location.pathname === "/p" || location.pathname.startsWith("/p/")) && !location.pathname.startsWith("/admin") && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        if (!isOpen && "Notification" in window && Notification.permission === "default") {
          Notification.requestPermission();
        }
        setIsOpen(!isOpen);
      },
      className: "fixed bottom-5 end-5 md:bottom-7 md:end-7 z-[100] w-14 h-14 bg-white/85 backdrop-blur-2xl border border-white/60 text-[#1d1d1f] rounded-full flex items-center justify-center shadow-[0_20px_40px_rgba(0,0,0,0.15)] hover:bg-white hover:scale-105 active:scale-95 transition-all group"
    },
    isOpen ? /* @__PURE__ */ React.createElement(X, { className: "w-6 h-6" }) : /* @__PURE__ */ React.createElement(MessageCircle, { className: "w-6 h-6" }),
    !isOpen && unreadCount > 0 && /* @__PURE__ */ React.createElement("span", { className: "absolute -top-1 -end-1 bg-indigo-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-bounce" }, unreadCount)
  ), /* @__PURE__ */ React.createElement(
    "audio",
    {
      id: "user-notify-main",
      src: "/sounds/main-notification.mp3",
      preload: "auto"
    }
  ), /* @__PURE__ */ React.createElement(
    "audio",
    {
      id: "user-notify-inchat",
      src: "https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3",
      preload: "auto"
    }
  ));
}
