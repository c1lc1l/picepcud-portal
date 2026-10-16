# Staging Operations Requirements

## Introduction

Staging Operations (STG) consumes versioned PFG identity/policy artifacts and the DHO Phase A route target, executes disposable workflow rehearsals, and publishes one versioned workflow-evidence artifact for DHO Phase B. Requirement IDs are stable; amendments add IDs.

## Scope and Dependencies

STG consumes `PFG-TARGET-BINDING-v1`, `PFG-NONPROD-GUARD-v1`, the PFG branch-state artifact and conformance harness, and `DHO-ROUTE-TARGET-v1`. STG is the single writer for its gitignored fixture manifest and `STG-WORKFLOW-EVIDENCE-v1` under `docs/audits/phase-3-4/staging/<commit>/<run-id>/`.

STG does not create provider projects, write PFG governance, deploy applications, mutate production, configure production email/DNS, or write DHO/PED evidence.

## Requirements

### STG-REQ-001: Consume PFG capacity and identity

1. **STG-AC-001.1:** STG SHALL accept only supported, schema-valid PFG artifacts whose environment, binding ID/hash, allowlist version, and branch state are coherent.
2. **STG-AC-001.2:** `blocked-capacity` SHALL block cloud staging and permit only local/test rehearsal without relabeling it as staging evidence.
3. **STG-AC-001.3:** STG SHALL not inspect capacity, create/delete a provider project, or amend the PFG allowlist.

### STG-REQ-002: Operation-specific authorization

1. **STG-AC-002.1:** Seed, controlled mail, schema bootstrap, and cleanup execution SHALL each require a separate supplied attestation containing operation, operator, approver, commit SHA, environment, `targetRefHash`, `allowlistVersion`, issue/expiry window, recovery owner, and exact scope IDs/hashes.
2. **STG-AC-002.2:** Seed SHALL bind DHO route/lifecycle ID+hash, run ID, and schema digest; controlled mail SHALL additionally bind configuration/recipient-policy fingerprint; cleanup SHALL bind DHO route/lifecycle ID+hash and manifest/run ID+hash. Missing, expired, malformed, cross-operation, cross-run, cross-route, cross-schema, cross-config, cross-manifest, cross-commit, cross-target, or cross-allowlist authorization SHALL block the operation.
3. **STG-AC-002.3:** Automation SHALL validate authorizations but SHALL never create, infer, or checkbox-approve them.

### STG-REQ-003: DHO route and provider readiness

1. **STG-AC-003.1:** Before rehearsal and each mutation phase, STG SHALL validate a supported `DHO-ROUTE-TARGET-v1` plus current `DHO-ROUTE-LIFECYCLE-v1` with exact candidate commit, eligible local/test/staging environment, ready lifecycle, unexpired lease, and origin matching PFG policy.
2. **STG-AC-003.2:** Production, stale, closed, expired, superseded, mismatched, unready, or route/lifecycle-incoherent targets SHALL be rejected for workflow mutation.
3. **STG-AC-003.3:** Supabase Auth Site URL, redirect allowlist, and confirmation callback changes are manual provider gates; STG SHALL only perform read-only verification of supplied provider state.

### STG-REQ-004: Structural zero-effect plan

1. **STG-AC-004.1:** Plan/dry-run SHALL use read-only dependency containers and make zero database, Auth, Storage, provider-setting, manifest, deployment, and network-mail writes.
2. **STG-AC-004.2:** Mutation and mail adapter construction count and call count SHALL both be zero in plan mode.
3. **STG-AC-004.3:** Plan SHALL output phases, redacted expected counts, artifact references, and abort findings but SHALL not create/update a manifest or claim rehearsal.

### STG-REQ-005: Recoverable manifest and seed

1. **STG-AC-005.1:** Execute mode SHALL atomically persist a gitignored manifest bound to run ID, commit, environment, `targetRefHash`, `allowlistVersion`, PFG artifact IDs/hashes, DHO route artifact ID/hash, schema digest, and immutable fixture IDs/keys.
2. **STG-AC-005.2:** The manifest SHALL contain no full references, credentials, addresses, names, passwords, tokens, receipt content, or raw provider data.
3. **STG-AC-005.3:** Interrupted seed SHALL reconcile by immutable identity, adopt exactly one attributable resource, and abort on duplicates, ambiguity, or unowned resources.

### STG-REQ-006: Controlled mail and fixture display

1. **STG-AC-006.1:** Local/test SHALL use mock mail; separately authorized staging mail SHALL force server-only `TEST_EMAIL_TO` and ignore client/fixture recipients.
2. **STG-AC-006.2:** Any staging QR SHALL state `FIXTURE — NON-PAYABLE`, be isolated from production assets, and not satisfy the live-QR launch dependency.

