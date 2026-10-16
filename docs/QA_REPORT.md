# QA Report — PICE PCUD Portal

**Audit date:** 2026-10-17 · **Branch:** `main` (from `edbd0f1`, changes uncommitted) · **Build under test:** Next.js 16.3.8 production build (`next build && next start`)

---

## 1. Executive summary

The portal is in good shape for a project of its size. The code is careful: server actions re-check admin rights, inputs are validated with zod, outbound links are `noopener`, and redirects can't leave the site. The public pages are responsive down to 320 px and now pass axe (WCAG 2.2 AA rules) with no violations.

**Major findings**

1. **Critical: members can self-approve payments (QA-01).** The database rule for member payment inserts only checks *whose* payment it is, not its *status*. The Supabase anon key is public by design, so a signed-in member can skip the app and insert a payment that is already `approved` through the Supabase API. **A fix is written (`supabase/migrations/20261021_payments_insert_guard.sql`) but has not been applied.** The only database is the live project, and changing it needs your go-ahead.
2. **High: Next.js 16.3.5 had seven published advisories**, one rated critical. This includes SSRF in image optimization, which this app uses. **Fixed** by upgrading to 16.3.8, a patch release.
3. **Medium: hardening and UX gaps, all fixed:**
   - no anti-clickjacking/security headers;
   - an unbranded, dead-end 404 page and no error page;
   - an oversized logo image that was the mobile LCP element;
   - several accessibility defects.

**Recommendation: CONDITIONAL.** The site can launch once QA-01's migration is applied and the authenticated smoke test in §6 has been run. See §7.

---

## 2. Test coverage

### Pages and features tested

| Area | How | Result |
|---|---|---|
| Home, /events, /officers (live data) | Browser: render, links, carousel, officer and highlight dialogs, 7 viewports, axe, Lighthouse | Pass (after fixes) |
| /login, /register, /forgot-password, /reset-password | Browser: validation, error announcement, input preservation, password toggle, keyboard, axe | Pass |
| 404 page | Browser: status code, branding, way back | Fixed → Pass |
| Route protection (/dashboard, /dashboard/events, /admin + 6 sub-pages) | Browser: signed-out redirect to /login | Pass |
| `/payments/gcash-qr` | HTTP: anonymous request | 401, Pass |
| `/auth/callback` open-redirect | HTTP: `//evil`, `/\evil`, absolute URL in `next` | Stays on-site, Pass |
| Expired reset link | Browser: callback → `/forgot-password?expired=1` notice | Pass |
| Signed-in UI: portal header, admin tabs, payments table, pagination, events list, create-event dialog, GCash payment dialog, approve/reject dialogs | Temporary preview route with fake data (deleted afterwards): 320/375/768/1440 px, axe, screenshots | Pass |
| Server actions, RLS policies, storage policies, signup trigger | Code review of `app/actions/*`, `lib/**`, all 11 migrations | 1 critical + several recommendations |
| Secrets exposure | Browser: scanned HTML/JS for service-role JWTs and Resend key shapes; browser storage | Pass |
| Validation helpers | Unit tests (search sanitising, PCU-email rule, roster liveness, calendar, hashtags) | Pass |

### Viewports

320, 375, 430, 768, 1024, 1440 and 1920 px, every public page at every width. Signed-in UI at 320, 375, 768 and 1440 px.

### Browser environments

Google Chrome 155 (headless, via Playwright `channel: "chrome"`). Lighthouse 12 used the same Chrome.

### Tools

Playwright 1.64 (new), @axe-core/playwright 4.14 (new), Lighthouse 12 (run via `npx`, not added), TypeScript, ESLint, `next build`, `npm audit`, and a `sharp`-based pixel diff for before/after screenshots.

### Not tested, and why

| Area | Reason |
|---|---|
| Real sign-in, sign-up, payment submission, receipt upload, approve/reject, approval email, CSV export, officer/highlight/featured/GCash editing, password-reset email | The only Supabase project is the live one. Testing these would create accounts, rows, uploads and emails there. No test credentials were provided, and the project's rule is to ask before changing live data. These components were exercised only with fake data (UI) and code review (logic). |
| Exploiting QA-01 against the database | Would mean inserting a fraudulent row into the live database. Confirmed from migration source instead. |
| `app/error.tsx` at runtime | Triggering it means making Supabase fail. Verified by type-check and build only. |
| Firefox, Safari, real phones | Only Chrome is installed. Safari/iOS is worth a manual pass, since many members will use iPhones. |
| INP (field) | Needs real-user interaction data. Lighthouse lab TBT is reported instead. |
| Dark mode | Dark tokens exist in `globals.css`, but no theme provider is mounted, so dark mode isn't reachable. |

