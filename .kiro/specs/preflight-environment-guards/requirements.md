# Preflight Environment Guards Requirements

## Introduction

Preflight Environment Guards (PFG) publishes the environment identity and policy contracts used by later operational specifications. PFG closes when its contracts, reference implementation, conformance harness, governance records, and redacted evidence are valid; it does not wait for downstream integrations.

Requirement IDs are stable. Amendments add IDs rather than renumbering existing requirements.

## Scope and Dependencies

PFG is the single writer for the environment matrix, project allowlist, decision register, free-tier budget and branch state, shared evidence schema, `PFG-TARGET-BINDING-v1`, `PFG-NONPROD-GUARD-v1`, and the guard conformance harness. PFG has no dependency on `staging-operations`, `deployment-handover`, or `production-email-dns` for closure.

PFG does not own staging manifests or run evidence, deployments or deployment records, DNS state, private DNS change sheets, or downstream human operation approvals.

## Requirements

### PFG-REQ-001: Isolated environment classification

1. **PFG-AC-001.1:** `bindTargetIdentity` SHALL support read-only identity binding for exactly `local`, `test`, `staging`, and `production`.
2. **PFG-AC-001.2:** A CLI/environment mismatch, unknown environment, or ambiguous allowlist match SHALL fail before a mutation-capable adapter is constructed.
3. **PFG-AC-001.3:** Non-production mutation APIs SHALL always reject production.
4. **PFG-AC-001.4:** Each binding SHALL use only the selected environment's allowlisted project, origin policy, data class, email mode, and destructive-operation policy.

### PFG-REQ-002: Free-tier staging branch state

1. **PFG-AC-002.1:** PFG SHALL own one machine-readable branch-state artifact with state `enabled-free` or `blocked-capacity`, allowance version, observation time, source, owner-attestation reference, and safe target binding reference.
2. **PFG-AC-002.2:** Project creation or deletion and the capacity decision are human/provider actions outside executable PFG tasks; executable work SHALL only validate a supplied scoped attestation and observed state.
3. **PFG-AC-002.3:** `blocked-capacity` SHALL permit local/test preparation but SHALL prohibit cloud-staging claims, production reuse, automatic deletion, and paid upgrade.
4. **PFG-AC-002.4:** One validator SHALL cover both branch states; mutually exclusive executable task branches are prohibited.

### PFG-REQ-003: Exact environment variable contract

1. **PFG-AC-003.1:** PFG SHALL define exposure and validation rules for `APP_ENV`, all operative Supabase endpoints/credentials, database endpoints, site origins, Resend configuration, and `TEST_EMAIL_TO`.
2. **PFG-AC-003.2:** A required missing or exposed server-only value SHALL fail without logging the value or substituting a public credential.
3. **PFG-AC-003.3:** Every newly operative endpoint or credential SHALL register with the identity binder before use.

### PFG-REQ-004: Complete target identity binding

1. **PFG-AC-004.1:** Every operative endpoint and credential SHALL bind to exactly one enabled allowlist entry and one `allowlistVersion`.
2. **PFG-AC-004.2:** JWT reference claims, database hosts/usernames, and opaque-key read-only probes SHALL agree with the expected target.
3. **PFG-AC-004.3:** Binding output SHALL include an opaque `bindingId`, `targetRefHash`, `allowlistVersion`, environment, origin policy, issue time, and evidence-safe target suffix; it SHALL exclude full references and secrets.
4. **PFG-AC-004.4:** Missing, unsupported, ambiguous, or mismatched values SHALL abort before mutation capability exists.

### PFG-REQ-005: Split identity and policy APIs

1. **PFG-AC-005.1:** `bindTargetIdentity` SHALL only establish read identity and SHALL not claim operation authorization.
2. **PFG-AC-005.2:** `assertNonProductionMutationTarget` SHALL authorize the machine policy boundary for fixture seed, rehearsal, and cleanup only after a valid PFG binding and SHALL reject production.
3. **PFG-AC-005.3:** `assertProductionReleaseTarget` SHALL expose read-only release-smoke dependencies and SHALL structurally exclude mutation and mail-dispatch adapters.
4. **PFG-AC-005.4:** `assertAuthorizedMigrationTarget` SHALL require exact target identity plus a supplied, valid human migration authorization; it SHALL never infer authorization from identity.
5. **PFG-AC-005.5:** Every resumable mutation phase SHALL invoke the applicable assertion immediately before the phase and construct clients only from returned guarded values.

### PFG-REQ-006: Structural zero-effect plan mode

1. **PFG-AC-006.1:** Plan/dry-run SHALL perform zero database, Auth, Storage, DNS, provider-setting, local manifest, and network-email writes.
2. **PFG-AC-006.2:** Plan mode SHALL receive read-only dependency containers; mutation/mail adapters SHALL have construction count zero and call count zero.
3. **PFG-AC-006.3:** Plan mode MAY perform identity and health reads and emit a redacted plan but SHALL not write a manifest or claim execution.

### PFG-REQ-007: Environment-aware email isolation

