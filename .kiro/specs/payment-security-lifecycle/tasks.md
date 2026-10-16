# Payment Security Lifecycle Implementation Plan

## Table of Contents

- [Execution Rules](#execution-rules)
- [Execution Classes](#execution-classes)
- [Manual Gates](#manual-gates)
- [Tasks](#tasks)
- [Completion Gate](#completion-gate)

## Execution Rules

- Execute tasks by their fully qualified dependencies and the canonical migration manifest, not by an ambiguous whole-group or whole-spec cycle.
- Use the next sequential migration prefix after `20260924_event_banners_bucket.sql`; preserve manifest ordinal/stem/owner.
- Non-production preflight applies to fixtures, rehearsal, profiling, backfill, reconciliation, and migration cleanup. It never authorizes production retention.
- Do not guess academic-year data, mapping/remediation, banner quarantine approval, retention ratification/operator, compatibility evidence, or destructive-drop authorization.
- External approvals remain in Manual Gates without checkboxes. Executable tasks validate immutable artifacts and fail closed.
- Preserve immutable history; after irreversible movement use a forward fix.
- Record only redacted evidence; never record member PII, references, full keys, receipt content, signed URLs, tokens, or secrets.
- PSL owns payment core, receipt, retention, and banner semantics. SAE owns canonical diagnostics, delivery extension, final approval/rejection actions/UI, and exports.
- The cross-spec artifact chain is `PSL-APPROVAL-CORE-v1` -> `SAE-DELIVERY-SCHEMA-v1` -> `SAE-ATOMIC-APPROVAL-DELIVERY-v1` -> `SAE-DISPATCH-v1` -> `SAE-APPLICATION-CUTOVER-v1`; consumers verify exact digests at merge checkpoints.

## Execution Classes

| Class | Meaning |
| --- | --- |
| `A` | Artifact authoring only; no environment mutation |
| `V` | Read-only validation/evidence |
| `N` | Non-production mutation after preflight |
| `C` | Coordinated cutover using named milestone artifacts |
| `D` | Destructive production-capable step; never executable without a separate Manual Gate |

Every `N`, `C`, or `D` phase names required and produced artifacts. Production retention approval/execution is intentionally absent from runnable tasks.

## Manual Gates

These are human/external decisions, not executable checkboxes:

- **MG-PSL-AY:** Data owner supplies signed academic-year values and immutable digest.
- **MG-PSL-PAYMENT-MAP:** Treasurer/data owner supplies payment-year mapping and remediation/quarantine manifest with count/hash.
- **MG-PSL-BANNER-QUARANTINE:** Data/Security reviewers approve the banner quarantine manifest digest.
- **MG-PSL-BANNER-COMPAT:** Release owner supplies one successful compatibility-release evidence record with source/build SHA and observation window.
- **MG-PSL-BANNER-DROP:** Data/Security reviewers separately authorize the exact `event_banner_legacy_drop` artifact digest and target.
- **MG-PSL-RETENTION:** Treasurer and data owner provide distinct exact-target attestations, immutable eligible digest, completed dry run, batch limit, operator, and bounded kill-switch authorization.
- **MG-PSL-RELEASE:** Security and Data reviewers approve zero blockers, manifests, recovery, ownership, and redaction.

## Tasks

- [ ] 1. Establish the migration baseline and safety harness
  - [ ] 1.1 Record the applied migration order, schema version, RLS state, routine owners/grants/search paths, bucket settings, and redacted row/object counts before changes.
    - Dependencies: none.
    - Requirements: PSL-9.1, PSL-9.2, PSL-10.2, PSL-10.8.
  - [ ] 1.2 Add a non-production preflight invocation to every planned profiler, backfill, reconciliation, and migration-rehearsal entry point.
    - Dependencies: 1.1.
    - Requirements: PSL-10.1.
  - [ ] 1.3 Consume the SAE-owned canonical error categories, correlation-ID fields, and redacted logging contract; define only PSL domain mappings.
    - Dependencies: 1.1.
    - Requirements: PSL-10.5, PSL-10.8.
  - [ ] 1.4 Capture rollback/forward-fix decision points for each additive, enforcement, policy, application, and legacy-removal phase.
    - Dependencies: 1.1.
    - Requirements: PSL-10.3, PSL-10.4.
  - [ ] 1.5 Publish the canonical migration manifest with ordinal, stem, owner, prerequisite artifact, environment, destructive classification, and recovery; fail validation if either spec diverges.
    - Execution class: `A`.
    - Required artifacts: baseline evidence and both spec designs.
    - Produced artifacts: versioned canonical migration manifest digest.
    - Dependencies: 1.1, 1.4.
    - Requirements: PSL-10.3, PSL-10.4.

- [ ] 2. Add academic-year and payment-lifecycle schema
  - Execution class: `A`, then `N`/authorized production apply per manifest.
  - Required artifacts: task 1.5 manifest and baseline evidence.
  - Produced artifacts: manifest ordinals 01–03 and 06 SQL artifacts plus apply evidence.
  - [ ] 2.1 Create the next `payment_academic_years_additive` migration with `academic_years`, its one-active-year constraint, and append-only academic-year change history; insert no academic-year values.
    - Dependencies: 1.1.
    - Requirements: PSL-4.1, PSL-4.2, PSL-4.6, PSL-9.1.
  - [ ] 2.2 In the same academic-year concern, add nullable `payments.academic_year_id` and an unvalidated foreign key suitable for controlled backfill.
    - Dependencies: 2.1.
    - Requirements: PSL-4.3, PSL-4.4, PSL-10.3.
  - [ ] 2.3 Create the next `payment_lifecycle_additive` migration with reviewer/time projection fields, `approval_version`, `row_version`, receipt-deletion/deadline fields, and compatibility support for renaming `proof_url` to `receipt_object_key`.
    - Dependencies: 2.2.
    - Requirements: PSL-1.4, PSL-2.3, PSL-2.5, PSL-2.6, PSL-4.6, PSL-7.4.
  - [ ] 2.4 Add append-only `payment_status_history`, `payment_approvals`, and restricted `payment_migration_quarantine` tables with supporting foreign keys and indexes.
    - Dependencies: 2.3.
    - Requirements: PSL-2.6, PSL-2.7, PSL-3.1–PSL-3.5, PSL-9.1.
  - [ ] 2.5 Author manifest ordinal 06 `payment_profile_fk_restrict` to replace cascading deletion with retention-safe restricted deletion; apply it only after task 6.6 under task 7.2 validation.
    - Dependencies: 1.5, 2.3.
    - Requirements: PSL-3.5, PSL-7.6, PSL-10.3.

- [ ] 3. Add retention, hold, and deletion-audit schema
  - [ ] 3.1 Create the next `payment_retention_additive` migration with immutable versioned retention policies and a provisional version representing 60 metadata months and 24 receipt months.
    - Dependencies: 2.4.
    - Requirements: PSL-7.1, PSL-7.2.
  - [ ] 3.2 Add `payment_holds` with dedicated placement/release attribution and active-hold indexing.
    - Dependencies: 3.1.
    - Requirements: PSL-7.3, PSL-7.5.
  - [ ] 3.3 Add append-only `receipt_deletion_history`, `retention_runs`, and restricted run-item state for retry-safe reconciliation.
    - Dependencies: 3.1.
    - Requirements: PSL-3.5, PSL-7.4, PSL-7.5, PSL-7.7.
  - [ ] 3.4 Add database checks that keep production deletion disabled unless the policy is ratified, required approval references exist, an operator is assigned, and an explicit enable flag is set.
    - Dependencies: 3.1, 3.3.
    - Requirements: PSL-7.2, PSL-7.6, PSL-7.7.

- [ ] 4. Author the event-banner additive schema and compatibility helpers
  - Execution class: `A`; later apply follows manifest ordinal 11.
  - Required artifacts: task 1.5 manifest and baseline evidence.
  - Produced artifacts: `event_banner_object_keys_additive` SQL and compatibility contract.
  - [ ] 4.1 Author manifest ordinal 11 `event_banner_object_keys_additive` with nullable `events.banner_object_key` and restricted `banner_migration_quarantine`, retaining `banner_url` for compatibility.
    - Dependencies: 1.5, 3.4.
    - Requirements: PSL-8.1, PSL-8.4–PSL-8.7, PSL-9.1.
  - [ ] 4.2 Add canonical key, WebP, and 524288-byte target-contract helpers without enabling strict writer cutover.
    - Dependencies: 4.1.
    - Requirements: PSL-8.1, PSL-8.2.
  - [ ] 4.3 Define the trusted legacy prefix contract as exact HTTPS Supabase origin plus `/storage/v1/object/public/event-banners/`, rejecting credentials, lookalike origins, malformed encoding, and ambiguous paths.
    - Dependencies: 4.1.
    - Requirements: PSL-8.4, PSL-8.5.

- [ ] 5. Build read-only existing-data profilers and prechecks
  - [ ] 5.1 Implement a payment profiler that emits redacted counts for amount, scale, reference format/duplicates, status/projection, receipt format/duplicates/ownership/existence/MIME/size, and academic-year mapping categories.
    - Dependencies: 1.2, 2.4, 3.3.
    - Requirements: PSL-10.1, PSL-10.2, PSL-10.8.
  - [ ] 5.2 Implement a banner profiler that classifies every nonnull legacy URL as trusted candidate, untrusted origin, malformed path, missing object, wrong MIME, oversized object, or ambiguous mapping without emitting the URL.
    - Dependencies: 1.2, 4.3.
    - Requirements: PSL-8.4, PSL-8.5, PSL-10.2, PSL-10.8.
  - [ ] 5.3 Generate deterministic count/hash manifests and fail if source counts drift between profile, approved remediation, and enforcing migration.
    - Dependencies: 5.1, 5.2.
    - Requirements: PSL-10.2–PSL-10.4.
  - [ ] 5.4 Encode zero blocker thresholds for unmapped/invalid/duplicate operational payments and zero unverified banner destinations or unclassified legacy banner rows.
    - Dependencies: 5.3.
    - Requirements: PSL-10.2, PSL-10.3.

- [ ] 6. Validate external inputs and perform controlled backfill or quarantine
  - Execution class: `V`, then `N` for rehearsal/staging; production apply requires separately reviewed deployment authorization.
  - Required artifacts: `MG-PSL-AY`, `MG-PSL-PAYMENT-MAP`, profiler manifest, and task 1.5 manifest.
  - Produced artifacts: validated input digest, ordinal-04 SQL, redacted backfill/quarantine evidence.
  - [ ] 6.1 Validate the supplied `MG-PSL-AY` artifact for distinct approver identity, label/start/end/activation values, immutable digest, and target; fail closed if absent or inferred.
    - Dependencies: 2.1.
    - Requirements: PSL-4.1–PSL-4.3.
  - [ ] 6.2 Validate `MG-PSL-PAYMENT-MAP` covers every existing operational payment with an approved payment-ID-to-academic-year-ID mapping.
    - Dependencies: 5.1, 6.1.
    - Requirements: PSL-4.4, PSL-4.5.
  - [ ] 6.3 Validate the same gate's remediation/restricted-quarantine manifest classifies every invalid legacy payment, matches profiler count/hash, and never rounds amounts, fabricates references, reassigns receipts, or infers years.
    - Dependencies: 5.1, 5.3, 6.2.
    - Requirements: PSL-1.2, PSL-1.3, PSL-1.6, PSL-4.4, PSL-10.2.
  - [ ] 6.4 Author and rehearse manifest ordinal 04 `payment_existing_data_backfill` using only validated mappings/remediations; transactionally verify quarantine copies and bootstrap history without invented actors or approvals.
    - Dependencies: 6.2, 6.3.
    - Requirements: PSL-3.1, PSL-4.4–PSL-4.6, PSL-10.2–PSL-10.4.
  - [ ] 6.5 Snapshot each payment's receipt-retention deadline from its explicit academic-year end and provisional policy version without changing it on later year edits.
    - Dependencies: 3.1, 6.4.
    - Requirements: PSL-4.6, PSL-7.1, PSL-7.4.
  - [ ] 6.6 Run the zero-blocker precheck and stop if any category or manifest count/hash differs from its approval.
    - Dependencies: 5.4, 6.4, 6.5.
    - Requirements: PSL-10.2, PSL-10.3.

- [ ] 7. Enforce payment constraints and retention-safe foreign keys
  - Execution class: `N` for rehearsal/staging and coordinated apply per manifest.
  - Required artifacts: ordinal-04 evidence, zero-blocker digest, ordinal-05 and ordinal-06 SQL.
  - Produced artifacts: constraint/FK validation and apply evidence.
  - [ ] 7.1 Create the next `payment_constraints` migration enforcing amount bounds, exact ASCII reference format, global reference uniqueness, unique receipt association, projection consistency, and immutable academic-year presence.
    - Dependencies: 6.6.
    - Requirements: PSL-1.2–PSL-1.7, PSL-2.3, PSL-4.3–PSL-4.5.
  - [ ] 7.2 Apply and validate manifest ordinals 05–06, including all previously unvalidated checks and `payment_profile_fk_restrict`; abort if any operational row is invalid/unmapped or cascade behavior remains.
    - Dependencies: 2.5, 7.1.
    - Requirements: PSL-4.4, PSL-10.2, PSL-10.3.
  - [ ] 7.3 Add a projection guard that canonicalizes timestamps and rejects direct writes to owner, academic year, status, reviewer, review time, approval version, row version, and deletion fields outside reviewed routines/migrations.
    - Dependencies: 7.1.
    - Requirements: PSL-1.1, PSL-1.4, PSL-2.2, PSL-2.3, PSL-4.5, PSL-7.4.
  - [ ] 7.4 Make status, approval, academic-year, and receipt-deletion history append-only for all ordinary authenticated and admin access.
    - Dependencies: 7.1.
    - Requirements: PSL-3.2, PSL-3.5, PSL-4.6, PSL-7.4, PSL-7.5.

- [ ] 8. Implement and publish the PSL lifecycle core
  - Execution class: `A`/`N` and milestone publication `V`.
  - Required artifacts: validated ordinals 05–07 and direct core test evidence.
  - Produced artifacts: `PSL-APPROVAL-CORE-v1`.
  - [ ] 8.1 Create a fixed-search-path `submit_payment` routine that derives `auth.uid()`, validates amount text before coercion, requires an explicitly active year, validates the exact receipt object, and atomically writes pending projection plus creation history.
    - Dependencies: 7.3.
    - Requirements: PSL-1.1–PSL-1.8, PSL-4.3, PSL-5.7.
  - [ ] 8.2 Create a fixed-search-path `review_payment` routine that locks by payment/expected row version and performs exactly one pending-to-approved or pending-to-rejected transition with history.
    - Dependencies: 8.1.
    - Requirements: PSL-2.1–PSL-2.3, PSL-2.6, PSL-2.8, PSL-3.1.
  - [ ] 8.3 Make approval atomically increment the version, insert one immutable `(payment_id, approval_version)` row, and return the version and database approval time.
    - Dependencies: 8.2.
    - Requirements: PSL-2.6–PSL-2.8, PSL-3.1.
  - [ ] 8.4 Create a fixed-search-path `reopen_payment` routine requiring admin authorization, expected row version, reviewed state, and a trimmed 10–500 character reason.
    - Dependencies: 8.2.
    - Requirements: PSL-2.2–PSL-2.5, PSL-2.8, PSL-3.1, PSL-3.3.
  - [ ] 8.5 Create dedicated academic-year configuration/change routines that append reasoned history and never recompute existing payment deadlines.
    - Dependencies: 7.4.
    - Requirements: PSL-4.1, PSL-4.2, PSL-4.6.
  - [ ] 8.6 Create dedicated hold placement/release routines with authorized actor checks and trimmed 10–500 character reasons.
    - Dependencies: 3.2, 7.4.
    - Requirements: PSL-7.3, PSL-7.5, PSL-9.2.
  - [ ] 8.7 Publish `PSL-APPROVAL-CORE-v1` only after schema/routine signature, catalog, concurrency, immutable-history, and redaction checks pass; include source SHA, manifest ordinals/stems, produced paths, and evidence digest, but no delivery or application-cutover claim.
    - Dependencies: 8.1–8.6, 16.2.
    - Requirements: PSL-2.1–PSL-2.8, PSL-3.1–PSL-3.5, PSL-9.2, PSL-10.8.

- [ ] 9. Harden payment RLS/routine grants and prepare banner policies
  - Execution class: `C` for payment hardening; banner policy authoring remains `A` until verified backfill.
  - Required artifacts: `PSL-APPROVAL-CORE-v1`, `SAE-ATOMIC-APPROVAL-DELIVERY-v1`, and policy test evidence.
  - Produced artifacts: ordinal-10 apply evidence and inert ordinal-12 banner policy artifact.
  - [ ] 9.1 Apply manifest ordinal 10 `payment_rls_storage_hardening`, removing direct authenticated payment insert/update policies and granting only required routines without replacing the SAE-owned approval extension.
    - Dependencies: 8.7, `SAE-ATOMIC-APPROVAL-DELIVERY-v1`.
    - Requirements: PSL-1.1, PSL-1.4, PSL-2.3, PSL-9.1, PSL-9.5.
  - [ ] 9.2 Enable and verify owner/admin read RLS plus append-only write denial on every new lifecycle table.
    - Dependencies: 9.1.
    - Requirements: PSL-3.2, PSL-3.4, PSL-9.1, PSL-9.5.
  - [ ] 9.3 Revoke `PUBLIC` and anonymous routine execution, assign least-privileged no-login owners, set fixed search paths, and grant only required roles.
    - Dependencies: 9.1.
    - Requirements: PSL-9.2, PSL-9.4, PSL-9.5.
  - [ ] 9.4 Harden `is_admin` against anonymous arbitrary-user probing and add the trusted `postgres`/`service_role`/no-JWT bypass to `protect_profile_role()`.
    - Dependencies: 9.3.
    - Requirements: PSL-9.3, PSL-9.4.
  - [ ] 9.5 Author public-read/admin-write banner Storage policy checks and manifest ordinal 12 SQL without enabling strict writer policy; activation is task 14.5 after verified backfill.
    - Dependencies: 4.2, 9.3, 1.5.
    - Requirements: PSL-8.2, PSL-8.3, PSL-8.8, PSL-9.5, PSL-10.3.

- [ ] 10. Enforce receipt upload, association, and signed-preview contracts
  - [ ] 10.1 Replace receipt Storage policies with exact two-segment owner keys, `[0-9]{13}.webp` filenames, `image/webp`, and size `< 204800`, with no member update/delete grant.
    - Dependencies: 9.3.
    - Requirements: PSL-1.5, PSL-5.1, PSL-5.6, PSL-5.7.
  - [ ] 10.2 Restrict owner/admin receipt reads to associated, nondeleted payments and deny all other direct actor combinations.
    - Dependencies: 10.1.
    - Requirements: PSL-5.2, PSL-5.3, PSL-5.6, PSL-9.5.
  - [ ] 10.3 Implement the Server Action preview flow by payment ID, using `getCurrentUser()` and exactly `createSignedUrl(key, 60)` after owner/admin association authorization.
    - Dependencies: 10.2.
    - Requirements: PSL-5.2–PSL-5.4.
  - [ ] 10.4 Keep signed URLs ephemeral, remove URL logging/persistence, and display the bearer-until-expiry warning in owner/admin preview UI.
    - Dependencies: 10.3.
    - Requirements: PSL-5.5.
  - [ ] 10.5 Retain client WebP compression as a quota optimization and add a post-compression byte/MIME check without treating it as authoritative enforcement.
    - Dependencies: 10.1.
    - Requirements: PSL-5.1, PSL-5.7.

- [ ] 11. Implement hold and receipt-deletion application boundaries
  - [ ] 11.1 Add admin Server Actions for hold placement/release that call `getCurrentUser()`, accept no actor/role override, and use canonical responses.
    - Dependencies: 8.6, 9.2.
    - Requirements: PSL-7.3, PSL-7.5, PSL-10.5.
  - [ ] 11.2 Implement one internal receipt-disposal operation that locks the payment, rechecks policy/deadline/hold/deletion state, targets only its stored private key, and appends deletion history after confirmed absence.
    - Dependencies: 3.3, 8.6, 10.2.
    - Requirements: PSL-7.3–PSL-7.5, PSL-7.7.
  - [ ] 11.3 Implement early deletion as a distinct operator-only call requiring configured authorization and a trimmed 10–500 character reason; leave it disabled while operator/ratification inputs are unresolved.
    - Dependencies: 11.2.
    - Requirements: PSL-7.2, PSL-7.3, PSL-7.5.

- [ ] 12. Implement narrow orphan cleanup and reconciliation
  - [ ] 12.1 Add `cleanupFailedReceipt(receiptKey)` with session-derived owner, fixed `gcash-receipts` bucket, exact single key, canonical metadata, unassociated state, and default 15-minute immediate window checks.
    - Dependencies: 10.1.
    - Requirements: PSL-6.1–PSL-6.4.
  - [ ] 12.2 Ensure the immediate cleanup interface accepts no bucket, prefix, wildcard, owner, list, or multiple-key input and returns only `deleted`, `skipped`, or sanitized `failed`.
    - Dependencies: 12.1.
    - Requirements: PSL-6.2–PSL-6.4, PSL-10.5.
  - [ ] 12.3 Add a preflight-gated, dry-run-default orphan reconciler that uses a 24-hour grace period and reports canonical/unassociated eligibility counts before exact-key deletion.
    - Dependencies: 1.2, 12.2.
    - Requirements: PSL-6.5, PSL-10.1, PSL-10.8.
  - [ ] 12.4 Require exact target confirmation and separately authorized execute mode, then reconcile and report deleted/skipped/failed/remaining counts without PII or keys.
    - Dependencies: 12.3.
    - Requirements: PSL-6.3–PSL-6.5, PSL-10.8.

- [ ] 13. Implement provisional retention reporting and fail-closed validators
  - Execution class: `A`/`V`; no task in this group authorizes or executes production deletion.
  - Required artifacts: provisional policy schema; `MG-PSL-RETENTION` only when validating a future production request.
  - Produced artifacts: dry-run report, immutable digest, validator and kill-switch test evidence.
  - [ ] 13.1 Build a dry-run eligibility report for metadata, receipts, holds, already-deleted objects, and unresolved policy state using configured bounded batches and redacted counts.
    - Dependencies: 3.4, 11.2.
    - Requirements: PSL-7.1–PSL-7.4, PSL-7.7, PSL-10.9.
  - [ ] 13.2 Implement retry-safe receipt execution mechanics by run ID for non-production rehearsal only, with object/database reconciliation and no cross-service atomicity claim.
    - Dependencies: 13.1, 1.2.
    - Requirements: PSL-7.4, PSL-7.7, PSL-10.1.
  - [ ] 13.3 Implement a read-only production authorization validator that fails unless `MG-PSL-RETENTION` contains two distinct attestations, exact target/environment, unchanged eligible digest, completed dry run, batch limit, assigned operator, and bounded kill-switch authorization; the task SHALL NOT disable the switch or delete data.
    - Dependencies: 13.1.
    - Requirements: PSL-7.2, PSL-7.3, PSL-7.6, PSL-7.7, PSL-10.9.
  - [ ] 13.4 Leave metadata disposition unimplemented/fail-closed until the ratified delete/anonymize/minimum-audit contract is supplied; permit reports only.
    - Dependencies: 13.1.
    - Requirements: PSL-7.2, PSL-7.6, PSL-10.9.

- [ ] 14. Backfill, cut over, and separately retire event-banner legacy access
  - Execution class: `A`/`N`/`C` through 14.8; task 14.9 is `D` and cannot run without its Manual Gate.
  - Required artifacts: ordinal-11 apply evidence, profiler/quarantine digests, ordinal-12/13 SQL, compatibility evidence, separate drop authorization.
  - Produced artifacts: verified backfill, policy cutover, application legacy-removal evidence, compatibility validator result, legacy-drop apply evidence.
  - [ ] 14.1 Run the preflight-gated Storage-API backfill that parses exact trusted URLs, copies to deterministic `<event-id>/<object-uuid>.webp`, and verifies destination metadata/content before database update.
    - Dependencies: 4.3, 5.2, 9.5.
    - Requirements: PSL-8.2, PSL-8.4, PSL-8.7, PSL-10.1.
  - [ ] 14.2 Append redacted quarantine findings, validate `MG-PSL-BANNER-QUARANTINE` against the exact count/hash, and prevent approved-quarantined legacy values from rendering.
    - Dependencies: 14.1.
    - Requirements: PSL-8.5, PSL-10.2, PSL-10.8.
  - [ ] 14.3 Reconcile every legacy nonnull row to exactly `verified_migrated` or `approved_quarantined`, with zero destination-verification failures and matching manifest digest.
    - Dependencies: 14.2.
    - Requirements: PSL-8.4–PSL-8.7, PSL-10.2.
  - [ ] 14.4 Update PSL-owned event writers/deleters/readers for canonical keys and temporary validated fallback; do not enable strict policy until task 14.3 is verified.
    - Dependencies: 14.3.
    - Requirements: PSL-8.1–PSL-8.3, PSL-8.6, PSL-8.7.
  - [ ] 14.5 Author manifest ordinal 12 `event_banner_constraints_and_policies` and ordinal 13 `event_banner_legacy_drop`, record immutable digests, and include both in non-production rehearsal before any real deployment; do not apply either artifact in this task.
    - Execution class: `A`.
    - Dependencies: 9.5, 14.3, 14.4.
    - Requirements: PSL-8.1–PSL-8.8, PSL-10.3, PSL-10.4.
  - [ ] 14.6 Apply ordinal 12 strict writer policy only after tasks 14.3–14.5 and 16.8 prove verified backfill, zero unclassified rows, and canonical writer readiness; never apply ordinal 13 here.
    - Execution class: `C`.
    - Dependencies: 14.3, 14.4, 14.5, 16.8, 17.3.
    - Requirements: PSL-8.1–PSL-8.3, PSL-8.6, PSL-8.8, PSL-9.5, PSL-10.3.
  - [ ] 14.7 Remove all application reads/writes of `banner_url` after ordinal 12 is active and prove canonical-only behavior; retain the database column and ordinal-13 artifact.
    - Dependencies: 14.6, 17.4.
    - Requirements: PSL-8.6, PSL-8.7, PSL-10.3.
  - [ ] 14.8 Validate `MG-PSL-BANNER-COMPAT` against task 14.7 source/build SHA, observation window, zero fallback use, and ordinal-13 digest; fail closed without changing schema.
    - Execution class: `V`.
    - Dependencies: 14.7, 17.5.
    - Requirements: PSL-8.6, PSL-10.2–PSL-10.4.
  - [ ] 14.9 Apply the already-authored/rehearsed ordinal-13 legacy drop only when `MG-PSL-BANNER-DROP` separately authorizes the exact target and digest; record apply/forward-fix evidence.
    - Execution class: `D`.
    - Dependencies: 14.8, `MG-PSL-BANNER-DROP`.
    - Requirements: PSL-8.6, PSL-8.7, PSL-10.3, PSL-10.4.

- [ ] 15. Prepare PSL-owned application boundaries and consume SAE cutover
  - Execution class: `A`/`V`; final approval/rejection action and review-UI mutation is SAE-owned.
  - Required artifacts: PSL routines, SAE canonical diagnostics contract, and `SAE-APPLICATION-CUTOVER-v1` for final readiness.
  - Produced artifacts: PSL application-readiness manifest.
  - [ ] 15.1 Update payment submission to accept amount/reference strings, explicit active academic-year ID, and receipt key only; call `getCurrentUser()` and the dedicated submission routine.
    - Dependencies: 8.1, 9.1, 10.1.
    - Requirements: PSL-1.1–PSL-1.8, PSL-4.3, PSL-10.5.
  - [ ] 15.2 Publish the review contract consumed by SAE—expected row version, immutable approval result, stale/conflict mapping, rejection semantics, and revalidation paths—without editing SAE-owned approval/rejection actions or delivery UI.
    - Dependencies: 8.2, 8.3, 8.7.
    - Requirements: PSL-2.1–PSL-2.3, PSL-2.6, PSL-2.8, PSL-10.5.
  - [ ] 15.3 Add the PSL-owned admin reopen action/dialog with reviewed-state checks and trimmed 10–500 character reason validation.
    - Dependencies: 8.4, 9.1.
    - Requirements: PSL-2.2–PSL-2.5, PSL-3.3.
  - [ ] 15.4 Expose owner/admin immutable history without mutation and show approval versions distinctly after reopen/reapproval; consume SAE delivery projection without owning it.
    - Dependencies: 9.2, 15.2, 15.3.
    - Requirements: PSL-2.5–PSL-2.7, PSL-3.1–PSL-3.5.
  - [ ] 15.5 Validate `SAE-APPLICATION-CUTOVER-v1` owner, source SHA, prerequisite digests, produced paths, and targeted evidence; prove no PSL-owned file competes for final approval/rejection action or delivery extension.
    - Dependencies: `SAE-APPLICATION-CUTOVER-v1`, 15.1, 15.3, 15.4.
    - Requirements: PSL-2.6–PSL-2.8, PSL-10.3, PSL-10.8.
  - [ ] 15.6 Publish PSL application readiness for submission, reopen, receipt, retention, and banner surfaces after all callers use canonical routines/responses; exclude final approve/reject cutover from PSL ownership.
    - Dependencies: 15.1–15.5.
    - Requirements: PSL-1.4, PSL-2.2, PSL-2.3, PSL-10.5.

- [ ] 16. Add automated correctness and boundary verification
  - [ ] 16.1 Add amount/reference property tests covering bounds, decimal representation, Unicode digits, whitespace, malformed values, and concurrent uniqueness.
    - Dependencies: 8.1.
    - Requirements: PSL-1.2, PSL-1.3, PSL-1.7, PSL-10.7.
  - [ ] 16.2 Add transition-matrix, reason-boundary, row-version race, history immutability, and approval-version/reapproval tests.
    - Dependencies: 8.2–8.4.
    - Requirements: PSL-2.1–PSL-2.8, PSL-3.1–PSL-3.5, PSL-10.7.
  - [ ] 16.3 Add academic-year tests for invalid ranges, activation, absent configuration, explicit mapping, immutable assignment, audited edits, and stable deadlines.
    - Dependencies: 8.5.
    - Requirements: PSL-4.1–PSL-4.6, PSL-10.7.
  - [ ] 16.4 Add a pure unit test proving the signed-preview adapter calls `createSignedUrl(key, 60)` exactly and never logs/returns the URL outside the action result.
    - Dependencies: 10.3, 10.4.
    - Requirements: PSL-5.2, PSL-5.4, PSL-5.5, PSL-10.7.
  - [ ] 16.5 Add a direct mint actor matrix for anonymous, owner, second member, and admin; assert owner/admin mint and non-enumerating denial for others without provider-expiry waiting.
    - Dependencies: 10.1–10.4, 16.4.
    - Requirements: PSL-5.1–PSL-5.7, PSL-9.5, PSL-10.6, PSL-10.7.
  - [ ] 16.6 Run one serial provider expiry test that emits no URL: prove bearer fetch before expiry, begin expiry checks no earlier than 60 seconds, and require denial by 90 seconds; fail on timeout.
    - Dependencies: 16.5.
    - Requirements: PSL-5.2, PSL-5.5, PSL-10.7, PSL-10.8.
  - [ ] 16.7 Add orphan and retention tests for exact-key scope, age windows, associated/foreign refusal, holds, two-person/digest/batch/operator/kill-switch validation, early-reason bounds, partial failure, and retry convergence without executing production deletion.
    - Dependencies: 12.4, 13.4.
    - Requirements: PSL-6.1–PSL-7.7, PSL-10.7, PSL-10.9.
  - [ ] 16.8 Add banner actor-matrix and failure-injection tests for exact parsing, quarantine, copy/verify/update order, idempotence, public reads, and strict writer activation only after verified backfill.
    - Dependencies: 14.3, 14.4.
    - Requirements: PSL-8.1–PSL-8.8, PSL-10.7.
  - [ ] 16.9 Add catalog assertions for RLS, routine ownership/search paths/grants, anonymous denial, trusted profile-role bypass, and SAE extension preservation.
    - Dependencies: 9.4.
    - Requirements: PSL-9.1–PSL-9.5, PSL-10.6.
  - [ ] 16.10 Seed secret/PII/key/URL canaries and fail if any response, log, profiler, cleanup summary, milestone, or evidence file contains them.
    - Dependencies: 1.3, 16.1–16.9.
    - Requirements: PSL-10.5, PSL-10.8.

- [ ] 17. Rehearse migrations and execute the staged cutover
  - Execution class: `N` rehearsal, then `C` staging.
  - Required artifacts: all ordinal 01–13 SQL artifacts, `PSL-APPROVAL-CORE-v1`, `SAE-APPLICATION-CUTOVER-v1`, PSL application readiness, and test evidence.
  - Produced artifacts: rehearsal digest, staging apply evidence, rollback/forward-fix evidence.
  - [ ] 17.1 Rehearse every manifest artifact—including ordinal 12 policy and ordinal 13 legacy drop—plus profiling, approved backfill/quarantine, routines, RLS/Storage, and compatibility paths on isolated non-production infrastructure before real deployment.
    - Dependencies: 14.5, 15.6, 16.1–16.10.
    - Requirements: PSL-10.1–PSL-10.4, PSL-10.6, PSL-10.7.
  - [ ] 17.2 Record runtime, locks, count/hash manifests, abort behavior, reruns, artifact digests, compatibility checkpoints, and recovery without sensitive values.
    - Dependencies: 17.1.
    - Requirements: PSL-10.2–PSL-10.4, PSL-10.8.
  - [ ] 17.3 Apply payment staging changes only after zero blockers, PSL application readiness from 15.6, and verified `SAE-APPLICATION-CUTOVER-v1`; do not deploy a competing PSL approval action or routine extension.
    - Dependencies: 6.6, 8.7, 15.6, 17.2, `SAE-APPLICATION-CUTOVER-v1`.
    - Requirements: PSL-4.4, PSL-9.5, PSL-10.2, PSL-10.3.
  - [ ] 17.4 Record payment hardening and banner additive/backfill/ordinal-12 policy cutover in staging, rerun the direct actor matrix, and preserve legacy column/source banners through compatibility.
    - Dependencies: 9.1–9.5, 14.6, 17.3.
    - Requirements: PSL-5.1–PSL-5.7, PSL-8.1–PSL-8.8, PSL-9.5, PSL-10.6.
  - [ ] 17.5 Demonstrate compatible application rollback before irreversible removal and forward-fix recovery after immutable movement; produce compatibility-observation inputs for `MG-PSL-BANNER-COMPAT`.
    - Dependencies: 17.4.
    - Requirements: PSL-10.3, PSL-10.4.

- [ ] 18. Close evidence and coordinated release validation
  - [ ] 18.1 Run strict lint, lifecycle tests, non-production Supabase boundaries, migration rehearsal, and production build at the recorded commit.
    - Dependencies: 17.5.
    - Requirements: PSL-10.6, PSL-10.7.
  - [ ] 18.2 Record redacted expected/actual outcomes for all PSL requirements, canonical manifest ordinals, milestone digests, and actor matrices.
    - Dependencies: 18.1.
    - Requirements: PSL-1.1–PSL-1.8; PSL-2.1–PSL-2.8; PSL-3.1–PSL-3.5; PSL-4.1–PSL-4.6; PSL-5.1–PSL-5.7; PSL-6.1–PSL-6.5; PSL-7.1–PSL-7.7; PSL-8.1–PSL-8.8; PSL-9.1–PSL-9.5; PSL-10.1–PSL-10.9.
  - [ ] 18.3 Prove production retention and early deletion remain disabled; if `MG-PSL-RETENTION` is supplied, validate its two-person/exact-target/digest/dry-run/batch/operator/kill-switch fields without executing deletion.
    - Dependencies: 13.3, 18.2.
    - Requirements: PSL-7.1–PSL-7.7, PSL-10.9.
  - [ ] 18.4 Validate `MG-PSL-RELEASE` and publish PSL closure as provisional unless `SAE-APPLICATION-CUTOVER-v1` and the selected SAE HTTP evidence both match the recorded source/build SHA and report zero failures.
    - Dependencies: 15.5, 18.2, 18.3, `MG-PSL-RELEASE`, `SAE-APPLICATION-CUTOVER-v1`, SAE task 12.8 evidence.
    - Requirements: PSL-9.1–PSL-10.9.

## Completion Gate

PSL implementation is complete when all executable PSL tasks except separately gated task 14.9 have passed, direct boundaries have zero mismatches, blockers are zero, banner rows are migrated or externally approved-quarantined, and evidence is redacted. Task 14.9 remains blocked until `MG-PSL-BANNER-COMPAT` and `MG-PSL-BANNER-DROP` exist and match; earlier quarantine validation separately requires `MG-PSL-BANNER-QUARANTINE`. Production retention approval/execution is not a checkbox and is not required for PSL application release; the kill switch remains active. Release closure remains provisional until the exact `SAE-APPLICATION-CUTOVER-v1` and selected SAE HTTP evidence are verified.
