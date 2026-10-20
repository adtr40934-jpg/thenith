import Clarity from "@microsoft/clarity";

let isInitialized = false;

/**
 * تهيئة أداة Microsoft Clarity باستخدام الإعدادات الموجودة في ملف .env
 * آمنة للاستدعاء عدة مرات (يتم تفعيلها مرة واحدة فقط).
 */
export function initClarity() {
  if (isInitialized) return;
  if (typeof window === "undefined") return;

  const rawProjectId = import.meta.env.VITE_CLARITY_PROJECT_ID;
  const projectId = (rawProjectId || "").trim();
  const isEnabled = import.meta.env.VITE_CLARITY_ENABLED !== "false";
  const enableInDev = import.meta.env.VITE_CLARITY_ENABLE_IN_DEV === "true";
  const isDev = Boolean(import.meta.env.DEV);

  // إذا تم تعطيل الأداة من خلال المتغير VITE_CLARITY_ENABLED
  if (!isEnabled) {
    if (isDev) {
      console.info("[Clarity] تم تعطيل التتبع بواسطة VITE_CLARITY_ENABLED=false");
    }
    return;
  }

  // في بيئة التطوير المحلية، نتجاهل التتبع افتراضياً إلا إذا تم تفعيل VITE_CLARITY_ENABLE_IN_DEV=true
  if (isDev && !enableInDev) {
    console.info(
      "[Clarity] معطل افتراضياً في بيئة التطوير (localhost) لعدم إفساد إحصائيات الإنتاج. لتفعيله محلياً ضع VITE_CLARITY_ENABLE_IN_DEV=true في .env",
    );
    return;
  }

  // التأكد من إدخال Project ID صحيح وعدم تركه فارغاً أو نصاً افتراضياً
  if (!projectId || projectId === "your_clarity_project_id_here") {
    if (isDev) {
      console.warn(
        "[Clarity] برجاء تعيين VITE_CLARITY_PROJECT_ID في ملف .env لبدء تسجيل الجلسات والخرائط الحرارية.",
      );
    }
    return;
  }

  try {
    Clarity.init(projectId);
    isInitialized = true;

    // معالجة خيار ملفات تعريف الارتباط / الموافقة إذا تم تحديده في .env
    const consentSetting = (import.meta.env.VITE_CLARITY_CONSENT || "").trim().toLowerCase();
    if (consentSetting === "true") {
      Clarity.consent(true);
    } else if (consentSetting === "false") {
      Clarity.consent(false);
    }

    if (isDev) {
      console.info(`[Clarity] تم التفعيل بنجاح باستخدام Project ID: ${projectId}`);
    }
  } catch (error) {
    console.error("[Clarity] فشل في تهيئة المكتبة:", error);
  }
}

/**
 * ربط جلسة التتبع ببيانات المستخدم المسجل حالياً (معرّف واسم المستخدم)
 * للبحث عن تسجيلات مستخدم محدد داخل لوحة تحكم Clarity.
 */
export function identifyUser(userId, friendlyName, sessionId, pageId) {
  if (!isInitialized || !userId) return;
  try {
    Clarity.identify(String(userId), sessionId, pageId, friendlyName || undefined);
  } catch {
    // Non-blocking error handling
  }
}

/**
 * إضافة وسوم مخصصة للجلسة (مثل نوع الحساب، الخطة، أو نوع الصفحة)
 */
export function setClarityTag(key, value) {
  if (!isInitialized || !key || value === undefined || value === null) return;
  try {
    Clarity.setTag(String(key), String(value));
  } catch {
    // Non-blocking
  }
}

/**
 * تسجيل حدث مخصص داخل Clarity (مثل إتمام طلب، نقرة مهمة، مسح NFC)
 */
export function logClarityEvent(eventName) {
  if (!isInitialized || !eventName) return;
  try {
    Clarity.event(String(eventName));
  } catch {
    // Non-blocking
  }
}

export { isInitialized };
export default Clarity;
