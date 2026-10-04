import { useState, useEffect } from "react";
import { fetchSubscriptionStats, fetchFilteredUsers } from "../services/adminApi.js";
import {
  Loader2,
  TrendingUp,
  Users,
  CreditCard,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Calendar,
  X,
  Mail,
  Phone,
  ExternalLink,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full flex flex-col max-h-[90vh] ${wide ? "max-w-4xl" : "max-w-lg"}`}
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

export default function SubscriptionAnalytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("monthly"); // daily, monthly, yearly
  const [filterType, setFilterType] = useState(null); // 'total', 'free', 'pro', 'lost', 'abandoned'
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const openFilteredModal = async (type) => {
    setFilterType(type);
    setLoadingUsers(true);
    try {
      const data = await fetchFilteredUsers(type);
      setFilteredUsers(data);
    } catch (e) {
      alert("Error fetching users: " + e.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionStats()
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-rose-500 gap-3">
        <AlertCircle className="w-10 h-10" />
        <p className="font-bold">{error}</p>
      </div>
    );
  }

  const {
    statusCounts,
    planCounts,
    totalUsers,
    freeUsersCount,
    proUsersCount,
    lostSubscriptionsCount,
    abandonedUsersCount,
    pendingUsersCount,
    metrics,
    trend,
    recentPayments,
  } = stats;

  const activeCount = statusCounts.active || 0;
  const currentMetric = metrics[timeRange];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            إحصائيات الاشتراكات الدقيقة
          </h2>
          <p className="text-slate-500 mt-1">
            متابعة شاملة ويومية لنمو الإيرادات وحالات العملاء.
          </p>
        </div>
        <div className="flex items-center bg-slate-200/50 p-1.5 rounded-2xl w-max">
          <button
            onClick={() => setTimeRange("daily")}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${timeRange === "daily" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-white/50"}`}
          >
            اليوم
          </button>
          <button
            onClick={() => setTimeRange("monthly")}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${timeRange === "monthly" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-white/50"}`}
          >
            الشهر
          </button>
          <button
            onClick={() => setTimeRange("yearly")}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${timeRange === "yearly" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-white/50"}`}
          >
            السنة
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
        {/* Dynamic Revenue Based on Range */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 end-0 w-24 h-24 bg-indigo-50 rounded-es-full -z-10 opacity-50" />
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-slate-500">
              {timeRange === "daily"
                ? "إيرادات اليوم"
                : timeRange === "monthly"
                  ? "إيرادات الشهر"
                  : "إيرادات السنة"}
            </p>
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-800">
            {currentMetric.revenue.toLocaleString()}{" "}
            <span className="text-sm font-normal text-slate-400">ج.م</span>
          </p>
          {timeRange === "monthly" && (
            <div
              className={`mt-2 flex items-center gap-1 text-xs font-bold ${currentMetric.growth >= 0 ? "text-emerald-500" : "text-rose-500"}`}
            >
              <TrendingUp
                className={`w-3 h-3 ${currentMetric.growth < 0 ? "rotate-180" : ""}`}
              />
              <span>
                {Math.abs(currentMetric.growth).toFixed(1)}% عن الشهر الماضي
              </span>
            </div>
          )}
          {timeRange !== "monthly" && (
            <p className="mt-2 text-xs font-bold text-slate-400">
              {currentMetric.count} عملية دفع ناجحة
            </p>
          )}
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-slate-500">
              إجمالي الإيرادات (All Time)
            </p>
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-800">
            {metrics.total.toLocaleString()}{" "}
            <span className="text-sm font-normal text-slate-400">ج.م</span>
          </p>
          <p className="text-xs text-slate-400 mt-2 font-medium">
            تراكمي لجميع الباقات
          </p>
        </div>

        {/* Total Active / Total Users */}
        <div
          onClick={() => openFilteredModal("total")}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-slate-500 group-hover:text-emerald-600 transition-colors">
              إجمالي المستخدمين
            </p>
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-800">
            {totalUsers.toLocaleString()}
          </p>
          <p className="text-xs text-emerald-500 mt-2 font-bold flex items-center gap-1">
            <ExternalLink className="w-3 h-3" /> عرض بياناتهم
          </p>
        </div>

        {/* Free Plan */}
        <div
          onClick={() => openFilteredModal("free")}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-slate-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-slate-500 group-hover:text-slate-800 transition-colors">
              الباقة المجانية
            </p>
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-slate-200 transition-colors">
              <Users className="w-4 h-4 text-slate-600" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-800">
            {freeUsersCount.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-2 font-bold flex items-center gap-1">
            <ExternalLink className="w-3 h-3" /> عرض الباقة المجانية
          </p>
        </div>

        {/* Pro Plan */}
        <div
          onClick={() => openFilteredModal("pro")}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-slate-500 group-hover:text-indigo-600 transition-colors">
              باقة برو
            </p>
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
              <Activity className="w-4 h-4 text-indigo-600" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-800">
            {proUsersCount.toLocaleString()}
          </p>
          <p className="text-xs text-indigo-500 mt-2 font-bold flex items-center gap-1">
            <ExternalLink className="w-3 h-3" /> عرض باقة برو
          </p>
        </div>

        {/* Cancelled/Expired (Clickable) */}
        <div
          onClick={() => openFilteredModal("lost")}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:shadow-md hover:border-rose-300 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-slate-500 group-hover:text-rose-600 transition-colors">
              الاشتراكات المفقودة
            </p>
            <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center group-hover:bg-rose-100 transition-colors">
              <XCircle className="w-4 h-4 text-rose-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-slate-800">
              {lostSubscriptionsCount.toLocaleString()}
            </p>
          </div>
          <p className="text-xs text-rose-500 mt-2 font-bold flex items-center gap-1">
            <ExternalLink className="w-3 h-3" /> عرض المفقودين
          </p>
        </div>

        {/* Abandoned Checkouts */}
        <div
          onClick={() => openFilteredModal("abandoned")}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:shadow-md hover:border-amber-300 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-slate-500 group-hover:text-amber-600 transition-colors">
              المنسحبين من الدفع
            </p>
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center group-hover:bg-amber-100 transition-colors">
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-slate-800">
              {(abandonedUsersCount || 0).toLocaleString()}
            </p>
          </div>
          <p className="text-xs text-amber-500 mt-2 font-bold flex items-center gap-1">
            <ExternalLink className="w-3 h-3" /> استهداف إعادة التسويق
          </p>
        </div>

        {/* Pending Payments */}
        <div
          onClick={() => openFilteredModal("pending")}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:shadow-md hover:border-blue-300 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-slate-500 group-hover:text-blue-600 transition-colors">
              المدفوعات المعلقة
            </p>
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-slate-800">
              {(pendingUsersCount || 0).toLocaleString()}
            </p>
          </div>
          <p className="text-xs text-blue-500 mt-2 font-bold flex items-center gap-1">
            <ExternalLink className="w-3 h-3" /> عرض بياناتهم
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Charts / Breakdowns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Revenue Trend Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-slate-800">
                نمو الإيرادات (آخر 6 أشهر)
              </h3>
            </div>
            {trend.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">
                لا توجد بيانات كافية للرسم البياني
              </p>
            ) : (
              <div className="h-64 w-full mt-4" >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={trend}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorRevenue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#6366f1"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#6366f1"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e2e8f0"
                    />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      tickFormatter={(val) => `${val}`}
                      dx={-10}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow:
                          "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                      }}
                      formatter={(value) => [`${value} ج.م`, "الإيرادات"]}
                      labelStyle={{
                        fontWeight: "bold",
                        color: "#1e293b",
                        marginBottom: "4px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#6366f1"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Recent Payments Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">
                أحدث عمليات الدفع الناجحة
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-end">
                <thead>
                  <tr className="text-xs font-bold text-slate-500 uppercase border-b border-slate-100 bg-slate-50/50">
                    <th className="py-3 px-5">المستخدم</th>
                    <th className="py-3 px-5">الباقة</th>
                    <th className="py-3 px-5">المبلغ</th>
                    <th className="py-3 px-5">التاريخ</th>
                    <th className="py-3 px-5">بواسطة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentPayments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-slate-400 text-sm"
                      >
                        لا توجد مدفوعات حديثة
                      </td>
                    </tr>
                  ) : (
                    recentPayments.map((p) => (
                      <tr
                        key={p._id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="py-3 px-5">
                          <p className="font-bold text-slate-800 text-sm">
                            {p.userId?.name || "مستخدم محذوف"}
                          </p>
                          <p className="text-xs text-slate-500" >
                            {p.userId?.email || ""}
                          </p>
                        </td>
                        <td className="py-3 px-5">
                          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold uppercase">
                            {p.referenceId?.planId?.name?.ar || p.referenceId?.planId?.name?.en || p.referenceId?.planId?.key || "—"}
                          </span>
                        </td>
                        <td className="py-3 px-5 font-black text-slate-800 text-sm">
                          {p.amount} ج.م
                        </td>
                        <td className="py-3 px-5 text-sm text-slate-500">
                          {new Date(p.paidAt).toLocaleDateString("ar-EG")}
                        </td>
                        <td className="py-3 px-5 text-xs font-medium text-slate-400 capitalize">
                          {p.provider}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Breakdown */}
        <div className="space-y-6">
          {/* Plan Distribution */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-5">
              توزيع الباقات النشطة
            </h3>
            {planCounts.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">
                لا توجد باقات نشطة
              </p>
            ) : (
              <div className="space-y-4">
                {planCounts.map((p, i) => {
                  const percentage =
                    activeCount > 0
                      ? ((p.count / activeCount) * 100).toFixed(0)
                      : 0;
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-bold text-slate-700">
                          {typeof p.name === 'object' ? (p.name?.ar || p.name?.en) : p.name}
                        </span>
                        <span className="font-bold text-slate-500">
                          {percentage}% ({p.count})
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Status Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-5">
              حالة جميع الاشتراكات
            </h3>
            <div className="space-y-3">
              {[
                {
                  key: "active",
                  label: "نشط",
                  icon: CheckCircle2,
                  color: "text-emerald-500",
                  bg: "bg-emerald-50",
                },
                {
                  key: "trialing",
                  label: "فترة تجريبية",
                  icon: Clock,
                  color: "text-amber-500",
                  bg: "bg-amber-50",
                },
                {
                  key: "pending",
                  label: "معلق",
                  icon: Loader2,
                  color: "text-blue-500",
                  bg: "bg-blue-50",
                },
                {
                  key: "expired",
                  label: "منتهي",
                  icon: XCircle,
                  color: "text-rose-500",
                  bg: "bg-rose-50",
                },
                {
                  key: "cancelled",
                  label: "ملغى",
                  icon: XCircle,
                  color: "text-slate-500",
                  bg: "bg-slate-50",
                },
              ].map((s) => (
                <div
                  key={s.key}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.bg}`}
                    >
                      <s.icon className={`w-4 h-4 ${s.color}`} />
                    </div>
                    <span className="font-bold text-slate-700 text-sm">
                      {s.label}
                    </span>
                  </div>
                  <span className="font-black text-slate-800">
                    {statusCounts[s.key] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filtered Users Modal */}
      {filterType && (
        <Modal
          title={
            filterType === "total"
              ? "إجمالي المستخدمين"
              : filterType === "free"
                ? "مستخدمي الباقة المجانية"
                : filterType === "pro"
                  ? "مستخدمي باقة برو"
                  : filterType === "lost"
                    ? "الاشتراكات المفقودة (ملغى/منتهي)"
                    : filterType === "abandoned"
                      ? "العملاء المنسحبين من الدفع"
                      : "المدفوعات المعلقة"
          }
          onClose={() => setFilterType(null)}
          wide
        >
          <div className="space-y-4">
            {loadingUsers ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-bold">
                لا يوجد مستخدمين لعرضهم.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-2">
                {filteredUsers.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => setSelectedUser(user)}
                    className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Users className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {user.name || "بدون اسم"}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5" dir="ltr">
                          {user.phone || user.email || "-"}
                        </p>
                      </div>
                    </div>
                    <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* User Full Detail Modal */}
      {selectedUser && (
        <Modal
          title="بيانات العميل الكاملة"
          onClose={() => setSelectedUser(null)}
          wide
        >
          <div className="space-y-5 py-2" dir="rtl">
            {/* Header: Avatar + Name */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow shrink-0">
                {selectedUser.avatar ? (
                  <img src={selectedUser.avatar} className="w-full h-full object-cover" />
                ) : (
                  <Users className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">{selectedUser.name || "بدون اسم"}</h3>
                <p className="text-sm text-slate-500 font-medium">{selectedUser.email}</p>
                {selectedUser.phone && (
                  <p className="text-sm text-slate-500 font-medium" dir="ltr">{selectedUser.phone}</p>
                )}
              </div>
            </div>

            {/* Contact Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <a
                href={`mailto:${selectedUser.email}`}
                className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors justify-center"
              >
                <Mail className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-bold text-blue-700">إرسال إيميل</span>
              </a>
              {selectedUser.phone && (
                <a
                  href={`tel:${selectedUser.phone}`}
                  className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors justify-center"
                >
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-bold text-emerald-700">اتصال</span>
                </a>
              )}
            </div>

            {/* Transaction Details */}
            {selectedUser._lastTransaction && (() => {
              const tx = selectedUser._lastTransaction;
              const txDate = tx.updatedAt || tx.createdAt;
              return (
                <div className="space-y-3">
                  <h4 className="font-black text-slate-700 text-sm flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-indigo-500" />
                    تفاصيل آخر معاملة مالية
                  </h4>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Status */}
                    <div className="p-3 bg-white border border-slate-200 rounded-xl">
                      <p className="text-xs text-slate-500 font-bold mb-1">الحالة</p>
                      <span className={`text-xs font-black px-2 py-1 rounded-lg ${
                        tx.status === "pending" ? "bg-amber-50 text-amber-700" :
                        tx.status === "cancelled" ? "bg-rose-50 text-rose-700" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {tx.status === "pending" ? "معلقة" : tx.status === "cancelled" ? "ملغية" : tx.status}
                      </span>
                    </div>

                    {/* Amount */}
                    <div className="p-3 bg-white border border-slate-200 rounded-xl">
                      <p className="text-xs text-slate-500 font-bold mb-1">المبلغ</p>
                      <p className="font-black text-slate-800">{tx.amount?.toLocaleString()} ج.م</p>
                    </div>

                    {/* Method */}
                    <div className="p-3 bg-white border border-slate-200 rounded-xl">
                      <p className="text-xs text-slate-500 font-bold mb-1">وسيلة الدفع</p>
                      <p className="font-bold text-slate-700 text-sm">{tx.paymentMethodName || `Method #${tx.paymentMethodId}` || "—"}</p>
                    </div>

                    {/* Date */}
                    <div className="p-3 bg-white border border-slate-200 rounded-xl">
                      <p className="text-xs text-slate-500 font-bold mb-1">التاريخ</p>
                      <p className="font-bold text-slate-700 text-sm" dir="ltr">
                        {txDate ? new Date(txDate).toLocaleString("ar-EG") : "—"}
                      </p>
                    </div>

                    {/* Intent Key */}
                    {tx.intentKey && (
                      <div className="col-span-2 p-3 bg-white border border-slate-200 rounded-xl">
                        <p className="text-xs text-slate-500 font-bold mb-1">Intent Key (Fawaterak)</p>
                        <p className="font-mono text-xs text-slate-700 break-all" dir="ltr">{tx.intentKey}</p>
                      </div>
                    )}

                    {/* Fawaterak Invoice ID */}
                    {(tx.fawaterakResponse?.invoice_id || tx.fawaterakResponse?.transaction_id) && (
                      <div className="col-span-2 p-3 bg-white border border-slate-200 rounded-xl">
                        <p className="text-xs text-slate-500 font-bold mb-1">رقم الفاتورة (Fawaterak)</p>
                        <p className="font-mono text-sm font-black text-indigo-700" dir="ltr">
                          {tx.fawaterakResponse?.invoice_id || tx.fawaterakResponse?.transaction_id}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Raw Fawaterak Response */}
                  {tx.fawaterakResponse && (
                    <details className="group">
                      <summary className="cursor-pointer text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-2 p-2">
                        <span>عرض الرد الكامل من فواتيرك</span>
                        <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                      </summary>
                      <pre className="mt-2 p-3 bg-slate-900 text-green-400 text-xs rounded-xl overflow-x-auto max-h-48 font-mono" dir="ltr">
                        {JSON.stringify(tx.fawaterakResponse, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              );
            })()}
          </div>
        </Modal>
      )}
    </div>
  );
}
