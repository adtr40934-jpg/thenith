import QRCode from "qrcode";

/**
 * QR Code Service
 * Dynamically generates SVG and PNG data URLs without storing blobs in MongoDB.
 */

export async function generateQrSvg(url, options = {}) {
  const defaultOptions = {
    errorCorrectionLevel: "H",
    type: "svg",
    margin: 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
    ...options,
  };

  return QRCode.toString(url, defaultOptions);
}

export async function generateQrDataUrl(url, options = {}) {
  const defaultOptions = {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 600,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
    ...options,
  };

  return QRCode.toDataURL(url, defaultOptions);
}

export default {
  generateQrSvg,
  generateQrDataUrl,
};
