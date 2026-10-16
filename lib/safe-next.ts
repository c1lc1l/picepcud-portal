/**
 * Turns an untrusted `next` value (query string or form field) into a
 * same-site path, or the fallback. Anything that resolves to another origin
 * (`//evil.com`, `/\evil.com`, `https://evil.com`) or back to the auth pages
 * is rejected, so a crafted link can't bounce a member off-site after login.
 */
export function safeNextPath(
  value: FormDataEntryValue | string | null | undefined,
  fallback = "/dashboard",
): string {
  if (typeof value !== "string" || !value.startsWith("/")) return fallback;
  const base = "http://same-origin.invalid";
  try {
    const url = new URL(value, base);
    if (url.origin !== base) return fallback;
    if (/^\/(login|register)\/?$/.test(url.pathname)) return fallback;
    return `${url.pathname}${url.search}`;
  } catch {
    return fallback;
  }
}
