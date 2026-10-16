# Server Actions, Email, and Exports Implementation Plan

## Execution Rules

Tasks follow fully qualified dependencies and named milestone artifacts. A checkbox is complete only when required artifacts and targeted verification pass. Non-production migration/fixture/cleanup commands require preflight. Human or provider approvals remain in Manual Gates; executable tasks validate those artifacts and fail closed. SAE owns canonical diagnostics, delivery schema/routine extension, final approval/rejection actions/UI, confirmation, dispatch, and exports. PSL owns payment core, receipts, retention, and banners.

## Execution Classes

| Class | Meaning |
| --- | --- |
| `A` | Artifact authoring; no environment mutation |
| `V` | Read-only validation/evidence |
| `N` | Non-production mutation after preflight |
| `C` | Coordinated atomic/application cutover |

Every high-risk phase names required and produced artifacts.

## Manual Gates

These external decisions have no checkbox:

- **MG-SAE-LEGACY:** Data owner supplies signed approval-fact/payment-year remediation and its immutable digest.
- **MG-SAE-PREVIEW:** For `HTTP_MODE=preview` only, deployment owner supplies HTTPS origin, expected SHA, deployment identity, and teardown deadline.
- **MG-SAE-RELEASE:** Security/Data reviewers accept redacted zero-failure evidence and milestone digests.

## Tasks

- [ ] 1. Close prerequisites and record the implementation baseline
  - [ ] 1.1 Verify the shared canonical `ActionResponse<T>`, SAE-owned diagnostics baseline, pinned Node version, canonical migration manifest digest, and shared-file ownership matrix; do not define a competing result/logger. (SAE-1.1, SAE-11.1, SAE-12.11, SAE-13.6, SAE-13.7)
  - [ ] 1.2 Read the installed Next.js 16 Route Handler, async `cookies()`, `redirect`, `NextResponse`, and `revalidatePath` documentation plus installed `@supabase/ssr`; record the callback/session approach. Depends on SAE task 1.1. (SAE-3.9)
  - [ ] 1.3 Verify exact owner, source SHA, prerequisite digests, schema/routine signatures, and evidence digest of `PSL-APPROVAL-CORE-v1`; fail closed on whole-spec prose or task-range claims. Depends on SAE task 1.1 and PSL task 8.7. (SAE-6.8, SAE-8.1, SAE-13.1, SAE-13.7)
  - [ ] 1.4 Run the PSL redacted inventory in approved non-production and capture only counts/categories. Depends on SAE task 1.1 and PSL task 5.4. (SAE-13.2)
  - [ ] 1.5 Validate `MG-SAE-LEGACY` covers every reviewed legacy row, matches inventory count/hash, and contains no facts inferred from `updated_at`/`created_at`; do not obtain approval in this task. Depends on SAE tasks 1.3 and 1.4. (SAE-13.3)
  - [ ] 1.6 Author the delivery cutover policy and legacy audit classification as a non-authoritative planning artifact; explicitly leave database marker and automatic eligibility disabled until SAE task 5.1. Depends on SAE task 1.5. (SAE-6.10, SAE-6.11, SAE-13.4)

- [ ] 2. Establish shared action and diagnostic foundations
  - [ ] 2.1 Add stable server-only error categories, correlation-ID creation, safe public messages, and redacted structured logging helpers without changing the canonical response definition. Depends on 1.1. (SAE-1.2, SAE-1.3, SAE-11.1, SAE-11.5)
  - [ ] 2.2 Migrate `app/actions/auth.ts` normal returns to imported `ActionResponse<T>` and explicitly type non-returning redirect paths; do not catch Next.js redirects. Depends on 2.1. (SAE-1.1, SAE-1.4, SAE-1.5)
  - [ ] 2.3 Migrate `app/actions/payments.ts` to the canonical response and `getCurrentUser()` guard while preserving payment-lifecycle ownership checks. Depends on 2.1 and 1.3. (SAE-1.1, SAE-2.1, SAE-2.3)
  - [ ] 2.4 Migrate `app/actions/admin-events.ts` to the canonical response and guard every protected operation with `getCurrentUser()`. Depends on 2.1. (SAE-1.1, SAE-2.1, SAE-2.2)
  - [ ] 2.5 Migrate `app/actions/admin-members.ts` normal non-export actions to the canonical response and admin guard; SAE tasks 8.4–8.9 own export replacement. Depends on SAE task 2.1. (SAE-1.1, SAE-2.1, SAE-2.2)
  - [ ] 2.6 Remove or permanently disable the unsafe direct-send path in `app/actions/test-email.ts`; any retained diagnostic entry point must be non-sending and fail closed. Prove no environment, recipient, guard, or canonical-result bypass exists before any test task runs. Depends on SAE task 2.1. (SAE-1.1, SAE-4.1–SAE-4.5, SAE-5.4, SAE-12.1)
  - [ ] 2.7 Update every existing Client Component action caller to narrow on `result.success`, consume typed `data`, and stop reading legacy top-level warning/error shapes. Depends on 2.2–2.6. (SAE-1.5)

