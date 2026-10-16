# QA Report — PICE PCUD Portal

**Audit date:** 2026-10-17 (audit, then a follow-up round the same day; see §8) · **Branch:** `main` · **Build under test:** Next.js 16.3.8 production build (`next build && next start`)

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
4. **Follow-up round (§8):**
   - Members can now edit their own profile from the dashboard.
   - The @pcu.edu.ph rule and duplicate-reference protection are written as database migrations.
   - QA-11 to QA-19 are addressed: fixed in code, or written as migrations that still need applying.
   - QA-20, an officer-title clipping bug found along the way, is fixed.

**Recommendation: CONDITIONAL.** The site can launch once the migrations in §6.1 (QA-01 at minimum) are applied and the authenticated smoke test in §6 has been run. See §7.

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

> QA-11 to QA-19 were resolved in a follow-up round on 2026-10-17 (see §8). Each entry below shows the original finding and its outcome.

### QA-11 · Medium · Member profile self-editing — **Decided: allowed. Built, with guards written**
- **Finding:** The `profiles_update_own` policy let members edit their profile through the API, with no screen for it.
- **Decision (2026-10-17):** Members may edit their own profile.
- **Done:**
  - **Edit form:** the dashboard's *Your details* card has an **Edit** dialog for full name, student ID and year level. Email is read-only because it's the login.
  - **Server action:** `updateOwnProfile` validates with the same rules as registration, updates only the caller's own row, and reports a duplicate student ID in plain words.
  - **Role:** cannot change; the existing `protect_profile_role` trigger blocks it.
  - **Guard migration** (`20261023_profile_self_edit_guards.sql`, **not applied**): members can't rewrite `created_at`, and names and IDs can't be blank or oversized.
- **Residual risk (accepted):** a member can still change their student ID after a payment is approved. Officers matching payments to members should use the name and email as well.
- **Verification:** 3 unit tests (validation, trimming, ignoring `role`/`email`). The dialog was exercised with fake data at 320 and 1440 px (prefill, Save disabled until changed, read-only email, announced errors, Cancel resets, axe clean). Saving to the live database was not exercised.

### QA-12 · Medium · PCU-email restriction only in the app — **Fix written** (`20261022_pcu_email_domain.sql`, **not applied**)
- **Finding:** `@pcu.edu.ph` was only checked by zod, so a direct Supabase `signUp` call with the public anon key could use any address.
- **Fix:** A `BEFORE INSERT OR UPDATE OF email, email_change` trigger on `auth.users` rejects new accounts, and email changes, outside `pcu.edu.ph`.
  - Existing accounts, including any admin on another domain, are untouched unless their email changes.
  - Supabase reports a blocked sign-up as a generic "Database error saving new user". The app's own validation shows the friendly message first.
- **Verification:** The SQL parses with PostgreSQL's parser. The function body was reviewed by hand, not executed. After applying it, try signing up with a non-PCU address through the API; it should fail.

### QA-13 · Low · Same GCash reference could be submitted repeatedly — **Fix written** (`20261024_payment_reference_unique.sql`, **not applied**). App side done.
- **Fix:**
  - **Database:** a unique index on `reference_no` across pending and approved payments. Rejected payments don't count, so a corrected receipt can reuse its reference.
  - **Safe to run:** the migration first checks for existing duplicates and stops with instructions if it finds any, rather than half-applying.
  - **App:** `submitPayment` turns the unique-violation error into "This GCash reference number has already been submitted…". The dialog already removes the orphaned upload on error.

### QA-14 · Low · Reset-link origin could come from request headers — **Fixed** (code); one config step remains
- **Fix:** `siteUrl()` now tries, in order:
  1. `NEXT_PUBLIC_SITE_URL`;
  2. Vercel's `VERCEL_PROJECT_PRODUCTION_URL`, on production deploys only;
  3. request headers, which only previews and local dev now reach.
- **Still recommended:** set `NEXT_PUBLIC_SITE_URL` to your custom domain if you use one, and keep Supabase's redirect allowlist tight.

