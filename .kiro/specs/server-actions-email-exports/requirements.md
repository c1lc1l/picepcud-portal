# Server Actions, Email, and Exports Requirements

## Table of Contents

- [Introduction](#introduction)
- [Cross-Spec Milestone Contract](#cross-spec-milestone-contract)
- [Glossary](#glossary)
- [Requirements](#requirements)
  - [SAE-1: Canonical Server Action Contract](#requirement-sae-1-canonical-server-action-contract)
  - [SAE-2: Protected Action Authorization](#requirement-sae-2-protected-action-authorization)
  - [SAE-3: Mandatory Email Ownership Confirmation](#requirement-sae-3-mandatory-email-ownership-confirmation)
  - [SAE-4: Environment-Aware Mail Routing](#requirement-sae-4-environment-aware-mail-routing)
  - [SAE-5: Scoped Recipient Resolution](#requirement-sae-5-scoped-recipient-resolution)
  - [SAE-6: Delivery Persistence and Approval-Version Idempotency](#requirement-sae-6-delivery-persistence-and-approval-version-idempotency)
  - [SAE-7: Named Member-Roster Export](#requirement-sae-7-named-member-roster-export)
  - [SAE-8: Named Liquidation-Ledger Export](#requirement-sae-8-named-liquidation-ledger-export)
  - [SAE-9: CSV Safety, Limits, and Browser Delivery](#requirement-sae-9-csv-safety-limits-and-browser-delivery)
  - [SAE-10: Administrative User Interfaces and Revalidation](#requirement-sae-10-administrative-user-interfaces-and-revalidation)
  - [SAE-11: Error Handling and Observability](#requirement-sae-11-error-handling-and-observability)
  - [SAE-12: Automated Verification and HTTP Lifecycle](#requirement-sae-12-automated-verification-and-http-lifecycle)
  - [SAE-13: Payment-Lifecycle and Existing-Data Dependencies](#requirement-sae-13-payment-lifecycle-and-existing-data-dependencies)
- [Requirement Traceability](#requirement-traceability)

## Introduction

This Design-First specification defines the application boundary for canonical Server Action results, protected mutations, mandatory email-ownership confirmation, environment-aware transactional mail, approval-version delivery persistence, and Treasurer CSV exports. It depends only on the versioned `PSL-APPROVAL-CORE-v1` artifact from `payment-security-lifecycle`, not on ambiguous completion of that whole specification.

PSL owns payment core lifecycle, receipts, retention, and event-banner semantics. SAE owns canonical shared diagnostics, inert delivery schema, the delivery extension and database cutover marker, final approval/rejection Server Actions and review UI, mail dispatch/retries, and exports. SAE produces `SAE-DELIVERY-SCHEMA-v1`, `SAE-ATOMIC-APPROVAL-DELIVERY-v1`, `SAE-DISPATCH-v1`, and `SAE-APPLICATION-CUTOVER-v1` in that order. Each is an immutable manifest containing source SHA, prerequisite digests, produced paths, and targeted verification evidence.

Database mutations and delivery triggers remain in `app/actions/*`. The `/auth/confirm` Route Handler is the narrow authentication callback that verifies Supabase confirmation credentials and writes session cookies; it is not a general mutation API. Redirecting authentication actions are documented control-flow exceptions because Next.js `redirect()` does not return.

## Cross-Spec Milestone Contract

| Artifact | Producer condition | Consumer condition |
| --- | --- | --- |
| `PSL-APPROVAL-CORE-v1` | PSL base approval/version/history routines and evidence pass | Required before SAE delivery schema |
| `SAE-DELIVERY-SCHEMA-v1` | Delivery schema is deployed inert with eligibility constraints and prechecks | Required before atomic activation |
| `SAE-ATOMIC-APPROVAL-DELIVERY-v1` | Approval routine extension, database-owned cutover marker, and enablement activate in one transaction | Required before dispatch and PSL hardening/staging |
| `SAE-DISPATCH-v1` | Scoped recipient, environment routing, claim/finalize, and tests pass | Required before action/UI cutover |
| `SAE-APPLICATION-CUTOVER-v1` | Approval/rejection actions and UI use only the atomic routine and legacy paths are disabled | Required for coordinated staging/release closure |

A cross-spec dependency SHALL cite one artifact ID and digest; it SHALL NOT depend on an unspecified task range or whole-spec completion.

## Glossary

- **Approval date:** The immutable `approved_at` timestamp on an approval-version record.
- **Approval version:** The monotonically increasing version created each time a payment enters `approved`.
- **Automatic attempt:** The single delivery attempt initiated for one newly committed approval version.
- **Canonical response:** `ActionResponse<T> = { success: true; data?: T } | { success: false; error: string }` exported from `lib/actions/types.ts`.
- **Current approval:** The immutable approval record referenced by a payment whose current status is `approved`.
- **Delivery aggregate:** The one durable mail-delivery record for `(payment_id, approval_version)`.
- **Liquidation range:** A half-open UTC interval derived from inclusive calendar dates interpreted in `Asia/Manila`.
- **Target recipient:** The reviewed payment owner's currently verified Auth email resolved server-side for exactly one payment and approval version.

## Requirements

### Requirement SAE-1: Canonical Server Action Contract

**User Story:** As a client-component developer, I want one typed action result, so that success, warnings, and failures are handled consistently.

#### Acceptance Criteria

1. **SAE-1.1:** WHEN a Server Action under `app/actions/*` returns normally, THE SYSTEM SHALL return the shared `ActionResponse<T>` imported from `lib/actions/types.ts`.
2. **SAE-1.2:** WHEN an action succeeds with a non-fatal warning, THE SYSTEM SHALL place the sanitized warning in typed `data` and SHALL NOT represent the committed operation as failed.
3. **SAE-1.3:** WHEN an action fails, THE SYSTEM SHALL return `{ success: false, error: <sanitized message> }` without raw database, provider, stack, secret, token, or recipient details.
4. **SAE-1.4:** WHEN an authentication action's successful path invokes Next.js `redirect()`, THE SYSTEM SHALL treat the non-returning redirect as a documented control-flow exception to the normal response contract.
5. **SAE-1.5:** WHEN action callers are migrated, THE SYSTEM SHALL narrow on `success` and consume only declared `data` fields rather than inspect legacy `error`, `warning`, or `success` shapes.

### Requirement SAE-2: Protected Action Authorization

**User Story:** As a member or admin, I want protected actions to verify my current identity and role, so that client-submitted IDs or hidden controls cannot grant privileges.

#### Acceptance Criteria

1. **SAE-2.1:** WHEN a protected Server Action starts, THE SYSTEM SHALL call `getCurrentUser()` before reading protected data, mutating a row, minting a signed URL, exporting PII, or triggering mail.
2. **SAE-2.2:** WHEN an administrative action is called by an anonymous user or non-admin member, THE SYSTEM SHALL return a canonical unauthorized result before protected queries or side effects occur.
3. **SAE-2.3:** WHEN a member action accepts a resource ID or object key, THE SYSTEM SHALL derive ownership from the authenticated session and reauthorize the resource server-side.
4. **SAE-2.4:** WHEN a client submits a recipient, role, owner ID, approval version, sender identity, or environment mode, THE SYSTEM SHALL ignore it as authority and use server-derived values.
5. **SAE-2.5:** WHEN a protected layout is requested directly, THE SYSTEM SHALL redirect an anonymous actor to `/login`, a non-admin actor requesting `/admin/*` to `/dashboard`, and an admin to the requested protected route.

### Requirement SAE-3: Mandatory Email Ownership Confirmation

**User Story:** As a registering member, I want to confirm ownership of my email before entering the portal, so that unverified accounts cannot access protected features.

#### Acceptance Criteria

1. **SAE-3.1:** WHEN deployment is configured, THE SYSTEM SHALL require Supabase email confirmation and SHALL use an allowlisted HTTPS application origin whose callback path is `/auth/confirm`.
2. **SAE-3.2:** WHEN registration succeeds without a confirmed session, THE SYSTEM SHALL initiate Supabase confirmation for `/auth/confirm` and show a generic check-your-email state without revealing account existence beyond the submitted flow.
3. **SAE-3.3:** WHEN `/auth/confirm` receives one valid, unused, unexpired confirmation credential and a recognized verification type, THE SYSTEM SHALL verify or exchange it through the server Supabase client, establish SSR session cookies, verify profile readiness, and redirect to `/dashboard`.
4. **SAE-3.4:** WHEN a confirmation credential is missing, malformed, invalid, reused, or expired, or its verification type is unrecognized, THE SYSTEM SHALL reveal no credential or account details and SHALL redirect to `/login?message=confirmation_failed`.
5. **SAE-3.5:** WHEN a confirmation request supplies a return target, THE SYSTEM SHALL allow only an explicitly allowlisted application-relative path and SHALL default to `/dashboard`; absolute, protocol-relative, encoded, or external targets SHALL be rejected.
6. **SAE-3.6:** WHEN an unconfirmed or unknown user attempts password login, THE SYSTEM SHALL return one generic confirmation-or-credentials message without disclosing whether an email is registered.
7. **SAE-3.7:** WHEN confirmation succeeds but the corresponding member profile is unavailable, THE SYSTEM SHALL clear or avoid exposing the partial session and redirect to `/login?message=confirmation_failed` with a recoverable sanitized outcome.
8. **SAE-3.8:** WHEN an unconfirmed identity requests a protected route, THE SYSTEM SHALL deny protected access even if a client presents stale or partial auth state.
9. **SAE-3.9:** WHEN confirmation behavior is implemented, THE SYSTEM SHALL use the installed Next.js 16 asynchronous request/cookie APIs and installed `@supabase/ssr` patterns documented under local `node_modules`.

### Requirement SAE-4: Environment-Aware Mail Routing

**User Story:** As an operator, I want mail routing to fail closed by environment, so that tests cannot contact members and production cannot use sandbox settings.

#### Acceptance Criteria

1. **SAE-4.1:** WHEN `APP_ENV` is `local` or `test`, THE SYSTEM SHALL persist a simulated successful delivery outcome without constructing or calling a Resend network transport.
2. **SAE-4.2:** WHEN `APP_ENV` is `staging`, THE SYSTEM SHALL send only to the validated server-only `TEST_EMAIL_TO` address regardless of the member's actual email and SHALL retain the intended recipient only as the owner Auth UUID.
3. **SAE-4.3:** WHEN `APP_ENV` is `production`, THE SYSTEM SHALL require a verified non-sandbox sender and complete server-only Resend configuration and SHALL route only to the server-resolved payment owner.
4. **SAE-4.4:** WHEN the environment is missing, unknown, mismatched, or combines production with `TEST_EMAIL_TO` or `onboarding@resend.dev`, THE SYSTEM SHALL fail closed before any mail network request.
5. **SAE-4.5:** WHEN mail configuration is loaded, THE SYSTEM SHALL keep API keys, sender validation data, target addresses, and provider responses out of browser bundles, client props, action errors, and release evidence.

### Requirement SAE-5: Scoped Recipient Resolution

**User Story:** As a member, I want approval mail sent only to my verified account address, so that another recipient cannot be injected or discovered.

#### Acceptance Criteria

1. **SAE-5.1:** WHEN approval delivery is prepared, THE SYSTEM SHALL perform one scoped server-authorized lookup for exactly the payment ID, approval version, owner profile, and owner Auth record.
2. **SAE-5.2:** WHEN the payment, owner, approval version, current approval, or confirmed email does not match, THE SYSTEM SHALL record a sanitized delivery failure and SHALL NOT scan or return unrelated members.
3. **SAE-5.3:** WHEN a member email changes after an earlier approval, THE SYSTEM SHALL resolve the current verified owner email for an authorized retry while preserving earlier attempt audit records without storing an unnecessary plaintext recipient copy.
4. **SAE-5.4:** WHEN a client calls approval or retry actions, THE SYSTEM SHALL accept no recipient parameter and SHALL never trust an address from form data, URL state, hidden inputs, or client component props.

### Requirement SAE-6: Delivery Persistence and Approval-Version Idempotency

**User Story:** As a Treasurer, I want approval delivery attempts persisted independently from payment state, so that failures can be retried without duplicate approvals.

#### Acceptance Criteria

1. **SAE-6.1:** WHEN a payment approval version commits, THE SYSTEM SHALL preserve the approved status even if every subsequent recipient or mail operation fails.
2. **SAE-6.2:** WHEN a new approval version commits after delivery cutover, THE SYSTEM SHALL create exactly one delivery aggregate for `(payment_id, approval_version)` in the same database transaction and at most one automatic attempt for that version after commit.
3. **SAE-6.3:** WHEN repeated or concurrent approval calls observe the same current version, THE SYSTEM SHALL return the existing or stale result without creating another delivery aggregate or automatic attempt.
4. **SAE-6.4:** WHEN an attempt is claimed or finalized, THE SYSTEM SHALL persist attempt kind, state, started/completed timestamps, sanitized error category, safe provider message ID, and retry actor when applicable.
5. **SAE-6.5:** WHEN a claimed attempt exceeds the designed lease without a terminal result, THE SYSTEM SHALL mark or recover it through an explicit reconciliation path and SHALL NOT silently resend with the same idempotency key.
6. **SAE-6.6:** WHEN an admin invokes `retryPaymentApprovalEmail`, THE SYSTEM SHALL verify current admin authorization, derive payment/version/recipient server-side, leave payment status and approval history unchanged, and use a required retry-request idempotency key.
7. **SAE-6.7:** WHEN the same retry-request idempotency key is repeated, THE SYSTEM SHALL return the existing attempt outcome rather than send twice.
8. **SAE-6.8:** WHEN a payment is reopened and later reapproved, THE SYSTEM SHALL retain earlier delivery records and create a separate aggregate and automatic attempt only for the new approval version.
9. **SAE-6.9:** WHEN approval succeeds but delivery fails, THE SYSTEM SHALL return `success: true` with a sanitized typed warning and expose an admin-only retry state.
10. **SAE-6.10:** WHEN an audit-only aggregate represents a legacy approval, THE SYSTEM SHALL require `origin = 'legacy_audit'` and `automatic_eligible = false`; no automatic claim routine SHALL accept that row.
11. **SAE-6.11:** WHEN delivery cutover activates, THE SYSTEM SHALL create the database-owned cutover version/time marker, replace or enable the approval-plus-delivery routine, and enable automatic eligibility atomically after the inert schema exists; a no-gap query SHALL prove every approval at or after the marker has exactly one eligible aggregate and no approval before it is automatically eligible.

### Requirement SAE-7: Named Member-Roster Export

**User Story:** As a Treasurer, I want a filtered member roster CSV, so that I can reconcile chapter membership without manually combining tables.

#### Acceptance Criteria

1. **SAE-7.1:** WHEN an admin invokes `exportMemberRosterCsv`, THE SYSTEM SHALL export one row for every member matching the current sanitized search and year-level filters, not merely the visible page.
2. **SAE-7.2:** WHEN a member has a current approved payment, THE SYSTEM SHALL include the latest current immutable approval's status, reference number, and two-decimal amount.
3. **SAE-7.3:** WHEN a member has no current approved payment, THE SYSTEM SHALL emit the exact status `No approved payment` and blank reference and amount fields.
4. **SAE-7.4:** WHEN the roster is generated, THE SYSTEM SHALL emit columns in this order: `Full Name`, `Student ID`, `Year Level`, `Role`, `Approved Payment Status`, `Reference Number`, `Amount (PHP)`, `Registration Date`.
5. **SAE-7.5:** WHEN a non-admin invokes the roster action or UI, THE SYSTEM SHALL deny export before querying or returning roster PII.
6. **SAE-7.6:** WHEN roster filters are absent, THE SYSTEM SHALL apply the documented all-members default subject to export limits and SHALL return the effective normalized filters in typed action data.

### Requirement SAE-8: Named Liquidation-Ledger Export

**User Story:** As a Treasurer, I want an approval-date-filtered liquidation CSV, so that approved GCash receipts can be reconciled for a reporting period.

#### Acceptance Criteria

1. **SAE-8.1:** WHEN an admin invokes `exportLiquidationLedgerCsv`, THE SYSTEM SHALL export one row per current approved payment whose current immutable `approved_at` falls within the effective approval-date range.
2. **SAE-8.2:** WHEN inclusive Manila start and end dates are supplied, THE SYSTEM SHALL validate real calendar dates, require start not after end, and query the equivalent half-open UTC interval `[start 00:00, day-after-end 00:00)`.
3. **SAE-8.3:** WHEN no range is supplied, THE SYSTEM SHALL default to the current Manila calendar month and return its effective inclusive dates in typed action data; it SHALL NOT infer an academic year.
4. **SAE-8.4:** WHEN the ledger is generated, THE SYSTEM SHALL emit columns in this order: `Member Name`, `Student ID`, `Reference Number`, `Amount (PHP)`, `Approved At`, `Payment Record Date`, `Payment ID`, `Approval Version`.
5. **SAE-8.5:** WHEN a payment is pending, rejected, reopened, or approved outside the half-open range, THE SYSTEM SHALL exclude it.
6. **SAE-8.6:** WHEN a payment was approved more than once, THE SYSTEM SHALL include only its current approval while currently approved and SHALL use that approval version's immutable `approved_at`.
7. **SAE-8.7:** WHEN a non-admin invokes the ledger action or UI, THE SYSTEM SHALL deny export before querying payment-owner PII.

### Requirement SAE-9: CSV Safety, Limits, and Browser Delivery

**User Story:** As an officer, I want safe bounded CSV downloads, so that exports open correctly without spreadsheet injection or uncontrolled resource use.

#### Acceptance Criteria

1. **SAE-9.1:** WHEN either CSV is generated, THE SYSTEM SHALL emit UTF-8 with BOM, CRLF records, RFC 4180-compatible quote escaping, Manila dates, two-decimal amounts, and empty strings rather than `null` or `undefined`.
2. **SAE-9.2:** WHEN a cell contains commas, quotes, CR, or LF, THE SYSTEM SHALL preserve the content through correct quoting and doubled quotes.
3. **SAE-9.3:** WHEN a cell's first meaningful character after leading whitespace or C0 controls is `=`, `+`, `-`, or `@`, THE SYSTEM SHALL prefix the normalized cell with a single apostrophe before serialization.
4. **SAE-9.4:** WHEN a cell contains disallowed C0 controls, THE SYSTEM SHALL remove U+0000 through U+0008, U+000B, U+000C, and U+000E through U+001F while preserving tab, CR, and LF for safe quoted serialization.
5. **SAE-9.5:** WHEN an export would exceed 10000 data rows or 5 MiB measured as final UTF-8 bytes including BOM, THE SYSTEM SHALL reject it with a sanitized instruction to narrow filters and SHALL NOT return a partial file.
6. **SAE-9.6:** WHEN export data is queried, THE SYSTEM SHALL select only required columns and filtered rows using bounded pagination or a scoped database function and SHALL NOT load unrelated payment or Auth rows.
7. **SAE-9.7:** WHEN an export succeeds, THE SYSTEM SHALL return typed CSV text, filename, row count, byte count, and effective filters/range for a browser-created download and SHALL NOT retain a server-side copy.
8. **SAE-9.8:** WHEN export telemetry is recorded, THE SYSTEM SHALL log export type, actor or correlation ID, normalized filter summary, row count, byte count, and outcome without CSV content or member PII.

### Requirement SAE-10: Administrative User Interfaces and Revalidation

**User Story:** As an admin, I want clear controls and statuses for review, retries, and exports, so that operations are understandable and safe.

#### Acceptance Criteria

1. **SAE-10.1:** WHEN payment approval, rejection, or reopening completes, THE SYSTEM SHALL revalidate `/admin`, `/admin/payments`, and `/dashboard`; WHEN delivery-only retry completes, THE SYSTEM SHALL revalidate delivery-status views without changing payment state.
2. **SAE-10.2:** WHEN delivery failed or remains undelivered, THE SYSTEM SHALL show an admin-only retry control labeled as email delivery only and SHALL state that retry does not change payment status.
3. **SAE-10.3:** WHEN roster filters are active, THE SYSTEM SHALL pass the same normalized filters to `exportMemberRosterCsv` and reflect them in typed metadata and the downloaded filename.
4. **SAE-10.4:** WHEN an admin chooses a liquidation range, THE SYSTEM SHALL label it as an approval-date range in Philippine time and display the effective validated range before download.
5. **SAE-10.5:** WHEN an action is pending, THE SYSTEM SHALL disable accidental duplicate submission while preserving server-side constraints and idempotency as authoritative.
6. **SAE-10.6:** WHEN an export action fails or exceeds a limit, THE SYSTEM SHALL retain the selected filters/range and present a sanitized corrective message.

### Requirement SAE-11: Error Handling and Observability

**User Story:** As an operator, I want sanitized diagnostics and durable delivery state, so that failures can be investigated without leaking member data.

#### Acceptance Criteria

1. **SAE-11.1:** WHEN an action, confirmation, mail, recipient lookup, or export fails, THE SYSTEM SHALL assign a stable error category and correlation ID while returning only a user-safe message.
2. **SAE-11.2:** WHEN mail state changes, THE SYSTEM SHALL make delivery status and attempt history queryable to authorized admins without exposing provider payloads, API keys, plaintext recipients, or unrelated records.
3. **SAE-11.3:** WHEN confirmation fails, THE SYSTEM SHALL log only the category, verification-type category, environment, and correlation ID and SHALL NOT log credentials, tokens, full email addresses, or callback query strings.
4. **SAE-11.4:** WHEN exports or delivery attempts run, THE SYSTEM SHALL emit redacted structured outcomes suitable for release evidence and aggregate monitoring.
5. **SAE-11.5:** WHEN provider or database details are needed for diagnosis, THE SYSTEM SHALL confine them to restricted server logs and sanitize them before action responses or UI display.

### Requirement SAE-12: Automated Verification and HTTP Lifecycle

**User Story:** As a maintainer, I want deterministic, isolated tests for actions, routes, mail, and exports, so that security regressions block release.

#### Acceptance Criteria

1. **SAE-12.1:** WHEN unit and contract tests run, THE SYSTEM SHALL verify canonical response narrowing, `getCurrentUser()` guards, sanitized errors, typed warnings, mail routing, idempotency, recipient scoping, and CSV behavior; the unsafe direct test-mail path SHALL already be removed or fail closed through the same environment/scoping contract before any test phase starts.
2. **SAE-12.2:** WHEN confirmation HTTP tests run, THE SYSTEM SHALL use a deterministic server-only fixture seam unavailable in production to create valid-unused, reused, expired, unrecognized-type, and missing-profile cases without sending mail, and SHALL cover open-redirect rejection plus successful session establishment.
3. **SAE-12.3:** WHEN mail tests run, THE SYSTEM SHALL prove zero network calls in local/test, forced `TEST_EMAIL_TO` routing in staging, fail-closed production configuration, scoped recipient lookup, approval survival on failure, and approval/retry idempotency.
4. **SAE-12.4:** WHEN CSV tests run, THE SYSTEM SHALL cover both named exports, filters, current-approval semantics, immutable approval-date boundaries, zero rows, pagination, Unicode, commas, quotes, CR/LF, control/formula payloads, BOM, exact fallback text, and row/byte limits.
5. **SAE-12.5:** WHEN direct Supabase boundary tests run, THE SYSTEM SHALL invoke non-production preflight, own disposable fixtures and cleanup, test database/RLS/RPC constraints directly, emit redacted results, and SHALL NOT start or manage a Next.js HTTP server.
6. **SAE-12.6:** WHEN HTTP route validation is selected, THE SYSTEM SHALL resolve exactly one `HTTP_MODE` value: unset defaults to `local`, `local` forbids preview-only inputs, and `preview` requires its HTTPS origin/deployment identity inputs. Evidence SHALL depend only on the selected harness.
7. **SAE-12.7:** WHEN local HTTP mode runs, THE HARNESS SHALL create a source/build manifest and SHA, use its matching production build, allocate an isolated port, start exactly one production Next.js server, wait on a bounded readiness probe, and self-terminate the complete process tree on success, failure, startup error, timeout, Ctrl+C, termination signal, or parent exit using Windows-safe and POSIX-safe teardown.
8. **SAE-12.8:** WHEN preview HTTP mode runs, THE HARNESS SHALL require a deployed HTTPS preview for the exact expected SHA, verify deployment identity/readiness, create isolated actor sessions/cookies, run the same assertions, clean only test identities, and record the external preview teardown owner.
9. **SAE-12.9:** WHEN HTTP evidence is recorded, THE SYSTEM SHALL include selected mode, source/build/deployment SHA as applicable, sanitized origin label, readiness result, actor matrix, redirect/cookie assertions, fixture cleanup, process-tree teardown for local mode, and zero secrets or PII.
10. **SAE-12.10:** WHEN Supabase and HTTP suites are combined, THE SYSTEM SHALL orchestrate them as separate phases with separate commands, logs, timeouts, fixture ownership, teardown, and failure summaries.
11. **SAE-12.11:** WHEN release validation runs, THE SYSTEM SHALL require strict lint, unit/contract tests, non-production Supabase boundary tests, a production build, and exactly the selected HTTP lifecycle to pass.

### Requirement SAE-13: Payment-Lifecycle and Existing-Data Dependencies

**User Story:** As a data owner, I want delivery and export migrations to depend on verified approval history, so that the system never invents audit facts for existing payments.

#### Acceptance Criteria

1. **SAE-13.1:** BEFORE delivery persistence is authored, THE SYSTEM SHALL verify the exact digest of `PSL-APPROVAL-CORE-v1`, which provides immutable approvals, monotonic versions, current projection, append-only history, pending-only review, and dedicated reopening.
2. **SAE-13.2:** BEFORE applying new constraints or backfills, THE SYSTEM SHALL run the payment specification's redacted non-production inventory for malformed or duplicate references, duplicate/missing receipt objects, illegal state, and untrusted banner data.
3. **SAE-13.3:** WHEN existing reviewed payments lack trustworthy reviewer, approval date, approval version, history, or academic-year evidence, THE SYSTEM SHALL stop automated backfill until an external approved mapping/remediation artifact classifies each row; it SHALL NOT infer approval facts from mutable `updated_at` or academic year from `created_at`.
4. **SAE-13.4:** WHEN delivery policy is planned before cutover, THE SYSTEM MAY record policy intent but SHALL keep the delivery schema inert. The authoritative database-owned cutover marker and automatic enablement SHALL be created only by the same atomic migration transaction that activates the approval-plus-delivery routine.
5. **SAE-13.5:** WHEN a delivery aggregate is created, THE SYSTEM SHALL enforce a composite reference to an existing immutable `(payment_id, approval_version)` approval and the `origin`/`automatic_eligible` invariant; the cutover no-gap query SHALL report zero missing, duplicate, or wrongly eligible aggregates.
6. **SAE-13.6:** WHEN migrations are planned, THE SYSTEM SHALL follow the canonical cross-spec migration manifest and separate inert schema, redacted prechecks, approved remediation/backfill, atomic routine/marker activation, application cutover, and legacy removal into forward-fixable dependency-ordered steps.
7. **SAE-13.7:** WHEN cross-spec work merges, THE SYSTEM SHALL use explicit merge checkpoints after each of the five named milestone artifacts and SHALL reject a milestone whose prerequisite digest, owner, source SHA, or produced paths do not match the shared-file ownership matrix.

## Requirement Traceability

This reverse map is generated from actual requirement citations in `tasks.md`.

| Requirement | Citing task groups |
| --- | --- |
| SAE-1 | 1, 2, 6, 7, 9, 12 |
| SAE-2 | 2, 3, 4, 5, 7, 8, 9, 10, 11 |
| SAE-3 | 1, 3, 9, 11 |
| SAE-4 | 2, 3, 4, 6, 9 |
| SAE-5 | 2, 5, 6, 7, 9, 10, 12 |
| SAE-6 | 1, 4, 5, 6, 7, 9, 10 |
| SAE-7 | 8, 9, 10, 12 |
| SAE-8 | 1, 6, 8, 9, 10, 12 |
| SAE-9 | 8, 9, 10, 12 |
| SAE-10 | 5, 7, 8, 9 |
| SAE-11 | 1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12 |
| SAE-12 | 1, 2, 9, 10, 11, 12 |
| SAE-13 | 1, 4, 5, 6, 7, 10, 12 |

Cross-spec milestones map to PSL task 8.7 and SAE tasks 4.5, 5.9, 6.7, and 7.7. No whole-spec completion claim satisfies those dependencies.