---

## 3. Bug report

Severity reflects impact on this app's users and data. Status meanings: **Fixed** means changed and verified by tests. **Fix written** means code exists but has not been applied. **Open** means it is a recommendation only.

### QA-01 · Critical · Members can insert pre-approved payments
- **Where:** `supabase/migrations/20260921_init_schema.sql`, policy `payments_insert_own`.
- **Problem:** The insert policy's check is only `user_id = auth.uid()`. The app's `submitPayment` action always sends `status: 'pending'`, but nothing in the database enforces that.
- **Reproduction (not executed against live data):** sign in as a member, then call `supabase.from('payments').insert({ user_id: <own id>, amount: 1, reference_no: '0000000000000', proof_url: '<own id>/x.webp', status: 'approved' })` from the browser console using the public anon key.
- **Expected:** The insert is rejected, or forced to `pending`.
- **Actual (by policy analysis):** An approved payment is created with no officer review. The member's dashboard then shows "approved", the admin roster export shows them as paid, and they can also set `admin_notes` and backdate `created_at`.
- **Root cause:** The RLS `WITH CHECK` doesn't constrain `status` or `admin_notes`.
- **Fix written:** `supabase/migrations/20261021_payments_insert_guard.sql`. It:
  1. recreates the policy to require `status = 'pending' and admin_notes is null`;
  2. adds a trigger so non-admins can't set `created_at`/`updated_at`;
  3. limits the `gcash-receipts` bucket to images up to 2 MB (QA-10).

  The script is idempotent and changes no existing rows.
- **Verification:** **Not applied, not verified live.** After running it in the SQL Editor, re-try the reproduction with a test member account and confirm the insert fails. A normal payment submission should still work.

### QA-02 · High · Vulnerable Next.js version — **Fixed**
- **Where:** `package.json` (`next@16.3.5`).
- **Problem:** `npm audit` reported 1 critical and 11 high advisories. The `next` ones were:
  - RCE in `next/og` (not used here);
  - SSRF in Image Optimization (used here);
  - cache poisoning;
  - dev-server info disclosure.
- **Fix:**
  - `next` and `eslint-config-next` updated to **16.3.8** (same minor version, exact pins kept);
  - `npm audit fix` (non-breaking) updated `sharp` to 0.35.5 and `source-map-js` to 1.2.2.
- **Verification:** Build, lint, type-check and all tests pass on 16.3.8. `npm audit` now shows **0 critical / 9 high**; for what's left, see QA-18.

### QA-03 · Medium · No security headers (clickjacking, MIME sniffing, stack disclosure) — **Fixed**
- **Where:** `next.config.ts`.
- **Reproduction:** `curl -I /login` showed no `X-Frame-Options` or CSP, and did show `X-Powered-By: Next.js`.
- **Expected:** The login and payment pages can't be framed by another site.
- **Actual:** Any site could embed them in an iframe.
- **Fix:** Added to every response:
  - `X-Frame-Options: DENY`
  - `Content-Security-Policy: frame-ancestors 'none'`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - a restrictive `Permissions-Policy`

  Also set `poweredByHeader: false`. A full script CSP was deliberately left out, because Next's inline scripts need nonces.
- **Verification:** `e2e/security.spec.ts` (3 tests). These failed before the fix and pass after.

### QA-04 · Medium · 404 is a bare dead end; no error page — **Fixed**
- **Where:** `app/not-found.tsx` and `app/error.tsx` (both new).
- **Reproduction:** Visit `/anything-unknown`.
- **Expected:** A branded page with a way back.
- **Actual:** Next's default black-on-white "404 | This page could not be found." with no navigation, header or footer.
- **Fix:**
  - **404 page:** uses the existing `PageMasthead`/`SiteFooter`, with "Back to the homepage" and "See events" links.
  - **Error page:** branded, with "Try again" (Next 16 `retry()`), a home link, and the error digest for log matching.
- **Verification:** `e2e/pages.spec.ts › not found` (status 404, heading, footer, link home). Also covered in the 7-viewport overflow sweep and axe. The error page was build-verified only (see §2).

