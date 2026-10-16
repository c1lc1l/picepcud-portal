import { expect, test } from "@playwright/test";

// Regression: logo <Image>s had no `sizes`, so every page downloaded the
// 1920w variant (~256 KB) for a logo drawn 30-225 px wide, and the hidden
// hero ghost was fetched eagerly on phones. That image was the mobile LCP.
test.describe("logo images are sized for their slot", () => {
  for (const path of ["/", "/events", "/login"]) {
    test(`${path} on a phone fetches no oversized logo`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      const widths: number[] = [];
      page.on("request", (req) => {
        const url = new URL(req.url());
        if (url.pathname !== "/_next/image") return;
        if (!url.searchParams.get("url")?.includes("pice-pcud-logo")) return;
        widths.push(Number(url.searchParams.get("w")));
      });
      await page.goto(path, { waitUntil: "networkidle" });
      expect(widths.length).toBeGreaterThan(0);
      expect(Math.max(...widths)).toBeLessThanOrEqual(640);
    });
  }

  test("no layout shift while the home page loads", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/", { waitUntil: "networkidle" });
    const cls = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let total = 0;
          new PerformanceObserver((list) => {
            for (const e of list.getEntries() as (PerformanceEntry & {
              value: number;
              hadRecentInput: boolean;
            })[]) {
              if (!e.hadRecentInput) total += e.value;
            }
          }).observe({ type: "layout-shift", buffered: true });
          setTimeout(() => resolve(total), 500);
        }),
    );
    expect(cls).toBeLessThan(0.1);
  });
});
