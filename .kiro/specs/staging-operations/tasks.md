# Staging Operations Implementation Plan

## Execution Rules

Checkboxes are executable implementation, test, validation, or authorized operational tasks. Each leaf declares execution class and machine-readable artifacts. Provider/human actions are non-checkbox manual gates. Kiro validates supplied attestations and remains blocked when they are missing or invalid. No task writes PFG governance, DHO deployment records, or PED state.

## Manual Gate — not an executable Kiro task

Provider project creation, Auth/Storage/Resend setting changes, preserved-admin designation, schema-bootstrap authorization, seed authorization, controlled-mail authorization, cleanup authorization, browser workflow actions, and workflow reviewer approval occur outside this task list. Browser actions must consume an unexpired `STG-REHEARSAL-START-GATE-v1`. Each approval supplies a scoped attestation bound to operation/operator/approver/commit/private environment/`targetRefHash`/`allowlistVersion`/issue/expiry/change window/recovery owner. Bootstrap additionally supplies migration hashes/range. Executable work remains blocked until the relevant artifact is supplied and validated.

## Executable Tasks

- [ ] 1. Implement cross-spec artifact intake
  - [ ] 1.1 Validate supported `PFG-TARGET-BINDING-v1`, `PFG-NONPROD-GUARD-v1`, `PFG-STAGING-BRANCH-STATE-v1`, `DHO-ROUTE-TARGET-v1`, and current `DHO-ROUTE-LIFECYCLE-v1` schemas, IDs, hashes, commit, target, allowlist version, origin, readiness, lease, and execution eligibility. **Execution class:** `read-only-validation`. **Inputs:** the named versioned artifacts and canonical paths from PFG/DHO. **Outputs:** `STG-ARTIFACT-INTAKE-v1` with consumed IDs/hashes. (STG-REQ-001, STG-REQ-003, STG-REQ-011)
  - [ ] 1.2 Reject production, stale/closed/expired/superseded routes, blocked cloud capacity, unknown versions, and route/binding/lifecycle mismatch before effect-capable construction. **Execution class:** `automated-test`. **Inputs:** versioned artifact fixtures. **Outputs:** `STG-ARTIFACT-INTAKE-NEGATIVE-REPORT-v1`. (STG-REQ-001, STG-REQ-003, STG-REQ-009, STG-REQ-011)
  - [ ] 1.3 Run the PFG conformance harness against STG bootstrap, seed, controlled-mail, and cleanup adapters. **Execution class:** `automated-test`. **Inputs:** PFG harness and STG adapters. **Outputs:** consumer conformance report. (STG-REQ-011)

- [ ] 2. Validate provider prerequisites
  - [ ] 2.1 Implement the prerequisite-matrix validator for PFG binding/capacity, DHO route, Auth origins, schema, private receipt Storage, preserved admin, controlled-mail readiness, Luma HTTPS, and fixture QR isolation. **Execution class:** `implementation`. **Inputs:** provider-state fingerprints and attestations. **Outputs:** prerequisite report. (STG-REQ-003, STG-REQ-012)
  - [ ] 2.2 Read-only verify Site URL, redirect allowlist, callback, Storage privacy/policies, preserved-admin Auth/profile/role, and route origin; do not change settings. **Execution class:** `read-only-validation`. **Inputs:** prerequisite artifacts. **Outputs:** provider-readiness result. (STG-REQ-003, STG-REQ-012)
  - [ ] 2.3 Validate operation authorizations and prove cross-operation/operator/commit/target/allowlist/run/route/lifecycle/schema/config/manifest/expiry use fails. **Execution class:** `automated-test`. **Inputs:** `OPERATION-AUTHORIZATION-v1` fixtures with required scope IDs/hashes. **Outputs:** `STG-AUTHORIZATION-VALIDATION-v1`. (STG-REQ-002, STG-REQ-009)

- [ ] 3. Implement structural plan mode
  - [ ] 3.1 Build `plan` with read-only dependencies only and no manifest writer, mutation/provider/deployment adapter, or mail transport constructor. **Execution class:** `implementation`. **Inputs:** valid upstream artifacts. **Outputs:** redacted plan. (STG-REQ-004)
  - [ ] 3.2 Instrument all excluded adapters and assert construction count and call count zero plus unchanged manifest bytes. **Execution class:** `automated-test`. **Inputs:** plan scenarios. **Outputs:** zero-effect report. (STG-REQ-004)

