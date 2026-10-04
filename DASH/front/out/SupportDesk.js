import { useState, useEffect, useRef } from "react";
import {
  Loader2,
  Send,
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
  User as UserIcon,
  MessageSquare
} from "lucide-react";
import { adminFetch } from "../services/adminApi.js";
import { io } from "socket.io-client";
export default function SupportDesk() {
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const activeTicketRef = useRef(null);
  const [unreadTabCount, setUnreadTabCount] = useState(0);
  useEffect(() => {
    if (unreadTabCount > 0) {
      document.title = `(${unreadTabCount}) Thenith | Admin`;
    } else {
      document.title = "Thenith | Admin";
    }
  }, [unreadTabCount]);
  useEffect(() => {
    const handleFocus = () => setUnreadTabCount(0);
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);
  useEffect(() => {
    activeTicketRef.current = activeTicket;
  }, [activeTicket]);
  useEffect(() => {
    const adminToken = localStorage.getItem("admin_token");
    const newSocket = io(
      import.meta.env.VITE_API_BASE_URL.replace("/api", ""),
      {
        auth: { adminToken }
      }
    );
    setSocket(newSocket);
    newSocket.on("connect", () => {
      newSocket.emit("joinAdmin");
    });
    newSocket.on("conversationUpdated", (updatedTicket) => {
      setTickets((prev) => {
        const exists = prev.find((t) => t._id === updatedTicket._id);
        if (exists) {
          return prev.map((t) => t._id === updatedTicket._id ? updatedTicket : t).sort(
            (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
          );
        } else {
          return [updatedTicket, ...prev];
        }
      });
      if (activeTicketRef.current && activeTicketRef.current._id === updatedTicket._id) {
        setActiveTicket(updatedTicket);
      }
    });
    newSocket.on("newMessage", (message) => {
      const conversationId = message.conversation || message.ticket;
      const isCurrentChat = activeTicketRef.current && activeTicketRef.current._id === conversationId;
      const soundId = isCurrentChat ? "admin-notify-inchat" : "admin-notify-main";
      if (message.senderModel === "Guest" || message.senderModel === "User") {
        if (document.hidden) {
          setUnreadTabCount((prev) => prev + 1);
        }
        const audioEl = document.getElementById(soundId) || new Audio("/sounds/digital-notification.mp3");
        audioEl.volume = 0.8;
        audioEl.play().catch((e) => );
        if ("Notification" in window && Notification.permission === "granted") {
          if (document.hidden || !isCurrentChat) {
            new Notification("\u0631\u0633\u0627\u0644\u0629 \u062C\u062F\u064A\u062F\u0629 \u0645\u0646 \u0639\u0645\u064A\u0644", {
              body: message.content,
              icon: "/favicon.ico"
            });
          }
        }
      }
      setMessages((prev) => {
        if (activeTicketRef.current && conversationId === activeTicketRef.current._id) {
          if (!prev.find((m) => m._id === message._id)) {
            return [...prev, message];
          }
        }
        return prev;
      });
    });
    newSocket.on("conversationStatusChanged", (updatedTicket) => {
      setTickets(
        (prev) => prev.map((t) => t._id === updatedTicket._id ? updatedTicket : t)
      );
      if (activeTicketRef.current && activeTicketRef.current._id === updatedTicket._id) {
        if (updatedTicket.status === "resolved") {
          setActiveTicket(null);
        } else {
          setActiveTicket(updatedTicket);
        }
      }
    });
    newSocket.on("ticketStatusChanged", (updatedTicket) => {
      setTickets(
        (prev) => prev.map((t) => t._id === updatedTicket._id ? updatedTicket : t)
      );
      if (activeTicketRef.current && activeTicketRef.current._id === updatedTicket._id) {
        if (updatedTicket.status === "resolved") {
          setActiveTicket(null);
        } else {
          setActiveTicket(updatedTicket);
        }
      }
    });
    loadTickets();
    return () => newSocket.close();
  }, []);
  useEffect(() => {
    if (!activeTicket) return;
    loadMessages(activeTicket._id);
    const joinRoom = () => {
      socket?.emit("joinTicket", activeTicket._id);
    };
    joinRoom();
    socket?.on("connect", joinRoom);
    return () => {
      socket?.off("connect", joinRoom);
    };
  }, [activeTicket, socket]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  const loadTickets = async () => {
    try {
      const data = await adminFetch("/admin/customerServices");
      setTickets(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };
  const loadMessages = async (ticketId) => {
    try {
      const data = await adminFetch(
        `/admin/customerServices/${ticketId}/messages`
      );
      setMessages(data);
      setTickets(
        (prev) => prev.map((t) => t._id === ticketId ? { ...t, unreadAdmin: 0 } : t)
      );
    } catch (error) {
    }
  };
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeTicket) return;
    const content = newMessage;
    setNewMessage("");
    try {
      const sentMessage = await adminFetch(
        `/admin/customerServices/${activeTicket._id}/messages`,
        {
          method: "POST",
          data: { content }
        }
      );
      setMessages((prev) => {
        if (!prev.find((m) => m._id === sentMessage._id)) {
          return [...prev, sentMessage];
        }
        return prev;
      });
    } catch (error) {
      alert("\u0641\u0634\u0644 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0631\u0633\u0627\u0644\u0629");
      setNewMessage(content);
    }
  };
  const updateStatus = async (status) => {
    if (!activeTicket) return;
    try {
      await adminFetch(`/admin/customerServices/${activeTicket._id}/status`, {
        method: "PUT",
        data: { status }
      });
      if (status === "resolved") {
        setActiveTicket(null);
      }
    } catch (error) {
      alert("\u0641\u0634\u0644 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u062D\u0627\u0644\u0629");
    }
  };
  const [filter, setFilter] = useState("all");
  if (loading) {
    return /* @__PURE__ */ React.createElement("div", { className: "flex justify-center py-24" }, /* @__PURE__ */ React.createElement(Loader2, { className: "w-8 h-8 animate-spin text-indigo-500" }));
  }
  const filteredTickets = tickets.filter((ticket) => {
    if (filter === "all") return true;
    const isPaid = ticket.user?.planType === "paid";
    return filter === "paid" ? isPaid : !isPaid;
  });
  return /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-end gap-2 px-2" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setFilter("all"),
      className: `px-4 py-2 rounded-full text-sm font-bold transition-all ${filter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`
    },
    "\u0627\u0644\u0643\u0644"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setFilter("paid"),
      className: `px-4 py-2 rounded-full text-sm font-bold transition-all ${filter === "paid" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`
    },
    "\u0628\u0627\u0642\u0629 \u0645\u062F\u0641\u0648\u0639\u0629"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setFilter("free"),
      className: `px-4 py-2 rounded-full text-sm font-bold transition-all ${filter === "free" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`
    },
    "\u0645\u062C\u0627\u0646\u064A / \u0632\u0627\u0626\u0631"
  )), /* @__PURE__ */ React.createElement("div", { className: "flex h-[calc(100vh-140px)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300" }, /* @__PURE__ */ React.createElement("div", { className: "w-1/3 border-s border-slate-200 flex flex-col bg-slate-50/50" }, /* @__PURE__ */ React.createElement("div", { className: "p-4 border-b border-slate-200 bg-white" }, /* @__PURE__ */ React.createElement("h2", { className: "font-bold text-lg text-slate-800" }, "\u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0627\u062A \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-slate-500" }, filteredTickets.length, " \u0645\u062D\u0627\u062F\u062B\u0629 \u0645\u0639\u0631\u0648\u0636\u0629")), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-y-auto" }, filteredTickets.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "p-8 text-center text-slate-400 font-medium" }, "\u0644\u0627 \u062A\u0648\u062C\u062F \u0645\u062D\u0627\u062F\u062B\u0627\u062A \u062D\u062A\u0649 \u0627\u0644\u0622\u0646.") : filteredTickets.map((ticket) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: ticket._id,
      onClick: () => {
        if ("Notification" in window && Notification.permission === "default") {
          Notification.requestPermission();
        }
        setActiveTicket(ticket);
      },
      className: `w-full text-end p-4 border-b border-slate-100 hover:bg-slate-100 transition-colors flex flex-col gap-2 relative ${activeTicket?._id === ticket._id ? "bg-indigo-50 hover:bg-indigo-50" : ""}`
    },
    activeTicket?._id === ticket._id && /* @__PURE__ */ React.createElement("div", { className: "absolute end-0 top-0 bottom-0 w-1 bg-indigo-500" }),
    /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-start" }, /* @__PURE__ */ React.createElement("div", { className: "font-bold text-slate-800 flex flex-wrap items-center gap-2" }, ticket.name, ticket.user ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded-full" }, "\u0645\u0633\u062C\u0644"), /* @__PURE__ */ React.createElement("span", { className: `${ticket.user.planType === "paid" ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"} text-[10px] px-2 py-0.5 rounded-full` }, ticket.user.planName)) : /* @__PURE__ */ React.createElement("span", { className: "bg-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded-full" }, "\u0632\u0627\u0626\u0631")), /* @__PURE__ */ React.createElement("div", { className: "text-[10px] text-slate-400 font-medium " }, new Date(ticket.lastMessageAt).toLocaleTimeString(
      "ar-EG",
      { hour: "2-digit", minute: "2-digit" }
    ))),
    /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center w-full" }, /* @__PURE__ */ React.createElement(
      "span",
      {
        className: `text-xs font-bold px-2 py-1 rounded-md ${ticket.status === "open" ? "bg-amber-100 text-amber-700" : ticket.status === "resolved" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`
      },
      ticket.status === "open" ? "\u0645\u0641\u062A\u0648\u062D\u0629" : ticket.status === "resolved" ? "\u062A\u0645 \u0627\u0644\u062D\u0644" : ticket.status
    ), ticket.unreadAdmin > 0 && /* @__PURE__ */ React.createElement("span", { className: "bg-rose-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full" }, ticket.unreadAdmin))
  )))), /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col bg-white" }, activeTicket ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "p-4 border-b border-slate-200 flex justify-between items-center bg-white shadow-sm z-10" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center" }, /* @__PURE__ */ React.createElement(UserIcon, { className: "w-5 h-5" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-slate-800" }, activeTicket.name), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-slate-500 flex gap-2" }, /* @__PURE__ */ React.createElement("span", null, activeTicket.email), activeTicket.ipAddress && /* @__PURE__ */ React.createElement("span", null, "\u2022 ", activeTicket.ipAddress)))), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, activeTicket.status !== "resolved" && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => updateStatus("resolved"),
      className: "flex items-center gap-1.5 text-sm font-bold bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
    },
    /* @__PURE__ */ React.createElement(CheckCircle2, { className: "w-4 h-4" }),
    " \u062A\u062D\u062F\u064A\u062F \u0643\u0645\u062D\u0644\u0648\u0644\u0629"
  ))), /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30",
      style: {
        backgroundImage: "radial-gradient(#e5e7eb 1px, transparent 1px)",
        backgroundSize: "20px 20px"
      }
    },
    messages.map((msg) => {
      const isAdmin = msg.senderModel === "Admin";
      const isSystem = msg.senderModel === "System";
      if (isSystem) {
        return /* @__PURE__ */ React.createElement("div", { key: msg._id, className: "flex justify-center my-2" }, /* @__PURE__ */ React.createElement("div", { className: "bg-slate-200/60 text-slate-500 px-4 py-1.5 rounded-full text-xs font-bold border border-slate-200/80 shadow-sm flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement(AlertCircle, { className: "w-3.5 h-3.5" }), msg.content));
      }
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: msg._id,
          className: `flex ${isAdmin ? "justify-end" : "justify-start"}`
        },
        /* @__PURE__ */ React.createElement(
          "div",
          {
            className: `max-w-[70%] p-3 rounded-2xl ${isAdmin ? "bg-indigo-600 text-white rounded-ss-none" : "bg-white border border-slate-200 text-slate-800 rounded-se-none shadow-sm"}`
          },
          /* @__PURE__ */ React.createElement("p", { className: "text-sm leading-relaxed whitespace-pre-wrap" }, msg.content),
          /* @__PURE__ */ React.createElement(
            "div",
            {
              className: `text-[10px] mt-1.5 text-end font-medium ${isAdmin ? "text-indigo-200" : "text-slate-400"}`
            },
            new Date(msg.createdAt).toLocaleTimeString("ar-EG", {
              hour: "2-digit",
              minute: "2-digit"
            })
          )
        )
      );
    }),
    /* @__PURE__ */ React.createElement("div", { ref: messagesEndRef })
  ), /* @__PURE__ */ React.createElement("div", { className: "p-4 bg-white border-t border-slate-200" }, activeTicket.status === "resolved" ? /* @__PURE__ */ React.createElement("div", { className: "text-center p-3 bg-slate-50 text-slate-500 rounded-xl font-bold flex items-center justify-center gap-2" }, /* @__PURE__ */ React.createElement(AlertCircle, { className: "w-5 h-5" }), " \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629 \u0645\u062D\u0644\u0648\u0644\u0629 \u0648\u0645\u063A\u0644\u0642\u0629. \u0644\u0627 \u064A\u0645\u0643\u0646\u0643 \u0625\u0631\u0633\u0627\u0644 \u0631\u0633\u0627\u0626\u0644.") : /* @__PURE__ */ React.createElement("form", { onSubmit: sendMessage, className: "flex gap-2" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      value: newMessage,
      onChange: (e) => setNewMessage(e.target.value),
      placeholder: "\u0627\u0643\u062A\u0628 \u0631\u062F\u0643 \u0647\u0646\u0627...",
      className: "flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "submit",
      disabled: !newMessage.trim(),
      className: "bg-indigo-600 text-white w-12 rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:opacity-50"
    },
    /* @__PURE__ */ React.createElement(Send, { className: "w-5 h-5 -ml-1 rtl:rotate-180" })
  )))) : /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col items-center justify-center text-slate-400" }, /* @__PURE__ */ React.createElement(MessageSquare, { className: "w-16 h-16 mb-4 text-slate-200" }), /* @__PURE__ */ React.createElement("p", { className: "font-bold text-lg text-slate-500" }, "\u0627\u062E\u062A\u0631 \u0645\u062D\u0627\u062F\u062B\u0629 \u0644\u0644\u0628\u062F\u0621")))), /* @__PURE__ */ React.createElement(
    "audio",
    {
      id: "admin-notify-main",
      src: "/sounds/digital-notification.mp3",
      preload: "auto"
    }
  ), /* @__PURE__ */ React.createElement(
    "audio",
    {
      id: "admin-notify-inchat",
      src: "https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3",
      preload: "auto"
    }
  ));
}
