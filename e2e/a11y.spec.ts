import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { PUBLIC_PAGES } from "./helpers";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test.describe("axe: WCAG 2.2 AA", () => {
  for (const width of [375, 1440]) {
    for (const { path } of [...PUBLIC_PAGES, { path: "/nope-404" }]) {
      test(`${path} @ ${width}px has no violations`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path);
        const { violations } = await new AxeBuilder({ page })
          .withTags(WCAG_TAGS)
          .analyze();
        expect(
          violations.map((v) => `${v.id}: ${v.nodes.length} node(s)`),
        ).toEqual([]);
      });
    }
  }

  test("login form with errors has no violations", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.locator("#email-error")).toBeVisible();
    const { violations } = await new AxeBuilder({ page })
      .withTags(WCAG_TAGS)
      .analyze();
    expect(violations.map((v) => v.id)).toEqual([]);
  });
});

test.describe("keyboard", () => {
  test("login form is fully operable by keyboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("PCU email").focus();
    await page.keyboard.type("not-an-email");
    // Email -> "Forgot password?" (label row) -> password -> show/hide toggle.
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("link", { name: "Forgot password?" }),
    ).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Password", { exact: true })).toBeFocused();
    await page.keyboard.type("pw");
    await page.keyboard.press("Enter");
    await expect(page.locator("#email-error")).toBeVisible();
  });

  test("focused controls show a visible focus indicator", async ({ page }) => {
    await page.goto("/login");
    const button = page.getByRole("button", { name: "Log in" });
    await button.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(button).toBeFocused();
    const ring = await button.evaluate((el) => {
      const s = getComputedStyle(el);
      return `${s.boxShadow} ${s.outlineStyle}`;
    });
    expect(ring).not.toBe("none none");
  });
});

test.describe("officer profile dialog", () => {
  test("opens, traps focus, closes with Escape and restores focus", async ({
    page,
  }) => {
    await page.goto("/officers");
    const cards = page.getByRole("button", { name: /View profile/ });
    test.skip(
      (await cards.count()) === 0,
      "Officer roster is not published, so there is nothing to open",
    );

    const first = cards.first();
    await first.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading")).toBeVisible();

    // Tabbing cycles inside the dialog. Base UI routes focus through a guard
    // element for one tick at the edges, so wait for it to settle back in.
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Tab");
      await expect
        .poll(() => dialog.evaluate((d) => d.contains(document.activeElement)))
        .toBe(true);
    }

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(first).toBeFocused();
  });

  test("reduced motion disables hover lift", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/officers");
    const card = page.getByRole("button", { name: /View profile/ }).first();
    test.skip((await card.count()) === 0, "Officer roster is not published");
    await card.hover();
    await page.waitForTimeout(600);
    const transform = await card.evaluate((el) => getComputedStyle(el).transform);
    expect(["none", "matrix(1, 0, 0, 1, 0, 0)"]).toContain(transform);
  });
});

test.describe("highlights carousel", () => {
  test("arrow buttons scroll the strip and cards open a dialog", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/");
    const right = page.getByRole("button", { name: "Scroll posts right" });
    test.skip((await right.count()) === 0, "No highlights are published");

    const strip = page.locator("ul.snap-x");
    const before = await strip.evaluate((el) => el.scrollLeft);
    await right.click();
    await expect
      .poll(() => strip.evaluate((el) => el.scrollLeft))
      .toBeGreaterThan(before);

    await page.getByRole("button", { name: /View post$/ }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Close" }).click();
    await expect(dialog).toBeHidden();
  });
});