### QA-15 · Low · Highlight photos served at full upload size — **Fixed**
- **Fix:**
  - **Cards:** now render through `next/image` with `sizes`.
  - **Config:** `images.remotePatterns` allows only `https://<project>.supabase.co/storage/v1/object/public/highlight-photos/**` with no query string, so the optimizer refuses every other remote URL. `maximumRedirects: 0`.
  - **Admin preview:** the admin form's local `blob:` preview is passed through unoptimized, which `next/image` does automatically.
  - **Pop-up:** it still loads the full image, only when opened.
- **Verification:**
  - The two home-page highlight photos dropped from **491 KB + 108 KB to 48 KB + 29 KB**.
  - Total home weight dropped from **1,688 KB to 1,163 KB** on Lighthouse mobile.
  - Regression test: no raw highlight-photo requests, and optimized widths ≤ 640.
  - Lab LCP didn't measurably change (7.0–7.3 s). It's dominated by load and render delay, not bytes.

### QA-16 · Low · Very small text — **Partially resolved**
- **Fix:** All 15 sub-0.7rem labels (0.55/0.6/0.65rem, i.e. 8.8–10.4 px) are now **0.7rem (11.2 px)**.
- **Not fully resolved:** Lighthouse's "legible font sizes" check uses a 12 px threshold, so /officers still fails it (Best Practices 96). Reaching 12 px (0.75rem) would make the wide Michroma titles wrap badly in the two-up phone cards; see QA-20. Treat it as a brand-typography decision.

### QA-17 · Low · Sign-in didn't return you to the requested page — **Fixed**
- **Fix:**
  - Signed-out visits to protected pages redirect to `/login?next=<path+query>`.
  - `signIn` sends members back there after login.
  - Already-signed-in visits to `/login?next=…` go straight there.
  - Every `next` value goes through the new shared `lib/safe-next.ts`, which rejects other origins (`//x`, `/\x`, `https://x`, `javascript:`) and the auth pages themselves. `/auth/callback` now uses the same helper.
- **Verification:** 3 unit tests on the helper; e2e confirms the remembered path (including the query string) on all 9 protected routes, and that hostile `next` values still render the login page normally. A successful sign-in redirect wasn't exercised (no test credentials).

### QA-18 · Low · `npm audit` highs in build tooling — **Mitigated**
- `shadcn` moved to `devDependencies`: it's only a build-time CSS import, and Tailwind is already a dev dependency the build needs. **The production dependency tree now audits clean (0 vulnerabilities).**
- 9 highs remain in dev tooling, from one `braces` ReDoS. **No patched `braces` release exists** (all versions ≤ 3.0.3 are affected, and 3.0.3 is the latest). Revisit when one ships.

### QA-19 · Info · Minor code observations — **Fixed**
- **Password toggle:** fixed label "Show password", with state conveyed by `aria-pressed`; test updated.
- **Approval email lookup:** `approvePayment` looks up one member's email through the new admin-only `admin_payment_email` RPC (`20261025_admin_payment_email_rpc.sql`, **not applied**). Until that's applied it falls back to the old list lookup, so approvals keep working either way.
- **Build warning:** `turbopack.root` is pinned to the project, so the stray-lockfile warning is gone. The file in your user folder was left alone.

### QA-20 · Low · Officer titles clipped on small phones — **Fixed** (found during the follow-up)
- **Where:** `components/officers/OfficerProfileCard.tsx`.
- **Problem:** At 320 px, **even before any changes**, 4 committee titles were cut off ("CHAIRPERSO…"). The single word "Chairperson" in Michroma was wider than the two-up card. The first sweep missed it because the card clips its overflow, so the page never scrolls sideways. Raising the size for QA-16 made it worse: 7 clipped titles at 320 px and 4 at 375 px.
- **Fix:** Below `sm`, the title uses tighter letter-spacing (0.04em, from 0.12em; unchanged from `sm` up) plus a break-word fallback. It fits whole from 360 px up. At 320 px one long word wraps onto two lines instead of losing letters.
- **Verification:** New regression test at 320/360/375/430/768 px measures each title against its box. Zero clipped titles, and no split words from 360 px up.

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
| `next build` (16.3.8) | Pass, 22 routes, no warnings (the stray-lockfile warning is fixed by QA-19). |
| `npm audit` | Before: 1 critical, 11 high. After: **0 critical**, 9 high (dev tooling only, QA-18). **Production dependencies: 0.** |

