import { useState, useEffect } from "react";
import { Send, Users, User, Bell, CheckCircle2, AlertCircle, Search, Loader2 } from "lucide-react";
import apiClient from "../api/client.js";
export default function PushNotifications() {
  const [target, setTarget] = useState("all");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [targetPlan, setTargetPlan] = useState("pro");
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [sentHistory, setSentHistory] = useState([]);
  useEffect(() => {
    if (target === "user" || target === "plan") {
      setLoadingUsers(true);
      apiClient.get("/admin/notifications/users").then((res) => {
        setUsers(res.data || []);
        setFilteredUsers(res.data || []);
      }).catch(() => setUsers([])).finally(() => setLoadingUsers(false));
    }
  }, [target]);
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredUsers(users.filter(
        (u) => (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q) || (u.username || "").toLowerCase().includes(q)
      ));
    }
  }, [searchQuery, users]);
  const selectedUser = users.find((u) => u._id === userId);
  const handleSend = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (target === "user" && !userId) return;
    setSending(true);
    setResult(null);
    try {
      const payload = { target, title: title.trim(), message: message.trim() };
      if (target === "user") payload.userId = userId;
      if (target === "plan") payload.plan = targetPlan;
      const res = await apiClient.post("/admin/notifications/push", payload);
      setResult({ ok: true, data: res.data });
      setSentHistory((prev) => [{
        id: Date.now(),
        target,
        targetName: target === "all" ? "\u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646" : target === "plan" ? targetPlan === "pro" ? "\u0628\u0627\u0642\u0629 \u0628\u0631\u0648" : "\u0627\u0644\u0628\u0627\u0642\u0629 \u0627\u0644\u0645\u062C\u0627\u0646\u064A\u0629" : selectedUser?.name || userId,
        title: title.trim(),
        message: message.trim(),
        sentAt: (/* @__PURE__ */ new Date()).toLocaleString("ar-EG")
      }, ...prev].slice(0, 10));
      setTitle("");
      setMessage("");
    } catch (err) {
      setResult({ ok: false, error: err.response?.data?.error?.message || "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u0625\u0631\u0633\u0627\u0644" });
    } finally {
      setSending(false);
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-6 max-w-4xl mx-auto", dir: "rtl" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center" }, /* @__PURE__ */ React.createElement(Bell, { className: "w-5 h-5 text-indigo-600" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "text-xl font-bold text-slate-900" }, "\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-slate-500 mt-0.5" }, "\u0623\u0631\u0633\u0644 \u0625\u0634\u0639\u0627\u0631\u0627\u062A \u0641\u0648\u0631\u064A\u0629 \u0644\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646 \u0639\u0628\u0631 \u0627\u0644\u0645\u0648\u0642\u0639"))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6" }, /* @__PURE__ */ React.createElement("div", { className: "lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6" }, /* @__PURE__ */ React.createElement("h2", { className: "text-base font-bold text-slate-800 mb-5" }, "\u0625\u0646\u0634\u0627\u0621 \u0625\u0634\u0639\u0627\u0631 \u062C\u062F\u064A\u062F"), /* @__PURE__ */ React.createElement("form", { onSubmit: handleSend, className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "text-sm font-semibold text-slate-700 block mb-2" }, "\u0627\u0644\u062C\u0645\u0647\u0648\u0631 \u0627\u0644\u0645\u0633\u062A\u0647\u062F\u0641"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-3 gap-3" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => {
        setTarget("all");
        setUserId("");
      },
      className: `flex items-center gap-2 p-3 rounded-xl border-2 font-medium text-sm transition-all ${target === "all" ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`
    },
    /* @__PURE__ */ React.createElement(Users, { className: "w-4 h-4" }),
    "\u0627\u0644\u0643\u0644"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setTarget("plan"),
      className: `flex items-center gap-2 p-3 rounded-xl border-2 font-medium text-sm transition-all ${target === "plan" ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`
    },
    /* @__PURE__ */ React.createElement(CheckCircle2, { className: "w-4 h-4" }),
    "\u062D\u0633\u0628 \u0627\u0644\u0628\u0627\u0642\u0629"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setTarget("user"),
      className: `flex items-center gap-2 p-3 rounded-xl border-2 font-medium text-sm transition-all ${target === "user" ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`
    },
    /* @__PURE__ */ React.createElement(User, { className: "w-4 h-4" }),
    "\u0645\u0633\u062A\u062E\u062F\u0645 \u0645\u062D\u062F\u062F"
  ))), target === "user" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "text-sm font-semibold text-slate-700 block mb-2" }, "\u0627\u062E\u062A\u0631 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645"), loadingUsers ? /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 text-slate-500 text-sm py-3" }, /* @__PURE__ */ React.createElement(Loader2, { className: "w-4 h-4 animate-spin" }), "\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0645\u064A\u0644...") : /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement(Search, { className: "w-4 h-4 text-slate-400 absolute end-3 top-1/2 -translate-y-1/2" }), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      placeholder: "\u0627\u0628\u062D\u062B \u0628\u0627\u0644\u0627\u0633\u0645 \u0623\u0648 \u0627\u0644\u0628\u0631\u064A\u062F...",
      value: searchQuery,
      onChange: (e) => setSearchQuery(e.target.value),
      className: "w-full border border-slate-200 rounded-xl pe-9 ps-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
    }
  )), userId && selectedUser && /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl px-3 py-2 text-sm font-medium" }, /* @__PURE__ */ React.createElement(CheckCircle2, { className: "w-4 h-4 text-indigo-500 shrink-0" }), /* @__PURE__ */ React.createElement("span", null, "\u062A\u0645 \u0627\u062E\u062A\u064A\u0627\u0631: ", selectedUser.name, " (", selectedUser.email, ")"), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setUserId(""), className: "mr-auto text-indigo-400 hover:text-indigo-600 text-xs underline" }, "\u0625\u0644\u063A\u0627\u0621")), /* @__PURE__ */ React.createElement("div", { className: "border border-slate-100 rounded-xl overflow-hidden max-h-48 overflow-y-auto" }, filteredUsers.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-center text-slate-400 text-sm py-4" }, "\u0644\u0627 \u064A\u0648\u062C\u062F \u0645\u0633\u062A\u062E\u062F\u0645\u0648\u0646") : filteredUsers.map((u) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: u._id,
      type: "button",
      onClick: () => setUserId(u._id),
      className: `w-full flex items-center gap-3 px-4 py-2.5 text-start text-sm transition-colors border-b last:border-0 border-slate-50 ${userId === u._id ? "bg-indigo-50 text-indigo-700" : "hover:bg-slate-50 text-slate-700"}`
    },
    /* @__PURE__ */ React.createElement("div", { className: "w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs uppercase shrink-0" }, (u.name || "?")[0]),
    /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("p", { className: "font-medium truncate" }, u.name), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-400 truncate" }, u.email))
  ))))), target === "plan" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "text-sm font-semibold text-slate-700 block mb-2" }, "\u0627\u062E\u062A\u0631 \u0627\u0644\u0628\u0627\u0642\u0629"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setTargetPlan("free"),
      className: `flex items-center justify-center p-3 rounded-xl border-2 font-medium text-sm transition-all ${targetPlan === "free" ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`
    },
    "\u0627\u0644\u0628\u0627\u0642\u0629 \u0627\u0644\u0645\u062C\u0627\u0646\u064A\u0629"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setTargetPlan("pro"),
      className: `flex items-center justify-center p-3 rounded-xl border-2 font-medium text-sm transition-all ${targetPlan === "pro" ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`
    },
    "\u0628\u0627\u0642\u0629 \u0628\u0631\u0648"
  ))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "text-sm font-semibold text-slate-700 block mb-2" }, "\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0625\u0634\u0639\u0627\u0631 *"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      value: title,
      onChange: (e) => setTitle(e.target.value),
      placeholder: "\u0645\u062B\u0627\u0644: \u062A\u062D\u062F\u064A\u062B \u062C\u062F\u064A\u062F \u0645\u062A\u0627\u062D!",
      maxLength: 100,
      required: true,
      className: "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
    }
  ), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-400 mt-1 text-end" }, title.length, "/100")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "text-sm font-semibold text-slate-700 block mb-2" }, "\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0625\u0634\u0639\u0627\u0631 (\u0627\u062E\u062A\u064A\u0627\u0631\u064A)"), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      value: message,
      onChange: (e) => setMessage(e.target.value),
      placeholder: "\u0623\u0636\u0641 \u062A\u0641\u0627\u0635\u064A\u0644 \u0625\u0636\u0627\u0641\u064A\u0629...",
      rows: 3,
      maxLength: 300,
      className: "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
    }
  ), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-400 mt-1 text-end" }, message.length, "/300")), result && /* @__PURE__ */ React.createElement("div", { className: `flex items-start gap-2 rounded-xl p-3 text-sm ${result.ok ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}` }, result.ok ? /* @__PURE__ */ React.createElement(CheckCircle2, { className: "w-4 h-4 shrink-0 mt-0.5" }) : /* @__PURE__ */ React.createElement(AlertCircle, { className: "w-4 h-4 shrink-0 mt-0.5" }), /* @__PURE__ */ React.createElement("span", null, result.ok ? "\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0625\u0634\u0639\u0627\u0631 \u0628\u0646\u062C\u0627\u062D! \u{1F389}" : result.error)), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "submit",
      disabled: sending || !title.trim() || target === "user" && !userId,
      className: "w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm py-3 rounded-xl transition-colors"
    },
    sending ? /* @__PURE__ */ React.createElement(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ React.createElement(Send, { className: "w-4 h-4" }),
    sending ? "\u062C\u0627\u0631\u064A \u0627\u0644\u0625\u0631\u0633\u0627\u0644..." : "\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0625\u0634\u0639\u0627\u0631"
  ))), /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl border border-slate-100 shadow-sm p-5" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-bold text-slate-700 mb-3" }, "\u0645\u0639\u0627\u064A\u0646\u0629"), /* @__PURE__ */ React.createElement("div", { className: "bg-slate-900 rounded-xl p-3 flex items-start gap-2.5" }, /* @__PURE__ */ React.createElement("div", { className: "w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shrink-0" }, /* @__PURE__ */ React.createElement(Bell, { className: "w-4 h-4 text-white" })), /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("p", { className: "text-white text-sm font-semibold leading-snug" }, title || "\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0625\u0634\u0639\u0627\u0631..."), message && /* @__PURE__ */ React.createElement("p", { className: "text-slate-400 text-xs mt-1 line-clamp-2" }, message), /* @__PURE__ */ React.createElement("p", { className: "text-slate-500 text-xs mt-1.5" }, "\u0627\u0644\u0622\u0646"))), /* @__PURE__ */ React.createElement("div", { className: "mt-3 text-xs text-slate-400 bg-slate-50 rounded-lg p-2 text-center" }, "\u0627\u0644\u0625\u0634\u0639\u0627\u0631 \u0633\u064A\u0638\u0647\u0631 \u0639\u0644\u0649 \u0634\u0627\u0634\u0629 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0645\u0628\u0627\u0634\u0631\u0629")), sentHistory.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl border border-slate-100 shadow-sm p-5" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-bold text-slate-700 mb-3" }, "\u0622\u062E\u0631 \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u0631\u0633\u0644\u0629"), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, sentHistory.map((item) => /* @__PURE__ */ React.createElement("div", { key: item.id, className: "bg-slate-50 rounded-xl p-3 text-xs space-y-1" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "font-semibold text-slate-700 truncate" }, item.title), /* @__PURE__ */ React.createElement("span", { className: `shrink-0 ms-2 px-1.5 py-0.5 rounded-full font-bold text-[10px] ${item.target === "all" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}` }, item.target === "all" ? "\u0627\u0644\u0643\u0644" : "\u0641\u0631\u062F\u064A")), /* @__PURE__ */ React.createElement("p", { className: "text-slate-400" }, item.targetName, " \u2022 ", item.sentAt))))))));
}
