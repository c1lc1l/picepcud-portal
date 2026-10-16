import { expect, test, type Page } from "@playwright/test";

// Client-side validation only: none of these submissions reach Supabase,
// because the zod resolver blocks the server action until the form is valid.

async function expectFieldError(page: Page, id: string, message: RegExp) {
  const field = page.locator(`#${id}`);
  await expect(field).toHaveAttribute("aria-invalid", "true");
  const error = page.locator(`#${id}-error`);
  await expect(error).toHaveText(message);
  // The message is announced with the field.
  await expect(field).toHaveAttribute(
    "aria-describedby",
    new RegExp(`${id}-error`),
  );
}

test.describe("login form", () => {
  test("requires email and password", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Log in" }).click();
    await expectFieldError(page, "email", /valid email/i);
    await expectFieldError(page, "password", /required/i);
  });

  test("rejects non-PCU email addresses", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("PCU email").fill("someone@gmail.com");
    await page.getByLabel("Password", { exact: true }).fill("whatever123");
    await page.getByRole("button", { name: "Log in" }).click();
    await expectFieldError(page, "email", /pcu\.edu\.ph/i);
    await expect(page).toHaveURL(/\/login$/);
  });

  test("password visibility toggle reveals and hides the password", async ({
    page,
  }) => {
    await page.goto("/login");
    const password = page.getByLabel("Password", { exact: true });
    await password.fill("secret-pass");
    await expect(password).toHaveAttribute("type", "password");
    const toggle = page.getByRole("button", { name: "Show password" });
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await toggle.click();
    await expect(password).toHaveAttribute("type", "text");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await toggle.click();
    await expect(password).toHaveAttribute("type", "password");
  });

  test("shows the post-registration notice", async ({ page }) => {
    await page.goto("/login?registered=1");
    await expect(page.getByRole("status")).toContainText(/Account created/);
  });
});

test.describe("register form", () => {
  test("validates every field and keeps what was typed", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("Full name").fill("Juan Dela Cruz");
    await page.getByLabel("PCU email").fill("juan@yahoo.com");
    await page.getByLabel("Password", { exact: true }).fill("short");
    await page.getByRole("button", { name: "Create account" }).click();

    await expectFieldError(page, "studentId", /required/i);
    await expectFieldError(page, "yearLevel", /1-5/);
    await expectFieldError(page, "email", /pcu\.edu\.ph/i);
    await expectFieldError(page, "password", /8 characters/i);
    // Input is preserved after a failed submit.
    await expect(page.getByLabel("Full name")).toHaveValue("Juan Dela Cruz");
    await expect(page).toHaveURL(/\/register$/);
  });

  test("clears an error once the field is fixed", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("button", { name: "Create account" }).click();
    await expectFieldError(page, "fullName", /required/i);
    await page.getByLabel("Full name").fill("Juan Dela Cruz");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.locator("#fullName")).not.toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });
});

test.describe("forgot password form", () => {
  test("requires a PCU email", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expectFieldError(page, "email", /valid email/i);
    await page.getByLabel("PCU email").fill("x@example.com");
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expectFieldError(page, "email", /pcu\.edu\.ph/i);
  });

  test("expired-link notice is shown when requested", async ({ page }) => {
    await page.goto("/forgot-password?expired=1");
    await expect(page.getByRole("status")).toContainText(/expired/i);
  });

  test("reset page without a session offers a new link", async ({ page }) => {
    await page.goto("/reset-password");
    await page.getByRole("link", { name: "Request a new link" }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
  });
});
