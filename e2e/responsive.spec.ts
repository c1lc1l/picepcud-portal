import { expect, test } from "@playwright/test";
import { horizontalOverflow, PUBLIC_PAGES, VIEWPORT_WIDTHS } from "./helpers";

test.describe("no sideways scrolling", () => {
  for (const width of VIEWPORT_WIDTHS) {
    test(`public pages fit at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const { path } of [...PUBLIC_PAGES, { path: "/nope-404" }]) {
        await page.goto(path);
        expect(await horizontalOverflow(page), `${path} @ ${width}px`).toBe(0);
      }
    });
  }
});

// Regression: officer titles were cut off inside their cards on phones
// (the card clips, so the page never scrolled sideways to reveal it).
test.describe("officer titles are never clipped", () => {
  for (const width of [320, 360, 375, 430, 768]) {
    test(`at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/officers");
      const titles = page.locator("button span.font-wide");
      test.skip((await titles.count()) === 0, "Officer roster is not published");
      const clipped = await titles.evaluateAll((spans) =>
        spans
          .filter((s) => {
            const range = document.createRange();
            range.selectNodeContents(s);
            const right = s.getBoundingClientRect().right;
            return [...range.getClientRects()].some((r) => r.right > right + 1);
          })
          .map((s) => s.textContent),
      );
      expect(clipped).toEqual([]);
    });
  }
});

test.describe("mobile navigation", () => {
  test.use({ viewport: { width: 375, height: 800 } });

  test("menu opens, navigates, and closes with Escape", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Open menu" });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    // Desktop links are hidden at this width.
    await expect(
      page.getByRole("link", { name: "Log in", exact: true }),
    ).toBeHidden();

    await toggle.click();
    const close = page.getByRole("button", { name: "Close menu" });
    await expect(close).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();

    const reopen = page.getByRole("button", { name: "Open menu" });
    const panelId = await reopen.getAttribute("aria-controls");
    await reopen.click();
    const panel = page.locator(`[id="${panelId}"]`);
    // Exactly one Main landmark (the panel lives inside it, not beside it).
    await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(1);
    await panel.getByRole("link", { name: "Events", exact: true }).click();
    await expect(page).toHaveURL(/\/events$/);
    await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
  });

  test("tapping outside closes the menu", async ({ page }) => {
    await page.goto("/events");
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.mouse.click(180, 700);
    await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
  });

  test("hidden at tablet width and up", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Open menu" })).toBeHidden();
    await expect(
      page.getByRole("link", { name: "Log in", exact: true }),
    ).toBeVisible();
  });
});
