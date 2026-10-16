# Deployment Handover Requirements

## Introduction

Deployment Handover (DHO) owns every deployment and deployment record. Phase A publishes a route target for STG; Phase B consumes STG workflow evidence and completes handover. This split removes the former DHO/STG cycle. Requirement IDs are stable; amendments add IDs.

## Scope and Dependencies

DHO consumes PFG contracts. DHO Phase A publishes `DHO-ROUTE-TARGET-v1`; STG consumes it and publishes `STG-WORKFLOW-EVIDENCE-v1`; DHO Phase B validates that evidence. DHO owns local route harnesses, previews, production deployments, redeployments, migration/deployment authorization validation, deployment records, target lifecycle, route/read-only smoke evidence, and handover records.

DHO does not write PFG governance, STG manifests/evidence, or PED DNS state/private sheets/evidence. PED may request a DHO-owned redeployment but may not deploy.

## Requirements

### DHO-REQ-001: Versioned commit-matched route target

1. **DHO-AC-001.1:** Phase A SHALL publish a schema-valid `DHO-ROUTE-TARGET-v1` for `local-production`, immutable `preview`, or `production-deployment`, with environment `local`, `test`, `staging`, or `production`.
2. **DHO-AC-001.2:** The artifact SHALL include ID/hash/version, exact commit, safe origin, environment, target hash/allowlist version, deployment record reference, readiness, allowed execution class, issue/expiry, lifecycle/lease state, owner, and supersession status.
3. **DHO-AC-001.3:** Production route artifacts SHALL permit read-only release smoke only and SHALL never authorize fixtures or network test mail.
4. **DHO-AC-001.4:** Setup, readiness, lease, retention, teardown, supersession, and port/process results SHALL be recorded for every outcome.

### DHO-REQ-002: Environment and secret-scope verification

1. **DHO-AC-002.1:** Before migration, deployment, route publication, or smoke, DHO SHALL validate PFG binding, exact environment, target hash, allowlist version, origins, variable scopes, owners, and rotation status without recording secrets or full target identity.
2. **DHO-AC-002.2:** Exposure SHALL block handover until rotation/removal, clean rebuild/redeployment, and fresh validation.

### DHO-REQ-003: Auth origins and route protection

1. **DHO-AC-003.1:** Auth provider settings changes are manual provider gates; executable DHO work SHALL read-only verify Site URL, redirect allowlist, and confirmation callback against the exact route origin.
2. **DHO-AC-003.2:** Direct route checks SHALL verify anonymous, member, and admin outcomes independent of navigation visibility.

### DHO-REQ-004: Authorized migration and deployment order

1. **DHO-AC-004.1:** For production, Phase A SHALL order candidate freeze, PFG identity, provider prerequisites, migration precheck/authorization, sequential migration, deployment authorization, exact-commit deployment, readiness, and route-target publication. For local/test/staging rehearsal targets, DHO SHALL validate and record the expected migration hashes/range but SHALL leave schema bootstrap exclusively to STG after route publication and before seed.
2. **DHO-AC-004.2:** When DHO owns a production migration, `assertAuthorizedMigrationTarget` SHALL require exact binding plus a supplied attestation containing authorization ID, operation/operator/approver, environment, `targetRefHash`, `allowlistVersion`, commit, migration hashes and inclusive range, issue/expiry/change window, and recovery owner.
3. **DHO-AC-004.3:** Deployment authorization SHALL contain operation/operator/approver, commit, environment, target hash, allowlist version, deployment class, issue/expiry/change window, and recovery owner.
4. **DHO-AC-004.4:** Mismatch or failure SHALL stop before the next dependent stage.

### DHO-REQ-005: Read-only release smoke

1. **DHO-AC-005.1:** DHO SHALL invoke exactly `assertProductionReleaseTarget` at the production smoke effect boundary and use only its returned dependencies to verify public routes, callback, protected route matrix, receipt privacy, banner access, and existing link destinations.
2. **DHO-AC-005.2:** Production smoke SHALL structurally exclude mutation and mail-dispatch adapters and assert construction/call count zero.
3. **DHO-AC-005.3:** Disposable workflows SHALL be delegated to STG on eligible non-production targets.

### DHO-REQ-006: Free-tier and minimal configuration controls

1. **DHO-AC-006.1:** DHO SHALL consume the PFG free-tier budget and block unapproved recurring cost; it SHALL not copy or independently edit that record.
2. **DHO-AC-006.2:** Provider-specific configuration SHALL be introduced only for a named unmet requirement with supplied reviewer attestation.