- [ ] 4. Implement dedicated schema bootstrap
  - [ ] 4.1 Re-read canonical current `DHO-ROUTE-LIFECYCLE-v1`, enumerate/hash the exact ordered migration range, read-only probe schema state, and validate supplied bootstrap authorization after project creation. **Execution class:** `read-only-validation`. **Inputs:** `STG-ARTIFACT-INTAKE-v1`, canonical route/current-lifecycle IDs/hashes, migration files/hashes, and scoped `OPERATION-AUTHORIZATION-v1`. **Outputs:** `.staging/runs/<run-id>/STG-SCHEMA-BOOTSTRAP-PLAN-v1.json` with ID/hash/range. (STG-REQ-002–003, STG-REQ-012)
  - [ ] 4.2 Re-read current `DHO-ROUTE-LIFECYCLE-v1` before every resumable phase, then apply the exact range sequentially through `assertAuthorizedMigrationTarget`; stop on first failure. **Execution class:** `authorized-nonproduction-mutation`. **Inputs:** `STG-SCHEMA-BOOTSTRAP-PLAN-v1`, scoped authorization, `DHO-ROUTE-TARGET-v1`, and current lifecycle ID/hash. **Outputs:** `.staging/runs/<run-id>/STG-SCHEMA-BOOTSTRAP-RESULT-v1.json` with ID/hash. (STG-REQ-003, STG-REQ-009, STG-REQ-012)
  - [ ] 4.3 Re-read canonical current `DHO-ROUTE-LIFECYCLE-v1`, then read-only verify required tables, functions, RLS policies, private bucket, and Storage policies; block seed until all pass. **Execution class:** `read-only-validation`. **Inputs:** `.staging/runs/<run-id>/STG-SCHEMA-BOOTSTRAP-RESULT-v1.json`, `DHO-ROUTE-TARGET-v1`, and canonical current lifecycle artifact. **Outputs:** `.staging/runs/<run-id>/STG-SCHEMA-READY-v1.json` with ID/hash/schema digest. (STG-REQ-003, STG-REQ-012)

- [ ] 5. Implement manifest, seed, and recovery
  - [ ] 5.1 Define/schema-test `.staging/manifests/<run-id>/STG-FIXTURE-MANIFEST-v1.json` with all PFG/DHO route+lifecycle/commit/target/allowlist/schema bindings and prohibited-data checks. **Execution class:** `implementation`. **Inputs:** `STG-ARTIFACT-INTAKE-v1` and `STG-SCHEMA-READY-v1`. **Outputs:** `STG-FIXTURE-MANIFEST-v1` schema with required ID/hash. (STG-REQ-005)
  - [ ] 5.2 Implement atomic execute-only persistence and phase transitions; plan cannot create/write a manifest. **Execution class:** `implementation`. **Inputs:** manifest schema. **Outputs:** phase engine. (STG-REQ-004–005)
  - [ ] 5.3 Execute authorized seed using `assertNonProductionMutationTarget`, re-reading current `DHO-ROUTE-LIFECYCLE-v1` and re-guarding before every phase, then persist immutable IDs/keys. **Execution class:** `authorized-nonproduction-mutation`. **Inputs:** `STG-SCHEMA-READY-v1`, seed authorization scoped to route/lifecycle/run/schema, PFG artifacts, DHO route/current lifecycle. **Outputs:** `.staging/manifests/<run-id>/STG-FIXTURE-MANIFEST-v1.json` with ID/hash. (STG-REQ-002–003, STG-REQ-005)
  - [ ] 5.4 Inject interruption after each phase and prove unique reconciliation/convergence or ambiguity abort without unowned effects. **Execution class:** `automated-test`. **Inputs:** fixture scenarios. **Outputs:** recovery report. (STG-REQ-005, STG-REQ-009)

- [ ] 6. Validate staging workflow rehearsal
  - [ ] 6.1 Immediately before the manual/browser rehearsal, re-read canonical current `DHO-ROUTE-LIFECYCLE-v1` and publish a short-lived start gate bound to route/lifecycle/run/schema and execute mode. **Execution class:** `phase-gate-validation`. **Inputs:** canonical DHO route/current lifecycle, `STG-SCHEMA-READY-v1`, run ID, and scoped rehearsal authorizations. **Outputs:** `.staging/runs/<run-id>/STG-REHEARSAL-START-GATE-v1.json` with ID/hash/expiry. (STG-REQ-002–003, STG-REQ-007)
  - [ ] 6.2 Re-read canonical current `DHO-ROUTE-LIFECYCLE-v1` and validate a supplied `STG-WORKFLOW-OBSERVATION-v1` proving it consumed the unexpired start-gate ID/hash for registration/confirmation, login, two payments, approval/rejection, controlled mail, CSVs, event/Luma, fixture QR, and pre/post preserved-admin results. **Execution class:** `evidence-validation`. **Inputs:** observation with ID/hash, start gate, `DHO-ROUTE-TARGET-v1`, current `DHO-ROUTE-LIFECYCLE-v1`, run ID, and scoped authorizations. **Outputs:** `.staging/runs/<run-id>/STG-REHEARSAL-CASE-RESULT-v1.json` with ID/hash. (STG-REQ-003, STG-REQ-006–007)
  - [ ] 6.3 Prove controlled mail is absent in local/test and forced to server-only `TEST_EMAIL_TO` in separately authorized staging execute. **Execution class:** `automated-test`. **Inputs:** instrumented mail scenarios. **Outputs:** recipient-confinement report. (STG-REQ-006)
  - [ ] 6.4 Reject any mutating evidence labeled plan/dry-run and preserve local/test versus dedicated-staging classification. **Execution class:** `contract-validation`. **Inputs:** rehearsal evidence fixtures. **Outputs:** mode/classification report. (STG-REQ-007, STG-REQ-010)

