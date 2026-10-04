import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import _env5040 from "../config/env.js";
const { env } = _env5040;

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

function createOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashOtp(code) {
  return crypto.createHash("sha256").update(String(code)).digest("hex");
}

function createVerificationToken(email, purpose) {
  const secret = env.JWT_ACCESS_SECRET + "_verify";
  return jwt.sign({ email, purpose, verified: true }, secret, {
    expiresIn: "15m",
  });
}

function verifyVerificationToken(token, purpose) {
  const secret = env.JWT_ACCESS_SECRET + "_verify";
  const payload = jwt.verify(token, secret);
  if (payload.purpose !== purpose || payload.verified !== true)
    throw new Error("Invalid verification token");
  return payload;
}

export default {
  OTP_TTL_MS,
  OTP_RESEND_MS,
  OTP_MAX_ATTEMPTS,
  createOtp,
  hashOtp,
  createVerificationToken,
  verifyVerificationToken,
};
