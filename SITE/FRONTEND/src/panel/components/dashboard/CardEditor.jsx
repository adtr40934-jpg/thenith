import { useState } from "react";
import { Loader2, Eye, ArrowUpRight } from "lucide-react";
import { isFeatureEnabled } from "../../config/features.js";

import EditorTabs from "./editor/EditorTabs.jsx";
import PersonalSection from "./editor/PersonalSection.jsx";
import ContactSection from "./editor/ContactSection.jsx";
import LinksSection from "./editor/LinksSection.jsx";
import ActionSection from "./editor/ActionSection.jsx";
import ThemeSection from "./editor/ThemeSection.jsx";

export default function CardEditor({
  t,
  language,
  card,
  activeCardLink,
  section,
  dragItem,
  linkDraft,
  showContactMenu,
  showLinkPicker,
  customLinkOpen,
  permissions,
  entitlements,
  onUpgrade,
  onBack,
  onChangeSection,
  onSetDragItem,
  onToggleContactMenu,
  onToggleLinkPicker,
  onToggleCustomLink,
  onSetLinkDraft,
  onUpdateCard,
  onSaveCard,
  onUpdatePersonal,
  onUpdateContact,
  onAddContact,
  onDeleteContact,
  onAddLink,
  onUpdateLink,
  onDeleteLink,
  onReorderItems,
  isUploading,
  hasCardChanges,
  uploadCallbacks,
}) {
  const [saveState, setSaveState] = useState("idle");
  const [showValidation, setShowValidation] = useState(false);
  // Remove internal isUploading; use prop isUploading
  // Remove uploadCallbacks defined here; will receive via props
  const isPro = entitlements?.plan === "pro";

  const handleSave = async () => {
    setSaveState("saving");
    setShowValidation(false);
    try {
      await onSaveCard();
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch (error) {
      if (error.message === "ValidationFailed") {
        setShowValidation(true);
        setSaveState("idle");
        // Optionally switch to the section with the error if we knew which one
      } else {
        setSaveState("error");
        setTimeout(() => setSaveState("idle"), 2500);
      }
    }
  };

  return (
    <section className="space-y-4">
      <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-950/45 sm:space-y-4 sm:p-5 md:bg-transparent md:p-0 md:shadow-none">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs font-black text-indigo-600">
              {t("editCard")}
            </p>
            <h1 className="mt-0.5 sm:mt-1 truncate text-lg sm:text-2xl font-black text-slate-900 dark:text-white">
              {card.name}
            </h1>
          </div>
          <div className="flex w-full sm:w-auto items-center gap-2">
            {activeCardLink && (
              <a
                href={activeCardLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-10 flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 py-2 text-xs sm:text-sm font-bold text-indigo-600 hover:bg-indigo-100 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/50 active:scale-95 transition-all shadow-xs"
                title={language === "ar" ? "معاينة البطاقة في تبويب جديد" : "Preview Card"}
              >
                <Eye className="h-4 w-4" />
                <span>{language === "ar" ? "معاينة" : "Preview"}</span>
                <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
              </a>
            )}
            <button
              onClick={onBack}
              className="min-h-10 flex-1 sm:flex-none rounded-xl border border-slate-200 px-4 py-2 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 active:scale-95 transition-all"
            >
              {t("backToCards")}
            </button>
          </div>
        </div>
        <EditorTabs
          t={t}
          language={language}
          activeSection={section}
          onChangeSection={onChangeSection}
          permissions={permissions}
          entitlements={entitlements}
          onUpgrade={onUpgrade}
        />
      </div>

      {section === "personal" && isFeatureEnabled("cardPersonalDetails") && (
        <PersonalSection
          t={t}
          card={card}
          permissions={permissions}
          isPro={isPro}
          onUpgrade={onUpgrade}
          onUpdateCard={onUpdateCard}
          onUpdatePersonal={onUpdatePersonal}
          {...uploadCallbacks}
        />
      )}

      {section === "contact" && isFeatureEnabled("cardContacts") && (
        <ContactSection
          t={t}
          card={card}
          permissions={permissions}
          isPro={isPro}
          onUpgrade={onUpgrade}
          showContactMenu={showContactMenu}
          onToggleContactMenu={onToggleContactMenu}
          onAddContact={onAddContact}
          onUpdateContact={onUpdateContact}
          onDeleteContact={onDeleteContact}
          onUpdateCard={onUpdateCard}
          showValidation={showValidation}
        />
      )}

      {section === "links" && isFeatureEnabled("cardLinks") && (
        <LinksSection
          t={t}
          language={language}
          permissions={permissions}
          isPro={isPro}
          onUpgrade={onUpgrade}
          card={card}
          linkDraft={linkDraft}
          showLinkPicker={showLinkPicker}
          customLinkOpen={customLinkOpen}
          onSetLinkDraft={onSetLinkDraft}
          onToggleLinkPicker={onToggleLinkPicker}
          onToggleCustomLink={onToggleCustomLink}
          onAddLink={onAddLink}
          onUpdateLink={onUpdateLink}
          onDeleteLink={onDeleteLink}
          onUpdateCard={onUpdateCard}
          showValidation={showValidation}
        />
      )}

      {section === "action" && isFeatureEnabled("cardActionButton") && (
        <ActionSection
          t={t}
          language={language}
          card={card}
          permissions={permissions}
          isPro={isPro}
          onUpgrade={onUpgrade}
          onUpdateCard={onUpdateCard}
        />
      )}

      {section === "theme" && (
        <ThemeSection
          t={t}
          language={language}
          card={card}
          onUpdateCard={onUpdateCard}
        />
      )}

      <div className="flex flex-col items-stretch gap-2 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-900 dark:bg-slate-950/45 sm:flex-row sm:items-center sm:justify-end">
        {saveState === "saved" && (
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
            {t("saved")}
          </span>
        )}
        {saveState === "error" && (
          <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
            {t("saveFailed")}
          </span>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saveState === "saving" || isUploading || !hasCardChanges}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black text-white transition-all ${
            saveState === "saving"
              ? "bg-indigo-600 opacity-80 cursor-wait"
              : isUploading || !hasCardChanges
                ? "bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-70"
                : "bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-indigo-500/20"
          }`}
        >
          {(saveState === "saving" || isUploading) && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          {saveState === "saving"
            ? t("saving")
            : isUploading
              ? t("uploading")
              : t("save")}
        </button>
      </div>
    </section>
  );
}