- [ ] 3. Implement mandatory confirmation and protected session gates
  - [ ] 3.1 Add one server-only application-origin/config validator that permits local HTTP only for local tests, requires allowlisted HTTPS origins outside local, and produces the `/auth/confirm` URL without accepting a client origin. Depends on 1.2 and 2.1. (SAE-3.1, SAE-4.5)
  - [ ] 3.2 Update registration to request Supabase email confirmation through the validated `/auth/confirm` callback and return a generic typed `checkEmail` state when no confirmed session exists. Depends on 2.2 and 3.1. (SAE-3.1, SAE-3.2)
  - [ ] 3.3 Update the registration UI to render the generic check-your-email state without adding an account-enumeration distinction. Depends on 3.2. (SAE-3.2)
  - [ ] 3.4 Implement strict confirmation query parsing for exactly one PKCE `code` or one `token_hash` plus allowlisted `signup` type, with a one-entry `/dashboard` return-path allowlist and size/control/encoding rejection. Depends on 1.2. (SAE-3.3–SAE-3.5)
  - [ ] 3.5 Implement `app/auth/confirm/route.ts` using the server Supabase client to exchange/verify, establish SSR cookies, require confirmed `getUser()` plus an existing profile, redirect success to `/dashboard`, and redirect every failure to `/login?message=confirmation_failed`. Depends on 3.4. (SAE-3.3, SAE-3.4, SAE-3.7, SAE-3.9)
  - [ ] 3.6 Normalize login failures for unconfirmed and unknown identities to one sanitized public result and remove raw Supabase messages. Depends on 2.2 and 2.1. (SAE-3.6, SAE-11.1)
  - [ ] 3.7 Add `app/dashboard/layout.tsx` to require a confirmed authenticated user and ready profile on direct requests. Depends on 3.5. (SAE-2.5, SAE-3.8)
  - [ ] 3.8 Correct `app/admin/layout.tsx` so anonymous requests redirect to `/login`, members to `/dashboard`, and admins retain the requested nested route. Depends on 3.7. (SAE-2.5)
  - [ ] 3.9 Render only the allowlisted sanitized login message for `message=confirmation_failed`; ignore arbitrary message text. Depends on 3.5. (SAE-3.4, SAE-11.3)

- [ ] 4. Add and publish inert delivery schema
  - Execution class: `A`, then `N`/coordinated inert apply.
  - Required artifacts: `PSL-APPROVAL-CORE-v1`, `MG-SAE-LEGACY`, cutover policy, manifest ordinal 08.
  - Produced artifacts: `SAE-DELIVERY-SCHEMA-v1`.
  - [ ] 4.1 Author/apply ordinal 08 `payment_email_delivery_additive` with database timestamps, owner UUID, state, `origin`, `automatic_eligible`, `UNIQUE(payment_id, approval_version)`, and composite approval reference; leave automatic behavior inert. Depends on SAE tasks 1.3–1.6. (SAE-6.2, SAE-6.10, SAE-13.5, SAE-13.6)
  - [ ] 4.2 Add attempts with kind, retry UUID, claim/lease/completion times, safe category/provider ID, correlation ID, one-automatic uniqueness, retry uniqueness, and consistency checks. Depends on SAE task 4.1. (SAE-6.2, SAE-6.4–SAE-6.7)
  - [ ] 4.3 Enable RLS/grants so browsers cannot mutate delivery tables and admins read only sanitized projections; automatic claims remain disabled. Depends on SAE tasks 4.1 and 4.2. (SAE-2.2, SAE-11.2)
  - [ ] 4.4 Run a redacted precheck proving real approval references, `legacy_audit -> automatic_eligible=false`, zero eligible pre-cutover rows, and no plaintext recipient/provider payload. Depends on SAE task 4.3. (SAE-4.5, SAE-6.10, SAE-13.4, SAE-13.5)
  - [ ] 4.5 Publish `SAE-DELIVERY-SCHEMA-v1` with source SHA, ordinal-08 digest, prerequisite digest, produced paths, catalog/precheck evidence, and explicit inert-state assertion. Depends on SAE task 4.4. (SAE-13.5–SAE-13.7)

