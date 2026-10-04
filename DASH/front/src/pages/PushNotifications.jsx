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
  const [result, setResult] = useState(null); // { ok, error }
  const [sentHistory, setSentHistory] = useState([]);

  useEffect(() => {
    if (target === "user" || target === "plan") {
      setLoadingUsers(true);
      apiClient.get("/admin/notifications/users")
        .then((res) => {
          setUsers(res.data || []);
          setFilteredUsers(res.data || []);
        })
        .catch(() => setUsers([]))
        .finally(() => setLoadingUsers(false));
    }
  }, [target]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredUsers(users.filter(u =>
        (u.name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.username || "").toLowerCase().includes(q)
      ));
    }
  }, [searchQuery, users]);

  const selectedUser = users.find(u => u._id === userId);

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
      setSentHistory(prev => [{
        id: Date.now(),
        target,
        targetName: target === "all" ? "جميع المستخدمين" : target === "plan" ? (targetPlan === "pro" ? "باقة برو" : "الباقة المجانية") : (selectedUser?.name || userId),
        title: title.trim(),
        message: message.trim(),
        sentAt: new Date().toLocaleString("ar-EG"),
      }, ...prev].slice(0, 10));
      setTitle("");
      setMessage("");
    } catch (err) {
      setResult({ ok: false, error: err.response?.data?.error?.message || "حدث خطأ أثناء الإرسال" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
          <Bell className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">إرسال الإشعارات</h1>
          <p className="text-sm text-slate-500 mt-0.5">أرسل إشعارات فورية للمستخدمين عبر الموقع</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-slate-800 mb-5">إنشاء إشعار جديد</h2>
          <form onSubmit={handleSend} className="space-y-4">

            {/* Target selector */}
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">الجمهور المستهدف</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => { setTarget("all"); setUserId(""); }}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 font-medium text-sm transition-all ${
                    target === "all"
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  الكل
                </button>
                <button
                  type="button"
                  onClick={() => setTarget("plan")}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 font-medium text-sm transition-all ${
                    target === "plan"
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  حسب الباقة
                </button>
                <button
                  type="button"
                  onClick={() => setTarget("user")}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 font-medium text-sm transition-all ${
                    target === "user"
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <User className="w-4 h-4" />
                  مستخدم محدد
                </button>
              </div>
            </div>

            {/* User selector */}
            {target === "user" && (
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">اختر المستخدم</label>
                {loadingUsers ? (
                  <div className="flex items-center gap-2 text-slate-500 text-sm py-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري التحميل...
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute end-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="ابحث بالاسم أو البريد..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl pe-9 ps-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                    {userId && selectedUser && (
                      <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl px-3 py-2 text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span>تم اختيار: {selectedUser.name} ({selectedUser.email})</span>
                        <button type="button" onClick={() => setUserId("")} className="mr-auto text-indigo-400 hover:text-indigo-600 text-xs underline">إلغاء</button>
                      </div>
                    )}
                    <div className="border border-slate-100 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                      {filteredUsers.length === 0 ? (
                        <p className="text-center text-slate-400 text-sm py-4">لا يوجد مستخدمون</p>
                      ) : (
                        filteredUsers.map(u => (
                          <button
                            key={u._id}
                            type="button"
                            onClick={() => setUserId(u._id)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-start text-sm transition-colors border-b last:border-0 border-slate-50 ${
                              userId === u._id
                                ? "bg-indigo-50 text-indigo-700"
                                : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                              {(u.name || "?")[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{u.name}</p>
                              <p className="text-xs text-slate-400 truncate">{u.email}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Plan selector */}
            {target === "plan" && (
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">اختر الباقة</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTargetPlan("free")}
                    className={`flex items-center justify-center p-3 rounded-xl border-2 font-medium text-sm transition-all ${
                      targetPlan === "free"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    الباقة المجانية
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetPlan("pro")}
                    className={`flex items-center justify-center p-3 rounded-xl border-2 font-medium text-sm transition-all ${
                      targetPlan === "pro"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    باقة برو
                  </button>
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">عنوان الإشعار *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: تحديث جديد متاح!"
                maxLength={100}
                required
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <p className="text-xs text-slate-400 mt-1 text-end">{title.length}/100</p>
            </div>

            {/* Message */}
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">تفاصيل الإشعار (اختياري)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="أضف تفاصيل إضافية..."
                rows={3}
                maxLength={300}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
              <p className="text-xs text-slate-400 mt-1 text-end">{message.length}/300</p>
            </div>

            {/* Result feedback */}
            {result && (
              <div className={`flex items-start gap-2 rounded-xl p-3 text-sm ${
                result.ok
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}>
                {result.ok
                  ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                }
                <span>{result.ok ? "تم إرسال الإشعار بنجاح! 🎉" : result.error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={sending || !title.trim() || (target === "user" && !userId)}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm py-3 rounded-xl transition-colors"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? "جاري الإرسال..." : "إرسال الإشعار"}
            </button>
          </form>
        </div>

        {/* Preview + History */}
        <div className="space-y-4">
          {/* Preview */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-3">معاينة</h3>
            <div className="bg-slate-900 rounded-xl p-3 flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-semibold leading-snug">{title || "عنوان الإشعار..."}</p>
                {message && <p className="text-slate-400 text-xs mt-1 line-clamp-2">{message}</p>}
                <p className="text-slate-500 text-xs mt-1.5">الآن</p>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-400 bg-slate-50 rounded-lg p-2 text-center">
              الإشعار سيظهر على شاشة المستخدم مباشرة
            </div>
          </div>

          {/* History */}
          {sentHistory.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-3">آخر الإشعارات المرسلة</h3>
              <div className="space-y-2">
                {sentHistory.map((item) => (
                  <div key={item.id} className="bg-slate-50 rounded-xl p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700 truncate">{item.title}</span>
                      <span className={`shrink-0 ms-2 px-1.5 py-0.5 rounded-full font-bold text-[10px] ${
                        item.target === "all" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                      }`}>{item.target === "all" ? "الكل" : "فردي"}</span>
                    </div>
                    <p className="text-slate-400">{item.targetName} • {item.sentAt}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