1. **PFG-AC-007.1:** Local/test SHALL not instantiate network mail transport.
2. **PFG-AC-007.2:** Controlled staging mail SHALL require server-only `TEST_EMAIL_TO` and a downstream operation authorization and SHALL ignore any client/fixture recipient.
3. **PFG-AC-007.3:** Production mail policy remains owned by PED and SHALL never fall back to staging/sandbox behavior.

### PFG-REQ-008: Credential custody

1. **PFG-AC-008.1:** Staging Admin credentials SHALL remain in a project-owner-controlled server-only store and SHALL not be distributed through documentation, browsers, fixtures, CI artifacts, logs, evidence, or handover.
2. **PFG-AC-008.2:** PFG SHALL separate credential custody from operation approval; non-owner browser testers need not receive the credential.
3. **PFG-AC-008.3:** Suspected exposure SHALL block privileged operations until owner rotation/destruction and fresh binding validation.

### PFG-REQ-009: Redacted PFG evidence schema

1. **PFG-AC-009.1:** PFG SHALL own the shared evidence-envelope schema and publish PFG evidence only under `docs/audits/phase-3-4/preflight/<commit>/<run-id>/`.
2. **PFG-AC-009.2:** Evidence SHALL include artifact version, commit/date, environment, mode, binding ID/hash, allowlist version, procedure, expected/actual result, validator version, reviewer fields, exceptions, and deferred findings.
3. **PFG-AC-009.3:** Evidence SHALL exclude secrets, full project references, addresses, PII, tokens, receipts, credential-bearing URLs, and raw provider payloads.

### PFG-REQ-010: Governance ownership

1. **PFG-AC-010.1:** PFG SHALL be the sole writer of the environment matrix, allowlist, decision register, free-tier budget/branch state, and shared evidence schema.
2. **PFG-AC-010.2:** Governance artifacts SHALL record owner, approver or attestation reference, effective date, reason, version, and linked evidence.
3. **PFG-AC-010.3:** Downstream specs SHALL reference, not copy or independently amend, these artifacts.

### PFG-REQ-011: Fail-closed recovery

1. **PFG-AC-011.1:** Validation failures SHALL return stable machine-readable classes and non-zero status before the guarded effect.
2. **PFG-AC-011.2:** Corrections, target changes, allowlist changes, and credential rotations SHALL invalidate cached success and require full rebinding.
3. **PFG-AC-011.3:** No fallback SHALL change environment, weaken verification, or purchase capacity.

### PFG-REQ-012: Versioned publications and conformance harness

1. **PFG-AC-012.1:** PFG SHALL publish machine-readable `PFG-TARGET-BINDING-v1` and `PFG-NONPROD-GUARD-v1` schemas with explicit `artifactType`, `schemaVersion`, compatibility rules, required fields, redaction rules, and stable error classes.
2. **PFG-AC-012.2:** Unknown or incompatible contract versions SHALL fail closed.
3. **PFG-AC-012.3:** PFG SHALL publish a consumer conformance harness proving internal guard timing, environment/allowlist binding, client-construction ordering, production refusal, plan structural non-mutation, resumable re-guarding, and redaction.
4. **PFG-AC-012.4:** PFG closure SHALL require the contracts and reference adapter to pass the harness; it SHALL NOT require STG, DHO, PED, or another downstream integration to exist.

### PFG-REQ-013: Scoped authorization attestation validation

1. **PFG-AC-013.1:** Shared authorization validation SHALL require `attestationType`, schema version, authorization ID, operation, operator, approver, commit SHA, environment, `targetRefHash`, `allowlistVersion`, issue time, expiry/change window, recovery owner, exact `scopeArtifactIds`, `scopeArtifactHashes`, and `scopeHash`.
2. **PFG-AC-013.2:** Operation owners SHALL bind those scope fields to the exact route, run, schema, manifest, configuration, migration, or deployment instance required by that operation; cross-instance replay SHALL fail. Environment and full target identity SHALL remain private, while committed evidence uses safe IDs/hashes.
3. **PFG-AC-013.3:** Executable tasks SHALL validate supplied attestations and SHALL remain blocked when they are absent, expired, mismatched, or malformed; automation SHALL not create human approvals.

## Requirement Traceability

| Requirement | Design contract/section | Task coverage |
| --- | --- | --- |
| PFG-REQ-001, PFG-REQ-003–004 | Target binding | 1.1, 2.1, 3.1–3.2 |
| PFG-REQ-002 | Capacity branch-state artifact | 1.2 |
| PFG-REQ-005–008 | Split APIs, structural non-mutation, email isolation, custody | 3.2, 4.1–4.4, 5.2–5.3, 5.5–5.6 |
| PFG-REQ-009–010 | Single-writer governance and evidence | 1.1, 2.3, 5.4, 6.2 |
| PFG-REQ-011 | Failure and recovery | 2.2, 5.2, 6.1 |
| PFG-REQ-012 | Published contracts and harness | 2.1–2.3, 5.1–5.4, 6.1, 6.3 |
| PFG-REQ-013 | Attestation validator | 1.2, 4.3–4.4, 6.2 |
