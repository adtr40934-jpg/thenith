import { useMemo, useState } from "react";
import { AnimatePresence, Reorder, motion } from "motion/react";
import {
  CalendarDays,
  Globe,
  GripVertical,
  Instagram,
  Link2,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Save,
  Trash2,
  Youtube,
  Lock,
} from "lucide-react";
import Field from "../../ui/Field.jsx";
import { makeId } from "../../../data/dashboardSeed.js";
import { normalizeUrl } from "../../../hooks/useDashboardData.js";
import { useConfirm } from "../../../context/ConfirmContext";
import AppPhoneInput from "../../ui/AppPhoneInput.jsx";

const popularLinks = [
  {
    name: "Instagram",
    nameAr: "انستجرام",
    searchAr: "انستقرام",
    icon: Instagram,
    placeholder: "https://instagram.com/username",
  },
  {
    name: "LinkedIn",
    nameAr: "لينكد ان",
    icon: Linkedin,
    placeholder: "https://linkedin.com/in/username",
  },
  {
    name: "YouTube",
    nameAr: "يوتيوب",
    icon: Youtube,
    placeholder: "https://youtube.com/@channel",
  },
  {
    name: "Facebook",
    nameAr: "فيسبوك",
    icon: Globe,
    placeholder: "https://facebook.com/username",
  },
  {
    name: "TikTok",
    nameAr: "تيك توك",
    icon: Globe,
    placeholder: "https://tiktok.com/@username",
  },
  {
    name: "X (Twitter)",
    nameAr: "اكس",
    searchAr: "تويتر",
    icon: Globe,
    placeholder: "https://x.com/username",
  },
  {
    name: "Behance",
    nameAr: "بيهانس",
    icon: Globe,
    placeholder: "https://behance.net/username",
  },
  {
    name: "Dribbble",
    nameAr: "دريبل",
    icon: Globe,
    placeholder: "https://dribbble.com/username",
  },
  {
    name: "GitHub",
    nameAr: "جيت هب",
    icon: Globe,
    placeholder: "https://github.com/username",
  },
  {
    name: "WhatsApp",
    nameAr: "واتساب",
    icon: MessageCircle,
    placeholder: "https://wa.me/201001234567",
  },
  {
    name: "Telegram",
    nameAr: "تيليجرام",
    icon: MessageCircle,
    placeholder: "https://t.me/username",
  },
  {
    name: "Snapchat",
    nameAr: "سناب شات",
    icon: Globe,
    placeholder: "https://snapchat.com/add/username",
  },
  {
    name: "Pinterest",
    nameAr: "بينتريست",
    icon: Globe,
    placeholder: "https://pinterest.com/username",
  },
  {
    name: "Threads",
    nameAr: "ثريدز",
    icon: Globe,
    placeholder: "https://threads.net/@username",
  },
  {
    name: "Medium",
    nameAr: "ميديام",
    icon: Globe,
    placeholder: "https://medium.com/@username",
  },
  {
    name: "Website",
    nameAr: "موقع ويب",
    icon: Globe,
    placeholder: "https://example.com",
  },
  {
    name: "Portfolio",
    nameAr: "معرض اعمال",
    icon: Globe,
    placeholder: "https://portfolio.example.com",
  },
  {
    name: "Store",
    nameAr: "متجر",
    icon: Globe,
    placeholder: "https://store.example.com",
  },
  {
    name: "Calendly",
    nameAr: "كاليندلي",
    icon: CalendarDays,
    placeholder: "https://calendly.com/username",
  },
  {
    name: "Google Maps",
    nameAr: "خرائط جوجل",
    icon: MapPin,
    placeholder: "https://maps.google.com/?q=business",
  },
  {
    name: "Email",
    nameAr: "بريد الكتروني",
    searchAr: "ايميل",
    icon: Mail,
    placeholder: "mailto:hello@example.com",
  },
  {
    name: "Phone",
    nameAr: "رقم هاتف",
    icon: Phone,
    placeholder: "tel:+201001234567",
  },
  {
    name: "Discord",
    nameAr: "ديسكورد",
    icon: MessageCircle,
    placeholder: "https://discord.gg/invite",
  },
  {
    name: "Twitch",
    nameAr: "تويتش",
    icon: Globe,
    placeholder: "https://twitch.tv/username",
  },
  {
    name: "Reddit",
    nameAr: "ريديت",
    icon: Globe,
    placeholder: "https://reddit.com/u/username",
  },
  {
    name: "SoundCloud",
    nameAr: "ساوند كلاود",
    icon: Globe,
    placeholder: "https://soundcloud.com/username",
  },
  {
    name: "Spotify",
    nameAr: "سبوتيفاي",
    icon: Globe,
    placeholder: "https://open.spotify.com/user/username",
  },
  {
    name: "Apple Music",
    nameAr: "ابل ميوزك",
    icon: Globe,
    placeholder: "https://music.apple.com/profile/username",
  },
  {
    name: "App Store",
    nameAr: "اب ستور",
    searchAr: "ابل",
    icon: Globe,
    placeholder: "https://apps.apple.com/app/id000000",
  },
  {
    name: "Google Play",
    nameAr: "جوجل بلاي",
    searchAr: "اندرويد",
    icon: Globe,
    placeholder: "https://play.google.com/store/apps/details?id=app.id",
  },
  {
    name: "Vimeo",
    nameAr: "فيميو",
    icon: Globe,
    placeholder: "https://vimeo.com/username",
  },
  {
    name: "Patreon",
    nameAr: "باتريون",
    icon: Globe,
    placeholder: "https://patreon.com/username",
  },
  {
    name: "Substack",
    nameAr: "سابستاك",
    icon: Globe,
    placeholder: "https://username.substack.com",
  },
  {
    name: "OnlyFans",
    nameAr: "اونلي فانز",
    icon: Globe,
    placeholder: "https://onlyfans.com/username",
  },
  {
    name: "Kwai",
    nameAr: "كواي",
    icon: Globe,
    placeholder: "https://kwai.com/username",
  },
];