### QA-05 · Medium · Logo served at 1920 px on every page; mobile LCP — **Fixed**
- **Where:**
  - `app/page.tsx`
  - `app/(auth)/layout.tsx`
  - `components/site/SiteHeader.tsx`
  - `components/site/PageMasthead.tsx`
  - `components/portal/PortalHeader.tsx`
- **Problem:** The logo `<Image>`s had no `sizes`, so the browser picked the `w=1920` variant (~256 KB) for a logo drawn 26–270 px wide. On the home page this image *is* the mobile LCP element: 3.1 s of load time on Lighthouse's mobile profile. The decorative hero "ghost" copy is hidden on phones but was `loading="eager"`, so phones downloaded it as well.
- **Fix:**
  - Accurate `sizes` on each logo, derived from its Tailwind height and the 810:1154 aspect ratio.
  - The hidden ghost is now lazy, so it is no longer fetched while `display:none`.
- **Verification:**
  - **Requests:** on a phone the logo now costs 7 KB + 51 KB instead of ≥256 KB.
  - **Speed:** the LCP image's load phase fell from 3.1 s to 0.07–0.3 s.
  - **Lighthouse:** see §5.
  - **Visual check:** perceptual pixel diff and side-by-side crops show no visible quality loss.
  - **Regression test:** `e2e/performance.spec.ts` asserts no logo request wider than 640 px on phones.

### QA-06 · Medium · Card buttons' accessible names don't match visible text (WCAG 2.5.3) — **Fixed**
- **Where:**
  - `components/officers/OfficerProfileCard.tsx`
  - `components/site/HighlightCard.tsx`
- **Problem:** axe reported `label-content-name-mismatch` (serious) on 14 officer cards and 3 highlight cards. Their `aria-label` replaced the visible text, so voice-control users saying "click View profile" may not match the card.
- **Fix:** Removed the `aria-label` overrides and un-hid the "View profile" / "View post" cues, so the visible text is the accessible name.
- **Verification:** axe is clean on `/` and `/officers` at 375 and 1440 px (`e2e/a11y.spec.ts`). The officer-dialog and carousel tests use the new names.

### QA-07 · Low · Button-styled links were exposed to assistive tech as buttons (WCAG 4.1.2) — **Fixed**
- **Where:** 12 call sites using `<Button nativeButton={false} render={<Link/>}>`. These include the hero CTAs, "Join", "Create your account", "View post on Facebook", "Request a new link", "Save QR", pagination, Luma links in admin, and members "Clear".
- **Problem:** Base UI adds `role="button"` to the anchor, so screen readers announced navigation links as "button". Keyboard activation still worked, because Base UI handles Space.
- **Fix:** These now render as plain `<Link>`/`<a>` styled with the same `cn(buttonVariants(...))`, so classes and visuals are unchanged.
- **Verification:**
  - **Regression test:** `e2e/pages.spec.ts › link semantics` asserts no `a[href][role=button]` on any public page.
  - **Visual check:** before/after screenshots of all pages × 7 widths were pixel-identical, apart from intended changes.

