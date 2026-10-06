import {
  ChevronDown,
  Globe,
  GripVertical,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Trash2,
  Twitter,
} from "lucide-react";
import { AnimatePresence, Reorder, motion } from "motion/react";
import { useConfirm } from "../../../context/ConfirmContext";
import Field from "../../ui/Field.jsx";
import { makeId } from "../../../data/dashboardSeed.js";
import AppPhoneInput from "../../ui/AppPhoneInput.jsx";
import { useGlobalLanguage } from "../../../../context/GlobalLanguageContext.jsx";

const contactTypes = [
  { type: "phone", labelKey: "phone", fallback: "Phone", icon: Phone },
  {
    type: "whatsapp",
    labelKey: "whatsapp",
    fallback: "WhatsApp",
    icon: MessageCircle,
  },
  { type: "email", labelKey: "email", fallback: "Email", icon: Mail },
  {
    type: "location",
    labelKey: "location",
    fallback: "Location",
    icon: MapPin,
  },
  { type: "website", labelKey: "website", fallback: "Website", icon: Globe },
];

export default function ContactSection({
  t,
  card,
  permissions,
  showContactMenu,
  onToggleContactMenu,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
  onUpdateCard,
  showValidation,
  onUpgrade,
  isPro,
}) {
  const { confirm } = useConfirm();
  const { language } = useGlobalLanguage();
  const isAr = language === "ar";
  const canReorderContacts = permissions?.reorderLinks === true;

  const showUpgradeMessage = () => {
    import("sweetalert2").then((Swal) => {
      Swal.default.fire({
        title: isPro ? t("limitReachedTitle") : t("proFeatureOnly"),
        text: isPro ? t("limitReachedText") : t("proFeatureText"),
        icon: "warning",
        showCancelButton: !isPro,
        confirmButtonText: isPro 
          ? (isAr ? "حسناً" : "OK") 
          : (isAr ? "تصفح الباقات" : "View Plans"),
        cancelButtonText: isAr ? "إلغاء" : "Cancel",
        confirmButtonColor: "#4f46e5",
      }).then((result) => {
        if (!isPro && result.isConfirmed && onUpgrade) {
          onUpgrade();
        }
      });
    });
  };

  const addContact = (type) => {
    const whatsappCount = card.contacts.filter(
      (item) => item.type === "whatsapp",
    ).length;
    const phoneCount = card.contacts.filter(
      (item) => item.type === "phone",
    ).length;
    const typeCount = card.contacts.filter((item) => item.type === type).length;
    const maxForType = type === "phone" || type === "whatsapp" ? 2 : 1;
    if (typeCount >= maxForType) return;

    const meta = contactTypes.find((item) => item.type === type);
    onAddContact({
      id: makeId(),
      type,
      label: meta?.fallback || "Contact",
      value: "",
      primary:
        (type === "phone" && phoneCount === 0) ||
        (type === "whatsapp" && whatsappCount === 0),
    });
    onToggleContactMenu(false);
  };

  const confirmDeleteContact = async (contactId) => {
    const ok = await confirm({
      title: t("confirmDeleteContact"),
      message: t("confirmDeleteContactText"),
      confirmText: t("delete"),
      type: "danger",
    });
    if (ok) onDeleteContact(contactId);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="relative">
          <button
            onClick={() => onToggleContactMenu(!showContactMenu)}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            {t("add")}
            <ChevronDown className="h-4 w-4" />
          </button>
          {showContactMenu && (
            <div className="absolute end-0 z-20 mt-2 w-56 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-950">
              {contactTypes.map((item) => {
                const Icon = item.icon;
                const count = card.contacts.filter(
                  (contact) => contact.type === item.type,
                ).length;
                const maxForType =
                  item.type === "phone" || item.type === "whatsapp" ? 2 : 1;
                const disabled = count >= maxForType;
                return (
                  <button
                    key={item.type}
                    onClick={() => addContact(item.type)}
                    disabled={disabled}
                    title={disabled ? t("contactTypeLimit") : undefined}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-900"
                  >
                    <Icon className="h-4 w-4" />
                    {item.fallback}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Reorder.Group
        axis="y"
        values={card.contacts}
        onReorder={(newOrder) => {
          if (canReorderContacts) {
            onUpdateCard((curr) => ({ ...curr, contacts: newOrder }));
          } else {
            showUpgradeMessage();
          }
        }}
        className="space-y-4"
      >
        <AnimatePresence initial={false}>
          {card.contacts.map((contact) => {
            const meta =
              contactTypes.find((item) => item.type === contact.type) ||
              contactTypes[0];
            const Icon = meta.icon;
            return (
              <Reorder.Item
                as="div"
                value={contact}
                dragListener={canReorderContacts}
                key={contact.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className={`flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-900 dark:bg-slate-950/45 ${canReorderContacts ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <motion.div
                    layout
                    className="flex items-center gap-2 text-slate-400 pointer-events-none"
                  >
                    <GripVertical className="h-4 w-4" />
                    <Icon className="h-5 w-5" />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/40">
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-300 truncate">
                        {t(meta.labelKey) || meta.fallback}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {(contact.type === "phone" ||
                      contact.type === "whatsapp") && (
                        <button
                          onClick={() =>
                            onUpdateContact(contact.id, { primary: true })
                          }
                          className={`h-9 rounded-xl px-3 text-xs font-bold ${contact.primary
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-900"
                            }`}
                        >
                          {t("primary")}
                        </button>
                      )}
                    <button
                      onClick={() => confirmDeleteContact(contact.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 dark:bg-rose-950/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {(() => {
                  const isInvalid = showValidation && (!contact.value || contact.value.trim() === "");
                  return (
                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <label className="block text-[11px] font-bold text-slate-400">
                          {t("value")}
                        </label>
                        {isInvalid && (
                          <span className="text-[11px] font-bold text-rose-500">
                            يجب ملء هذا الحقل
                          </span>
                        )}
                      </div>
                      {(contact.type === "phone" || contact.type === "whatsapp") ? (
                        <AppPhoneInput
                          value={contact.value}
                          prefixText="+"
                          onChange={(val) => onUpdateContact(contact.id, { value: val })}
                          invalid={isInvalid}
                        />
                      ) : (
                        <Field
                          label=""
                          value={contact.value}
                          onChange={(value) => onUpdateContact(contact.id, { value })}
                          invalid={isInvalid}
                        />
                      )}
                    </div>
                  );
                })()}
              </Reorder.Item>
            );
          })}
        </AnimatePresence>
      </Reorder.Group>
    </div>
  );
}