- [ ] 5. Atomically activate approval delivery and add scoped routines
  - Execution class: `C` for task 5.1; remaining tasks are `A`/`N` verification.
  - Required artifacts: `PSL-APPROVAL-CORE-v1`, `SAE-DELIVERY-SCHEMA-v1`, ordinal-09 SQL, and cutover policy.
  - Produced artifacts: `SAE-ATOMIC-APPROVAL-DELIVERY-v1`.
  - [ ] 5.1 Apply ordinal 09 in one transaction: verify prerequisite digests, extend/replace approval routine, create database-owned cutover version/time marker, enable automatic eligibility, and require approval/history/delivery aggregate to commit atomically. Depends on SAE task 4.5. (SAE-6.1–SAE-6.3, SAE-6.10, SAE-6.11, SAE-13.4, SAE-13.5)
  - [ ] 5.2 Add a guarded automatic-attempt claim routine that creates or returns the single automatic attempt and sets database claim/lease timestamps. Depends on 5.1. (SAE-6.2–SAE-6.4)
  - [ ] 5.3 Add a guarded retry-attempt claim routine that derives the current approval version from payment ID and creates or returns one attempt per retry-request UUID without changing payment state. Depends on 5.1. (SAE-6.6, SAE-6.7)
  - [ ] 5.4 Add a guarded attempt-finalization routine that permits only valid claimed-to-terminal changes and updates the aggregate from sanitized outcome fields. Depends on 5.2–5.3. (SAE-6.4, SAE-11.2)
  - [ ] 5.5 Add an explicit expired-lease reconciliation routine that moves ambiguous claims to `unknown` and never silently resends them. Depends on 5.4. (SAE-6.5)
  - [ ] 5.6 Add a fixed-search-path recipient resolver for exactly one payment/approval version that verifies admin/backend authorization, owner/profile match, current confirmed Auth email, and returns no list. Depends on 5.1. (SAE-5.1–SAE-5.3)
  - [ ] 5.7 Add a sanitized admin delivery-summary/attempt-history query for payment-review UI without plaintext recipient or provider payloads. Depends on 4.3 and 5.4. (SAE-10.2, SAE-11.2)
  - [ ] 5.8 Review ownership, fixed `search_path`, grants, JWT/backend behavior, RLS, marker immutability, and origin/eligibility checks for every routine; remove broad recipient execution. Depends on SAE tasks 5.1–5.7. (SAE-2.2, SAE-5.1, SAE-5.2, SAE-6.10, SAE-6.11, SAE-13.6)
  - [ ] 5.9 Run the canonical no-gap query and concurrency/catalog tests, then publish `SAE-ATOMIC-APPROVAL-DELIVERY-v1` with source SHA, ordinal-09 digest, prerequisite digests, marker identity, produced paths, and redacted zero-gap evidence. Depends on SAE tasks 5.1–5.8 and 10.3. (SAE-6.1–SAE-6.11, SAE-13.4–SAE-13.7)

