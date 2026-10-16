# Deployment Handover Implementation Plan

## Execution Rules

DHO has executable Phase A and Phase B validators separated by STG's handoff. Each checkbox declares execution class and machine-readable inputs/outputs. Human/provider actions are non-checkbox manual gates. Kiro validates supplied records/attestations and remains blocked when absent; it never starts a foreground server or performs PED-owned DNS work.

## Manual Gate — not an executable Kiro task

Candidate approval, provider project/config/Auth changes, migration apply authorization/action, deployment/redeployment authorization/action, recovery choice, preview retention, and Security/Data/Quality/Operational/Infrastructure/launch decisions occur outside this task list under named DHO owners. Their attestations include operation/operator/approver/commit/private environment/`targetRefHash`/`allowlistVersion`/issue/expiry/change window/recovery owner. Migration attestation includes exact ordered hashes/range. Deployment records are DHO-owned inputs to executable validation.

## Executable Tasks

- [ ] 1. Define DHO ownership and prerequisite contracts
  - [ ] 1.1 Define/schema-test candidate, `DHO-DEPLOYMENT-RECORD-v1`, redeployment-request/result, lifecycle, handover, and prerequisite-matrix records; enforce DHO as sole deployment writer. **Execution class:** `contract-publication`. **Inputs:** PFG contracts and DHO requirements. **Outputs:** `docs/contracts/dho/DHO-DEPLOYMENT-RECORD-v1.schema.json` plus DHO record schemas requiring version/ID/hash. (DHO-REQ-002, DHO-REQ-006–007, DHO-REQ-012)
  - [ ] 1.2 Implement read-only validation of PFG binding/budget, provider target, Auth origins, migration/deployment attestations, HTTPS/readiness, and PED request inputs. **Execution class:** `read-only-validation`. **Inputs:** prerequisite artifacts. **Outputs:** prerequisite report. (DHO-REQ-002–004, DHO-REQ-012)

- [ ] 2. Publish the route-target contract and lifecycle
  - [ ] 2.1 Define/schema-test `DHO-ROUTE-TARGET-v1` and `DHO-ROUTE-LIFECYCLE-v1` for local/test/staging/production, required identity/deployment/readiness/lease fields, current state, execution eligibility, and supersession. **Execution class:** `contract-publication`. **Inputs:** DHO record schemas. **Outputs:** `docs/contracts/dho/DHO-ROUTE-TARGET-v1.schema.json` and `docs/contracts/dho/DHO-ROUTE-LIFECYCLE-v1.schema.json` plus fixtures with IDs/hashes. (DHO-REQ-001, DHO-REQ-010)
  - [ ] 2.2 Implement immutable preview metadata, bounded lease/expiry/retain/teardown, production supersession, and stale-target validators. **Execution class:** `implementation`. **Inputs:** route lifecycle fixtures. **Outputs:** lifecycle validator. (DHO-REQ-001, DHO-REQ-008, DHO-REQ-012)
  - [ ] 2.3 Reject fixture execution for production and reject read-only-smoke artifacts that expose mutation/mail capability. **Execution class:** `automated-test`. **Inputs:** route policy matrix. **Outputs:** execution-class report. (DHO-REQ-001, DHO-REQ-005)

- [ ] 3. Implement authorization validation
  - [ ] 3.1 Validate migration authorization operation/operator/approver/commit/environment/target/allowlist/hashes/range/expiry/window/recovery owner before migration-capable construction. **Execution class:** `automated-test`. **Inputs:** migration attestations. **Outputs:** migration authorization report. (DHO-REQ-004)
  - [ ] 3.2 Validate deployment/redeployment authorization and PED request linkage without executing deployment. **Execution class:** `read-only-validation`. **Inputs:** DHO authorization plus PED request. **Outputs:** deployment authorization report. (DHO-REQ-004, DHO-REQ-007)
  - [ ] 3.3 For production, validate supplied migration/deployment records prove sequential migration-range success and exact-commit deployment. For local/test/staging, validate DHO did not mutate schema and recorded the range delegated to STG bootstrap. **Execution class:** `read-only-validation`. **Inputs:** `docs/audits/phase-3-4/deployment-handover/<commit>/<run-id>/DHO-DEPLOYMENT-RECORD-v1.json` with supported version/record ID/hash, migration action record, and target class. **Outputs:** `docs/audits/phase-3-4/deployment-handover/<commit>/<run-id>/DHO-PROMOTION-ORDER-v1.json` with ID/hash. (DHO-REQ-004)

