# Payment Security Lifecycle Requirements

<!-- markdownlint-disable MD024 -->

## Table of Contents

- [Introduction](#introduction)
- [Scope and Authority](#scope-and-authority)
- [Cross-Spec Milestone Contract](#cross-spec-milestone-contract)
- [Fixed Decisions and Open Inputs](#fixed-decisions-and-open-inputs)
- [Glossary](#glossary)
- [Requirements](#requirements)
- [Requirement Traceability](#requirement-traceability)

## Introduction

This Design-First specification defines the database and storage security architecture for GCash payments, receipt access, lifecycle corrections, retention, and event-banner path migration. The architecture is authoritative over implementation order: requirements below are derived from the proposed database invariants and must be enforced at the PostgreSQL or Storage boundary in addition to Server Action validation.

The current academic-year identity is intentionally unresolved. The feature must provide a configurable academic-year model without inventing a label or date range. The five-year payment-metadata and 24-month receipt-retention values are provisional defaults pending Treasurer and data-owner ratification; production deletion must remain disabled until that ratification is recorded.

## Scope and Authority

This specification owns payment creation invariants, core lifecycle transitions and routines, immutable payment evidence, academic-year identity, receipt privacy and cleanup, retention controls, payment routine/RLS hardening, and event-banner semantics. It produces `PSL-APPROVAL-CORE-v1` only after the base review routine, monotonic approval-version routine, immutable approval/history schema, catalog checks, and redacted verification evidence pass. The artifact contains schema/routine signatures, migration ordinals and stems, evidence digest, and source SHA; it does not authorize application approval cutover or create delivery state.

The companion `server-actions-email-exports` specification owns canonical shared diagnostics, the inert delivery schema, the delivery extension of the approval routine, the database-owned delivery cutover marker, final `approvePayment`/`rejectPayment` action and review-UI cutover, mail dispatch/retries, and exports. It consumes `PSL-APPROVAL-CORE-v1` and produces, in order, `SAE-DELIVERY-SCHEMA-v1`, `SAE-ATOMIC-APPROVAL-DELIVERY-v1`, `SAE-DISPATCH-v1`, and `SAE-APPLICATION-CUTOVER-v1`. PSL application work may prepare submission, reopening, receipt, retention, and banner callers, but must not edit the SAE-owned approval/rejection action or delivery UI paths.

The ownership boundary is file/contract based rather than whole-spec serialization: only a named producer artifact and its immutable digest can satisfy a cross-spec dependency. Native ticketing, camera scanners, Luma validation, branding, and selection of the current academic-year values are outside this specification.

## Cross-Spec Milestone Contract

| Artifact | Owner | Produced only after | Authorized consumers |
| --- | --- | --- | --- |
| `PSL-APPROVAL-CORE-v1` | PSL | Base approval/version/history routines and catalog/security evidence | SAE delivery schema and atomic extension |
| `SAE-DELIVERY-SCHEMA-v1` | SAE | Inert delivery tables, constraints, grants, and legacy eligibility precheck | SAE atomic extension |
| `SAE-ATOMIC-APPROVAL-DELIVERY-v1` | SAE | Approval routine extension, cutover marker creation, and enablement activate in one migration transaction | SAE dispatch and PSL hardening/staging |
| `SAE-DISPATCH-v1` | SAE | Post-commit environment routing, scoped recipient, attempt finalization, and tests | SAE action/UI cutover |
| `SAE-APPLICATION-CUTOVER-v1` | SAE | Approval/rejection actions and review UI exclusively use the atomic routine and legacy paths are disabled | PSL staging closure and coordinated release |

A milestone artifact is a versioned, immutable manifest, not a claim that an entire companion specification is complete. Each manifest records source SHA, produced artifact paths, prerequisite artifact digests, targeted verification commands/results, and no sensitive values.

## Fixed Decisions and Open Inputs

| Decision | State |
| --- | --- |
| PHP amount is `1.00` through `100000.00`, inclusive, with at most two decimals | Fixed |
| Reference is exactly 13 ASCII digits and globally unique | Fixed |
| Member creation is pending-only with server-owned fields protected | Fixed |
| Approved/rejected payments reopen to pending only by admin with a trimmed 10–500 character reason | Fixed |
| Every status change and approval occurrence is immutable history | Fixed |
| Reapproval increments the approval version consumed by the mail specification | Fixed |
| Academic-year ID, label, start, end, and activation are explicit configuration | Fixed model |
| Current academic-year label, start date, and end date | Unresolved; must not be guessed |
| Metadata retention is 60 months from payment creation | Provisional default |
| Receipt retention is 24 months after explicit academic-year end | Provisional default |
| Treasurer/data-owner ratification and authorized retention operator | Unresolved; production deletion disabled |
| Event banners migrate from trusted absolute URLs to canonical object keys | Included dependency |

## Glossary

- **Approval version:** A monotonically increasing integer assigned each time one payment enters `approved`; it identifies one immutable approval occurrence.
- **Associated receipt:** A `gcash-receipts` object whose key is referenced by a payment row.
- **Bearer URL:** A signed receipt URL that authorizes possession rather than identity until it expires.
- **Hold:** An active dispute or chapter-audit instruction that suspends otherwise eligible deletion.
- **Object key:** A bucket-relative Storage path; it never includes a bucket name or absolute URL.
- **Reviewed payment:** A payment whose current status is `approved` or `rejected`.

## Requirements

### Requirement PSL-1: Secure Payment Creation

**User Story:** As a student member, I want payment submissions validated at the data boundary, so that my receipt is recorded once without allowing forged review state.

#### Acceptance Criteria

1. **PSL-1.1:** WHEN an authenticated member submits a payment, THE SYSTEM SHALL derive `user_id` from the authenticated identity and reject an insert for any other owner.
2. **PSL-1.2:** WHEN a payment is inserted, THE SYSTEM SHALL require a PHP amount from `1.00` through `100000.00` inclusive with no more than two decimal places.
3. **PSL-1.3:** WHEN a payment is inserted, THE SYSTEM SHALL require `reference_no` to match exactly 13 ASCII numeric digits and be globally unique.
4. **PSL-1.4:** WHEN a payment is inserted, THE SYSTEM SHALL force the initial status to `pending`, force review fields to null, and assign creation and update timestamps at the database boundary.
5. **PSL-1.5:** WHEN a payment is inserted, THE SYSTEM SHALL require one existing, member-owned receipt object whose key matches `<authenticated-user-uuid>/<13-digit-epoch-milliseconds>.webp`.
6. **PSL-1.6:** WHEN a receipt object is already associated with a payment, THE SYSTEM SHALL reject every attempt to associate that object with another payment.
7. **PSL-1.7:** WHEN concurrent submissions use the same reference number or receipt object, THE SYSTEM SHALL commit at most one payment and return a sanitized conflict result for all losing submissions.
8. **PSL-1.8:** WHEN a rejected member submits a new payment with a different valid reference number and receipt, THE SYSTEM SHALL permit the submission without modifying the rejected payment.

### Requirement PSL-2: Controlled Review and Reopening

**User Story:** As a Treasurer, I want every status change constrained and attributable, so that review corrections are deliberate and auditable.

#### Acceptance Criteria

1. **PSL-2.1:** WHEN an admin reviews a `pending` payment, THE SYSTEM SHALL permit exactly one transition to either `approved` or `rejected`.
2. **PSL-2.2:** WHEN any actor attempts a direct transition other than `pending -> approved`, `pending -> rejected`, `approved -> pending`, or `rejected -> pending`, THE SYSTEM SHALL reject the transition at the database boundary.
3. **PSL-2.3:** WHEN a non-admin attempts to update payment status, review notes, reviewer identity, review timestamps, or approval version, THE SYSTEM SHALL reject the update.
4. **PSL-2.4:** WHEN an admin reopens an `approved` or `rejected` payment, THE SYSTEM SHALL require a trimmed reason from 10 through 500 characters and transition it to `pending` through a dedicated operation.
5. **PSL-2.5:** WHEN a reviewed payment is reopened, THE SYSTEM SHALL preserve all previous review and approval records, clear only the current review projection fields defined by the design, and leave the prior approval version unchanged until reapproval.
6. **PSL-2.6:** WHEN a payment enters `approved`, THE SYSTEM SHALL increment its approval version exactly once and create one immutable approval record containing payment ID, approval version, admin actor, and database timestamp.
7. **PSL-2.7:** WHEN a reopened payment is approved again, THE SYSTEM SHALL create a new approval version without altering any earlier approval record and SHALL expose that version through `PSL-APPROVAL-CORE-v1`; delivery aggregate and automatic-attempt cardinality are owned by the SAE specification.
8. **PSL-2.8:** WHEN concurrent or repeated review requests target the same current version, THE SYSTEM SHALL commit at most one transition and report the others as stale without repeating side effects.

### Requirement PSL-3: Immutable Status History

**User Story:** As an auditor, I want immutable payment history, so that I can reconstruct who changed a payment and why.

#### Acceptance Criteria

1. **PSL-3.1:** WHEN a payment is created or changes status, THE SYSTEM SHALL append a history row with the payment ID, from-status, to-status, actor identity or system actor, reason when required, approval version, and database timestamp.
2. **PSL-3.2:** WHEN a client or ordinary admin attempts to update or delete a history row, THE SYSTEM SHALL deny the operation.
3. **PSL-3.3:** WHEN a reopening history row is created, THE SYSTEM SHALL store the validated reason exactly once and associate it with the admin who authorized the correction.
4. **PSL-3.4:** WHEN history is queried by an owner, THE SYSTEM SHALL expose only that owner's payment history; WHEN history is queried by an admin, THE SYSTEM SHALL permit chapter-wide review.
5. **PSL-3.5:** WHEN payment metadata remains within its retention period or under hold, THE SYSTEM SHALL retain the corresponding status and receipt-deletion history.

### Requirement PSL-4: Explicit Academic-Year Identity

**User Story:** As a data owner, I want payments tied to an explicit academic year, so that retention and reporting never infer institutional periods from timestamps.

#### Acceptance Criteria

1. **PSL-4.1:** WHEN an academic year is configured, THE SYSTEM SHALL require a stable ID, unique label, start date, end date, activation state, and `start_date <= end_date`.
2. **PSL-4.2:** WHEN this feature is migrated before the current academic year is approved, THE SYSTEM SHALL create the configurable model without inserting a guessed label, start date, or end date.
3. **PSL-4.3:** WHEN a new payment is submitted, THE SYSTEM SHALL require the explicitly selected active academic-year ID and persist it immutably on the payment.
4. **PSL-4.4:** WHEN existing payments are backfilled, THE SYSTEM SHALL require an approved payment-to-academic-year mapping and fail the not-null migration precheck if any payment remains unmapped.
5. **PSL-4.5:** WHEN a user attempts to infer or overwrite a payment's academic year from `created_at`, THE SYSTEM SHALL reject that behavior.
6. **PSL-4.6:** WHEN academic-year boundaries are edited after payments reference the year, THE SYSTEM SHALL preserve an auditable change record and SHALL NOT silently recompute an already recorded receipt-retention deadline.

### Requirement PSL-5: Private Receipt Storage and Preview

**User Story:** As a member, I want my receipt kept private while still being reviewable by authorized officers, so that financial evidence is not publicly exposed.

#### Acceptance Criteria

1. **PSL-5.1:** WHEN a receipt is uploaded, THE SYSTEM SHALL store it only in the private `gcash-receipts` bucket as WebP with MIME type `image/webp`, size less than 204800 bytes, and the exact owner-key format in PSL-1.5.
2. **PSL-5.2:** WHEN a receipt owner or admin requests an associated receipt preview, THE SYSTEM SHALL authorize the request from the current session and mint a signed URL with a 60-second expiry.
3. **PSL-5.3:** WHEN an anonymous user, a different member, or an unauthorized role requests a receipt preview, THE SYSTEM SHALL deny URL creation without revealing object existence.
4. **PSL-5.4:** WHEN any code handles a receipt object, THE SYSTEM SHALL never derive or return a public URL for that object.
5. **PSL-5.5:** WHEN a signed receipt URL is displayed or documented, THE SYSTEM SHALL state that it is a bearer URL usable by anyone who possesses it until expiry and SHALL avoid logging or persisting the URL.
6. **PSL-5.6:** WHEN an associated receipt is targeted by ordinary member deletion, THE SYSTEM SHALL deny the deletion.
7. **PSL-5.7:** WHEN receipt upload metadata, path, MIME type, size, or ownership is invalid, THE SYSTEM SHALL reject payment association even if client-side compression or validation previously succeeded.

### Requirement PSL-6: Narrow Orphan Cleanup

**User Story:** As an operator, I want failed uploads removed without exposing a general privileged delete capability, so that storage remains bounded without weakening receipt privacy.

#### Acceptance Criteria

1. **PSL-6.1:** WHEN payment submission fails after a receipt upload, THE SYSTEM SHALL offer a server-side cleanup operation limited to the authenticated owner's exact `gcash-receipts` key.
2. **PSL-6.2:** WHEN the cleanup target is associated with any payment, belongs to another owner, has a noncanonical key, or is outside the configured orphan-cleanup age window, THE SYSTEM SHALL refuse deletion.
3. **PSL-6.3:** WHEN cleanup is authorized, THE SYSTEM SHALL delete only the named unassociated object and record a sanitized success, skipped, or failure outcome.
4. **PSL-6.4:** WHEN privileged credentials are used internally for cleanup, THE SYSTEM SHALL keep them server-only and SHALL NOT expose a general bucket/path delete endpoint or client-selectable bucket.
5. **PSL-6.5:** WHEN abandoned uploads outlive the immediate cleanup window, THE SYSTEM SHALL support a preflight-gated reconciliation process that selects only canonical, unassociated receipt objects older than a grace period and reports redacted counts before deletion.

### Requirement PSL-7: Retention, Holds, and Receipt Disposal

**User Story:** As the chapter data owner, I want configurable retention with holds, so that cleanup follows approved policy without destroying disputed evidence.

#### Acceptance Criteria

1. **PSL-7.1:** WHEN retention policy is configured, THE SYSTEM SHALL represent the provisional defaults of five years for payment metadata and 24 months after the explicit academic-year end for receipt objects, including policy version, approval state, and effective date.
2. **PSL-7.2:** WHILE the provisional policy lacks Treasurer and data-owner ratification, THE SYSTEM SHALL report eligible records but SHALL NOT execute production deletion.
3. **PSL-7.3:** WHEN a payment has an active dispute or audit hold, THE SYSTEM SHALL exclude its metadata and receipt from every retention or early-deletion operation.
4. **PSL-7.4:** WHEN a receipt becomes eligible and no hold exists, THE SYSTEM SHALL delete the private object through a privileged server-only process, preserve payment metadata, set an immutable receipt-deletion timestamp, and append deletion history.
5. **PSL-7.5:** WHEN early receipt deletion is requested, THE SYSTEM SHALL require an authorized role, a 10-to-500-character reason, no active hold, and an immutable audit entry.
6. **PSL-7.6:** WHEN payment metadata reaches 60 months after its database-owned creation timestamp, THE SYSTEM SHALL apply only the ratified disposition policy, SHALL preserve the minimum non-PII audit evidence required by that policy, and SHALL perform no production disposition while the exact disposition remains unresolved.
7. **PSL-7.7:** WHEN a cleanup run is retried, THE SYSTEM SHALL be idempotent and report eligible, held, deleted, already-deleted, failed, and remaining counts without PII, receipt content, keys, or signed URLs.

### Requirement PSL-8: Event-Banner Object-Key Migration

**User Story:** As an admin, I want event banners referenced by trusted object keys, so that untrusted absolute URLs cannot enter public event content.

#### Acceptance Criteria

1. **PSL-8.1:** WHEN a new or updated event references a banner, THE SYSTEM SHALL persist only a canonical `event-banners` object key and derive its public URL from trusted Supabase configuration at render time.
2. **PSL-8.2:** WHEN an admin uploads or deletes an event banner, THE SYSTEM SHALL enforce admin authorization, WebP MIME and size limits, and the canonical `<event-id>/<object-uuid>.webp` key.
3. **PSL-8.3:** WHEN an anonymous user or member reads an active event, THE SYSTEM SHALL permit public banner delivery but SHALL deny Storage insert, update, and delete operations.
4. **PSL-8.4:** WHEN existing `banner_url` data uses the exact trusted bucket prefix and references a valid existing object, THE SYSTEM SHALL copy or move the object to the canonical key, verify the destination, and backfill the object key before removing the legacy reference.
5. **PSL-8.5:** WHEN an existing banner URL has an untrusted origin, malformed path, missing object, invalid MIME/size, or ambiguous mapping, THE SYSTEM SHALL quarantine its redacted migration finding and leave the event without a migrated public banner rather than trusting the value.
6. **PSL-8.6:** WHEN all eligible rows are migrated and unresolved rows are quarantined, THE SYSTEM SHALL stop application reads and writes of the legacy absolute-URL column before removing it in a later migration.
7. **PSL-8.7:** WHEN migration or cleanup fails partway, THE SYSTEM SHALL preserve the last verified source object and support idempotent continuation without exposing a broken public URL.
8. **PSL-8.8:** WHEN strict canonical banner writer policies are enabled, THE SYSTEM SHALL first prove verified backfill, externally approved quarantine for every unresolved row, zero destination failures, matching manifest digest, and canonical writer readiness.

### Requirement PSL-9: Authorization and Routine Hardening

**User Story:** As a security reviewer, I want authorization enforced consistently across tables, functions, and Storage, so that direct API calls cannot bypass application controls.

#### Acceptance Criteria

1. **PSL-9.1:** WHILE this feature is active, THE SYSTEM SHALL keep RLS enabled on `profiles`, `events`, and `payments` and SHALL enable RLS on every new payment lifecycle table.
2. **PSL-9.2:** WHEN a security-definer function is created or changed, THE SYSTEM SHALL set a fixed `search_path`, use the least-privileged owner, revoke default public execution, and grant execution only to required roles.
3. **PSL-9.3:** WHEN `protect_profile_role()` runs as `postgres`, `service_role`, or without a user JWT, THE SYSTEM SHALL permit the trusted backend path; otherwise it SHALL continue to prevent member role escalation.
4. **PSL-9.4:** WHEN anonymous callers invoke role-probing or payment lifecycle routines, THE SYSTEM SHALL deny execution unless an explicit reviewed use case requires it.
5. **PSL-9.5:** WHEN owner-member, second-member, admin, and anonymous actors call table, routine, or Storage interfaces directly, THE SYSTEM SHALL allow only the operations explicitly assigned to that actor.

### Requirement PSL-10: Migration Safety, Errors, and Evidence

**User Story:** As a maintainer, I want staged migrations and direct boundary tests, so that hardening can ship without silently corrupting existing data.

#### Acceptance Criteria

1. **PSL-10.1:** BEFORE any fixture, rehearsal, backfill, migration cleanup, profiler, or reconciliation command targets a non-production environment, THE SYSTEM SHALL pass the non-production project preflight and reject missing, unknown, mismatched, or production references. Production retention execution SHALL use the distinct PSL-10.9 contract and SHALL NOT treat this preflight as authorization.
2. **PSL-10.2:** WHEN migration prechecks find invalid amounts, duplicate or malformed references, duplicate receipt associations, illegal statuses, unmapped academic years, or untrusted banner URLs, THE SYSTEM SHALL stop the enforcing migration and emit redacted counts plus remediation categories.
3. **PSL-10.3:** WHEN migrations are planned or applied, THE SYSTEM SHALL publish and follow one canonical manifest containing ordinal, stem, owner, prerequisite artifacts, permitted environment, destructive classification, and recovery strategy; additive schema, prechecks, controlled backfills, constraints/indexes including the payment-profile foreign-key change, transition routines, RLS/Storage policies, banner compatibility policies, and legacy-column removal SHALL remain separately reviewable.
4. **PSL-10.4:** WHEN a post-deployment defect is found after an irreversible data migration, THE SYSTEM SHALL use a forward-fix migration; rollback SHALL be limited to compatible application deployment or additive policy/function reversal that preserves committed history.
5. **PSL-10.5:** WHEN a database, authorization, or Storage operation fails, THE SYSTEM SHALL return a stable sanitized error to the caller and use the SAE-owned canonical diagnostics contract for correlation ID, operation name, actor class, environment, and non-sensitive error category.
6. **PSL-10.6:** WHEN security verification runs, THE SYSTEM SHALL test the anonymous, owner-member, second-member, and admin matrices against non-production Supabase and report a redacted summary that fails on any denied/allowed mismatch.
7. **PSL-10.7:** WHEN lifecycle logic is tested, THE SYSTEM SHALL cover amount/reference boundaries, concurrent uniqueness, all legal and illegal transitions, reason bounds, immutable history, approval versions, receipt authorization, signed-URL TTL configuration and provider expiry separately, orphan cleanup, holds, retention idempotency, and banner quarantine.
8. **PSL-10.8:** WHEN release evidence is recorded, THE SYSTEM SHALL exclude secrets, member PII, full object keys, receipt content, signed URLs, and access tokens.
9. **PSL-10.9:** WHEN production receipt or metadata disposition is requested, THE SYSTEM SHALL require a distinct exact-target two-person Treasurer/data-owner attestation, immutable eligible-set digest, completed dry-run, configured batch limit, assigned operator, and active kill switch that is disabled only for the bounded authorized run. No automated task SHALL approve or execute production deletion; executable checks SHALL only validate the external artifacts and fail closed.

## Requirement Traceability

This table is derived from the acceptance-criterion citations in `tasks.md`; a group appears only when one of its tasks cites that requirement.

| Requirement | Design ownership | Citing task groups |
| --- | --- | --- |
| PSL-1 | Payment projection, submission routine, receipt association | 2, 6, 7, 8, 9, 10, 15, 16, 18 |
| PSL-2 | Review/reopen routines and approval core contract | 2, 7, 8, 9, 15, 16, 18 |
| PSL-3 | Append-only status and approval evidence | 2, 3, 6, 7, 8, 9, 15, 16, 18 |
| PSL-4 | Academic-year model, explicit mapping, deadline snapshot | 2, 6, 7, 8, 15, 16, 17, 18 |
| PSL-5 | Private Storage policy and signed-preview authorization | 8, 10, 16, 17, 18 |
| PSL-6 | Exact-key immediate cleanup and reconciler | 12, 16, 18 |
| PSL-7 | Policy versions, holds, deletion evidence, fail-closed execution | 2, 3, 6, 7, 8, 11, 13, 16, 18 |
| PSL-8 | Banner object-key schema, verified backfill, compatibility, delayed drop | 4, 5, 9, 14, 16, 17, 18 |
| PSL-9 | RLS, routine ownership/grants, direct actor matrix | 1, 2, 4, 8, 9, 10, 14, 16, 17, 18 |
| PSL-10 | Manifest, profiling, abort gates, rehearsal, diagnostics, evidence | 1, 2, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18 |

Detailed acceptance-criterion-to-property mapping is in `design.md`. Cross-spec reverse traceability is milestone based: PSL task 8.7 produces `PSL-APPROVAL-CORE-v1`; SAE alone produces and consumes the four SAE artifacts; PSL staging and closure consume `SAE-APPLICATION-CUTOVER-v1` and selected SAE HTTP evidence.
