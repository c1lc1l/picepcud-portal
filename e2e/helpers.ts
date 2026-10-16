import type { Page } from "@playwright/test";

export const PUBLIC_PAGES = [
  { path: "/", h1: /Philippine Institute of Civil Engineers/i },
  { path: "/events", h1: /^Events$/i },
  { path: "/officers", h1: /^Officers$/i },
  { path: "/login", h1: /^Log in$/i },
  { path: "/register", h1: /^Join the chapter$/i },
  { path: "/forgot-password", h1: /^Reset password$/i },
  // Without a recovery session this shows the "link expired" state.
  { path: "/reset-password", h1: /^Link expired$/i },
] as const;

export const VIEWPORT_WIDTHS = [320, 375, 430, 768, 1024, 1440, 1920];

/** Collects uncaught page errors and console errors while a test runs. */
export function trackPageErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    // The browser logs the document's own 404 status on not-found pages.
    if (/status of 404/.test(m.text())) return;
    errors.push(`console: ${m.text()}`);
  });
  return errors;
}

/** Width the document scrolls past the viewport (0 = no sideways scroll). */
export function horizontalOverflow(page: Page) {
  return page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
}
