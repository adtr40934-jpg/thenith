import { useState } from "react";
import { Upload, User, Loader2, Lock } from "lucide-react";
import Field from "../../ui/Field.jsx";
import { isFeatureEnabled } from "../../../config/features.js";
import api from "../../../../api/index.js";
import { useGlobalLanguage } from "../../../../context/GlobalLanguageContext.jsx";
import { toast } from "../../../../util/toast";
import { getLocalizedErrorMessage } from "../../../../utils/errorHandling.js";

export default function PersonalSection({
  t,
  card,
  permissions,
  onUpdateCard,
  onUpdatePersonal,
  onUploadStart,
  onUploadEnd,
  onUpgrade,
  isPro,
}) {
  const { language } = useGlobalLanguage();
  const isAr = language === "ar";
  const [uploadingField, setUploadingField] = useState(null); // 'avatar' | 'cover' | null
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadImage = async (file, field, maxSize = 1024 * 1024) => {
    if (field === "cover" && !permissions?.coverImage) {
      import("sweetalert2").then((Swal) => {
        Swal.default
          .fire({
            title: isPro ? t("limitReachedTitle") : t("proFeatureOnly"),
            text: isPro ? t("limitReachedText") : t("proFeatureText"),
            icon: "warning",
            showCancelButton: !isPro,
            confirmButtonText: isPro 
              ? (isAr ? "حسناً" : "OK") 
              : (isAr ? "تصفح الباقات" : "View Plans"),
            cancelButtonText: isAr ? "إلغاء" : "Cancel",
            confirmButtonColor: "#4f46e5",
          })
          .then((result) => {
            if (!isPro && result.isConfirmed && onUpgrade) {
              onUpgrade();
            }
          });
      });
      return;
    }
    if (!file || !isFeatureEnabled("imageUpload") || uploadingField) return;

    // Keep uploaded images small enough for the API request.
    if (file.size > maxSize) {
      toast.error(t("fileTooLarge"));
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        if (onUploadStart) onUploadStart();
        setUploadingField(field);
        setUploadProgress(20);

        // Progress simulation interval while network request completes
        const progressTimer = setInterval(() => {
          setUploadProgress((prev) => (prev < 90 ? prev + 15 : prev));
        }, 250);

        const data = await api.upload.uploadBase64(field, reader.result);

        clearInterval(progressTimer);
        setUploadProgress(100);

        onUpdatePersonal(field === "cover" ? "coverImage" : field, data.url);

        setTimeout(() => {
          setUploadingField(null);
          setUploadProgress(0);
          if (onUploadEnd) onUploadEnd();
        }, 300);
      } catch (err) {
        toast.error(getLocalizedErrorMessage(err, language));
        setUploadingField(null);
        setUploadProgress(0);
        if (onUploadEnd) onUploadEnd();
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-900 dark:bg-slate-950/45">
      <div className="mb-6 grid gap-4 md:grid-cols-1">
        <Field
          label={t("cardName")}
          value={card.name}
          onChange={(value) =>
            onUpdateCard((current) => ({ ...current, name: value }))
          }
        />
      </div>
      <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900">
          {card.personal.avatar ? (
            <img
              src={card.personal.avatar}
              alt=""
              className={`h-full w-full object-cover transition-opacity ${uploadingField === "avatar" ? "opacity-50" : "opacity-100"}`}
            />
          ) : (
            <User className="h-10 w-10 text-slate-400" />
          )}
          {uploadingField === "avatar" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/40 p-2 text-white">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
              <span className="mt-1 text-[11px] font-bold">
                {uploadProgress}%
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {isFeatureEnabled("imageUpload") && (
            <label
              className={`flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold transition-all ${
                uploadingField
                  ? "cursor-not-allowed opacity-50 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-900"
                  : "cursor-pointer text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
              }`}
            >
              {uploadingField === "avatar" ? (
                <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploadingField === "avatar"
                ? `${t("uploading")} (${uploadProgress}%)`
                : t("uploadImage")}
              <input
                type="file"
                accept="image/*"
                disabled={Boolean(uploadingField)}
                className="hidden"
                onChange={(event) =>
                  uploadImage(event.target.files?.[0], "avatar")
                }
              />
            </label>
          )}
          {uploadingField === "avatar" && (
            <div className="w-48 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-1.5 rounded-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      </div>
      <div className="mb-6 space-y-3">
        <div className="relative overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900">
          {card.personal.coverImage ? (
            <img
              src={card.personal.coverImage}
              alt=""
              className={`h-36 w-full object-cover transition-opacity ${uploadingField === "cover" ? "opacity-50" : "opacity-100"}`}
            />
          ) : (
            <div className="flex h-36 items-center justify-center text-sm font-bold text-slate-400">
              {t("coverImage")}
            </div>
          )}
          {uploadingField === "cover" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/40 text-white">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
              <span className="mt-2 text-xs font-bold">
                {t("uploading")} {uploadProgress}%
              </span>
            </div>
          )}
        </div>
        {isFeatureEnabled("imageUpload") && (
          <div className="flex flex-col gap-2">
            <label
              className={`flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold transition-all ${
                uploadingField
                  ? "cursor-not-allowed opacity-50 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-900"
                  : "cursor-pointer text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
              }`}
            >
              {uploadingField === "cover" ? (
                <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploadingField === "cover"
                ? `${t("uploading")} (${uploadProgress}%)`
                : t("uploadCoverImage")}
              {!permissions?.coverImage && <Lock className="h-4 w-4 text-amber-500 shrink-0" />}
              <input
                type="file"
                accept="image/*"
                disabled={Boolean(uploadingField)}
                className="hidden"
                onClick={(e) => {
                  if (!permissions?.coverImage) {
                    e.preventDefault();
                    uploadImage(null, "cover");
                  }
                }}
                onChange={(event) =>
                  uploadImage(event.target.files?.[0], "cover", 2 * 1024 * 1024)
                }
              />
            </label>
            {uploadingField === "cover" && (
              <div className="w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-1.5 rounded-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label={t("fullName")}
          value={card.personal.fullName}
          onChange={(value) => onUpdatePersonal("fullName", value)}
        />
        <Field
          label={t("company")}
          value={card.personal.company}
          onChange={(value) => onUpdatePersonal("company", value)}
        />
        <Field
          label={t("jobTitle")}
          value={card.personal.jobTitle}
          onChange={(value) => onUpdatePersonal("jobTitle", value)}
        />
        <div className="md:col-span-2">
          <Field
            label={t("bio")}
            value={card.personal.bio}
            maxLength={150}
            onChange={(value) => onUpdatePersonal("bio", value)}
            textarea
          />
        </div>
      </div>
    </div>
  );
}