- [ ] 6. Implement and publish environment-aware dispatch
  - Execution class: `A`/`V`.
  - Required artifacts: `SAE-ATOMIC-APPROVAL-DELIVERY-v1` and fail-closed mail configuration.
  - Produced artifacts: `SAE-DISPATCH-v1`.
  - [ ] 6.1 Create a `server-only` mail configuration parser for `local`, `test`, `staging`, and `production`, validating all required and forbidden variable combinations before transport construction. Depends on 2.1. (SAE-4.1–SAE-4.5)
  - [ ] 6.2 Define an injectable mail transport interface and local/test simulator that persists `simulated` without constructing Resend or making network calls. Depends on 6.1 and 5.4. (SAE-4.1)
  - [ ] 6.3 Implement staging routing that always uses validated `TEST_EMAIL_TO` as envelope recipient while retaining only the owner UUID as intended-recipient identity. Depends on 6.1. (SAE-4.2, SAE-4.5)
  - [ ] 6.4 Implement production routing that rejects sandbox sender/test fallback and sends only to the current verified email returned by the scoped resolver. Depends on 6.1 and 5.6. (SAE-4.3, SAE-4.4, SAE-5.1)
  - [ ] 6.5 Update the approval email renderer to format the immutable approval timestamp in Manila time and remove use of send-time as approval date. Depends on 1.3. (SAE-6.1, SAE-8.1)
  - [ ] 6.6 Build one post-commit orchestrator that claims, resolves one recipient, routes, finalizes, and converts failures into typed non-fatal warnings. Depends on SAE tasks 5.2–5.6, 5.9, and 6.2–6.5. (SAE-1.2, SAE-4.1–SAE-4.5, SAE-5.1–SAE-5.4, SAE-6.1, SAE-6.9)
  - [ ] 6.7 Publish `SAE-DISPATCH-v1` with source SHA, prerequisite digest, produced paths, environment-matrix tests, zero-network local/test proof, recipient-scope proof, and redacted evidence. Depends on SAE tasks 6.1–6.6 and 9.3–9.4. (SAE-4.1–SAE-6.9, SAE-11.4, SAE-13.7)

- [ ] 7. Cut over SAE-owned payment approval actions and review UI
  - Execution class: `C`.
  - Required artifacts: `SAE-ATOMIC-APPROVAL-DELIVERY-v1` and `SAE-DISPATCH-v1`.
  - Produced artifacts: `SAE-APPLICATION-CUTOVER-v1`.
  - [ ] 7.1 Replace direct writes in SAE-owned `approvePayment`/`rejectPayment` with the atomic routine, expected-version stale handling, canonical results, and sanitized errors; no PSL task edits these paths. Depends on SAE tasks 2.1, 5.9, and 6.7. (SAE-1.1–SAE-1.3, SAE-6.1–SAE-6.3, SAE-13.7)
  - [ ] 7.2 Invoke the automatic delivery orchestrator only after a newly committed approval, preserve approval on all mail failures, and revalidate `/admin`, `/admin/payments`, and `/dashboard`. Depends on 7.1. (SAE-6.1, SAE-6.2, SAE-6.9, SAE-10.1)
  - [ ] 7.3 Implement `retryPaymentApprovalEmail(paymentId, retryRequestId)` with admin guard, UUID validation, server-derived current version/recipient, idempotent claim, and no payment mutation. Depends on 5.3 and 6.6. (SAE-2.1, SAE-5.4, SAE-6.6, SAE-6.7)
  - [ ] 7.4 Extend the admin payment query to return current approval version/date plus safe delivery summary without returning owner email. Depends on 5.7. (SAE-5.2, SAE-10.2, SAE-11.2)
  - [ ] 7.5 Update `PaymentsTable` to consume canonical review results, pass expected versions, render delivery state, and show the explicit email-only retry control only for eligible current approvals. Depends on 7.2–7.4. (SAE-1.5, SAE-10.1, SAE-10.2)
  - [ ] 7.6 Generate one retry UUID per user intent, retain it across duplicate pending submissions, disable controls accessibly, and state retry does not change payment status. Depends on SAE task 7.5. (SAE-6.7, SAE-10.2, SAE-10.5)
  - [ ] 7.7 Prove all approval/rejection callers and review UI use only the atomic routine/dispatch contract, legacy direct paths are disabled, ownership matrix has no conflict, and publish `SAE-APPLICATION-CUTOVER-v1` with source SHA, prerequisite digests, produced paths, and targeted evidence. Depends on SAE tasks 7.1–7.6 and 9.1, 9.4, 9.8. (SAE-1.1–SAE-1.5, SAE-6.1–SAE-6.11, SAE-10.1, SAE-13.6, SAE-13.7)

