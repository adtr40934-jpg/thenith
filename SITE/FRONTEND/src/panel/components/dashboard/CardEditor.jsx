import { useState } from "react";
import { Loader2 } from "lucide-react";
import { isFeatureEnabled } from "../../config/features.js";

import EditorTabs from "./editor/EditorTabs.jsx";
import PersonalSection from "./editor/PersonalSection.jsx";
import ContactSection from "./editor/ContactSection.jsx";
import LinksSection from "./editor/LinksSection.jsx";
import ActionSection from "./editor/ActionSection.jsx";

export default function CardEditor({
  t,
  language,
  card,
  section,
  dragItem,
  linkDraft,
  showContactMenu,
  showLinkPicker,
  customLinkOpen,
  permissions,
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
    <section className="space-y-4 p-1.5 sm:p-3 md:p-0">
      <div className="space-y-3 rounded-[20px] bg-white p-3 shadow-sm dark:bg-slate-950/45 sm:rounded-[24px] sm:space-y-4 sm:p-4 md:bg-transparent md:p-0 md:shadow-none">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <p className="text-xs font-black text-indigo-600">
              {t("editCard")}
            </p>
            <h1 className="mt-1 truncate text-xl font-black sm:text-2xl">
              {card.name}
            </h1>
          </div>
          <button
            onClick={onBack}
            className="min-h-10 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 sm:w-auto"
          >
            {t("backToCards")}
          </button>
        </div>
        <EditorTabs
          t={t}
          activeSection={section}
          onChangeSection={onChangeSection}
        />
      </div>

      {section === "personal" && isFeatureEnabled("cardPersonalDetails") && (
        <PersonalSection
          t={t}
          card={card}
          permissions={permissions}
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
          onUpgrade={onUpgrade}
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