- [ ] 7. Implement and execute authorized cleanup
  - [ ] 7.1 Implement exact-manifest reconcile, Storage, Auth, database, and final-reconcile phases with pre-phase re-guarding and preserved-admin exclusion. **Execution class:** `implementation`. **Inputs:** manifest schema/PFG guard. **Outputs:** cleanup adapter. (STG-REQ-008–009)
  - [ ] 7.2 Execute cleanup only with valid cleanup authorization scoped to the exact route+lifecycle ID/hash and `STG-FIXTURE-MANIFEST-v1` run/ID/hash. Revalidate current `DHO-ROUTE-LIFECYCLE-v1` before every phase. **Execution class:** `authorized-nonproduction-mutation`. **Inputs:** named manifest, authorization, PFG binding/guard, DHO route/current lifecycle. **Outputs:** `.staging/runs/<run-id>/STG-CLEANUP-RESULT-v1.json` with ID/hash. (STG-REQ-002–003, STG-REQ-008)
  - [ ] 7.3 Test interruption, already-absent skips, provider partial failure, non-manifest preservation, zero remaining fixtures, and admin integrity. **Execution class:** `automated-test`. **Inputs:** cleanup scenarios. **Outputs:** cleanup confinement report. (STG-REQ-008–009)

- [ ] 8. Verify abort, redaction, and invalidation
  - [ ] 8.1 Test every contract, capacity, route, schema, origin, authorization, manifest, admin, recipient, ownership, count, and redaction abort before the next effect. **Execution class:** `automated-test`. **Inputs:** negative matrix. **Outputs:** abort report. (STG-REQ-009)
  - [ ] 8.2 Test commit/target/allowlist/route/schema/provider/credential changes invalidate affected manifest/evidence. **Execution class:** `automated-test`. **Inputs:** transition matrix. **Outputs:** invalidation report. (STG-REQ-009, STG-REQ-011)

- [ ] 9. Publish the DHO Phase B handoff
  - [ ] 9.1 Re-read canonical current `DHO-ROUTE-LIFECYCLE-v1`, then build and schema-validate `STG-WORKFLOW-EVIDENCE-v1` with exact PFG, DHO route/current-lifecycle IDs/hashes/versions, execute classification, schema/manifest hashes, cases, cleanup/admin results, authorization IDs, and redaction result. **Execution class:** `evidence-publication`. **Inputs:** canonical current lifecycle, `STG-ARTIFACT-INTAKE-v1`, `STG-SCHEMA-READY-v1`, `STG-FIXTURE-MANIFEST-v1`, `STG-CLEANUP-RESULT-v1`, `STG-REHEARSAL-CASE-RESULT-v1`, and reviewer attestation. **Outputs:** `docs/audits/phase-3-4/staging/<commit>/<run-id>/STG-WORKFLOW-EVIDENCE-v1.json` with ID/hash. (STG-REQ-003, STG-REQ-010–011)
  - [ ] 9.2 Re-read canonical current lifecycle and reject publication for lifecycle ID/hash drift, invalid reviewer attestation, nonzero fixtures, failed admin/redaction, stale route, or environment misclassification. **Execution class:** `evidence-validation`. **Inputs:** candidate `STG-WORKFLOW-EVIDENCE-v1`, `DHO-ROUTE-TARGET-v1`, and current `DHO-ROUTE-LIFECYCLE-v1`. **Outputs:** `.staging/runs/<run-id>/STG-PUBLICATION-GATE-v1.json` with ID/hash. (STG-REQ-003, STG-REQ-010)

## Coverage Summary

| Requirement | Tasks |
| --- | --- |
| STG-REQ-001–003 | 1–2 |
| STG-REQ-004–005 | 3, 5 |
| STG-REQ-006–007 | 6 |
| STG-REQ-008–009 | 7–8 |
| STG-REQ-010–011 | 1, 6, 9 |
| STG-REQ-012 | 2, 4 |
