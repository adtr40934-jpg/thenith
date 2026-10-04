import { Link } from "react-router-dom";
import { useLanguage } from "../../hooks/useLanguage.jsx";

export default function UserNotFound() {
  const { language } = useLanguage();
  const isArabic = language === "ar";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      <h1 className="mb-4 text-3xl font-bold">
        {isArabic ? "المستخدم غير موجود" : "User Not Found"}
      </h1>
      <p className="mb-6 text-center">
        {isArabic
          ? "لقد حاولت الوصول إلى حساب غير موجود أو تم حذفه."
          : "You tried to access an account that doesn't exist or has been deleted."}
      </p>
      <Link
        to="/"
        className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
      >
        {isArabic ? "العودة إلى الصفحة الرئيسة" : "Return to Panel"}
      </Link>
    </div>
  );
}