### Automated tests: `npm run build && npm run test:e2e`

**Final run (after the follow-up): 107 tests in 8 files, 107 passed, 0 failed, 0 skipped.** Repeat runs found no flakes: 204/204 with `--repeat-each=2` on the 102 tests that existed before the QA-20 test was added, and 178/178 in the first round.

| File | Covers | Tests |
|---|---|---|
| `pages.spec.ts` | Every public page renders without console errors; navigation, back/forward, footer, external-link `rel`; link semantics; branded 404 | 21 |
| `auth-guards.spec.ts` | 9 protected routes redirect and remember the page (`?next=`), query string kept, hostile `next` values; QR route 401; callback open-redirect ×3; expired reset link | 16 |
| `forms.spec.ts` | Login/register/forgot validation, error announcement, input preservation, password toggle (`aria-pressed`), notices | 9 |
| `responsive.spec.ts` | No horizontal overflow on 8 pages × 7 widths; officer titles not clipped at 5 widths; mobile menu (open, Escape, outside-tap, navigate, hidden ≥ sm) | 15 |
| `a11y.spec.ts` | axe WCAG 2.2 AA on 8 pages × 2 widths; error state; keyboard order; focus ring; officer dialog focus trap/Escape/focus return; reduced motion; carousel | 22 |
| `security.spec.ts` | Headers on 3 pages; no service keys in HTML/JS; no tokens in storage | 5 |
| `performance.spec.ts` | Logo sizing on 3 pages; highlight photos optimized; CLS < 0.1 | 5 |
| `unit.spec.ts` | Search sanitising, year filter, PCU email rule, register and profile rules, safe `next` paths, hashtags, roster liveness, initials, calendar | 14 |

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
- **What's left:** queueing behind other downloads and render delay. QA-15 (follow-up) cut home-page weight from 1,688 KB to 1,163 KB, but lab LCP stayed at 7.0–7.3 s, so bytes aren't the main limit. Five web-font families with `latin-ext` subsets are the next thing to review.
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

1. **Apply the migrations** in the Supabase SQL Editor. None has been run; the only database is the live project. Each file is idempotent and independent, and the deployed code works whether or not they've been applied yet.

   | Order | File | Fixes | Check afterwards |
   |---|---|---|---|
   | 1 (**blocking**) | `20261021_payments_insert_guard.sql` | QA-01, QA-10 | With a test member, a direct `status: 'approved'` insert is rejected; a normal payment still submits |
   | 2 | `20261022_pcu_email_domain.sql` | QA-12 | A non-PCU `signUp` via the API fails; existing logins still work |
   | 3 | `20261023_profile_self_edit_guards.sql` | QA-11 | Editing your details on the dashboard saves |
   | 4 | `20261024_payment_reference_unique.sql` | QA-13 | Runs cleanly, or names duplicate references to reject first; re-submitting an existing reference shows the friendly error |
   | 5 | `20261025_admin_payment_email_rpc.sql` | QA-19 | Approving a payment still sends the email |

2. **Run an authenticated smoke test** (the existing `.kiro/steering/audit-playbook.md` covers most of it):
   - member registers, then confirms email;
   - edits their details;
   - submits a payment;
   - admin views the receipt, approves it, and the email arrives;
   - reject with a note, which shows on the dashboard;
   - opening `/admin/payments` while signed out returns you there after login;
   - CSV export;
   - officer/highlight/featured/GCash edits with image uploads;
   - password reset end-to-end.

   None of these could be exercised here without writing to live data.
3. **Production config:** set `NEXT_PUBLIC_SITE_URL` (QA-14) and a verified-domain `RESEND_FROM_EMAIL`. The Resend sandbox sender only delivers to the account owner, so members won't get approval emails without it.
4. **Ideally, a separate staging Supabase project** so future QA, and these Playwright tests extended with signed-in flows, can run without touching real member data.
5. **Still open:**
   - QA-16, Lighthouse's 12 px legibility threshold: a typography call.
   - The 9 dev-tooling `braces` advisories (QA-18): wait for an upstream patch.
   - A manual pass on iPhone Safari.

