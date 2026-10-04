import envConfig from "./env.js";

const { env } = envConfig;

export const REFRESH_COOKIE_NAME = "refreshToken";

export function getCookieOptions(overrides = {}) {
  const secure = env.NODE_ENV === "production" && env.COOKIE_SECURE;

  return {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
    path: "/",
    ...overrides,
  };
}

export const cookieOptions = getCookieOptions();

export default {
  REFRESH_COOKIE_NAME,
  cookieOptions,
  getCookieOptions,
};
