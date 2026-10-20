import { Check, Link2, Palette, Phone, User, Lock } from 'lucide-react';
import { isFeatureEnabled } from '../../../config/features.js';

export default function EditorTabs({ t, language, activeSection, onChangeSection, permissions, entitlements, onUpgrade }) {
  const hasTheme = entitlements?.features?.themeSelection?.enabled === true;
  const items = [
    { id: 'personal', label: t('personal'), icon: User, feature: 'cardPersonalDetails' },
    { id: 'contact', label: t('contacts'), icon: Phone, feature: 'cardContacts' },
    { id: 'links', label: t('links'), icon: Link2, feature: 'cardLinks' },
    { id: 'action', label: t('actionButton'), icon: Check, feature: 'cardActionButton' },
    { id: 'theme', label: language === 'ar' ? 'المظهر' : 'Appearance', icon: Palette },
  ].filter((item) => !item.feature || isFeatureEnabled(item.feature));

  return (
    <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-100 bg-white p-2 shadow-sm dark:border-slate-900 dark:bg-slate-950/45 sm:grid-cols-5">
      {items.map((item) => {
        const Icon = item.icon;
        const active = activeSection === item.id;
        return (
          <button
            key={item.id}
            onClick={(e) => {
              if (item.id === 'theme' && !hasTheme) {
                e.preventDefault();
                import("sweetalert2").then((Swal) => {
                  Swal.default.fire({
                    title: t("proFeatureOnly"),
                    text: t("proFeatureText"),
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: language === "ar" ? "تصفح الباقات" : "View Plans",
                    cancelButtonText: language === "ar" ? "إلغاء" : "Cancel",
                    confirmButtonColor: "#4f46e5",
                  }).then((result) => {
                    if (result.isConfirmed && onUpgrade) {
                      onUpgrade();
                    }
                  });
                });
                return;
              }
              onChangeSection(item.id);
            }}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-[11px] font-black transition-colors sm:text-xs last:col-span-2 sm:last:col-span-1 ${
              active ? 'bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950' : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900'
            }`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
            {item.id === 'theme' && !hasTheme && (
              <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );
}