- [ ] 4. Build read-only route and release checks
  - [ ] 4.1 Implement anonymous/member/admin direct-route expectations, public routes, callback/link destinations, receipt privacy, and banner access by invoking exactly `assertProductionReleaseTarget` for production. **Execution class:** `implementation`. **Inputs:** `DHO-ROUTE-TARGET-v1`, current `DHO-ROUTE-LIFECYCLE-v1`, and `PFG-NONPROD-GUARD-v1`. **Outputs:** DHO read-only smoke adapter. (DHO-REQ-003, DHO-REQ-005)
  - [ ] 4.2 Run the PFG conformance harness against the DHO smoke adapter and assert mutation, migration, fixture, Storage/Auth write, and mail adapter construction/call counts are zero. **Execution class:** `automated-test`. **Inputs:** smoke adapter and `PFG-GUARD-CONFORMANCE-HARNESS-v1`. **Outputs:** `docs/audits/phase-3-4/deployment-handover/<commit>/<run-id>/DHO-READ-ONLY-SMOKE-CONFORMANCE-v1.json` with ID/hash. (DHO-REQ-005)
  - [ ] 4.3 Read-only verify supplied Auth provider state against the exact route origin; do not change settings. **Execution class:** `read-only-validation`. **Inputs:** Auth status fingerprint and route artifact. **Outputs:** Auth-origin result. (DHO-REQ-003)

- [ ] 5. Implement the bounded local harness
  - [ ] 5.1 Implement one self-terminating route-harness command that clean-builds, spawns with `shell=false` on `127.0.0.1`, enforces readiness/total timeouts, runs checks, and always cleans up in `finally`. **Execution class:** `implementation`. **Inputs:** exact commit and isolated local/test binding. **Outputs:** bounded harness. (DHO-REQ-001, DHO-REQ-011)
  - [ ] 5.2 Implement Windows-safe process-tree termination verification and same-port rebind proof for success, failure, timeout, cancellation, and child-process escape attempts. **Execution class:** `automated-test`. **Inputs:** harness lifecycle scenarios. **Outputs:** teardown report. (DHO-REQ-011)
  - [ ] 5.3 Add a static/task-plan check rejecting any foreground server task or server lifetime spanning separate tasks. **Execution class:** `static-validation`. **Inputs:** scripts/task definitions. **Outputs:** harness-usage report. (DHO-REQ-011)
  - [ ] 5.4 Implement one bounded local orchestration invocation that starts the server, publishes ephemeral route/lifecycle artifacts to an in-process or bounded child STG execute-mode rehearsal, waits for cleanup and `STG-WORKFLOW-EVIDENCE-v1`, and then verifies process-tree termination and port rebind before returning. **Execution class:** `bounded-orchestration`. **Inputs:** exact commit, local/test PFG artifacts, scoped STG authorizations. **Outputs:** local `DHO-ROUTE-TARGET-v1`, `DHO-ROUTE-LIFECYCLE-v1`, `STG-WORKFLOW-EVIDENCE-v1`, and teardown report from one command. (DHO-REQ-010–011)

- [ ] 6. Validate DHO Phase A and publish route target
  - [ ] 6.1 Validate freeze, PFG/prerequisite results, Auth state, migration/deployment authorizations, supplied action records, exact commit, readiness, and lease in dependency order. **Execution class:** `phase-gate-validation`. **Inputs:** Phase A artifacts. **Outputs:** Phase A gate result. (DHO-REQ-001–004, DHO-REQ-010, DHO-REQ-012)
  - [ ] 6.2 Publish schema-valid `DHO-ROUTE-TARGET-v1` and current `DHO-ROUTE-LIFECYCLE-v1` only from passing DHO-owned records. **Execution class:** `evidence-publication`. **Inputs:** `DHO-PHASE-A-GATE-v1`. **Outputs:** `docs/audits/phase-3-4/deployment-handover/<commit>/<run-id>/DHO-ROUTE-TARGET-v1.json` and `DHO-ROUTE-LIFECYCLE-v1.json`, each with ID/hash. (DHO-REQ-001, DHO-REQ-010)
  - [ ] 6.3 Assert Phase A closure has no STG evidence input. **Execution class:** `contract-validation`. **Inputs:** Phase A manifest. **Outputs:** cycle-break result. (DHO-REQ-010)

