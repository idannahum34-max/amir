export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const getLoginUrl = (returnPath: string = "/dashboard") => {
  const params = new URLSearchParams();
  params.set("returnTo", returnPath);
  return `/login?${params.toString()}`;
};