export default function LinksSection({
  t,
  language,
  permissions,
  card,
  linkDraft,
  showLinkPicker,
  customLinkOpen,
  onSetLinkDraft,
  onToggleLinkPicker,
  onToggleCustomLink,
  onAddLink,
  onUpdateLink,
  onDeleteLink,
  onUpdateCard,
  showValidation,
  onUpgrade,
  isPro,
}) {
  const { confirm } = useConfirm();
  const [linkSearch, setLinkSearch] = useState("");
  const maxLinks = permissions?.maxLinks ?? null;
  const canAddLink = maxLinks === null || card.links.length < maxLinks;
  const canReorderLinks = permissions?.reorderLinks === true;

  const showUpgradeMessage = () => {
    import("sweetalert2").then((Swal) => {
      Swal.default.fire({
        title: isPro ? t("limitReachedTitle") : t("proFeatureOnly"),
        text: isPro ? t("linkLimitReached") : t("proFeatureText"),
        icon: "warning",
        showCancelButton: !isPro,
        confirmButtonText: isPro 
          ? (language === "ar" ? "حسناً" : "OK") 
          : (language === "ar" ? "تصفح الباقات" : "View Plans"),
        cancelButtonText: language === "ar" ? "إلغاء" : "Cancel",
        confirmButtonColor: "#4f46e5",
      }).then((result) => {
        if (!isPro && result.isConfirmed && onUpgrade) {
          onUpgrade();
        }
      });
    });
  };

  const filteredPopularLinks = useMemo(() => {
    const term = linkSearch.trim().toLowerCase();
    if (!term) return popularLinks;
    return popularLinks.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        (item.nameAr && item.nameAr.includes(term)) ||
        (item.searchAr && item.searchAr.includes(term)),
    );
  }, [linkSearch]);

  const addPopularLink = (name) => {
    if (!canAddLink) {
      showUpgradeMessage();
      return;
    }
    const preset = popularLinks.find((item) => item.name === name);
    onAddLink({
      id: makeId(),
      name,
      nameAr: preset?.nameAr || name,
      url: preset?.placeholder || "",
      isPreset: true,
    });
    onToggleLinkPicker(false);
  };

  const addCustomLink = () => {
    if (!canAddLink) {
      showUpgradeMessage();
      return;
    }
    if (!linkDraft.name || !linkDraft.url) return;
    onAddLink({
      id: makeId(),
      name: linkDraft.name,
      url: normalizeUrl(linkDraft.url),
      isPreset: false,
    });
    onSetLinkDraft({ name: "", url: "" });
    onToggleCustomLink(false);
  };

  const confirmDeleteLink = async (linkId) => {
    const ok = await confirm({
      title: t("confirmDeleteLink"),
      message: t("confirmDeleteLinkText"),
      confirmText: t("delete"),
      type: "danger",
    });
    if (ok) onDeleteLink(linkId);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-end gap-2">
        <button
          onClick={() => {
            if (!canAddLink) {
              showUpgradeMessage();
              return;
            }
            onToggleCustomLink(!customLinkOpen);
          }}
          className={`rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 flex items-center justify-center gap-2 ${
            !canAddLink ? "opacity-75" : ""
          }`}
        >
          {t("customLink")}
          {!canAddLink && <Lock className="h-4 w-4 text-amber-500 shrink-0" />}
        </button>
        <button
          onClick={() => {
            if (!canAddLink) {
              showUpgradeMessage();
              return;
            }
            onToggleLinkPicker(!showLinkPicker);
          }}
          className={`flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 ${
            !canAddLink ? "opacity-75" : ""
          }`}
        >
          {!canAddLink ? <Lock className="h-4 w-4 text-amber-400" /> : <Plus className="h-4 w-4" />}
          {t("add")}
        </button>
      </div>

      {showLinkPicker && (
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-900 dark:bg-slate-950/45">
          <input
            type="search"
            value={linkSearch}
            onChange={(event) => setLinkSearch(event.target.value)}
            placeholder={t("searchPlatforms")}
            className="mb-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold outline-hidden focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900/60"
          />
          {!canAddLink && (
            <p className="mb-3 text-xs font-bold text-amber-600 dark:text-amber-400">
              {t("linkLimitReached")}
            </p>
          )}
          <div className="grid max-h-80 gap-2 overflow-auto sm:grid-cols-2 lg:grid-cols-3">
            {filteredPopularLinks.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => addPopularLink(item.name)}
                  className="flex min-h-12 items-center gap-3 rounded-xl bg-slate-50 px-3 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 dark:bg-slate-900/60 dark:text-slate-200"
                >
                  <Icon className="h-4 w-4" />
                  {language === "ar" && item.nameAr ? item.nameAr : item.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {customLinkOpen && (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-900 dark:bg-slate-950/45">
          <Field
            label={t("linkName")}
            value={linkDraft.name}
            onChange={(value) =>
              onSetLinkDraft((draft) => ({ ...draft, name: value }))
            }
          />
          <Field
            label={t("linkUrl")}
            value={linkDraft.url}
            onChange={(value) =>
              onSetLinkDraft((draft) => ({ ...draft, url: value }))
            }
          />
          <button
            onClick={addCustomLink}
            disabled={!linkDraft.name.trim() || !linkDraft.url.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 py-3 text-sm font-bold text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200"
          >
            <Save className="h-4 w-4" />
            {t("save")}
          </button>
        </div>
      )}

      <Reorder.Group
        axis="y"
        values={card.links}
        onReorder={(newOrder) => {
          if (canReorderLinks) {
            onUpdateCard((curr) => ({ ...curr, links: newOrder }));
          } else {
            showUpgradeMessage();
          }
        }}
        className="space-y-3"
      >
        <AnimatePresence initial={false}>
          {card.links.map((link, index) => (
            <Reorder.Item
              as="div"
              value={link}
              dragListener={canReorderLinks}
              key={link.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className={`relative overflow-hidden flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-slate-900 dark:bg-slate-950/45 ${canReorderLinks ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <motion.div
                  layout
                  className="flex items-center gap-2 text-slate-400 pointer-events-none"
                >
                  <GripVertical className="h-4 w-4" />
                  <Link2 className="h-5 w-5" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  {(() => {
                    const preset = popularLinks.find(
                      (p) => p.name === link.name,
                    );
                    const isPreset = link.isPreset || !!preset;
                    const nameAr = link.nameAr || preset?.nameAr;

                    return isPreset ? (
                      <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/40">
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300 truncate">
                          {language === "ar" && nameAr ? nameAr : link.name}
                        </span>
                      </div>
                    ) : (
                      <Field
                        label=""
                        value={link.name}
                        onChange={(value) =>
                          onUpdateLink(link.id, { name: value })
                        }
                      />
                    );
                  })()}
                </div>
                <button
                  onClick={() => confirmDeleteLink(link.id)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 dark:bg-rose-950/30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {(() => {
                const isInvalid = showValidation && (!link.url || link.url.trim() === "");
                return (
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-slate-400">
                        {t("linkUrl")}
                      </label>
                      {isInvalid && (
                        <span className="text-[11px] font-bold text-rose-500">
                          يجب ملء هذا الحقل
                        </span>
                      )}
                    </div>
                    {link.name === "WhatsApp" || link.name === "Phone" ? (
                      <AppPhoneInput
                        value={link.url}
                        prefixText={link.name === "WhatsApp" ? "https://wa.me/" : "tel:+"}
                        onChange={(val) => onUpdateLink(link.id, { url: val })}
                        invalid={isInvalid}
                      />
                    ) : (
                      <Field
                        label=""
                        value={link.url}
                        onChange={(value) =>
                          onUpdateLink(link.id, { url: normalizeUrl(value) })
                        }
                        invalid={isInvalid}
                      />
                    )}
                  </div>
                );
              })()}
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>

      {card.features?.links?.hiddenCount > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-orange-800 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-200 mt-4 text-sm text-center">
          {language === "ar"
            ? `لديك ${card.features.links.hiddenCount} روابط مخفية لأن باقتك الحالية تسمح بـ ${maxLinks} روابط فقط. قم بالترقية لإظهارها.`
            : `You have ${card.features.links.hiddenCount} hidden links because your plan allows a maximum of ${maxLinks}. Upgrade to PRO to show them all.`}
        </div>
      )}
    </div>
  );
}