---

## 7. Production readiness verdict

**CONDITIONAL:** the site can launch once QA-01 is resolved.

- **Blocking:** QA-01. Until the migration is applied, any member can mark their own membership fee as paid without an officer seeing a receipt. That defeats the portal's core workflow, so it needs fixing before members are invited. The fix is ready, small, and doesn't change existing data. The other four migrations (§6.1) should go in at the same time, but they aren't launch-blocking.
- **Fixed and verified here:**
  - the vulnerable Next.js version;
  - the missing security headers;
  - the 404/error experience;
  - mobile image weight (logos and highlight photos);
  - the accessibility defects;
  - return-to-page after login;
  - officer-title clipping.

  Evidence: 107/107 automated tests, a clean build and lint, axe and Lighthouse a11y at 100, no horizontal overflow or clipped titles from 320 to 1920 px, and 0 vulnerabilities in production dependencies.
- **Not yet verified:** the signed-in workflows (§6.2) were reviewed in code and rendered with fake data, but not run end-to-end against a real account. Run that smoke test before announcing the portal.

---

## 8. Follow-up round (2026-10-17)

**Requested:**
- allow members to edit their own profile;
- enforce @pcu.edu.ph in the database;
- apply the recommendations for the open issues;
- commit and push to `main`.

**Outcomes** are recorded in each bug entry above (QA-11 to QA-20). The files changed in this round:

| File | Change | Bug |
|---|---|---|
| `components/portal/EditProfileDialog.tsx` (new), `app/actions/profile.ts` (new), `app/dashboard/page.tsx`, `lib/validations/auth.ts` | Member profile editing; shared field rules with registration | QA-11 |
| `supabase/migrations/20261022_pcu_email_domain.sql` (new) | PCU-only accounts at the database | QA-12 |
| `supabase/migrations/20261023_profile_self_edit_guards.sql` (new) | `created_at` lock; name/ID length checks | QA-11 |
| `supabase/migrations/20261024_payment_reference_unique.sql` (new), `app/actions/payments.ts` | One live payment per reference; friendly error | QA-13 |
| `app/actions/auth.ts` | Reset-link origin from config or Vercel production URL; login returns to `next` | QA-14, QA-17 |
| `lib/safe-next.ts` (new), `lib/supabase/middleware.ts`, `app/(auth)/login/*`, `app/auth/callback/route.ts` | Remember and validate the post-login destination | QA-17 |
| `components/site/HighlightCard.tsx`, `next.config.ts` | Highlight cards via `next/image`; `remotePatterns` locked to one bucket; `turbopack.root` | QA-15, QA-19 |
| 11 files (`text-[0.7rem]`), `components/officers/OfficerProfileCard.tsx` | Larger labels; phone-width title tracking and wrapping | QA-16, QA-20 |
| `package.json` | `shadcn` moved to devDependencies | QA-18 |
| `components/auth/PasswordInput.tsx`, `app/actions/admin-payments.ts`, `supabase/migrations/20261025_admin_payment_email_rpc.sql` (new) | Toggle label; single-row email lookup with fallback | QA-19 |
| `e2e/*` | +14 tests: redirect memory, safe paths, profile rules, highlight images, title clipping | — |

**Deployment note:** `main` is linked to Vercel, so the push deploys. Every code change works against the database as it stands today, before any migration is applied:
- the email RPC has a fallback;
- the unique-reference message only appears once the index exists;
- profile editing uses the existing policy.

**Verification limits:**
- **Migrations:** the five unapplied migrations were checked with PostgreSQL's parser. Their PL/pgSQL bodies were reviewed by hand, not executed.
- **Real account flows:** profile saving, the sign-in redirect and the email RPC were not exercised against a real account.

---

### Running the tests

```bash
npm run build
npm run test:e2e        # starts `next start -p 3210` automatically (or reuses one already running)
```

The tests use the installed Google Chrome. Set `PLAYWRIGHT_CHANNEL=""` and run `npx playwright install chromium` to use Playwright's bundled browser instead, for example in CI.
