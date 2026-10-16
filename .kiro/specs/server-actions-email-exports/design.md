# Server Actions, Email, and Exports Design

## Table of Contents

- [Overview](#overview)
- [Prerequisites and Migration Gates](#prerequisites-and-migration-gates)
- [Architecture](#architecture)
- [Components and Interfaces](#components-and-interfaces)
- [Data Model](#data-model)
- [Export Design](#export-design)
- [UI and Revalidation](#ui-and-revalidation)
- [Error Model and Observability](#error-model-and-observability)
- [Test Strategy](#test-strategy)
- [Correctness Properties](#correctness-properties)
- [Requirement Traceability](#requirement-traceability)
- [Key Design Decisions](#key-design-decisions)

## Overview

This design standardizes every Server Action on one discriminated result, establishes mandatory email ownership confirmation, attaches durable email-delivery state to immutable payment approval versions, and provides safe member-roster and liquidation-ledger CSV exports. Server Components remain the default. Client Components are limited to forms, pending state, retry controls, and browser downloads. All database mutations and email triggers remain Server Actions under `app/actions/*`; `/auth/confirm` is the sole narrow authentication callback Route Handler.

The design consumes the exact `PSL-APPROVAL-CORE-v1` artifact from `.kiro/specs/payment-security-lifecycle`; it does not wait on or claim completion of the whole PSL specification. Delivery schema begins only after that artifact verifies immutable `(payment_id, approval_version)` records, database-owned `approved_at`, current projection, append-only history, pending-only review, and dedicated reopening. Liquidation queries consume the same immutable contract after their own scoped routine prerequisites.

### Goals

- One shared `ActionResponse<T>` and mandatory `getCurrentUser()` authorization boundary.
- Confirmed email ownership before protected access, with SSR session establishment through `/auth/confirm`.
- Approval commits independent of mail success, with durable, idempotent automatic and retry attempts.
- No broad Auth-user scan and no client-selected recipient.
- Fail-closed local/test, staging, and production mail behavior.
- Two named, admin-only, bounded CSV exports with deterministic spreadsheet defenses.
- Separate direct-Supabase and HTTP route test lifecycles with commit-matched evidence.

### Non-goals

- Native ticketing, QR scanning, campaign/bulk email, or arbitrary recipient messaging.
- Reconstructing historical mail delivery or inventing approval facts for legacy rows.
- Storing generated CSV files server-side.
- Replacing the payment-lifecycle specification's review, reopening, receipt, retention, or banner rules.
- Production DNS provisioning; that remains blocked by the production email/DNS specification and D-09.

## Prerequisites and Migration Gates

Implementation depends on exact artifacts, never whole-spec completion:

1. Verify the shared canonical action/diagnostic baseline and remove or fail-close the direct test-mail path before any test phase.
2. Consume the exact digest of `PSL-APPROVAL-CORE-v1`; independently consume PSL redacted inventory and externally approved remediation artifacts where required.
3. Apply the SAE delivery schema inertly and publish `SAE-DELIVERY-SCHEMA-v1`. Planning may describe cutover policy, but no database cutover marker or automatic eligibility is active.
4. In one transaction after inert schema, extend/replace the approval routine, create the database-owned cutover version/time marker, and enable automatic eligibility; publish `SAE-ATOMIC-APPROVAL-DELIVERY-v1` only after the no-gap query passes.
5. Complete post-commit recipient/routing/attempt behavior and publish `SAE-DISPATCH-v1`.
6. Cut final approval/rejection actions and review UI to the atomic routine, disable legacy paths, and publish `SAE-APPLICATION-CUTOVER-v1`.

Each phase is forward-fixable. A failed precheck stops before activation or irreversible work. Human approvals are external Manual Gates; executable tasks validate immutable artifacts and fail closed.

### Canonical migration manifest

This is the same authoritative cross-spec manifest used by PSL. SQL filenames receive sequential repository timestamp prefixes while preserving ordinal and stem.

| Ordinal | Stem | Owner | Prerequisite | Environment | Destructive | Recovery |
| --- | --- | --- | --- | --- | --- | --- |
| 01 | `payment_academic_years_additive` | PSL | Baseline evidence | Non-production, then production | No | Revert additive objects if unused |
| 02 | `payment_lifecycle_additive` | PSL | 01 | Non-production, then production | No | Revert additive objects if unused |
| 03 | `payment_retention_additive` | PSL | 02 | Non-production, then production | No | Keep disabled; forward fix |
| 04 | `payment_existing_data_backfill` | PSL | Approved mappings and 01–03 | Rehearsal, staging, then authorized production | Data movement | Forward fix; preserve quarantine/history |
| 05 | `payment_constraints` | PSL | 04 and zero blockers | Non-production, then production | Enforcement | Forward-fix constraints |
| 06 | `payment_profile_fk_restrict` | PSL | 04 and retention review | Non-production, then production | Enforcement | Forward-fix FK; never cascade |
| 07 | `payment_lifecycle_routines` | PSL | 05–06 | Non-production, then production | No | Compatible routine reversal or forward fix |
| 08 | `payment_email_delivery_additive` | SAE | `PSL-APPROVAL-CORE-v1` | Non-production, then production, inert | No | Revert only while inert/unreferenced |
| 09 | `payment_approval_delivery_cutover` | SAE | `SAE-DELIVERY-SCHEMA-v1` | Non-production, then production | Atomic activation | Forward fix; never remove committed approval/delivery facts |
| 10 | `payment_rls_storage_hardening` | PSL | `SAE-ATOMIC-APPROVAL-DELIVERY-v1` and application readiness | Non-production, then production | Policy cutover | Compatible policy reversal or forward fix |
| 11 | `event_banner_object_keys_additive` | PSL | Baseline evidence | Non-production, then production | No | Revert additive objects if unused |
| 12 | `event_banner_constraints_and_policies` | PSL | Verified backfill, zero unclassified rows, canonical writer readiness | Non-production, then production | Policy cutover | Compatible policy reversal or forward fix |
| 13 | `event_banner_legacy_drop` | PSL | Compatibility-release evidence and separate drop authorization | Rehearsal first; production only after gate | Yes | No destructive rollback; restore by forward fix from preserved evidence |

### Shared-file ownership and merge checkpoints

| Surface | Sole owner | Merge rule |
| --- | --- | --- |
| Payment core schema/routines and approval-version semantics | PSL | SAE consumes `PSL-APPROVAL-CORE-v1`; only SAE edits the documented delivery extension |
| Receipt, retention, and banner semantics/actions | PSL | SAE does not edit these shared paths |
| Canonical action response and diagnostics | SAE | PSL imports/consumes; no duplicate type/logger |
| Delivery schema, cutover marker, approval routine extension | SAE | PSL verifies artifact digest before hardening/staging |
| Approval/rejection actions and payment-review delivery UI | SAE | PSL provides contracts, not competing edits |
| Confirmation, dispatch/retry, exports | SAE | No PSL shared-file ownership |

Explicit merge checkpoints occur after `PSL-APPROVAL-CORE-v1`, `SAE-DELIVERY-SCHEMA-v1`, `SAE-ATOMIC-APPROVAL-DELIVERY-v1`, `SAE-DISPATCH-v1`, and `SAE-APPLICATION-CUTOVER-v1`. Every checkpoint verifies owner, source SHA, prerequisite digests, produced paths, and targeted evidence.

## Architecture

```mermaid
flowchart LR
  Browser[Browser UI] -->|Server Action| Actions[app/actions]
  Browser -->|GET confirmation credential| Confirm[/auth/confirm Route Handler]
  Actions --> Guard[getCurrentUser]
  Actions --> Review[Payment review RPC]
  Review --> Approval[(Immutable approval)]
  Review --> Delivery[(Delivery aggregate)]
  Actions --> Claim[Attempt claim/finalize RPCs]
  Claim --> Recipient[Scoped recipient resolver]
  Recipient --> Auth[(auth.users: one owner)]
  Claim --> Mail[Environment-aware mail service]
  Mail --> Resend[Resend only in staging/production]
  Actions --> ExportRPC[Scoped export RPCs]
  ExportRPC --> Data[(profiles/payments/approvals)]
  Actions --> CSV[Shared CSV serializer]
  CSV --> Browser
  Confirm --> SSR[Supabase SSR client]
  SSR --> Browser
```

### Trust boundaries

- The browser may provide payment IDs, normalized filters, date-only range values, and a retry-request UUID. None conveys ownership, role, approval version, recipient, sender, or environment authority.
- `getCurrentUser()` is called before every protected query or effect. Admin actions require `profile.role === "admin"`/`isAdmin`.
- RLS remains enabled on `profiles`, `events`, and `payments`. Database routines repeat authorization and lifecycle checks.
- Auth email access is isolated to a payment/version-scoped server routine. No page, action result, or delivery table contains plaintext recipient email.
- Secrets and Resend code live in modules importing `server-only`.

## Components and Interfaces

### Canonical action response

`lib/actions/types.ts` is the only definition:

```ts
export type ActionResponse<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };
```

Normal actions catch expected failures, record a private categorized diagnostic, and return a stable safe message. Successful non-fatal outcomes use typed data, for example:

```ts
type ReviewPaymentData = {
  outcome: "approved" | "rejected" | "stale";
  warning?: "Payment approved, but confirmation delivery failed.";
};

type CsvExportData = {
  csv: string;
  filename: string;
  rowCount: number;
  byteCount: number;
  effectiveFilters: Record<string, string | number | null>;
};
```

Authentication actions that call `redirect()` on success return `Promise<never | ActionResponse<T>>` as appropriate; redirects remain outside `try/catch`. Registration without a session returns a typed `checkEmail: true` state. Existing action modules and client callers migrate together so no legacy result union remains.

### Authorization

Every protected action starts with:

```ts
const { user, profile, isAdmin } = await getCurrentUser();
```

Member actions require `user` and re-check row ownership. Admin actions require `user`, `profile`, and `isAdmin` before opening protected queries. `app/dashboard/layout.tsx` enforces authenticated, confirmed, profile-ready access. `app/admin/layout.tsx` redirects anonymous users to `/login` and members to `/dashboard`.

### Confirmation callback

Registration passes a validated origin callback ending in `/auth/confirm?next=%2Fdashboard`. Supabase deployment settings require email confirmation and allowlist that origin. The callback accepts exactly one supported shape:

- PKCE: `code`; or
- hashed OTP: `token_hash` with the allowlisted `type=signup`.

Supplying both shapes, incomplete fields, unknown types, oversized values, or duplicate query values fails closed. `next` is decoded once and accepted only when it exactly matches an allowlist initially containing `/dashboard`; it may not contain a scheme, host, backslash, control character, encoded redirect, or protocol-relative prefix.

The GET handler uses `createClient()` from `lib/supabase/server`, awaits installed Next.js 16 cookie APIs through that factory, and calls either `exchangeCodeForSession(code)` or `verifyOtp({ token_hash, type: "signup" })`. It then calls `auth.getUser()`, requires `email_confirmed_at`, and verifies the profile exists. Success returns a redirect response to `/dashboard` carrying SSR cookies. Every malformed, invalid, reused, expired, unconfirmed, or missing-profile result clears/avoids the partial session and redirects to the exact public destination `/login?message=confirmation_failed`. Logs contain only category, type category, environment, and correlation ID.

### Delivery orchestration and atomic cutover

`payment_email_deliveries` and attempts are first deployed inert as `SAE-DELIVERY-SCHEMA-v1`: browser writes are denied, no approval routine inserts aggregates, and no automatic claim can select a row. Cutover policy may be reviewed at this stage, but it is not authoritative enablement.

SAE alone owns the ordinal-09 migration. One database transaction:

1. verifies `PSL-APPROVAL-CORE-v1` and `SAE-DELIVERY-SCHEMA-v1` digests;
2. installs the approval routine extension that authorizes the admin and compares expected status/version;
3. transitions pending to approved and creates immutable approval/version/history;
4. inserts exactly one `origin = 'post_cutover'`, `automatic_eligible = true` delivery aggregate;
5. creates the database-owned cutover version/time marker and enables the new routine; and
6. commits all changes together or none.

The migration publishes `SAE-ATOMIC-APPROVAL-DELIVERY-v1` only after a no-gap query proves every approval at/after the marker has exactly one eligible aggregate, every aggregate references a real approval, and no pre-marker or `legacy_audit` aggregate is automatically eligible. Audit-only legacy aggregates require `origin = 'legacy_audit'` and `automatic_eligible = false`; automatic claim routines reject them. There is no interval in which approvals can commit under the enabled cutover without delivery intent.

After commit, `approvePayment(paymentId, expectedVersion)` claims the automatic attempt. Network delivery is never inside the approval transaction. The action resolves one recipient, renders from immutable approval data, invokes the environment adapter, finalizes the attempt, revalidates affected paths, and returns success. Any post-commit failure finalizes a categorized failure/unknown state when possible and returns successful approval with a warning.

`retryPaymentApprovalEmail(paymentId, retryRequestId)` accepts no recipient or approval version. It authorizes the current admin, resolves the payment's current approved version, and creates/returns the attempt unique on `(delivery_id, retry_request_id)`. It never invokes a payment transition routine. Reusing the key returns the stored/in-progress result.

Attempt claiming uses a database-generated `started_at` and short `lease_expires_at`. A timed-out `sending` attempt becomes `unknown` through an explicit admin/reconciliation operation; it is not automatically resent because provider acceptance may have occurred before a crash. A new explicit retry key is required.

### Environment-aware mail service

`lib/mail/*` imports `server-only` and exposes a transport-injected service. Configuration is parsed before transport construction:

| `APP_ENV` | Envelope recipient | Sender/transport | Persisted result |
| --- | --- | --- | --- |
| `local`, `test` | none | no Resend construction/network | `simulated` |
| `staging` | validated `TEST_EMAIL_TO` only | configured staging sender/Resend | provider outcome |
| `production` | scoped verified owner email | verified non-sandbox sender/Resend | provider outcome |

Unknown/missing environments fail closed. Production rejects `TEST_EMAIL_TO`, `onboarding@resend.dev`, an unverified sender configuration, or missing API key. Staging ignores the intended email for the envelope and persists only owner UUID. The payment approval email receives the immutable `approved_at`, not `new Date()`.

### Scoped recipient resolution

A fixed-search-path, server-only routine such as `resolve_payment_approval_recipient(payment_id, approval_version)`:

- verifies the caller is an admin or an explicitly authorized backend role;
- matches exactly one payment and immutable approval version;
- requires the payment owner/profile relationship and confirmed Auth email;
- optionally requires the version to be current for retries;
- returns only the fields needed to render one message; and
- exposes no list or wildcard behavior.

The broad `admin_list_payments(status=approved)` recipient scan is removed from delivery. The recipient resolver's result never crosses the Server Action boundary.

## Data Model

### `payment_email_deliveries`

| Column | Rule |
| --- | --- |
| `id uuid` | Primary key, database generated |
| `payment_id uuid` | Part of foreign key to immutable approval |
| `approval_version integer` | Part of foreign key; positive |
| `owner_id uuid` | Auditable intended identity, not an address |
| `origin` | `post_cutover` or `legacy_audit` |
| `automatic_eligible boolean` | True only for `post_cutover` rows created by the active atomic routine |
| `state` | `queued`, `simulated`, `sending`, `delivered`, `failed`, or `unknown` |
| `created_at`, `updated_at` | Database-owned timestamps |

`UNIQUE(payment_id, approval_version)` and a composite foreign key to the immutable approval table prevent duplicate or orphan aggregates. A CHECK constraint enforces `origin = 'legacy_audit' -> automatic_eligible = false` and `automatic_eligible = true -> origin = 'post_cutover'`. The database-owned singleton cutover record contains activation version, activation timestamp, migration identity, and immutable creation time. Audit-only legacy aggregates may be inserted by a reviewed migration, but never reconstructed as attempts, marked delivered, or claimed automatically.

The canonical no-gap query must return zero rows for: post-marker approvals without exactly one eligible aggregate; duplicate aggregates; aggregates without approvals; pre-marker approvals marked eligible; and `legacy_audit` aggregates marked eligible.

### `payment_email_attempts`

| Column | Rule |
| --- | --- |
| `id uuid` | Primary key |
| `delivery_id uuid` | Foreign key to aggregate |
| `kind` | `automatic` or `retry` |
| `retry_request_id uuid` | Required only for retry |
| `status` | `claimed`, `simulated`, `delivered`, `failed`, or `unknown` |
| `requested_by uuid` | Admin for retry; approval actor/system reference for automatic |
| `started_at`, `lease_expires_at`, `completed_at` | Database-owned lifecycle times |
| `error_category` | Stable sanitized enum; no provider text |
| `provider_message_id` | Nullable, length-limited safe identifier |
| `correlation_id uuid` | Redacted diagnostic correlation |

A partial unique index permits one automatic attempt per delivery. `UNIQUE(delivery_id, retry_request_id)` makes explicit retries idempotent. CHECK constraints enforce kind/key/actor combinations and terminal timestamps. Client roles cannot insert, update, or delete either table directly; admins receive only a safe delivery summary and attempt history through scoped routines/views.

### State invariants

- Payment approval is durable before transport work begins.
- One immutable approval maps to one delivery aggregate and at most one automatic attempt.
- Reopening does not mutate or delete prior approvals/deliveries.
- Reapproval creates a new approval version and delivery aggregate.
- Attempt rows are append-oriented; finalization changes only claim lifecycle fields through a guarded routine.
- No table stores plaintext recipient email, API keys, rendered message body, or provider payload.

## Export Design

### Shared input and output

`exportMemberRosterCsv({ search?, yearLevel? })` and `exportLiquidationLedgerCsv({ startDate?, endDate? })` are named admin Server Actions. Inputs are parsed by shared server validation. Search is trimmed, control-normalized, and length-bounded; year level is absent or 1–5. Date values are strict `YYYY-MM-DD` real Manila calendar dates.

Both actions return `ActionResponse<CsvExportData>`. The browser control builds a UTF-8 Blob, clicks a temporary object URL, and revokes it. The server stores no generated file.

### Member roster query

A scoped admin query/RPC receives normalized search/year filters and keyset/page parameters. It selects only:

- profile full name, student ID, year level, role, registration timestamp; and
- the payment reference/amount plus immutable approval for the member's current approved payment.

It returns at most 10,001 rows so the action detects overflow without an unbounded scan. A member with no current approved payment—including members with only pending, rejected, or reopened payments—gets `No approved payment`, blank reference, and blank amount. The column order is exactly that in SAE-7.4.

### Liquidation query

The default range is the current Manila calendar month. Strict date parsing computes inclusive display dates and the UTC half-open range `[start midnight, midnight after end)` in `Asia/Manila`. A scoped admin query selects at most 10,001 current approved payments whose current immutable approval timestamp is in that interval. Reopened/rejected/pending rows and superseded approval versions are excluded. The column order is exactly that in SAE-8.4.

### CSV normalization and limits

For each scalar, the serializer performs this deterministic order:

1. convert `null`/`undefined` to empty string and format typed dates/amounts;
2. remove disallowed C0 characters U+0000–0008, U+000B, U+000C, U+000E–001F;
3. inspect past leading preserved whitespace/controls; if the first meaningful character is `=`, `+`, `-`, or `@`, prefix one apostrophe;
4. double every quote and enclose every field in quotes;
5. join fields with commas and records with CRLF; and
6. prepend UTF-8 BOM U+FEFF.

Embedded tab, CR, and LF remain inside quoted fields. Amounts use two decimal places. Dates are rendered in Manila time using stable documented formats. The serializer encodes the complete candidate and measures final UTF-8 bytes including BOM. More than 10,000 data rows or more than 5 MiB rejects the whole export; no partial CSV is returned.

Filenames are server-generated and contain only export type plus normalized effective filters/date range, for example `member-roster-all-2026-09-30.csv` and `liquidation-ledger-2026-09-01-to-2026-09-30.csv`.

## UI and Revalidation

- `PaymentsTable` consumes canonical results, shows delivery summary, and renders `Retry approval email (does not change payment status)` only for authorized failed/unknown/undelivered current approvals.
- Retry buttons generate one UUID per user submission and retain it while pending/retrying the same request.
- `ExportRosterButton` is renamed/updated to call `exportMemberRosterCsv` with the page's normalized filters.
- A liquidation export control on the payments admin page displays start/end date inputs labeled `Approval date range (Philippine time)`, defaults to the current Manila month, and shows the effective range returned by the action.
- Pending controls are disabled and expose accessible progress. Server constraints remain authoritative.
- Review/reopen revalidates `/admin`, `/admin/payments`, and `/dashboard`. Delivery-only retry revalidates `/admin/payments` and `/admin`. Export actions do not revalidate.

## Error Model and Observability

Public categories are stable, bounded values such as `UNAUTHORIZED`, `VALIDATION`, `STALE_REVIEW`, `RECIPIENT_UNAVAILABLE`, `MAIL_CONFIG`, `MAIL_REJECTED`, `MAIL_UNKNOWN`, `EXPORT_LIMIT`, and `INTERNAL`. User messages never include raw Supabase/Resend text. Each operation has a UUID correlation ID.

Structured server logs include operation, category, environment, correlation ID, actor UUID where authorized, payment/delivery IDs where needed, row/byte counts, and outcome. They exclude tokens, query strings, full email addresses, CSV cells, rendered emails, receipt keys, signed URLs, API keys, and provider payloads. Confirmation logs are stricter and retain only category, coarse verification type, environment, and correlation ID.

## Test Strategy

### Unit and contract tests

Use deterministic clocks and injected transports/repositories to cover action shapes, guard-first call order, error sanitization, environment routing, no-network local/test behavior, staging override, production fail-closed combinations, one-payment recipient lookup, idempotent claims/retries, and CSV normalization/byte boundaries. Type checks prove client callers narrow `ActionResponse`.

### Direct Supabase tests

`tests/security/supabase-boundaries.test.mjs` (or a focused companion invoked by `test:security`) has its own non-production preflight, fixture manifest, actor clients, and cleanup. It never starts Next.js. It directly verifies RLS, routine grants, approval/delivery uniqueness, stale concurrency, current approval semantics, scoped export rows, no broad recipient disclosure, and append/transition restrictions. Output is redacted and cleanup targets immutable fixture IDs only.

### HTTP route tests

HTTP validation uses one explicit selector: `HTTP_MODE=local|preview`. Unset defaults to `local`. Local mode rejects preview-only deployment inputs; preview mode requires HTTPS `BASE_URL`, expected source SHA, and deployment identity. Supplying contradictory inputs fails before fixtures. Release evidence depends only on the selected harness, never both.

Both harnesses consume a shared assertion library and deterministic server-only confirmation-fixture adapter. The adapter exists only under test configuration, is unreachable in production builds, sends no mail, and creates manifest-owned valid-unused, reused, expired, unrecognized-type, and missing-profile cases. Each case has a deterministic cleanup ID; credentials, callbacks, cookies, and emails never enter logs.

- **Local production server:** create a build manifest containing source SHA, build SHA, build command, Node version, and artifact digest; allocate an isolated port; set `BASE_URL=http://127.0.0.1:<port>`; start exactly one production server in its own process group; poll readiness with a fixed deadline; and register cleanup before startup. On success, assertion failure, startup error, timeout, Ctrl+C, termination signal, or parent exit, stop descendants before the parent and verify the port/process tree is gone. Use Windows `taskkill /PID <pid> /T /F` semantics and POSIX process-group termination as platform adapters; a second bounded forced pass is mandatory.
- **Commit-matched preview:** require HTTPS and expected SHA; verify deployment identity/readiness before fixtures; run the same assertions; clean only manifest-owned test identities; and record the named external owner and deadline for preview expiry/removal.

The matrix covers valid confirmation to `/dashboard`, session-cookie usability, deterministic malformed/reused/expired/unrecognized/missing-profile cases, exact sanitized failure, open-redirect rejection, anonymous dashboard/admin redirects, member admin redirect, and admin nested-route access. The unsafe direct test-mail action is removed or routes through the same fail-closed mail contract before any unit, Supabase, or HTTP test runs.

Direct Supabase and HTTP suites retain separate commands, logs, timeouts, fixture manifests, and teardown. Release orchestration runs unit/contract, direct Supabase, a production build, then exactly the selected HTTP lifecycle and records selected mode, source/build/deployment SHA as applicable, sanitized origin, readiness, actor matrix, assertions, fixture cleanup, and teardown.

## Correctness Properties

1. **P-SAE-1 — Canonical closure (SAE-1):** For every normal action outcome, the result has exactly one discriminant branch; warnings occur only in successful typed data and injected backend secrets never occur in public text.
2. **P-SAE-2 — Authorization precedes effects (SAE-2):** For every protected action and unauthorized actor, `getCurrentUser()` is observed before any protected repository/transport call and the number of subsequent effects is zero.
3. **P-SAE-3 — Confirmation safety (SAE-3):** Every valid unused confirmation establishes a usable confirmed session and reaches `/dashboard`; every other credential/target combination reaches only the sanitized login failure destination.
4. **P-SAE-4 — Environment isolation (SAE-4):** For every environment/configuration pair, delivery either uses the single permitted route or fails before transport; local/test transport calls are always zero.
5. **P-SAE-5 — Recipient singularity (SAE-5):** Every delivery lookup returns zero or one verified owner for the exact payment/version and cannot enumerate or accept another recipient.
6. **P-SAE-6 — Approval/delivery cardinality (SAE-6):** Across repeated/concurrent requests, each post-marker approval has exactly one eligible aggregate, each legacy-audit aggregate is ineligible, each version has at most one automatic attempt and one attempt per retry key, and payment approval survives delivery failure.
7. **P-SAE-7 — Roster projection (SAE-7):** For every filtered profile set, output contains exactly matching members once; current approved data is selected, otherwise exact fallback text and blank financial fields are emitted.
8. **P-SAE-8 — Liquidation interval (SAE-8):** For every valid Manila date range, a row appears iff the payment is currently approved and its current immutable `approved_at` is inside the derived half-open UTC interval.
9. **P-SAE-9 — CSV round trip and safety (SAE-9):** For arbitrary Unicode cells, serialization preserves allowed content under RFC-style parsing, removes specified controls, neutralizes every leading formula trigger, includes one BOM, and never exceeds configured row/byte bounds on success.
10. **P-SAE-10 — UI consistency (SAE-10):** UI inputs equal normalized action inputs, duplicate gestures do not create duplicate effects, and operation-specific routes are revalidated without delivery retry changing payment state.
11. **P-SAE-11 — Redaction (SAE-11):** For arbitrary sensitive canaries injected into backend failures or domain records, no public result, telemetry event, or release evidence contains those canaries.
12. **P-SAE-12 — Lifecycle isolation (SAE-12):** Direct Supabase tests start no HTTP server; exactly one selector-resolved HTTP harness runs, uses deterministic fixtures, proves source/build identity, and completes its declared fixture and Windows/POSIX-safe teardown.
13. **P-SAE-13 — Historical truth (SAE-13):** No delivery/export row references a nonexistent approval, no legacy row gains invented facts, milestone digests preserve ownership, and atomic marker/routine activation leaves no approval-delivery gap.

## Requirement Traceability

This reverse map is derived from actual requirement citations in `tasks.md`.

| Requirement | Primary design elements | Property | Citing task groups |
| --- | --- | --- | --- |
| SAE-1 | Canonical response, caller migration | P-SAE-1 | 1, 2, 6, 7, 9, 12 |
| SAE-2 | Authorization, protected layouts | P-SAE-2 | 2, 3, 4, 5, 7, 8, 9, 10, 11 |
| SAE-3 | Confirmation callback/session/profile gate | P-SAE-3 | 1, 3, 9, 11 |
| SAE-4 | Environment mail service | P-SAE-4 | 2, 3, 4, 6, 9 |
| SAE-5 | Scoped recipient routine | P-SAE-5 | 2, 5, 6, 7, 9, 10, 12 |
| SAE-6 | Delivery schema, atomic activation, dispatch, retry | P-SAE-6 | 1, 4, 5, 6, 7, 9, 10 |
| SAE-7 | Roster RPC/action/control | P-SAE-7 | 8, 9, 10, 12 |
| SAE-8 | Ledger range/RPC/action/control | P-SAE-8 | 1, 6, 8, 9, 10, 12 |
| SAE-9 | CSV serializer, bounds, download | P-SAE-9 | 8, 9, 10, 12 |
| SAE-10 | Admin UI and revalidation | P-SAE-10 | 5, 7, 8, 9 |
| SAE-11 | Diagnostics and redaction | P-SAE-11 | 1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12 |
| SAE-12 | Unit, Supabase, selected HTTP, release | P-SAE-12 | 1, 2, 9, 10, 11, 12 |
| SAE-13 | Manifest, milestones, historical cutover | P-SAE-13 | 1, 4, 5, 6, 7, 10, 12 |

| Milestone | Producer | Consumer |
| --- | --- | --- |
| `PSL-APPROVAL-CORE-v1` | PSL task 8.7 | SAE tasks 1.3 and 4.1 |
| `SAE-DELIVERY-SCHEMA-v1` | SAE task 4.5 | SAE task 5.1 |
| `SAE-ATOMIC-APPROVAL-DELIVERY-v1` | SAE task 5.9 | SAE tasks 6.6, 7.1; PSL hardening/staging |
| `SAE-DISPATCH-v1` | SAE task 6.7 | SAE task 7.1 |
| `SAE-APPLICATION-CUTOVER-v1` | SAE task 7.7 | SAE task 12.2; PSL staging/closure |

## Key Design Decisions

- **Delivery cutover is atomic and database-owned:** inert schema precedes one transaction that installs the routine extension, marker, and enablement, closing both crash and deployment gaps.
- **Legacy audit rows are never automatic:** `origin` and `automatic_eligible` checks plus the no-gap query prevent reconstructed sends.
- **Transport is post-commit:** external network failure can never roll back payment approval.
- **Retries derive current version and recipient:** the client supplies only payment ID and a non-authoritative idempotency UUID.
- **Unknown attempts are not automatically resent:** this avoids duplicates after an ambiguous provider response.
- **CSV limits apply after final encoding:** byte accounting includes BOM and all escaping.
- **HTTP and database tests are separate:** each suite owns only its own lifecycle and produces attributable SHA evidence.
