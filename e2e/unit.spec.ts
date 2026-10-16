// Pure-function checks for validation and parsing helpers. These run in the
// Playwright runner without a browser.
import { expect, test } from "@playwright/test";
import { addDays, monthGrid, parseDateKey, shiftKeyByMonths } from "@/lib/calendar";
import { splitHashtags } from "@/lib/highlights/types";
import { parseYear, sanitizeSearch } from "@/lib/members";
import { isRosterLive, officerInitials } from "@/lib/officers/validation";
import { loginSchema, registerSchema } from "@/lib/validations/auth";

test.describe("members search", () => {
  test("strips PostgREST filter syntax from search input", () => {
    expect(sanitizeSearch("a,b(c)%_*\\")).toBe("a b c");
    expect(sanitizeSearch("x".repeat(200))).toHaveLength(100);
    expect(sanitizeSearch(undefined)).toBe("");
  });

  test("only accepts year levels 1-5", () => {
    expect(parseYear("3")).toBe("3");
    expect(parseYear("6")).toBeUndefined();
    expect(parseYear("1 or 1=1")).toBeUndefined();
  });
});

test.describe("auth validation", () => {
  test("only PCU addresses can log in", () => {
    expect(loginSchema.safeParse({ email: "a@pcu.edu.ph", password: "x" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: " A@PCU.EDU.PH ", password: "x" }).success).toBe(true);
    for (const email of ["a@gmail.com", "a@pcu.edu.ph.evil.com", "a@notpcu.edu.ph"]) {
      expect(loginSchema.safeParse({ email, password: "x" }).success, email).toBe(false);
    }
  });

  test("registration enforces year level and password length", () => {
    const base = {
      email: "a@pcu.edu.ph",
      password: "longenough",
      fullName: "Juan Dela Cruz",
      studentId: "2021-00123",
      yearLevel: "2",
    };
    expect(registerSchema.safeParse(base).success).toBe(true);
    expect(registerSchema.safeParse({ ...base, yearLevel: "0" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, yearLevel: "2.5" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, password: "short" }).success).toBe(false);
  });
});

test.describe("highlights", () => {
  test("splits trailing hashtags into chips but keeps inline ones", () => {
    expect(splitHashtags("We placed #1 at the fair! #PICE #CE2026")).toEqual({
      body: "We placed #1 at the fair!",
      tags: ["#PICE", "#CE2026"],
    });
    expect(splitHashtags("No tags here").tags).toEqual([]);
  });
});

test.describe("officer roster", () => {
  const settings = {
    term_label: "A.Y. 2026 - 2027",
    term_start: "2026-08-01T16:00:00Z",
    term_end: "2027-06-07T15:59:59Z",
    is_published: true,
    published_at: null,
  };

  test("is live only while published and inside its term", () => {
    expect(isRosterLive(settings, new Date("2026-10-17T00:00:00Z"))).toBe(true);
    expect(isRosterLive(settings, new Date("2027-07-01T00:00:00Z"))).toBe(false);
    expect(isRosterLive({ ...settings, is_published: false }, new Date("2026-10-17"))).toBe(false);
    expect(isRosterLive({ ...settings, term_label: " " }, new Date("2026-10-17"))).toBe(false);
  });

  test("initials", () => {
    expect(officerInitials("John Paul M. Fulgar")).toBe("JF");
    expect(officerInitials("Ñino")).toBe("ÑI");
    expect(officerInitials("  ")).toBe("•");
  });
});

test.describe("calendar", () => {
  test("rejects impossible dates and clamps month shifts", () => {
    expect(parseDateKey("2026-02-30")).toBeNull();
    expect(shiftKeyByMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(monthGrid({ year: 2026, month: 9 })).toHaveLength(42);
  });
});
