import React, { useState, useEffect } from "react";
import { Save, Image as ImageIcon, Type, Loader2, Upload } from "lucide-react";
import {
  uploadAdminImage,
  fetchSiteSettings,
  updateSiteSettings,
} from "../services/adminApi.js";

export default function Settings() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [siteLoading, setSiteLoading] = useState(true);

  const [logoType, setLogoType] = useState("text");
  const [logoText, setLogoText] = useState("Thenith");
  const [logoUrl, setLogoUrl] = useState("");

  const loadSettings = async () => {
    try {
      setSiteLoading(true);
      const settings = await fetchSiteSettings();
      setLogoType(settings?.site_logo_type || "text");
      setLogoText(settings?.site_logo_text || "Thenith");
      setLogoUrl(settings?.site_logo_url || "");
    } catch (error) {
    } finally {
      setSiteLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const { url } = await uploadAdminImage(reader.result, "settings");
          setLogoUrl(url);
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

  const handleSave = async () => {
    try {
      setLoading(true);
      const payload = {
        site_logo_type: logoType,
        site_logo_text: logoText,
        site_logo_url: logoUrl,
      };

      await updateSiteSettings(payload);
      await loadSettings();
      alert("تم حفظ الإعدادات بنجاح");
    } catch (error) {
      alert("حدث خطأ أثناء حفظ الإعدادات");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">إعدادات الموقع</h1>
        <p className="text-slate-500 mt-1">
          تخصيص الهوية البصرية والشعار العام للموقع
        </p>
      </div>

      {siteLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin ms-2" />
          جاري تحميل الإعدادات...
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-indigo-500" />
            شعار الموقع (Logo)
          </h2>

          <div className="space-y-6">
            <div className="flex gap-4">
              <button
                onClick={() => setLogoType("text")}
                className={`flex-1 p-4 rounded-xl border-2 flex items-center justify-center gap-3 font-bold transition-all ${
                  logoType === "text"
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                <Type className="w-5 h-5" />
                نص (Text)
              </button>
              <button
                onClick={() => setLogoType("image")}
                className={`flex-1 p-4 rounded-xl border-2 flex items-center justify-center gap-3 font-bold transition-all ${
                  logoType === "image"
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                <ImageIcon className="w-5 h-5" />
                صورة (Image)
              </button>
            </div>

            <div className="p-6 bg-slate-50 rounded-xl border border-slate-100">
              {logoType === "text" ? (
                <div className="space-y-4">
                  <label className="block font-medium text-slate-700">
                    النص المعروض
                  </label>
                  <input
                    type="text"
                    value={logoText}
                    onChange={(e) => setLogoText(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Thenith"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <label className="block font-medium text-slate-700">
                    ارفع صورة الشعار
                  </label>
                  <div className="flex flex-col gap-4">
                    {logoUrl && (
                      <div className="w-32 h-32 bg-white rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden">
                        <img
                          src={logoUrl}
                          alt="Logo Preview"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    )}
                    <label className="cursor-pointer bg-white border border-slate-200 hover:bg-slate-50 transition-colors rounded-xl px-4 py-3 flex items-center justify-center gap-2 font-medium text-slate-600">
                      {uploading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Upload className="w-5 h-5" />
                      )}
                      {uploading ? "جاري الرفع..." : "اختر صورة"}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              حفظ التغييرات
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
