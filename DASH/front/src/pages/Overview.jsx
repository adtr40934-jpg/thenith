import { Users, CreditCard, Activity, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchStats } from "../services/adminApi.js";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function Overview() {
  const [data, setData] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalCards: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    {
      title: "إجمالي المستخدمين",
      value: data.totalUsers,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "الاشتراكات النشطة (Pro)",
      value: data.activeSubscriptions,
      icon: CreditCard,
      color: "text-indigo-600",
      bg: "bg-indigo-100",
    },
    {
      title: "الإيرادات",
      value: `$${data.revenue}`,
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
    {
      title: "إجمالي البطاقات",
      value: data.totalCards,
      icon: Activity,
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
  ];

  if (loading)
    return (
      <div className="p-8 text-center text-slate-500">جاري التحميل...</div>
    );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">
          نظرة عامة على المنصة
        </h2>
        <p className="text-slate-500 mt-1">
          إحصائيات الأداء السريعة لليوم (متصل بالباك إند)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4"
            >
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}
              >
                <Icon className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">
                  {stat.title}
                </p>
                <h3 className="text-2xl font-black text-slate-800">
                  {stat.value}
                </h3>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm min-h-[400px]">
          <h3 className="text-lg font-bold text-slate-800 mb-6">
            مصادر المستخدمين (Referrals)
          </h3>
          {!data.referrers || data.referrers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Activity className="w-12 h-12 mb-3 opacity-20" />
              <p>لا توجد بيانات كافية للرسم البياني</p>
            </div>
          ) : (
            <div className="h-72 w-full" >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.referrers}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="name"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {data.referrers.map((entry, index) => {
                      const COLORS = [
                        "#6366f1",
                        "#10b981",
                        "#f59e0b",
                        "#f43f5e",
                        "#8b5cf6",
                      ];
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value} مستخدم`, name]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
