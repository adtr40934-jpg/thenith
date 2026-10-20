// Disabled rate limiting completely for local development and network access.
const passthrough = (_req, _res, next) => next();

export const authRateLimit = passthrough;
export const usernameRateLimit = passthrough;
export const publicRequestRateLimit = passthrough;
export const supportRateLimit = passthrough;
export const analyticsRateLimit = passthrough;
export const adminLoginRateLimit = passthrough;

export default {
  authRateLimit,
  usernameRateLimit,
  publicRequestRateLimit,
  supportRateLimit,
  analyticsRateLimit,
  adminLoginRateLimit,
};
