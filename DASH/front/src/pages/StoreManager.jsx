import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Loader2,
  Image as ImageIcon,
  Store,
  AlertTriangle,
  Check,
  XCircle,
  TrendingUp,
  PackageSearch,
  PackageX,
  Package,
  ShoppingBag,
  Truck,
  CheckCircle2,
  RotateCcw,
  LayoutGrid,
  List,
  User,
  FileText,
  Edit3,
  CreditCard,
} from "lucide-react";
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadAdminImage,
  fetchStoreStats,
  fetchOrders,
  updateOrderStatus,
  deleteOrder,
  fetchStoreSettings,
  updateStoreSettings,
  fetchShippingRates,
  createShippingRate,
  updateShippingRate,
  deleteShippingRate,
  bulkUpdateShippingCost,
} from "../services/adminApi.js";

// ─── Reusable Components ────────────────────────────────────────────────────────

const parseLocalizedName = (name) => {
  if (!name) return "";
  if (typeof name === "object") return name.ar || name.en || "";
  if (typeof name === "string" && name.startsWith("{") && name.includes("ar:") && name.includes("en:")) {
    try {
      const arMatch = name.match(/ar:\s*['"]([^'"]+)['"]/);
      if (arMatch) return arMatch[1];
    } catch {
      return name;
    }
  }
  return name;
};