- [ ] 8. Implement safe roster and liquidation exports
  - [ ] 8.1 Add shared server validation for bounded roster search/year filters and strict real `YYYY-MM-DD` Manila dates, including current-Manila-month default and half-open UTC conversion. Depends on 2.1. (SAE-7.6, SAE-8.2, SAE-8.3)
  - [ ] 8.2 Add a pure CSV serializer implementing empty nulls, specified C0 removal, post-leading-whitespace/control formula neutralization with apostrophe, quote doubling, quoted fields, CRLF, UTF-8 BOM, and final byte measurement. Depends on 8.1. (SAE-9.1–SAE-9.5)
  - [ ] 8.3 Add a fixed-search-path admin roster query/RPC that applies normalized search/year filters, selects only required profile/current-approved fields, uses bounded pagination/keysets, and returns at most 10,001 rows. Depends on 1.3 and 5.8. (SAE-7.1–SAE-7.5, SAE-9.6)
  - [ ] 8.4 Implement `exportMemberRosterCsv` with `getCurrentUser()` admin guard, all matching pages, exact column order, latest current approval, exact `No approved payment` fallback/blanks, row/5-MiB all-or-nothing limits, metadata, and redacted telemetry. Depends on 8.2–8.3. (SAE-2.1, SAE-7.1–SAE-7.6, SAE-9.1–SAE-9.8)
  - [ ] 8.5 Update the roster export UI control to call `exportMemberRosterCsv` with the page's normalized filters, create/revoke the browser Blob URL, use the server filename, preserve filters on error, and expose pending state. Depends on 8.4. (SAE-9.7, SAE-10.3, SAE-10.5, SAE-10.6)
  - [ ] 8.6 Add a fixed-search-path admin liquidation query/RPC that selects only current approved payments/current immutable approvals in a supplied UTC half-open interval and returns at most 10,001 rows. Depends on 1.3 and 5.8. (SAE-8.1, SAE-8.5–SAE-8.7, SAE-9.6)
  - [ ] 8.7 Implement `exportLiquidationLedgerCsv` with admin guard, strict/default effective range, exact column order, current approval version/date, row/5-MiB all-or-nothing limits, typed metadata, and redacted telemetry. Depends on 8.1–8.2 and 8.6. (SAE-2.1, SAE-8.1–SAE-8.7, SAE-9.1–SAE-9.8)
  - [ ] 8.8 Add the liquidation control to the admin payments page with `Approval date range (Philippine time)` labels, current-month defaults, effective-range display, browser download/revocation, retained input on failure, and accessible pending state. Depends on 8.7. (SAE-9.7, SAE-10.4–SAE-10.6)
  - [ ] 8.9 Remove the legacy `exportRosterCsv` implementation and broad in-memory payment scan only after the named roster action/UI passes targeted tests. Depends on 8.4–8.5. (SAE-7.1–SAE-7.3, SAE-9.6)

- [ ] 9. Add unit, contract, and component tests
  - [ ] 9.1 Add action-contract tests for every action export, canonical returns, redirect exceptions, guard-first ordering, unauthorized zero effects, unsafe test-mail absence, and secret canaries. Depends on SAE tasks 2.2–2.7, 3.1–3.9, 7.1–7.6, and 8.1–8.9. (SAE-1.1–SAE-1.5, SAE-2.1–SAE-2.4, SAE-11.1, SAE-12.1)
  - [ ] 9.2 Add confirmation parser/unit tests for credential shapes, duplicate/missing/oversized values, recognized type, exact sanitized destination, and malicious targets. Depends on SAE tasks 2.6, 3.4, and 3.5. (SAE-3.3–SAE-3.5, SAE-12.1, SAE-12.2)
  - [ ] 9.3 Add mail configuration/transport tests proving zero local/test network, forced staging recipient, production rejection, scoped delivery, and secret-free errors. Depends on SAE tasks 2.6 and 6.1–6.6. (SAE-4.1–SAE-4.5, SAE-5.1–SAE-5.4, SAE-12.1, SAE-12.3)
  - [ ] 9.4 Add delivery-core tests for post-commit failures, repeated/concurrent claims, retry idempotency, changed verified email, ambiguous lease recovery, origin/eligibility rejection, no-gap behavior, and immutable payment status. Depends on SAE tasks 2.6, 5.1–5.8, and 6.1–6.6. (SAE-6.1–SAE-6.11, SAE-12.1, SAE-12.3)
  - [ ] 9.5 Add property tests for C0 normalization, leading formula prefixes, Unicode and RFC-style round trips, BOM/CRLF, null handling, and raw UTF-8 byte measurement. Depends on 8.2. (SAE-9.1–SAE-9.5, SAE-12.4)
  - [ ] 9.6 Add roster action/query tests for filter parity, pagination, zero rows, multiple payment histories, exact fallback text/blanks, exact headers, 10,000/10,001 rows, and 5-MiB boundaries. Depends on 8.4. (SAE-7.1–SAE-7.6, SAE-9.5, SAE-12.4)
  - [ ] 9.7 Add liquidation action/query tests for current-month default, impossible/reversed dates, Manila-to-UTC edges, current/superseded approvals, status exclusions, exact headers, and row/byte limits. Depends on 8.7. (SAE-8.1–SAE-8.7, SAE-9.5, SAE-12.4)
  - [ ] 9.8 Add component tests for canonical messages, delivery-only retry labeling/idempotency UUID retention, matching export filters, effective range, Blob URL revocation, pending state, and corrective limit errors. Depends on 7.5–7.6, 8.5, and 8.8. (SAE-10.1–SAE-10.6)

