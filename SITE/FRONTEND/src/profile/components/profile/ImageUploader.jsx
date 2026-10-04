import React, { useState } from "react";
import PropTypes from "prop-types";
import api from "../../../api/index.js";
import ErrorNotice from "../../../components/ErrorNotice.jsx";
import { getLocalizedErrorMessage } from "../../../utils/errorHandling.js";

/**
 * Simple image uploader that posts the selected file directly to the backend
 * `/api/upload` endpoint using the modular upload route.
 *
 * Props:
 *  - field: "avatar" | "cover" – tells the backend which user field to update.
 *  - onUpload: (url: string) => void – called with the Cloudinary URL on success.
 *  - maxSize: number (bytes) – optional client‑side size limit (default 2 MiB).
 */
export default function ImageUploader({
  field,
  onUpload,
  maxSize = 2 * 1024 * 1024,
}) {
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic size validation (mirrors Multer limits)
    if (file.size > maxSize) {
      setError(
        `حجم الصورة أكبر من الحد المسموح به (${Math.round(maxSize / 1024 / 1024)} MiB).`,
      );
      return;
    }

    // Optional dimension check for cover images (client‑side preview)
    if (field === "cover") {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise((resolve) => (img.onload = resolve));
      const { width, height } = img;
      // Allowed dimensions – same as server constants (1000‑2000 × 300‑600)
      const MIN_W = 1000,
        MAX_W = 2000,
        MIN_H = 300,
        MAX_H = 600;
      if (width < MIN_W || width > MAX_W || height < MIN_H || height > MAX_H) {
        setError(
          `أبعاد الغلاف غير صالحة. يجب أن يكون العرض بين ${MIN_W} و ${MAX_W} بكسل، والارتفاع بين ${MIN_H} و ${MAX_H} بكسل.`,
        );
        return;
      }
    }

    try {
      setUploading(true);
      setError(null);
      const data = await api.upload.uploadFormData(field, file);
      if (data?.url) {
        onUpload(data.url);
      }
    } catch (err) {
      setError(getLocalizedErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="block text-sm font-medium text-gray-700">
        {field === "avatar" ? "رفع صورة شخصية" : "رفع غلاف"}
      </label>
      <input
        type="file"
        accept="image/*"
        disabled={uploading}
        onChange={handleChange}
        className="border rounded p-1"
      />
      {uploading && <p className="text-blue-600">جارٍ الرفع…</p>}
      <ErrorNotice error={error} />
    </div>
  );
}

ImageUploader.propTypes = {
  field: PropTypes.oneOf(["avatar", "cover"]).isRequired,
  onUpload: PropTypes.func.isRequired,
  maxSize: PropTypes.number,
};