function Badge({ children, variant = "slate" }) {
  const v = {
    green: "bg-emerald-100 text-emerald-700",
    red: "bg-rose-100 text-rose-700",
    indigo: "bg-indigo-100 text-indigo-700",
    amber: "bg-amber-100 text-amber-700",
    blue: "bg-blue-100 text-blue-700",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${v[variant] || v.slate}`}
    >
      {children}
    </span>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full flex flex-col max-h-[90vh] ${wide ? "max-w-3xl" : "max-w-lg"}`}
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

function ConfirmModal({ message, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center text-center gap-5">
        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-rose-600" />
        </div>
        <p className="text-slate-700 font-medium">{message}</p>
        <div className="flex gap-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 border border-slate-200 py-2.5 rounded-xl font-bold text-slate-700 hover:bg-slate-50"
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-rose-600 text-white py-2.5 rounded-xl font-bold hover:bg-rose-700 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />} تأكيد
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Shipping Tab ─────────────────────────────────────────────────────────────
function ShippingRateForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(
    initial || {
      governorate: "",
      governorateAr: "",
      cost: 0,
      isActive: true,
    }
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">المحافظة (En)</label>
          <input
            value={form.governorate}
            onChange={(e) => setForm({ ...form, governorate: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">المحافظة (Ar)</label>
          <input
            value={form.governorateAr}
            onChange={(e) => setForm({ ...form, governorateAr: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1">تكلفة الشحن (ج.م)</label>
        <input
          type="number"
          value={form.cost}
          onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          className="w-4 h-4 text-indigo-600 rounded"
        />
        <span className="text-sm font-bold text-slate-700">مفعل</span>
      </label>
      <div className="flex gap-3 justify-end mt-6">
        <button
          onClick={onCancel}
          className="px-4 py-2 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
        >
          إلغاء
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={saving}
          className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          حفظ المحافظة
        </button>
      </div>
    </div>
  );
}

// ─── Products Tab ─────────────────────────────────────────────────────────────

function ProductForm({ initial, onSave, onCancel, saving, error }) {
  const getSafeForm = (init) => {
    if (!init) return { name: { ar: "", en: "" }, description: { ar: "", en: "" }, images: [], price: 0, quantity: 0, sku: "", isActive: true };
    return {
      ...init,
      name: typeof init.name === 'string' ? { ar: init.name, en: init.name } : { ar: init.name?.ar || "", en: init.name?.en || "" },
      description: typeof init.description === 'string' ? { ar: init.description, en: init.description } : { ar: init.description?.ar || "", en: init.description?.en || "" }
    };
  };
  const [form, setForm] = useState(getSafeForm(initial));
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return alert("الرجاء اختيار صورة صالحة");

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const { url } = await uploadAdminImage(
            reader.result,
            "thenith_store",
          );
          setForm((prev) => ({ ...prev, images: [...prev.images, url] }));
        } catch (err) {
          alert("فشل رفع الصورة");
        } finally {
          setUploading(false);
        }
      };
    } catch (err) {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">
                اسم المنتج (عربي)
              </label>
              <input
                type="text"
                value={form.name.ar}
                onChange={(e) => setForm({ ...form, name: { ...form.name, ar: e.target.value } })}
                className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">
                اسم المنتج (إنجليزي)
              </label>
              <input
                type="text"
                value={form.name.en}
                onChange={(e) => setForm({ ...form, name: { ...form.name, en: e.target.value } })}
                className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                dir="ltr"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">الوصف (عربي)</label>
            <textarea
              value={form.description.ar}
              rows={3}
              onChange={(e) =>
                setForm({ ...form, description: { ...form.description, ar: e.target.value } })
              }
              className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">الوصف (إنجليزي)</label>
            <textarea
              value={form.description.en}
              rows={3}
              onChange={(e) =>
                setForm({ ...form, description: { ...form.description, en: e.target.value } })
              }
              className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              dir="ltr"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">السعر</label>
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: Number(e.target.value) })
                }
                className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">
                الكمية بالمخزن
              </label>
              <input
                type="number"
                min="0"
                value={form.quantity}
                onChange={(e) =>
                  setForm({ ...form, quantity: Number(e.target.value) })
                }
                className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">
                SKU (اختياري)
              </label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}

                className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  className={`w-10 h-5 rounded-full transition-colors relative ${form.isActive ? "bg-emerald-500" : "bg-slate-300"}`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${form.isActive ? "start-5" : "start-0.5"}`}
                  />
                </div>
                <span
                  className={`text-sm font-bold ${form.isActive ? "text-emerald-600" : "text-slate-500"}`}
                >
                  {form.isActive ? "متاح" : "مخفي"}
                </span>
              </label>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-700">
              صور المنتج
            </label>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-indigo-100 transition-colors"
            >
              {uploading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Plus className="w-3 h-3" />
              )}{" "}
              إضافة صورة
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {form.images.map((img, i) => (
              <div
                key={i}
                className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group"
              >
                <img
                  src={img}
                  alt="Product"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      images: prev.images.filter((_, idx) => idx !== i),
                    }))
                  }
                  className="absolute top-2 end-2 p-1.5 bg-white/90 text-rose-500 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {i === 0 && (
                  <span className="absolute bottom-2 start-2 px-2 py-0.5 bg-slate-900/70 text-white text-[10px] font-bold rounded">
                    الرئيسية
                  </span>
                )}
              </div>
            ))}
            {form.images.length === 0 && (
              <div className="col-span-2 aspect-video flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-400">
                <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-sm">لا توجد صور للمنتج</span>
              </div>
            )}
          </div>
        </div>
      </div>
      {error && (
        <p className="text-rose-600 text-sm bg-rose-50 px-4 py-2.5 rounded-xl">
          {error}
        </p>
      )}
      <div className="flex gap-3 pt-4 border-t border-slate-100">
        <button
          onClick={onCancel}
          className="flex-1 border border-slate-200 py-3 rounded-xl font-bold text-slate-700 hover:bg-slate-50"
        >
          إلغاء
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={saving}
          className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}{" "}
          حفظ
        </button>
      </div>
    </div>
  );
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────

const ORDER_STATUS_MAP = {
  received: { label: "جاري المراجعة", color: "slate", icon: Package },
  processing: { label: "جاري التجهيز", color: "indigo", icon: Loader2 },
  shipped: { label: "في الشحن", color: "amber", icon: Truck },
  delivered: { label: "تم التسليم", color: "green", icon: CheckCircle2 },
  returned: { label: "مرتجع", color: "rose", icon: RotateCcw },
  cancelled: { label: "ملغى", color: "rose", icon: XCircle },
};
const getPaymentMethodInfo = (method) => {
  switch (method) {
    case "card": return { label: "دفع أونلاين (فيزا/ماستركارد)", color: "indigo" };
    case "fawry": return { label: "دفع أونلاين (فوري)", color: "amber" };
    case "meeza": return { label: "دفع أونلاين (ميزة/محفظة إلكترونية)", color: "emerald" };
    case "online": return { label: "دفع أونلاين", color: "blue" };
    case "cash_on_delivery":
    default: return { label: "الدفع عند الاستلام", color: "slate" };
  }
};

function OrderStatusModal({ order, onClose, onSaved }) {
  const [status, setStatus] = useState(order.status);
  const [reason, setReason] = useState(order.returnReason || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateOrderStatus(order._id, {
        status,
        returnReason: status === "returned" ? reason : "",
      });
      onSaved();
      onClose();
    } catch (e) {
      alert(e.message);
      setLoading(false);
    }
  };

  return (
    <Modal title={`تحديث حالة الطلب #${order.orderNumber}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">الحالة</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(ORDER_STATUS_MAP).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setStatus(key)}
                className={`p-3 rounded-xl border-2 flex items-center gap-2 text-sm font-bold transition-all ${status === key ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
              >
                <val.icon className="w-4 h-4" /> {val.label}
              </button>
            ))}
          </div>
        </div>
        {status === "returned" && (
          <div className="space-y-1.5 animate-in fade-in zoom-in-95">
            <label className="text-sm font-bold text-slate-700">
              سبب الترجيع
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="اكتب سبب الترجيع هنا..."
              className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            />
            <p className="text-xs text-slate-500">
              سيتم إرجاع كمية المنتجات للمخزن تلقائياً.
            </p>
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold flex justify-center mt-2 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "حفظ الحالة"
          )}
        </button>
      </div>
    </Modal>
  );
}

function OrderDetailsModal({ order, onClose }) {
  if (!order) return null;
  const statusObj = ORDER_STATUS_MAP[order.status] || ORDER_STATUS_MAP.received;
  
  return (
    <Modal title={`تفاصيل الطلب #${order.orderNumber}`} onClose={onClose} wide>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-500" /> بيانات العميل
            </h4>
            <div className="space-y-2 text-sm">
              <p><span className="text-slate-500">الاسم:</span> <span className="font-bold text-slate-700">{order.customer?.name}</span></p>
              <p><span className="text-slate-500">التليفون:</span> <span className="font-bold text-slate-700" dir="ltr">{order.customer?.phone}</span></p>
              <p><span className="text-slate-500">الإيميل:</span> <span className="font-bold text-slate-700">{order.customer?.email || "-"}</span></p>
              <p><span className="text-slate-500">المحافظة:</span> <span className="font-bold text-slate-700">{order.customer?.city}</span></p>
              <p><span className="text-slate-500">العنوان:</span> <span className="font-bold text-slate-700">{order.customer?.address}</span></p>
            </div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-500" /> تفاصيل الطلب
            </h4>
            <div className="space-y-2 text-sm">
              <p><span className="text-slate-500">تاريخ الطلب:</span> <span className="font-bold text-slate-700">{new Date(order.createdAt).toLocaleString("ar-EG")}</span></p>
              <p><span className="text-slate-500">الحالة:</span> <span className={`font-bold text-${statusObj.color}-600`}>{statusObj.label}</span></p>
              <p><span className="text-slate-500">طريقة الدفع:</span> <span className="font-bold text-slate-700">{getPaymentMethodInfo(order.paymentMethod).label}</span></p>
              <p><span className="text-slate-500">حالة الدفع:</span> <span className="font-bold text-slate-700">{order.paymentStatus === "paid" ? "مدفوع" : "غير مدفوع"}</span></p>
              <p><span className="text-slate-500">الإجمالي:</span> <span className="font-black text-indigo-600">{order.totalAmount} ج.م</span></p>
            </div>
          </div>
        </div>

        {order.paymentTransactionId && typeof order.paymentTransactionId === "object" && (
          <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
            <h4 className="font-bold text-indigo-800 mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> بيانات فواتيرك (Fawaterak)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p><span className="text-indigo-500/80 font-medium">Provider:</span> <span className="font-bold text-slate-700">{order.paymentTransactionId.provider || "-"}</span></p>
                <p><span className="text-indigo-500/80 font-medium">Intent Key:</span> <span className="font-mono font-bold text-slate-700 select-all">{order.paymentTransactionId.intentKey || "-"}</span></p>
                {order.transactionId && (
                  <p><span className="text-indigo-500/80 font-medium">Transaction ID:</span> <span className="font-mono font-bold text-slate-700 select-all">{order.transactionId}</span></p>
                )}
                {order.fawaterakRef && (
                  <p><span className="text-indigo-500/80 font-medium">Fawaterak Ref:</span> <span className="font-mono font-bold text-slate-700 select-all">{order.fawaterakRef}</span></p>
                )}
                {order.paymentMethodName && (
                  <p><span className="text-indigo-500/80 font-medium">Payment Method Name:</span> <span className="font-bold text-slate-700">{order.paymentMethodName}</span></p>
                )}
              </div>
              <div className="space-y-2">
                <p><span className="text-indigo-500/80 font-medium">Payment Data:</span></p>
                {order.paymentTransactionId.paymentData ? (
                  <pre className="text-xs bg-white p-2 rounded border border-slate-200 overflow-auto max-h-32 ltr text-left">
                    {JSON.stringify(order.paymentTransactionId.paymentData, null, 2)}
                  </pre>
                ) : (
                  <span className="text-slate-500">-</span>
                )}
                
                <p><span className="text-indigo-500/80 font-medium mt-2 block">Webhook Response:</span></p>
                {order.paymentTransactionId.fawaterakResponse ? (
                  <pre className="text-xs bg-white p-2 rounded border border-slate-200 overflow-auto max-h-32 ltr text-left">
                    {JSON.stringify(order.paymentTransactionId.fawaterakResponse, null, 2)}
                  </pre>
                ) : (
                  <span className="text-slate-500">-</span>
                )}
              </div>
            </div>
          </div>
        )}

        <div>
          <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-indigo-500" /> المنتجات المطلوبة
          </h4>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-end text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2 px-4 font-bold">المنتج</th>
                  <th className="py-2 px-4 font-bold">السعر</th>
                  <th className="py-2 px-4 font-bold">الكمية</th>
                  <th className="py-2 px-4 font-bold">المجموع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-700">{typeof item.name === 'string' ? parseLocalizedName(item.name) : item.name?.ar}</td>
                    <td className="py-3 px-4 text-slate-600">{item.price} ج.م</td>
                    <td className="py-3 px-4 text-indigo-600 font-bold">{item.quantity}x</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{item.price * item.quantity} ج.م</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Admin Checkout Modal ──────────────────────────────────────────────────────

function AdminCheckoutModal({ cart, setCart, onClose, shippingRates, onSaved }) {
  const [loading, setLoading] = useState(false);
  const [selectedGov, setSelectedGov] = useState("");
  const [shippingCost, setShippingCost] = useState(0);

  const totalPrice = cart.reduce((acc, item) => acc + item.price * item.adminQty, 0);
  const finalTotal = totalPrice + shippingCost;

  const handleGovChange = (e) => {
    const govId = e.target.value;
    setSelectedGov(govId);
    const rate = shippingRates.find((r) => r._id === govId);
    setShippingCost(rate ? rate.cost : 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.target);
      const govRate = shippingRates.find((r) => r._id === selectedGov);
      
      const orderData = {
        customer: {
          name: formData.get("name"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          address: formData.get("address"),
          city: govRate ? govRate.governorateAr : "Unknown",
          country: "مصر",
        },
        items: cart.map(item => ({
          productId: item._id,
          name: typeof item.name === 'string' ? parseLocalizedName(item.name) : item.name?.ar,
          price: item.price,
          quantity: item.adminQty
        })),
        totalAmount: finalTotal,
        paymentMethod: formData.get("paymentMethod")
      };

      const apiClient = (await import("../api/client.js")).default;
      await apiClient.post("/checkout/order", orderData);
      
      alert("تم إنشاء الطلب بنجاح!");
      setCart([]);
      onSaved();
      onClose();
    } catch (err) {
      alert("حدث خطأ أثناء إتمام الطلب.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="إتمام طلب المشرف" onClose={onClose} wide>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">الاسم بالكامل</label>
            <input required type="text" name="name" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">رقم التليفون</label>
              <input required type="text" name="phone" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">البريد الإلكتروني (اختياري)</label>
              <input type="email" name="email" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">المحافظة</label>
            <select required value={selectedGov} onChange={handleGovChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
              <option value="" disabled>اختر المحافظة</option>
              {shippingRates.map((rate) => (
                <option key={rate._id} value={rate._id}>{rate.governorateAr}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">العنوان بالتفصيل</label>
            <input required type="text" name="address" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">طريقة الدفع</label>
            <select name="paymentMethod" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
              <option value="cash_on_delivery">الدفع عند الاستلام</option>
              <option value="online">دفع إلكتروني</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold mt-4 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "تأكيد الطلب"}
          </button>
        </form>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <h4 className="font-bold text-slate-800 mb-3">المنتجات في السلة</h4>
          <div className="space-y-3 mb-4">
            {cart.map((item) => (
              <div key={item._id} className="flex justify-between items-center">
                <div className="text-sm">
                  <span className="font-bold text-indigo-600 ml-2">{item.adminQty}x</span>
                  {typeof item.name === 'string' ? parseLocalizedName(item.name) : item.name?.ar}
                </div>
                <div className="text-sm font-bold text-slate-700">{item.price * item.adminQty} ج.م</div>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-200 pt-3 space-y-2 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>المجموع:</span>
              <span>{totalPrice} ج.م</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>الشحن:</span>
              <span>{shippingCost} ج.م</span>
            </div>
            <div className="flex justify-between font-bold text-lg text-slate-800 pt-2 border-t border-slate-200">
              <span>الإجمالي:</span>
              <span className="text-indigo-600">{finalTotal} ج.م</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main StoreManager ────────────────────────────────────────────────────────


export default function StoreManager() {
  const [activeTab, setActiveTab] = useState("stats");

  // Data
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [storeSettings, setStoreSettings] = useState(null);
  const [shippingRates, setShippingRates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [addModal, setAddModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteProductItem, setDeleteProductItem] = useState(null);
  const [orderToUpdate, setOrderToUpdate] = useState(null);
  const [deleteOrderConfirm, setDeleteOrderConfirm] = useState(null);
  const [viewOrderDetails, setViewOrderDetails] = useState(null);
  const [editShippingRate, setEditShippingRate] = useState(null);
  const [deleteShippingRateItem, setDeleteShippingRateItem] = useState(null);
  const [addShippingRateModal, setAddShippingRateModal] = useState(false);
  const [bulkCostModal, setBulkCostModal] = useState(false);
  const [shippingViewMode, setShippingViewMode] = useState("grid"); // 'grid' | 'list'
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState("");
  
  const [adminCart, setAdminCart] = useState([]);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [orderFilter, setOrderFilter] = useState("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [p, o, s, conf, rates] = await Promise.all([
        fetchProducts(),
        fetchOrders(),
        fetchStoreStats(),
        fetchStoreSettings(),
        fetchShippingRates(),
      ]);
      setProducts(p);
      setOrders(o);
      setStats(s);
      setStoreSettings(conf);
      setShippingRates(rates);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Product Actions
  const handleCreateProduct = async (form) => {
    setActionLoading(true);
    setFormError("");
    try {
      await createProduct(form);
      setAddModal(false);
      loadData();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setActionLoading(false);
    }
  };
  const handleUpdateProduct = async (form) => {
    setActionLoading(true);
    setFormError("");
    try {
      await updateProduct(editProduct._id, form);
      setEditProduct(null);
      loadData();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setActionLoading(false);
    }
  };
  const handleDeleteProduct = async () => {
    setActionLoading(true);
    try {
      await deleteProduct(deleteProductItem._id);
      setDeleteProductItem(null);
      loadData();
    } catch (e) {
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteOrder = async () => {
    setActionLoading(true);
    try {
      await deleteOrder(deleteOrderConfirm._id);
      setDeleteOrderConfirm(null);
      loadData();
    } catch (e) {
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateShippingRate = async (form) => {
    setActionLoading(true);
    try {
      await createShippingRate(form);
      setAddShippingRateModal(false);
      loadData();
    } catch (e) {
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateShippingRate = async (form) => {
    setActionLoading(true);
    try {
      await updateShippingRate(editShippingRate._id, form);
      setEditShippingRate(null);
      loadData();
    } catch (e) {
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteShippingRate = async () => {
    setActionLoading(true);
    try {
      await deleteShippingRate(deleteShippingRateItem._id);
      setDeleteShippingRateItem(null);
      loadData();
    } catch (e) {
    } finally {
      setActionLoading(false);
    }
  };

  const handleGlobalShippingMode = async (mode, cost = 0) => {
    setActionLoading(true);
    try {
      const newSettings = {
        ...storeSettings,
        globalShippingMode: mode,
        globalShippingCost: cost,
      };
      await updateStoreSettings(newSettings);
      setStoreSettings(newSettings);
      if (mode === "fixed") setBulkCostModal(false);
      alert("تم تحديث إعدادات الشحن بنجاح");
    } catch (e) {
      alert("حدث خطأ أثناء التحديث");
    } finally {
      setActionLoading(false);
    }
  };

  const tabs = [
    { id: "stats", label: "الإحصائيات", icon: TrendingUp },
    { id: "orders", label: "الطلبات", icon: ShoppingBag },
    { id: "products", label: "المنتجات والمخزون", icon: Store },
    { id: "shipping", label: "أسعار الشحن", icon: Truck },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Tabs */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">إدارة المتجر</h2>
        <p className="text-slate-500 mt-1">
          نظام متكامل لإدارة منتجاتك، طلباتك، ومخزونك.
        </p>
        <div className="flex gap-2 mt-6 bg-slate-200/50 p-1.5 rounded-2xl w-max">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTab(t.id);
                  if (t.id !== "orders") setOrderFilter("all");
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === t.id
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                  }`}
              >
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading && !stats ? (
        <div className="py-24 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <>
          {/* STATS TAB */}
          {activeTab === "stats" && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-sm font-bold text-slate-500 mb-1">
                    إيرادات الشهر الحالي
                  </p>
                  <p className="text-3xl font-black text-slate-800">
                    {stats.revenue.thisMonth}{" "}
                    <span className="text-sm font-normal text-slate-400">
                      ج.م
                    </span>
                  </p>
                  <div
                    className={`mt-2 flex items-center gap-1 text-xs font-bold ${stats.revenue.growth >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                  >
                    <TrendingUp
                      className={`w-3 h-3 ${stats.revenue.growth < 0 ? "rotate-180" : ""}`}
                    />
                    <span>
                      {Math.abs(stats.revenue.growth).toFixed(1)}% عن الشهر
                      الماضي
                    </span>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-sm font-bold text-slate-500 mb-1">
                    الطلبات المسلّمة
                  </p>
                  <p className="text-3xl font-black text-slate-800">
                    {stats.statusCounts.delivered || 0}
                  </p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold text-slate-500 mb-1">
                        الطلبات المرتجعة
                      </p>
                      <p className="text-3xl font-black text-slate-800">
                        {stats.statusCounts.returned || 0}
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="text-sm font-bold text-rose-500 mb-1">
                        منسحبين من الدفع
                      </p>
                      <p 
                        className="text-2xl font-black text-rose-600 cursor-pointer hover:underline" 
                        onClick={() => {
                          setOrderFilter("abandoned");
                          setActiveTab("orders");
                        }}
                        title="عملاء بدأوا الدفع ولم يكملوه"
                      >
                        {stats.abandonedOrdersCount || 0}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50">
                  <p className="text-sm font-bold text-amber-600 mb-1">
                    تنبيهات المخزون
                  </p>
                  <div className="flex justify-between items-end mt-2">
                    <div>
                      <p className="text-2xl font-black text-amber-700">
                        {stats.inventory.lowStock}
                      </p>
                      <p className="text-xs text-amber-600 font-medium">
                        على وشك النفاذ (أقل من 5)
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black text-rose-600">
                        {stats.inventory.outOfStock}
                      </p>
                      <p className="text-xs text-rose-500 font-medium">
                        نفذت تماماً
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-500" /> أكثر
                  المنتجات مبيعاً
                </h3>
                {stats.topProducts.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-6">
                    لا توجد مبيعات بعد
                  </p>
                ) : (
                  <div className="space-y-4">
                    {stats.topProducts.map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-sm">
                            #{i + 1}
                          </div>
                          <p className="font-bold text-slate-700">
                            {typeof p.name === 'string' ? parseLocalizedName(p.name) : p.name?.ar || p.name?.en}
                          </p>
                        </div>
                        <div className="text-start">
                          <p className="font-black text-slate-800">
                            {p.count}{" "}
                            <span className="text-xs font-normal text-slate-400">
                              قطعة
                            </span>
                          </p>
                          <p className="text-xs text-emerald-600 font-bold">
                            +{p.revenue} ج.م
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ORDERS TAB */}
          {activeTab === "orders" && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800">
                  {orderFilter === "abandoned" ? "الطلبات المنسحبة من الدفع (Unpaid Online)" : "كل الطلبات"}
                </h3>
                {orderFilter === "abandoned" && (
                  <button onClick={() => setOrderFilter("all")} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-bold transition-colors">
                    عرض كل الطلبات
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-end">
                  <thead>
                    <tr className="text-xs font-bold text-slate-500 uppercase border-b border-slate-100 bg-slate-50/50">
                      <th className="py-3 px-5">رقم الطلب</th>
                      <th className="py-3 px-5">العميل</th>
                      <th className="py-3 px-5">المنتجات</th>
                      <th className="py-3 px-5">التاريخ</th>
                      <th className="py-3 px-5">الإجمالي</th>
                      <th className="py-3 px-5">الدفع</th>
                      <th className="py-3 px-5">الحالة</th>
                      <th className="py-3 px-5 text-center">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      const filteredOrders = orders.filter((o) => {
                        if (orderFilter === "abandoned") {
                          return o.paymentMethod !== "cash_on_delivery" && 
                                 ["pending", "cancelled"].includes(o.paymentStatus) &&
                                 !["delivered", "shipped", "returned"].includes(o.status);
                        }
                        return !o.isDraft;
                      });

                      if (filteredOrders.length === 0) {
                        return (
                          <tr>
                            <td colSpan={8} className="py-12 text-center text-slate-400 text-sm">
                              {orderFilter === "abandoned" ? "لا توجد طلبات منسحبة" : "لا توجد طلبات بعد"}
                            </td>
                          </tr>
                        );
                      }

                      return filteredOrders.map((order) => {
                        const statusObj = ORDER_STATUS_MAP[order.status];
                        const StatusIcon = statusObj.icon;
                        return (
                          <tr
                            key={order._id}
                            className="hover:bg-slate-50/50 transition-colors"
                          >
                            <td className="py-4 px-5 font-mono text-sm font-bold text-slate-700">
                              {order.orderNumber}
                            </td>
                            <td className="py-4 px-5">
                              <p className="font-bold text-slate-800 text-sm">
                                {order.customer?.name}
                              </p>
                              <p className="text-xs text-slate-500" dir="ltr">
                                {order.customer?.phone}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-1 whitespace-normal break-words leading-relaxed max-w-[250px]">
                                {order.customer?.address} - {order.customer?.city}
                              </p>
                            </td>
                            <td className="py-4 px-5">
                              <div className="flex flex-col gap-1 max-w-[200px]">
                                {order.items?.map((item, idx) => (
                                  <span key={idx} className="text-xs text-slate-600 truncate" title={`${item.quantity}x ${typeof item.name === 'string' ? parseLocalizedName(item.name) : item.name?.ar}`}>
                                    <span className="font-bold text-indigo-600 bg-indigo-50 px-1 rounded mr-1">{item.quantity}x</span> 
                                    {typeof item.name === 'string' ? parseLocalizedName(item.name) : item.name?.ar}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-4 px-5 text-sm text-slate-500">
                              {new Date(order.createdAt).toLocaleDateString(
                                "ar-EG",
                              )}
                            </td>
                            <td className="py-4 px-5 font-black text-slate-800 text-sm">
                              {order.totalAmount} ج.م
                            </td>
                            <td className="py-4 px-5">
                              <Badge variant={getPaymentMethodInfo(order.paymentMethod).color}>
                                {getPaymentMethodInfo(order.paymentMethod).label}
                              </Badge>
                            </td>
                            <td className="py-4 px-5">
                              <Badge variant={statusObj.color}>
                                <div className="flex items-center gap-1.5">
                                  <StatusIcon className="w-3 h-3" />{" "}
                                  {statusObj.label}
                                </div>
                              </Badge>
                              {order.status === "returned" &&
                                order.returnReason && (
                                  <p
                                    className="text-[10px] text-rose-500 mt-1 max-w-[120px] truncate"
                                    title={order.returnReason}
                                  >
                                    السبب: {order.returnReason}
                                  </p>
                                )}
                            </td>
                            <td className="py-4 px-5 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => setViewOrderDetails(order)}
                                  className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1"
                                >
                                  <FileText className="w-3 h-3" /> التفاصيل
                                </button>
                                <button
                                  onClick={() => setOrderToUpdate(order)}
                                  className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors flex items-center gap-1"
                                >
                                  <Edit3 className="w-3 h-3" /> تحديث
                                </button>
                                <button
                                  onClick={() => setDeleteOrderConfirm(order)}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="حذف الطلب نهائياً"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PRODUCTS TAB */}
          {activeTab === "products" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={() => setIsCheckoutModalOpen(true)}
                  disabled={adminCart.length === 0}
                  className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingBag className="w-5 h-5" /> السلة 
                  {adminCart.length > 0 && `(${adminCart.length})`}
                </button>
                <button
                  onClick={() => {
                    setFormError("");
                    setAddModal(true);
                  }}
                  className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-5 h-5" /> إضافة منتج
                </button>
              </div>
              {products.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-16 flex flex-col items-center text-center gap-4">
                  <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-400">
                    <PackageSearch className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg mb-1">
                      لا توجد منتجات
                    </h3>
                    <p className="text-slate-500 text-sm">
                      أضف منتجك الأول لتبدأ البيع
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <div
                      key={product._id}
                      className={`bg-white rounded-2xl border ${product.quantity === 0 ? "border-rose-200" : "border-slate-200"} shadow-sm overflow-hidden flex flex-col group relative`}
                    >
                      {product.quantity === 0 && (
                        <div className="absolute top-2 start-2 z-10 px-2 py-1 bg-rose-500 text-white text-[10px] font-black rounded flex items-center gap-1">
                          <PackageX className="w-3 h-3" /> نفذت الكمية
                        </div>
                      )}
                      <div className="aspect-[4/3] bg-slate-100 relative">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={typeof product.name === 'string' ? parseLocalizedName(product.name) : product.name?.ar}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <ImageIcon className="w-10 h-10" />
                          </div>
                        )}
                        {!product.isActive && (
                          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                            <span className="bg-slate-800 text-white px-3 py-1 rounded-lg text-sm font-bold">
                              غير متاح
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <div className="flex-1">
                          <h3
                            className="font-bold text-slate-800 line-clamp-1"
                            title={typeof product.name === 'string' ? parseLocalizedName(product.name) : product.name?.ar}
                          >
                            {typeof product.name === 'string' ? parseLocalizedName(product.name) : product.name?.ar}
                          </h3>
                          <p className="text-slate-500 text-sm line-clamp-2 mt-1 min-h-[40px]">
                            {typeof product.description === 'string' ? product.description : product.description?.ar}
                          </p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-end justify-between">
                          <div>
                            <p className="text-xs text-slate-400">السعر</p>
                            <p className="font-black text-slate-800 text-lg">
                              {product.price}{" "}
                              <span className="text-xs font-normal">ج.م</span>
                            </p>
                          </div>
                          <div className="text-start">
                            <p className="text-xs text-slate-400">الكمية</p>
                            <p className="font-bold text-slate-700">
                              {product.quantity}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="p-2 border-t border-slate-100 bg-slate-50 flex gap-2 flex-wrap">
                        <button
                          onClick={() => {
                            const exists = adminCart.find(item => item._id === product._id);
                            if (exists) {
                              setAdminCart(adminCart.map(item => item._id === product._id ? { ...item, adminQty: item.adminQty + 1 } : item));
                            } else {
                              setAdminCart([...adminCart, { ...product, adminQty: 1 }]);
                            }
                          }}
                          className="w-full mb-1 py-2 flex items-center justify-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-100 rounded-lg hover:bg-emerald-200 transition-colors"
                        >
                          <Plus className="w-3 h-3" /> أضف للسلة
                        </button>
                        <button
                          onClick={() => {
                            setFormError("");
                            setEditProduct(product);
                          }}
                          className="flex-1 py-2 flex items-center justify-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition-colors"
                        >
                          <Edit2 className="w-3 h-3" /> تعديل
                        </button>
                        <button
                          onClick={() => setDeleteProductItem(product)}
                          className="flex-1 py-2 flex items-center justify-center gap-1 text-xs font-bold text-rose-600 bg-rose-100 rounded-lg hover:bg-rose-200 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" /> حذف
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SHIPPING TAB */}
          {activeTab === "shipping" && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={storeSettings?.globalShippingMode === "free"}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleGlobalShippingMode("free");
                        } else {
                          handleGlobalShippingMode("default");
                        }
                      }}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <span className="font-bold text-sm text-slate-700">شحن مجاني للكل</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={storeSettings?.globalShippingMode === "fixed"}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setBulkCostModal(true);
                        } else {
                          handleGlobalShippingMode("default");
                        }
                      }}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="font-bold text-sm text-slate-700">سعر ثابت للكل</span>
                  </label>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                    <button
                      onClick={() => setShippingViewMode("grid")}
                      className={`p-1.5 rounded-md transition-colors ${shippingViewMode === "grid" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                    >
                      <LayoutGrid className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setShippingViewMode("list")}
                      className={`p-1.5 rounded-md transition-colors ${shippingViewMode === "list" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>
                  <button
                    onClick={() => setAddShippingRateModal(true)}
                    className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" /> إضافة محافظة
                  </button>
                </div>
              </div>

              {shippingViewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {shippingRates.map((rate) => {
                    let displayCost = rate.cost;
                    if (storeSettings?.globalShippingMode === "free") displayCost = 0;
                    else if (storeSettings?.globalShippingMode === "fixed") displayCost = storeSettings.globalShippingCost;

                    return (
                    <div
                      key={rate._id}
                      className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative group hover:border-indigo-200 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-slate-800 text-lg">
                            {rate.governorateAr}
                          </h3>
                          <p className="text-sm font-medium text-slate-500">
                            {rate.governorate}
                          </p>
                        </div>
                        <Badge variant={rate.isActive ? "green" : "slate"}>
                          {rate.isActive ? "مفعل" : "معطل"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                        {displayCost === 0 ? (
                          <p className="text-2xl font-black text-emerald-500">مجاني</p>
                        ) : (
                          <p className="text-2xl font-black text-indigo-600">
                            {displayCost} <span className="text-sm font-normal text-slate-400">ج.م</span>
                          </p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditShippingRate(rate)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteShippingRateItem(rate)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )})}
                  {shippingRates.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-slate-50 border border-slate-200 border-dashed rounded-3xl">
                      <Truck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-slate-700 mb-2">لا توجد أسعار شحن</h3>
                      <p className="text-slate-500 max-w-sm mx-auto mb-6">لم تقم بإضافة أي محافظات لتحديد أسعار الشحن بعد.</p>
                      <button
                        onClick={() => setAddShippingRateModal(true)}
                        className="bg-white border border-slate-200 text-indigo-600 px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-50 flex items-center gap-2 shadow-sm transition-all mx-auto"
                      >
                        <Plus className="w-5 h-5" /> إضافة محافظة
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-end">
                    <thead>
                      <tr className="text-xs font-bold text-slate-500 uppercase border-b border-slate-100 bg-slate-50/50">
                        <th className="py-3 px-5 text-start">المحافظة</th>
                        <th className="py-3 px-5">تكلفة الشحن</th>
                        <th className="py-3 px-5">الحالة</th>
                        <th className="py-3 px-5 text-start w-24">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {shippingRates.map((rate) => {
                        let displayCost = rate.cost;
                        if (storeSettings?.globalShippingMode === "free") displayCost = 0;
                        else if (storeSettings?.globalShippingMode === "fixed") displayCost = storeSettings.globalShippingCost;

                        return (
                        <tr key={rate._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-5 text-start">
                            <p className="font-bold text-slate-800">{rate.governorateAr}</p>
                            <p className="text-xs text-slate-500">{rate.governorate}</p>
                          </td>
                          <td className="py-3 px-5">
                            {displayCost === 0 ? (
                              <Badge variant="green">مجاني</Badge>
                            ) : (
                              <span className="font-bold text-slate-700">{displayCost} ج.م</span>
                            )}
                          </td>
                          <td className="py-3 px-5">
                            <Badge variant={rate.isActive ? "green" : "slate"}>
                              {rate.isActive ? "مفعل" : "معطل"}
                            </Badge>
                          </td>
                          <td className="py-3 px-5">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditShippingRate(rate)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteShippingRateItem(rate)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )})}
                      {shippingRates.length === 0 && (
                        <tr>
                          <td colSpan="4" className="py-12 text-center text-slate-500">
                            لا توجد محافظات مضافة.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === "settings" && storeSettings && (
            <div className="max-w-2xl bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">
                    الضرائب (نسبة مئوية %)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={storeSettings.taxRate}
                    onChange={(e) =>
                      setStoreSettings({
                        ...storeSettings,
                        taxRate: Number(e.target.value),
                      })
                    }
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-700">
                      مناطق وتكاليف الشحن
                    </label>
                    <button
                      onClick={() =>
                        setStoreSettings({
                          ...storeSettings,
                          shippingZones: [
                            ...storeSettings.shippingZones,
                            {
                              id: Date.now().toString(),
                              name: "",
                              cost: 0,
                              isActive: true,
                            },
                          ],
                        })
                      }
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> إضافة منطقة
                    </button>
                  </div>
                  {storeSettings.shippingZones.map((zone, idx) => (
                    <div key={zone.id} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="اسم المنطقة (مثال: القاهرة)"
                        value={zone.name}
                        onChange={(e) => {
                          const newZones = [...storeSettings.shippingZones];
                          newZones[idx].name = e.target.value;
                          setStoreSettings({
                            ...storeSettings,
                            shippingZones: newZones,
                          });
                        }}
                        className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <input
                        type="number"
                        placeholder="التكلفة (ج.م)"
                        value={zone.cost}
                        onChange={(e) => {
                          const newZones = [...storeSettings.shippingZones];
                          newZones[idx].cost = Number(e.target.value);
                          setStoreSettings({
                            ...storeSettings,
                            shippingZones: newZones,
                          });
                        }}
                        className="w-24 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <button
                        onClick={() => {
                          const newZones = storeSettings.shippingZones.filter(
                            (z) => z.id !== zone.id,
                          );
                          setStoreSettings({
                            ...storeSettings,
                            shippingZones: newZones,
                          });
                        }}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5 pt-4">
                  <label className="text-sm font-bold text-slate-700">
                    سياسة المتجر والاسترجاع
                  </label>
                  <textarea
                    rows={4}
                    value={storeSettings.storePolicy}
                    onChange={(e) =>
                      setStoreSettings({
                        ...storeSettings,
                        storePolicy: e.target.value,
                      })
                    }
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  />
                </div>
                <button
                  onClick={async () => {
                    setActionLoading(true);
                    try {
                      await updateStoreSettings(storeSettings);
                      alert("تم حفظ الإعدادات بنجاح");
                    } catch (e) {
                      alert(e.message);
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                  disabled={actionLoading}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}{" "}
                  حفظ الإعدادات
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {addShippingRateModal && (
        <Modal title="إضافة أسعار محافظة" onClose={() => setAddShippingRateModal(false)}>
          <ShippingRateForm
            onSave={handleCreateShippingRate}
            onCancel={() => setAddShippingRateModal(false)}
            saving={actionLoading}
          />
        </Modal>
      )}
      {editShippingRate && (
        <Modal title="تعديل أسعار محافظة" onClose={() => setEditShippingRate(null)}>
          <ShippingRateForm
            initial={editShippingRate}
            onSave={handleUpdateShippingRate}
            onCancel={() => setEditShippingRate(null)}
            saving={actionLoading}
          />
        </Modal>
      )}
      {deleteShippingRateItem && (
        <Modal title="تأكيد الحذف" onClose={() => setDeleteShippingRateItem(null)}>
          <div className="space-y-4">
            <p className="text-slate-600">هل أنت متأكد من حذف أسعار الشحن لمحافظة {deleteShippingRateItem.governorateAr}؟</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteShippingRateItem(null)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl">إلغاء</button>
              <button onClick={handleDeleteShippingRate} disabled={actionLoading} className="px-4 py-2 bg-rose-600 text-white font-bold rounded-xl">
                {actionLoading ? "جاري الحذف..." : "حذف"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {bulkCostModal && (
        <Modal title="تحديد سعر ثابت لكل المحافظات" onClose={() => setBulkCostModal(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleGlobalShippingMode("fixed", Number(e.target.cost.value));
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                تكلفة الشحن لجميع المحافظات (ج.م)
              </label>
              <input
                type="number"
                name="cost"
                required
                min="0"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setBulkCostModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl flex items-center gap-2"
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                تأكيد التحديث
              </button>
            </div>
          </form>
        </Modal>
      )}

      {addModal && (
        <Modal title="إضافة منتج جديد" onClose={() => setAddModal(false)} wide>
          <ProductForm
            onSave={handleCreateProduct}
            onCancel={() => setAddModal(false)}
            saving={actionLoading}
            error={formError}
          />
        </Modal>
      )}
      {editProduct && (
        <Modal title="تعديل منتج" onClose={() => setEditProduct(null)} wide>
          <ProductForm
            initial={editProduct}
            onSave={handleUpdateProduct}
            onCancel={() => setEditProduct(null)}
            saving={actionLoading}
            error={formError}
          />
        </Modal>
      )}
      {deleteProductItem && (
        <ConfirmModal
          message={`حذف "${typeof deleteProductItem.name === 'string' ? parseLocalizedName(deleteProductItem.name) : deleteProductItem.name?.ar || deleteProductItem.name?.en}"؟`}
          onConfirm={handleDeleteProduct}
          onCancel={() => setDeleteProductItem(null)}
          loading={actionLoading}
        />
      )}
      {deleteOrderConfirm && (
        <ConfirmModal
          message={`هل أنت متأكد من حذف الطلب رقم ${deleteOrderConfirm.orderNumber} بشكل نهائي؟`}
          onConfirm={handleDeleteOrder}
          onCancel={() => setDeleteOrderConfirm(null)}
          loading={actionLoading}
        />
      )}
      {orderToUpdate && (
        <OrderStatusModal
          order={orderToUpdate}
          onClose={() => setOrderToUpdate(null)}
          onSaved={loadData}
        />
      )}
      {viewOrderDetails && (
        <OrderDetailsModal
          order={viewOrderDetails}
          onClose={() => setViewOrderDetails(null)}
        />
      )}
      {isCheckoutModalOpen && (
        <AdminCheckoutModal
          cart={adminCart}
          setCart={setAdminCart}
          onClose={() => setIsCheckoutModalOpen(false)}
          shippingRates={shippingRates}
          onSaved={loadData}
        />
      )}
    </div>
  );
}
