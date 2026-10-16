import { expect, test } from "@playwright/test";
import { PUBLIC_PAGES, trackPageErrors } from "./helpers";

test.describe("public pages render", () => {
  for (const { path, h1 } of PUBLIC_PAGES) {
    test(`${path} renders its heading without errors`, async ({ page }) => {
      const errors = trackPageErrors(page);
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(h1);
      await expect(page).toHaveTitle(/PICE PCUD/);
      expect(errors).toEqual([]);
    });
  }
});

test.describe("navigation", () => {
  test("header links reach events and login, and the logo returns home", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const main = page.getByRole("navigation", { name: "Main" }).first();

    await main.getByRole("link", { name: "Events" }).click();
    await expect(page).toHaveURL(/\/events$/);
    await expect(
      main.getByRole("link", { name: "Events" }),
    ).toHaveAttribute("aria-current", "page");

    await page.getByRole("navigation", { name: "Main" }).first()
      .getByRole("link", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.getByRole("link", { name: "Back to site" }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("browser back and forward restore pages", async ({ page }) => {
    await page.goto("/");
    await page.goto("/events");
    await page.goto("/login");
    await page.goBack();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Events/);
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await page.goForward();
    await expect(page).toHaveURL(/\/events$/);
  });

  test("footer links work", async ({ page }) => {
    await page.goto("/events");
    const footer = page.getByRole("navigation", { name: "Footer" });
    await footer.getByRole("link", { name: "Join the chapter" }).click();
    await expect(page).toHaveURL(/\/register$/);
  });

  test("external links open safely in a new tab", async ({ page }) => {
    await page.goto("/");
    const external = page.locator('a[target="_blank"]');
    const count = await external.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(external.nth(i)).toHaveAttribute(
        "rel",
        /noopener.*noreferrer|noreferrer.*noopener/,
      );
    }
  });
});

test.describe("link semantics", () => {
  // Regression: button-styled links used to render as <a role="button">, so
  // screen readers announced navigation as an in-page action.
  for (const { path } of [...PUBLIC_PAGES, { path: "/nope-404" }]) {
    test(`${path} has no links disguised as buttons`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('a[href][role="button"]')).toHaveCount(0);
    });
  }

  test("hero calls to action are announced as links", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("link", { name: "Join the chapter" }).first(),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Member login" }).first())
      .toBeVisible();
  });
});

test.describe("not found", () => {
  test("unknown routes return 404 with a branded page and a way back", async ({
    page,
  }) => {
    const res = await page.goto("/this-page-does-not-exist");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /not found/i,
    );
    // Site chrome is present, so the visitor isn't stranded.
    await expect(
      page.getByRole("navigation", { name: "Footer" }),
    ).toBeVisible();
    await page.getByRole("link", { name: /back to (the )?home/i }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});
