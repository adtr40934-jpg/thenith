import {
  LayoutDashboard,
  Users,
  CreditCard,
  Bell,
  ShieldAlert,
  Store,
  PieChart,
  Tag,
  MessageSquare,
  Headphones,
  Settings,
  FileText,
} from "lucide-react";

export const DASHBOARD_NAV_ITEMS = [
  { id: "overview", path: "/", icon: LayoutDashboard, label: "نظرة عامة" },
  { id: "users", path: "/users", icon: Users, label: "إدارة المستخدمين" },
  { id: "subscriptions", path: "/subscriptions", icon: CreditCard, label: "الاشتراكات والباقات" },
  { id: "subscriptions-stats", path: "/subscriptions-stats", icon: PieChart, label: "إحصائيات الاشتراكات" },
  { id: "store", path: "/store", icon: Store, label: "إدارة المتجر" },
  { id: "landing", path: "/landing", icon: FileText, label: "إدارة اللاندنج" },
  { id: "coupons", path: "/coupons", icon: Tag, label: "كوبونات الخصم" },
  { id: "inbox", path: "/inbox", icon: MessageSquare, label: "صندوق الرسائل" },
  { id: "support", path: "/support", icon: Headphones, label: "مكتب الدعم الفني" },
  { id: "push-notifications", path: "/push-notifications", icon: Bell, label: "إرسال الإشعارات" },
  { id: "security", path: "/security", icon: ShieldAlert, label: "التدقيق الأمني" },
  { id: "settings", path: "/settings", icon: Settings, label: "الإعدادات" },
];

export default DASHBOARD_NAV_ITEMS;