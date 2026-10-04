import _asyncHandler4281 from "../util/asyncHandler.js";
const { asyncHandler } = _asyncHandler4281;
import _env7447 from "../config/env.js";
const { env } = _env7447;
import cloudinary from "../config/cloudinary.js";
import { uploadToCloudinary } from "../services/uploadService.js";
import _entitlements from "../util/entitlements.js";
const { canAccess } = _entitlements;

// POST /api/upload/base64?field=avatar|cover
const uploadBase64 = asyncHandler(async (req, res) => {
  const field = req.query.field || req.body?.field;
  const imageData = req.body?.imageData || req.body?.image;

  if (!env.CLOUDINARY_CLOUD_NAME) {
    return res.status(503).json({ message: "Cloudinary configuration missing" });
  }
  if (!["avatar", "cover"].includes(field)) {
    return res.status(400).json({ message: "Invalid field: must be 'avatar' or 'cover'" });
  }
  if (field === "cover" && !canAccess(req.subscription?.entitlements, "coverImage")) {
    return res.status(403).json({ message: "Cover image is available on the Pro plan" });
  }
  if (!imageData) {
    return res.status(400).json({ message: "No image data provided" });
  }

  let base64 = String(imageData);
  const dataUriMatch = base64.match(/^data:(image\/[a-zA-Z+.-]+);base64,/);
  if (base64.startsWith("data:") && !dataUriMatch) {
    return res.status(400).json({ message: "Only image files are supported" });
  }
  if (dataUriMatch) {
    base64 = base64.slice(dataUriMatch[0].length);
  }

  const cleanBase64 = base64.trim().replace(/\s+/g, "");
  const buffer = Buffer.from(cleanBase64, "base64");
  if (!buffer.length || buffer.length > 10 * 1024 * 1024) {
    return res.status(400).json({ message: "Image must be between 1 byte and 10 MB" });
  }

  try {
    const userId = req.user._id.toString();
    const folder = field === "cover" ? "thenith/covers" : "thenith/avatars";
    const fullPublicId = `${folder}/${userId}`;

    // Try to delete old image, ignore if it fails
    try {
      const uploader = cloudinary?.uploader || cloudinary?.default?.uploader;
      if (uploader) {
        await uploader.destroy(fullPublicId, { invalidate: true });
      }
    } catch {
      // ignore
    }

    const result = await uploadToCloudinary(buffer, folder, userId);
    if (field === "cover") {
      req.user.coverImage = result.secure_url;
    } else {
      req.user.avatar = result.secure_url;
    }
    await req.user.save();
    res.json({ url: result.secure_url });
  } catch (e) {
    res.status(502).json({ message: e.message || "Cloudinary upload failed" });
  }
});

export default { uploadBase64 };
