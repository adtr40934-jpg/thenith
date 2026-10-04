import { Check, Link2, Phone, User } from 'lucide-react';
import { isFeatureEnabled } from '../../../config/features.js';

export default function EditorTabs({ t, activeSection, onChangeSection }) {
  const items = [
    { id: 'personal', label: t('personal'), icon: User, feature: 'cardPersonalDetails' },
    { id: 'contact', label: t('contacts'), icon: Phone, feature: 'cardContacts' },
    { id: 'links', label: t('links'), icon: Link2, feature: 'cardLinks' },
    { id: 'action', label: t('actionButton'), icon: Check, feature: 'cardActionButton' },
  ].filter((item) => isFeatureEnabled(item.feature));

  return (
    <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-100 bg-white p-2 shadow-sm dark:border-slate-900 dark:bg-slate-950/45 sm:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        const active = activeSection === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChangeSection(item.id)}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-[11px] font-black transition-colors sm:text-xs ${
              active ? 'bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950' : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900'
            }`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