### DHO-REQ-007: Operational ownership

1. **DHO-AC-007.1:** Handover SHALL record deployment, migration, recovery, rotation, escalation, support, and launch owners plus least-privilege access procedures.
2. **DHO-AC-007.2:** DHO SHALL own all deployment records, deployment/redeployment execution, route artifact lifecycle, and deployment-request results.
3. **DHO-AC-007.3:** DHO SHALL reference PED-owned renewal/DNS evidence without copying its private values or assuming ownership.

### DHO-REQ-008: Recovery and revalidation

1. **DHO-AC-008.1:** A supplied recovery-owner attestation SHALL select rollback only when schema-compatible or otherwise select forward-fix.
2. **DHO-AC-008.2:** Repair, config/credential change, migration change, redeployment, or target change SHALL invalidate affected route/STG/handover evidence and require a new artifact chain.

### DHO-REQ-009: Redacted evidence and human acceptance

1. **DHO-AC-009.1:** DHO evidence SHALL live only under `docs/audits/phase-3-4/deployment-handover/<commit>/<run-id>/` and include artifact references, authorizations, migration/deployment records, procedures/results, lifecycle, exceptions, and safe reviewer attestation references.
2. **DHO-AC-009.2:** Phase B SHALL remain blocked until supplied Security, Data, Quality, Operational, Infrastructure, and launch-owner attestations validate for their scopes; automation SHALL not create these decisions.
3. **DHO-AC-009.3:** PED closure remains a launch dependency and is referenced, not reproduced, by DHO.

### DHO-REQ-010: Two-phase cross-spec handoff

1. **DHO-AC-010.1:** DHO Phase A SHALL close independently by publishing `DHO-ROUTE-TARGET-v1` and current `DHO-ROUTE-LIFECYCLE-v1`; it SHALL not require STG evidence.
2. **DHO-AC-010.2:** DHO Phase B SHALL validate supported `STG-WORKFLOW-EVIDENCE-v1` version, artifact/hash, exact DHO route and lifecycle references, commit, environment classification, cleanup/admin result, and reviewer attestation.
3. **DHO-AC-010.3:** Local/test evidence SHALL satisfy rehearsal only and SHALL not be relabeled as cloud staging.
4. **DHO-AC-010.4:** Each artifact-consuming or artifact-publishing executable phase/leaf SHALL, where applicable, declare execution class, machine-readable artifact name/version/ID/hash, canonical discovery path, and output.

### DHO-REQ-011: Bounded Windows-safe local harness

1. **DHO-AC-011.1:** Local route verification SHALL use one bounded, self-terminating harness command that spawns the server with `shell=false`, binds `127.0.0.1`, selects/records a port, enforces readiness and total timeouts, and runs cleanup in `finally`.
2. **DHO-AC-011.2:** Cleanup SHALL terminate and verify the complete process tree, verify the port can be rebound, and fail evidence closure if termination or rebind verification fails.
3. **DHO-AC-011.3:** No task SHALL start a foreground server or leave server lifetime to a subsequent task. When local STG rehearsal is required, one harness command SHALL publish the ephemeral route/lifecycle to an in-process or child STG invocation, wait for execute-mode rehearsal and cleanup evidence, then terminate and verify the process tree/port before returning.

### DHO-REQ-012: Provider prerequisites and bounded preview lifecycle

1. **DHO-AC-012.1:** A prerequisite matrix SHALL cover PFG identity/budget, provider account/project readiness, Auth origins, migration state, deployment metadata, HTTPS/readiness, lifecycle owner, and PED request inputs when applicable.
2. **DHO-AC-012.2:** Provider changes SHALL be manual gates; executable checks SHALL validate supplied attestations and provider state read-only.
3. **DHO-AC-012.3:** Preview leases SHALL have an owner, expiry, retention reason, maximum lifetime, teardown trigger, and stale/superseded invalidation; Phase B or abort SHALL close/retain them only within policy.

## Requirement Traceability

| Requirement | Design sections | Task coverage |
| --- | --- | --- |
| DHO-REQ-001, 010 | Artifact contract; Phase A/B | 2, 6, 7 |
| DHO-REQ-002–003, 012 | Prerequisite matrix | 1, 3 |
| DHO-REQ-004 | Authorization contracts; Phase A | 4, 6 |
| DHO-REQ-005 | Read-only smoke | 5, 7 |
| DHO-REQ-006–007 | Ownership and handover | 1, 8 |
| DHO-REQ-008–009 | Recovery/evidence | 8–9 |
| DHO-REQ-011 | Local harness | 2, 5 |