### QA-08 · Low · Home "Events couldn't be loaded" message is invisible — **Fixed**
- **Where:** `app/page.tsx`, Upcoming events error state.
- **Problem:** `text-destructive` (#c2263a) on the violet band (#493f80) has a calculated contrast of **≈1.04:1**, so the error is effectively invisible when it fires.
- **Fix:** White, medium-weight text (≈9:1).
- **Verification:** By calculation and code review. The state only appears when Supabase fails, which wasn't induced.

### QA-09 · Low · Duplicate nested "Main" navigation landmark on phones — **Fixed**
- **Where:** `components/site/MobileNav.tsx`.
- **Problem:** The open menu panel was a second `<nav aria-label="Main">` *inside* the header's `nav "Main"`.
- **Fix:** The panel is now a `div` inside the existing landmark.
- **Verification:** `e2e/responsive.spec.ts` asserts exactly one "Main" nav while the menu is open.

### QA-10 · Medium · Receipt bucket accepts any file type and size — **Fix written** (in QA-01 migration)
- **Problem:** `gcash-receipts` was created without `file_size_limit` or `allowed_mime_types`. The app compresses screenshots to ~200 KB WebP, but a member can upload any file of any size into their own folder through the API.
- **Fix:** The QA-01 migration limits the bucket to WebP/JPEG/PNG up to 2 MB.

### QA-11 · Medium · Members can rewrite their own profile (student ID, name, year) via the API — **Open**
- **Where:** policy `profiles_update_own`.
- **Problem:** No screen lets members edit their profile, but the policy allows it. A member could change their `student_id` or name after a payment is approved, which undermines the roster export.
- **Recommendation:** Drop `profiles_update_own`, or limit it to harmless columns with a trigger. No app code updates `profiles` (verified by search). It wasn't changed here because it's a product decision.

### QA-12 · Medium · PCU-email restriction is enforced only in the app — **Open** (already an open question in the handoff notes)
- **Problem:** `@pcu.edu.ph` is checked by zod in the server actions. Anyone can still call Supabase `signUp` directly with the public anon key and any address.
- **Recommendation:** Enforce it in the database, either with a domain check in `handle_new_user()` or a Supabase "before user created" auth hook. Before doing so, decide whether admin accounts on other domains need an allowlist.

### QA-13 · Low · The same GCash reference number can be submitted repeatedly — **Open**
- **Problem:** There is no uniqueness on `payments.reference_no`. A receipt could be resubmitted by the same member or a different one, and officers must catch it by eye.
- **Recommendation:** Add a unique index on `reference_no`, possibly excluding rejected rows, after checking existing data for duplicates. Also show "already submitted" in the dialog.

### QA-14 · Low · Reset-link origin can come from request headers — **Open** (config)
- **Where:** `app/actions/auth.ts › siteUrl()`.
- **Problem:** If `NEXT_PUBLIC_SITE_URL` is unset, the reset link's origin is taken from the `Origin`/`Host` header. Supabase's redirect allowlist mitigates this.
- **Recommendation:** Set `NEXT_PUBLIC_SITE_URL` in production, and keep the Supabase redirect allowlist tight.

### QA-15 · Low · Highlight photos are served at full upload size — **Open**
- **Problem:** Uploads are stored up to 1600 px / 0.5 MB and shown raw in ~224 px cards. One card on the home page was 491 KB, and Lighthouse estimates ~666 KB of savings.
- **Recommendation:** Generate a ~600 px thumbnail at upload (`HighlightsManager` already compresses client-side), or serve the images through `next/image` with a `remotePatterns` entry for the Supabase storage host.

### QA-16 · Low · Very small text — **Open** (design decision)
- **Problem:** Lighthouse flags `text-[0.6rem]` (9.6 px) Michroma labels, such as officer titles and subtitles: 44% of text on /officers mobile is below 12 px. This isn't a WCAG failure, but it is hard to read on phones.
- **Recommendation:** Consider 0.7rem or larger for these brand labels on small screens.

### QA-17 · Low · Sign-in doesn't return you to the page you asked for — **Open**
- **Problem:** Visiting `/admin/payments` while signed out redirects to `/login` without a `next` parameter, so after login you land on `/dashboard`.
- **Recommendation:** Add `?next=`, validated with the same same-origin check as `/auth/callback`.

### QA-18 · Low · Remaining `npm audit` highs are in build tooling — **Open**
- **Problem:** Nine highs remain, all from one `braces` ReDoS reached via `fast-glob`/`micromatch`, inside `eslint-config-next` and the `shadcn` CLI. No fix exists without a breaking downgrade.
- **Risk:** Glob patterns aren't attacker-controlled, so the practical risk is low.
- **Note:** `shadcn` is in `dependencies` but is only needed at build time (`@import "shadcn/tailwind.css"`). It could move to `devDependencies` if your deploy installs dev dependencies at build time; Vercel does by default.

### QA-19 · Info · Minor code observations — **Open**
- The password show/hide toggle changes both its label and `aria-pressed`. Pick one: a fixed "Show password" label plus `aria-pressed`.
- `approvePayment` loads every approved payment through `admin_list_payments` to find one email address. It's fine now, but slows as the table grows.
- The build warns about a stray `package-lock.json` in your user folder (outside the repo). Delete it, or set `turbopack.root`.

---

## 4. Changes implemented

| File | Change | Bug | Regression test |
|---|---|---|---|
| `supabase/migrations/20261021_payments_insert_guard.sql` (new) | Payment insert policy, server timestamps, receipt bucket limits. **Not applied.** | QA-01, QA-10 | manual (see QA-01) |
| `package.json`, `package-lock.json` | next and eslint-config-next 16.3.8; audit fixes; Playwright + axe dev deps; `test:e2e` script | QA-02 | full suite |
| `next.config.ts` | Security headers, `poweredByHeader: false` | QA-03 | `security.spec.ts` |
| `app/not-found.tsx` (new), `app/error.tsx` (new) | Branded 404 and error pages | QA-04 | `pages.spec.ts › not found` |
| `app/page.tsx`, `app/(auth)/layout.tsx`, `components/site/SiteHeader.tsx`, `components/site/PageMasthead.tsx`, `components/portal/PortalHeader.tsx` | Logo `sizes`; lazy hidden ghost | QA-05 | `performance.spec.ts` |
| `components/officers/OfficerProfileCard.tsx`, `components/site/HighlightCard.tsx` | Visible text is the accessible name | QA-06 | `a11y.spec.ts` |
| `app/page.tsx`, `app/admin/members/page.tsx`, `app/(auth)/reset-password/page.tsx`, `components/site/{SiteHeader,FeaturedPostSection,HighlightCard}.tsx`, `components/payments/GcashUploadDialog.tsx`, `components/admin/{Pagination,EventsTable,EventsCalendar}.tsx` | Button-styled links are real links | QA-07 | `pages.spec.ts › link semantics` |
| `app/page.tsx` | Readable events error text | QA-08 | — (calculated) |
| `components/site/MobileNav.tsx` | No nested duplicate nav landmark | QA-09 | `responsive.spec.ts` |
| `playwright.config.ts`, `e2e/*.spec.ts` (new), `.gitignore` | Test suite and ignore Playwright output | — | — |

No visual design changes were made apart from the new 404/error pages, which reuse existing components. Before/after screenshots of every public page at all 7 widths were compared pixel-by-pixel. The only differences are the intended 404 redesign and sub-perceptual logo resampling.

---

## 5. Test execution results

### Static checks and build (final run)

| Check | Result |
|---|---|
| `npx tsc --noEmit` | Pass (0 errors) |
| `npx eslint` | Pass (0 problems) |
| `next build` (16.3.8) | Pass, 22 routes. One environment warning (stray lockfile outside the repo). |
| `npm audit` | Before: 1 critical, 11 high. After: **0 critical**, 9 high (build tooling, QA-18). |

### Automated tests: `npm run build && npm run test:e2e`

**93 tests in 8 files: 93 passed, 0 failed, 0 skipped.** The suite was also run with `--repeat-each=2` (178/178 on the 89 tests that existed then) with no flakes.

| File | Covers | Tests |
|---|---|---|
| `pages.spec.ts` | Every public page renders without console errors; navigation, back/forward, footer, external-link `rel`; link semantics; branded 404 | 21 |
| `auth-guards.spec.ts` | 9 protected routes redirect; QR route 401; callback open-redirect ×3; expired reset link | 14 |
| `forms.spec.ts` | Login/register/forgot validation, error announcement, input preservation, password toggle, notices | 9 |
| `responsive.spec.ts` | No horizontal overflow on 8 pages × 7 widths; mobile menu (open, Escape, outside-tap, navigate, hidden ≥ sm) | 10 |
| `a11y.spec.ts` | axe WCAG 2.2 AA on 8 pages × 2 widths; error state; keyboard order; focus ring; officer dialog focus trap/Escape/focus return; reduced motion; carousel | 22 |
| `security.spec.ts` | Headers on 3 pages; no service keys in HTML/JS; no tokens in storage | 5 |
| `performance.spec.ts` | Logo sizing on 3 pages; CLS < 0.1 | 4 |
| `unit.spec.ts` | Search sanitising, year filter, PCU email rule, register rules, hashtags, roster liveness, initials, calendar | 8 |

**Baseline before fixes:** 70 passed, 10 failed.
- 8 failures were the defects above: axe ×4, the 404 page, security headers ×3.
- 2 were faults in my own test selectors. While fixing one of them I found QA-07 and QA-09.

The tests are read-only against Supabase. They never sign up, submit, upload or send email. The officer-dialog and carousel tests skip themselves automatically if no roster or highlights are published.

### Performance: Lighthouse 12, production build, local server

| Page | Mobile perf (before → after) | Mobile LCP (before → after) | Desktop perf (after) | A11y / BP / SEO (after) | CLS |
|---|---|---|---|---|---|
| Home | 75 → 75–77 | 8.1 s → 6.6–8.5 s (3 runs) | 96 | 100 / 100 / 100 | 0 |
| Events | 76 → 79 | 7.1 s → 5.6 s | 98 | 100 / 100 / 100 | 0 |
| Login | 85 → 86 | 4.2 s → 4.2 s | 99 | 100 / 100 / 100 | 0 |
| Officers | 77 → 78 | 6.5 s → 5.8 s | 98 | 100 / 96 (QA-16) / 100 | 0 |

How to read this:
- **Lab data on a local server.** Mobile scores are Lighthouse's simulated mid-tier phone on slow 4G. Mobile LCP on Home varied 6.6–8.5 s between identical runs, partly because highlight images load from Supabase over the real network.
- **What QA-05 did:** it removed ~200–250 KB per page, and the LCP image's load phase fell from 3.1 s to under 0.3 s.
- **What's left:** queueing behind other downloads (mainly QA-15's large highlight photos) and render delay. Five web-font families with `latin-ext` subsets are worth reviewing.
- **Not measured:** INP (needs field data).
- **Already good:** desktop LCP is 0.9–1.3 s, and TBT is ≤120 ms everywhere.

