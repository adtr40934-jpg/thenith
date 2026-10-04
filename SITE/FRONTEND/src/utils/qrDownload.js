/**
 * Utility to download QR code in ultra-crisp 1080x1080 resolution PNG format.
 */
export async function downloadQrCode1080({
  svgElement,
  svgId,
  fileName = "QR_Code_1080x1080.png",
  cardName = "",
  includeCenterBadge = false,
}) {
  const el = svgElement || (svgId ? document.getElementById(svgId) : null);
  if (!el) {
    return;
  }

  const canvas = document.createElement("canvas");
  const size = 1080;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // 1. Fill clean high-res white background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  // 2. Clone SVG to avoid mutating original DOM
  const clone = el.cloneNode(true);
  clone.setAttribute("width", "1080");
  clone.setAttribute("height", "1080");
  if (!clone.getAttribute("xmlns")) {
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  }

  // Ensure fill colors are dark slate (#0f172a) instead of currentColor or transparent
  clone.querySelectorAll("path").forEach((path) => {
    const fill = path.getAttribute("fill");
    if (!fill || fill === "currentColor" || fill === "transparent") {
      path.setAttribute("fill", "#0f172a");
    }
  });

  const svgString = new XMLSerializer().serializeToString(clone);
  const img = new Image();
  img.crossOrigin = "anonymous";

  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
  });

  // 3. Draw QR with quiet zone padding (90px padding on each side, QR = 900x900px)
  const padding = 90;
  const qrSize = size - padding * 2;

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, padding, padding, qrSize, qrSize);

  // 4. Optional Center Badge (matches CardsPage visual)
  if (includeCenterBadge) {
    const badgeSize = 150;
    const x = (size - badgeSize) / 2;
    const y = (size - badgeSize) / 2;
    const r = 32;

    // Drop shadow
    ctx.save();
    ctx.shadowColor = "rgba(15, 23, 42, 0.12)";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(x, y, badgeSize, badgeSize, r);
    ctx.fill();
    ctx.restore();

    // Subtle border
    ctx.save();
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(x, y, badgeSize, badgeSize, r);
    ctx.stroke();
    ctx.restore();

    // Draw stylish Lucide-style QR vector icon in indigo
    ctx.save();
    ctx.strokeStyle = "#4f46e5";
    ctx.fillStyle = "#4f46e5";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const iconSize = 72;
    const ix = (size - iconSize) / 2;
    const iy = (size - iconSize) / 2;
    const s = iconSize;

    // Top-left box
    ctx.strokeRect(ix, iy, s * 0.4, s * 0.4);
    ctx.fillRect(ix + s * 0.12, iy + s * 0.12, s * 0.16, s * 0.16);

    // Top-right box
    ctx.strokeRect(ix + s * 0.6, iy, s * 0.4, s * 0.4);
    ctx.fillRect(ix + s * 0.72, iy + s * 0.12, s * 0.16, s * 0.16);

    // Bottom-left box
    ctx.strokeRect(ix, iy + s * 0.6, s * 0.4, s * 0.4);
    ctx.fillRect(ix + s * 0.12, iy + s * 0.72, s * 0.16, s * 0.16);

    // Bottom-right dots
    ctx.fillRect(ix + s * 0.62, iy + s * 0.62, s * 0.14, s * 0.14);
    ctx.fillRect(ix + s * 0.84, iy + s * 0.62, s * 0.14, s * 0.14);
    ctx.fillRect(ix + s * 0.62, iy + s * 0.84, s * 0.14, s * 0.14);
    ctx.fillRect(ix + s * 0.84, iy + s * 0.84, s * 0.14, s * 0.14);

    ctx.restore();
  }

  // 5. Trigger download
  const cleanName = cardName
    ? `${cardName.trim().replace(/[/\\?%*:|"<>]/g, "_")}_QR_1080x1080.png`
    : fileName.endsWith(".png")
      ? fileName
      : `${fileName}.png`;

  const link = document.createElement("a");
  link.download = cleanName;
  link.href = canvas.toDataURL("image/png", 1.0);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