- [ ] 7. Validate DHO Phase B
  - [ ] 7.1 Validate `STG-WORKFLOW-EVIDENCE-v1` version/hash and exact route/current-lifecycle/commit/target/allowlist/environment linkage. **Execution class:** `read-only-validation`. **Inputs:** `DHO-ROUTE-TARGET-v1`, current `DHO-ROUTE-LIFECYCLE-v1`, and `STG-WORKFLOW-EVIDENCE-v1`. **Outputs:** `DHO-HANDOFF-COHERENCE-v1`. (DHO-REQ-010)
  - [ ] 7.2 Require zero cleanup remainder, preserved-admin/redaction pass, and valid STG reviewer attestation; reject local/test relabeling. **Execution class:** `evidence-validation`. **Inputs:** STG evidence. **Outputs:** STG acceptance result. (DHO-REQ-009–010)
  - [ ] 7.3 Execute DHO read-only route/smoke validators and validate bounded target teardown/retention records. **Execution class:** `read-only-verification`. **Inputs:** accepted handoff and live route. **Outputs:** Phase B verification result. (DHO-REQ-001, DHO-REQ-005, DHO-REQ-012)

- [ ] 8. Verify recovery and PED redeployment intake
  - [ ] 8.1 Test every commit/target/allowlist/Auth/migration/deployment/readiness/lifecycle mismatch and stale-evidence invalidation. **Execution class:** `automated-test`. **Inputs:** negative transition matrix. **Outputs:** abort/invalidation report. (DHO-REQ-002–004, DHO-REQ-008)
  - [ ] 8.2 Validate a supplied recovery choice and prove repaired/redeployed targets create fresh route artifacts and supersede old ones. **Execution class:** `evidence-validation`. **Inputs:** recovery attestation and new records. **Outputs:** recovery result. (DHO-REQ-008)
  - [ ] 8.3 Validate `docs/audits/phase-3-4/production-email-dns/<change-id>/PED-DHO-REDEPLOYMENT-REQUEST-v1.json` by version/ID/hash, DHO authorization/action records, and fresh production route response without permitting PED deployment ownership. **Execution class:** `contract-validation`. **Inputs:** named PED request and `DHO-DEPLOYMENT-RECORD-v1`. **Outputs:** `docs/audits/phase-3-4/deployment-handover/<commit>/<run-id>/DHO-PED-REQUEST-RESULT-v1.json` with ID/hash. (DHO-REQ-007–008)

- [ ] 9. Publish handover evidence
  - [ ] 9.1 Validate supplied Security/Data/Quality/Operational/Infrastructure/launch attestations and references to PED-owned evidence/block state. **Execution class:** `evidence-validation`. **Inputs:** scoped attestations and PED reference. **Outputs:** human-gate validation result. (DHO-REQ-007, DHO-REQ-009)
  - [ ] 9.2 Publish redacted DHO handover evidence with exact PFG/DHO/STG chain and lifecycle/recovery status. **Execution class:** `evidence-publication`. **Inputs:** passing Phase B and human-gate result. **Outputs:** `docs/audits/phase-3-4/deployment-handover/<commit>/<run-id>/DHO-HANDOVER-EVIDENCE-v1.json` with schema version/artifact ID/hash. (DHO-REQ-009–010)

## Coverage Summary

| Requirement | Tasks |
| --- | --- |
| DHO-REQ-001–003 | 1–2, 4–6 |
| DHO-REQ-004–005 | 3–4, 6–7 |
| DHO-REQ-006–007 | 1, 8–9 |
| DHO-REQ-008–010 | 6–9 |
| DHO-REQ-011 | 5 |
| DHO-REQ-012 | 1–2, 6–7 |
