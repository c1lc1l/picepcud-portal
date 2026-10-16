import { expect, test } from "@playwright/test";

test.describe("security headers", () => {
  for (const path of ["/", "/login", "/register"]) {
    test(`${path} cannot be framed and does not leak the stack`, async ({
      request,
    }) => {
      const res = await request.get(path);
      const h = res.headers();
      expect(h["x-frame-options"]).toBe("DENY");
      expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
      expect(h["x-content-type-options"]).toBe("nosniff");
      expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
      expect(h["permissions-policy"]).toBeTruthy();
      expect(h["x-powered-by"]).toBeUndefined();
    });
  }
});

test.describe("no secrets in the client", () => {
  test("public HTML and scripts carry no server-only keys", async ({
    page,
  }) => {
    const bodies: string[] = [];
    page.on("response", async (r) => {
      const type = r.headers()["content-type"] ?? "";
      if (/javascript|html/.test(type)) bodies.push(await r.text().catch(() => ""));
    });
    await page.goto("/");
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    const all = bodies.join("\n");
    expect(all).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY|RESEND_API_KEY/);
    expect(all).not.toMatch(/\bre_[A-Za-z0-9]{8,}_[A-Za-z0-9]{8,}/); // Resend key shape
    // A service-role JWT carries "role":"service_role" in its payload.
    for (const jwt of all.match(/eyJ[\w-]+\.eyJ[\w-]+\.[\w-]+/g) ?? []) {
      const payload = Buffer.from(jwt.split(".")[1], "base64url").toString();
      expect(payload).not.toContain("service_role");
    }
  });

  test("nothing sensitive is written to browser storage when signed out", async ({
    page,
  }) => {
    await page.goto("/");
    await page.goto("/login");
    const stored = await page.evaluate(() =>
      JSON.stringify({ ...localStorage, ...sessionStorage }),
    );
    expect(stored).not.toMatch(/access_token|refresh_token|service_role/);
  });
});