### Accessibility summary

- **axe:** 0 violations on all public pages at 375 and 1440 px, and in the signed-in preview (header, admin tabs, tables, dialogs).
- **Lighthouse a11y:** 100 on all pages tested.
- **Keyboard:** dialogs trap focus and return it on Escape; the login form is fully operable by keyboard; focus rings are visible.
- **Reduced motion:** honoured (hover lift disabled).
- **Touch targets:** WCAG 2.5.8 is met. The smallest targets are inline footer and text links, which the inline/spacing exception covers.

---

## 6. Remaining risks and next steps

1. **Apply `20261021_payments_insert_guard.sql`** in the Supabase SQL Editor (QA-01, QA-10). Then, with a throwaway member account, confirm a direct `status: 'approved'` insert is rejected and a normal payment still submits.
2. **Run an authenticated smoke test** (the existing `.kiro/steering/audit-playbook.md` covers most of it):
   - member registers, then confirms email;
   - submits a payment;
   - admin views the receipt, approves it, and the email arrives;
   - reject with a note, which shows on the dashboard;
   - CSV export;
   - officer/highlight/featured/GCash edits with image uploads;
   - password reset end-to-end.

   None of these could be exercised here without writing to live data.
3. **Decide on QA-11 and QA-12** (profile self-edit; database-level PCU email rule). Both are small SQL changes once decided.
4. **Production config:** set `NEXT_PUBLIC_SITE_URL` and a verified-domain `RESEND_FROM_EMAIL`. The Resend sandbox sender only delivers to the account owner, so members won't get approval emails without it.
5. **Ideally, a separate staging Supabase project** so future QA, and these Playwright tests extended with signed-in flows, can run without touching real member data.
6. **Nice to have:** QA-15 (highlight thumbnails), QA-13 (duplicate reference check), QA-17 (return-to after login), QA-16 (small labels), and a manual pass on iPhone Safari.

---

## 7. Production readiness verdict

**CONDITIONAL:** the site can launch once QA-01 is resolved.

- **Blocking:** QA-01. Until the migration is applied, any member can mark their own membership fee as paid without an officer seeing a receipt. That defeats the portal's core workflow, so it needs fixing before members are invited. The fix is ready, small, and doesn't change existing data.
- **Fixed and verified here:** the vulnerable Next.js version, the missing security headers, the 404/error experience, the mobile image weight, and the accessibility defects. Evidence: 93/93 automated tests, a clean build and lint, axe and Lighthouse a11y at 100, and no horizontal overflow at any width from 320 to 1920 px.
- **Not yet verified:** the signed-in workflows (§6.2) were reviewed in code and rendered with fake data, but not run end-to-end against a real account. Run that smoke test before announcing the portal.

---

### Running the tests

```bash
npm run build
npm run test:e2e        # starts `next start -p 3210` automatically (or reuses one already running)
```

The tests use the installed Google Chrome. Set `PLAYWRIGHT_CHANNEL=""` and run `npx playwright install chromium` to use Playwright's bundled browser instead, for example in CI.