- [ ] 10. Add direct Supabase-only security tests
  - [ ] 10.1 Add a dedicated non-production Supabase command that invokes preflight before fixtures, owns actors by immutable IDs, never starts Next.js, and requires unsafe test-mail removal. Depends on SAE tasks 1.1, 2.6, 4.5, and 5.8. (SAE-12.1, SAE-12.5, SAE-12.10)
  - [ ] 10.2 Test direct table/RLS/grant boundaries for delivery aggregates/attempts, including denied browser writes, allowed sanitized admin reads, immutable approval references, and no recipient disclosure. Depends on 10.1. (SAE-2.2, SAE-11.2, SAE-13.5)
  - [ ] 10.3 Test review/delivery routines under repeated/concurrent calls for one transition, aggregate, automatic attempt, retry key, reapproval separation, marker atomicity, origin/eligibility invariant, no-gap query, and no retry payment mutation. Depends on SAE task 10.1. (SAE-6.1–SAE-6.11, SAE-13.4, SAE-13.5)
  - [ ] 10.4 Test the recipient routine for exact payment/version/current-confirmed-owner behavior and prove it cannot list or return a second member. Depends on 10.1. (SAE-5.1–SAE-5.3)
  - [ ] 10.5 Test roster/liquidation RPC authorization, selected rows/columns, current approval semantics, pagination sentinel, Manila interval boundaries, and non-admin denial. Depends on SAE tasks 8.3, 8.6, and 10.1. (SAE-7.1–SAE-7.5, SAE-8.1–SAE-8.7, SAE-9.6)
  - [ ] 10.6 Implement retry-safe fixture cleanup by manifest IDs and emit redacted expected/deleted/skipped/remaining counts with `failures: 0` only on complete success. Depends on 10.2–10.5. (SAE-11.4, SAE-12.5)

