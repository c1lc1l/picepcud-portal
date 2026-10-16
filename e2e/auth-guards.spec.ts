import { expect, test } from "@playwright/test";

const PROTECTED = [
  "/dashboard",
  "/dashboard/events",
  "/admin",
  "/admin/payments",
  "/admin/members",
  "/admin/events",
  "/admin/highlights",
  "/admin/officers",
  "/admin/settings",
];

test.describe("route protection (signed out)", () => {
  for (const path of PROTECTED) {
    test(`${path} redirects to /login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login$/);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        /Log in/i,
      );
    });
  }

  test("GCash QR route refuses anonymous requests", async ({ request }) => {
    const res = await request.get("/payments/gcash-qr", { maxRedirects: 0 });
    expect(res.status()).toBe(401);
  });
});

test.describe("auth callback", () => {
  for (const next of ["//evil.example", "/\\evil.example", "https://evil.example/x"]) {
    test(`never redirects off-site (next=${next})`, async ({ request }) => {
      const res = await request.get(
        `/auth/callback?code=invalid&next=${encodeURIComponent(next)}`,
        { maxRedirects: 0 },
      );
      expect(res.status()).toBe(307);
      const location = new URL(res.headers()["location"], "http://localhost");
      expect(location.hostname).toBe("localhost");
    });
  }

  test("an expired reset link lands on forgot-password with a notice", async ({
    page,
  }) => {
    await page.goto("/auth/callback?code=invalid&next=/reset-password");
    await expect(page).toHaveURL(/\/forgot-password\?expired=1$/);
    await expect(page.getByRole("status")).toContainText(/expired/i);
  });
});