### STG-REQ-007: Staging workflow rehearsal

1. **STG-AC-007.1:** The mutating workflow SHALL be named `staging workflow rehearsal` and run only in mode `execute`; it SHALL never be called a dry run.
2. **STG-AC-007.2:** Rehearsal SHALL separately verify registration/confirmation, returning login, two fixture payments, one approval, one rejection, controlled mail when authorized, both Treasurer CSVs, event publication, HTTPS Luma handoff, and preserved-admin sign-in/role.
3. **STG-AC-007.3:** Local/test rehearsal and dedicated staging rehearsal SHALL retain distinct evidence classifications.

### STG-REQ-008: Phased idempotent cleanup

1. **STG-AC-008.1:** Authorized cleanup SHALL re-guard before reconcile, Storage, Auth, database, and final-reconcile phases and address only manifest IDs/keys.
2. **STG-AC-008.2:** Partial failure SHALL preserve completed results, stop unsafe dependents, report exact redacted counts, and make no cross-service atomicity claim.
3. **STG-AC-008.3:** Final success SHALL prove zero remaining manifest resources and preserved-admin integrity.

### STG-REQ-009: Abort and recovery ownership

1. **STG-AC-009.1:** Contract, route, capacity, schema, origin, authorization, manifest, admin, recipient, ownership, count, or redaction failure SHALL stop before the next effect.
2. **STG-AC-009.2:** The current operator owns containment/evidence, the project owner owns staging/credential recovery, and the responsible maintainer owns application forward-fixes.

### STG-REQ-010: Redacted staging evidence

1. **STG-AC-010.1:** STG SHALL publish schema-valid `STG-WORKFLOW-EVIDENCE-v1` at `docs/audits/phase-3-4/staging/<commit>/<run-id>/STG-WORKFLOW-EVIDENCE-v1.json`.
2. **STG-AC-010.2:** Evidence SHALL include upstream artifact IDs/hashes/versions, including current DHO route-lifecycle ID/hash, commit, environment classification, execute mode, schema digest/bootstrap result, manifest run/hash, authorization references, case results, counts, cleanup/admin integrity, operator, reviewer attestation reference, exceptions, and redaction result.
3. **STG-AC-010.3:** Evidence SHALL exclude full target identity, addresses, credentials, fixture PII, receipt/QR payloads, tokens, signed URLs, and raw provider data.
4. **STG-AC-010.4:** Publication SHALL remain blocked until a supplied reviewer attestation validates successful workflow, zero-fixture reconciliation, admin integrity, and accurate environment classification.

### STG-REQ-011: Cross-spec artifact handoff

1. **STG-AC-011.1:** Each artifact-consuming or artifact-publishing executable phase/leaf SHALL declare, where applicable, machine-readable artifact names, supported versions, required IDs/hashes, canonical discovery path, output artifact, and execution class.
2. **STG-AC-011.2:** STG SHALL reject unsupported versions, hash mismatch, route/binding/lifecycle incoherence, or evidence references to another route/lifecycle artifact.
3. **STG-AC-011.3:** Publishing `STG-WORKFLOW-EVIDENCE-v1` SHALL be STG's only DHO Phase B handoff; STG SHALL not write deployment records.

### STG-REQ-012: Provider prerequisite matrix and schema bootstrap

1. **STG-AC-012.1:** STG SHALL validate a provider prerequisite matrix covering PFG binding/capacity, DHO route readiness, Auth origins, schema/migration set, private receipt bucket/policies, preserved admin, controlled-mail readiness, HTTPS Luma URL, and fixture-QR isolation.
2. **STG-AC-012.2:** Provider setting changes and project creation SHALL remain manual gates represented by scoped attestations; executable tasks SHALL use read-only verification.
3. **STG-AC-012.3:** After provider project creation and before seed, a dedicated, separately authorized schema bootstrap SHALL apply the exact ordered migration set only to local/test or dedicated staging and record migration hashes/range and resulting schema digest.
4. **STG-AC-012.4:** Seed SHALL remain blocked until read-only checks verify required tables, policies, functions, and private Storage structures.

## Requirement Traceability

| Requirement | Design sections | Task coverage |
| --- | --- | --- |
| STG-REQ-001–003, 011 | Artifact pipeline; prerequisite matrix | 1–2 |
| STG-REQ-004 | Plan structural non-mutation | 3 |
| STG-REQ-005 | Manifest and seed | 5 |
| STG-REQ-006–007 | Rehearsal | 6 |
| STG-REQ-008–009 | Cleanup and recovery | 7–8 |
| STG-REQ-010 | Evidence publication | 9 |
| STG-REQ-012 | Provider matrix and bootstrap | 2, 4 |