- [ ] 11. Add one selected, self-terminating HTTP lifecycle
  - Execution class: `A`/`V`; local mode manages a child process tree, preview mode consumes `MG-SAE-PREVIEW`.
  - Required artifacts: unsafe test-mail removal, deterministic fixture adapter, source/build manifest, `HTTP_MODE` selector.
  - Produced artifacts: selected-mode-only redacted HTTP evidence.
  - [ ] 11.1 Build shared assertions with redirects disabled, cookie jars, sanitized logging, bounded readiness, exact status/headers, and a deterministic server-only confirmation fixture seam unavailable in production. Depends on SAE tasks 2.6 and 3.1–3.9. (SAE-12.1, SAE-12.2, SAE-12.6–SAE-12.10)
  - [ ] 11.2 Implement selector validation: unset defaults to `local`; `local` forbids preview-only inputs; `preview` requires HTTPS origin, expected SHA, deployment identity, and `MG-SAE-PREVIEW`; contradictory modes fail before fixtures. Depends on SAE task 11.1. (SAE-12.6, SAE-12.8)
  - [ ] 11.3 Implement local harness build manifest/source SHA, isolated port, one production server, bounded readiness, and complete Windows/POSIX process-tree teardown on pass, failure, startup error, timeout, Ctrl+C, termination signal, or parent exit; verify no descendant/port remains. Depends on SAE task 11.2. (SAE-12.7, SAE-12.9)
  - [ ] 11.4 Implement the preview harness with HTTPS/SHA/deployment identity checks, bounded readiness, manifest-owned identity cleanup, and external teardown-owner fields; implementation requires no live preview. Depends on SAE task 11.2. (SAE-12.8, SAE-12.9)
  - [ ] 11.5 Add deterministic confirmation cases for valid-unused then reused, expired, unrecognized type, missing profile, malformed input, exact sanitized redirect, and open-redirect rejection; no mail or live inbox dependency. Depends on SAE tasks 11.1 and 11.2. (SAE-3.3–SAE-3.8, SAE-12.2)
  - [ ] 11.6 Add protected-route cases for anonymous dashboard/admin, member admin, admin nested routes, cookie persistence, and exact direct-request redirects. Depends on SAE tasks 3.7, 3.8, 11.1, and 11.2. (SAE-2.5, SAE-3.8)
  - [ ] 11.7 Run only the selected harness and emit evidence with selector, source/build/deployment SHA as applicable, sanitized origin, readiness, actor matrix, assertions, fixture cleanup, and selected teardown. Local mode validates SAE tasks 11.3, 11.5, and 11.6 and rejects preview evidence; preview mode additionally validates `MG-SAE-PREVIEW`, then validates SAE tasks 11.4–11.6 and rejects local-run evidence. (SAE-11.3, SAE-11.4, SAE-12.6–SAE-12.10)

- [ ] 12. Cut over, remove legacy paths, and run release validation
  - Execution class: `C` then `V`.
  - Required artifacts: `SAE-DELIVERY-SCHEMA-v1`, `SAE-ATOMIC-APPROVAL-DELIVERY-v1`, `SAE-DISPATCH-v1`, `SAE-APPLICATION-CUTOVER-v1`, selected HTTP evidence, and `MG-SAE-RELEASE`.
  - Produced artifacts: coordinated release evidence with `failures: 0`.
  - [ ] 12.1 Run delivery prechecks/direct Supabase tests in approved non-production; stop on mapping, approval reference, origin/eligibility, no-gap, grant, or cleanup failure. Depends on SAE tasks 4.5, 5.9, and 10.1–10.6. (SAE-12.5, SAE-13.2–SAE-13.7)
  - [ ] 12.2 Verify `SAE-APPLICATION-CUTOVER-v1`, scoped recipient/export routines, and named controls; prove no broad recipient scan, client recipient, or competing PSL approval action. Depends on SAE tasks 6.7, 7.7, 8.4–8.8, and 12.1. (SAE-5.1–SAE-5.4, SAE-7.1, SAE-8.1, SAE-13.7)
  - [ ] 12.3 Remove superseded broad recipient/export routines and incompatible action-result definitions only after 12.2 passes; preserve forward-fix recovery. Depends on SAE task 12.2. (SAE-1.1, SAE-5.2, SAE-9.6, SAE-13.6)
  - [ ] 12.4 Run strict lint and type/contract/unit/component tests without weakening requirements. Depends on SAE tasks 2.6, 9.1–9.8, and 12.3. (SAE-12.1–SAE-12.4, SAE-12.11)
  - [ ] 12.5 Run direct Supabase as its own phase with timeout, cleanup, and redacted summary. Depends on SAE tasks 10.1–10.6 and 12.4. (SAE-12.5, SAE-12.10)
  - [ ] 12.6 Produce the commit-matched production build and immutable build manifest/SHA. Depends on SAE task 12.5. (SAE-12.7, SAE-12.11)
  - [ ] 12.7 Resolve `HTTP_MODE` (default `local`) and run exactly SAE task 11.7 against the selected harness; reject evidence from both or neither mode. Depends on SAE tasks 11.7 and 12.6. (SAE-12.6–SAE-12.11)
  - [ ] 12.8 Validate `MG-SAE-RELEASE`, then record requirement/property/task/milestone trace, commands, source/build SHA, selected-mode evidence, reviewers, exceptions, and `failures: 0`; do not close on unresolved dependencies. Depends on SAE tasks 12.4–12.7 and `MG-SAE-RELEASE`. (SAE-11.4, SAE-12.9–SAE-12.11, SAE-13.1, SAE-13.7)
