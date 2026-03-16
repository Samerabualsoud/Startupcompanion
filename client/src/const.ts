export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const LOGIN_PATH = "/login";
export const REGISTER_PATH = "/register";
export const APP_PATH = "/app";

// Returns the login page URL (replaces Manus OAuth)
export const getLoginUrl = (returnPath?: string) => {
  const base = LOGIN_PATH;
  if (returnPath) return `${base}?next=${encodeURIComponent(returnPath)}`;
  return base;
};
