# Preflight Environment Guards Implementation Plan

## Execution Rules

Every checkbox is executable by Kiro and independently verifiable. Every leaf declares its execution class and machine-readable artifacts. Human/provider decisions and actions appear only in the Manual Gate section. A missing manual attestation blocks its validator; Kiro never fabricates one. PFG closes on its own publications and reference-harness result, not downstream integration.

## Manual Gate — not an executable Kiro task

The provider allowance observation, project-owner capacity decision, project creation/deletion, allowlist approval, credential provisioning/rotation, and PFG reviewer decision occur outside this task list. Each supplies `OPERATION-AUTHORIZATION-v1` or the purpose-specific attestation with ID, schema version, operation, operator, approver, commit, private environment, `targetRefHash`, `allowlistVersion`, issue/expiry window, and recovery owner. Executable tasks remain blocked until required attestations are supplied and valid.

## Executable Tasks

- [ ] 1. Publish PFG-owned governance schemas
  - [ ] 1.1 Define and validate the environment matrix, allowlist, decision-register, free-tier budget/branch-state, and shared evidence-envelope schemas; reject secrets and ownership outside PFG. **Execution class:** `read-only-validation`. **Inputs:** repository governance sources. **Outputs:** schema validation report. (PFG-REQ-003, PFG-REQ-009–010)
  - [ ] 1.2 Implement one branch-state validator accepting exactly `enabled-free` or `blocked-capacity` and validating the supplied allowance/owner attestation without creating/deleting a project. **Execution class:** `read-only-validation`. **Inputs:** `PFG-STAGING-BRANCH-STATE-v1`, attestation. **Outputs:** branch validation result. (PFG-REQ-002, PFG-REQ-013)

- [ ] 2. Publish target-binding and guard contracts
  - [ ] 2.1 Define and schema-test `PFG-TARGET-BINDING-v1`, including artifact identity/hash, binding ID, environment, `targetRefHash`, `allowlistVersion`, origin policy, capacity state, issue/expiry, and redaction. **Execution class:** `contract-publication`. **Inputs:** `config/supabase-projects.json` plus `docs/operations/PFG-STAGING-BRANCH-STATE-v1.json`. **Outputs:** `docs/contracts/pfg/PFG-TARGET-BINDING-v1.schema.json` and versioned fixtures with IDs/hashes. (PFG-REQ-001, PFG-REQ-004, PFG-REQ-012)
  - [ ] 2.2 Define and schema-test `PFG-NONPROD-GUARD-v1`, compatibility policy, split API signatures, and stable error classes. **Execution class:** `contract-publication`. **Inputs:** `PFG-TARGET-BINDING-v1`. **Outputs:** `docs/contracts/pfg/PFG-NONPROD-GUARD-v1.schema.json` and versioned fixtures with IDs/hashes. (PFG-REQ-005, PFG-REQ-011–012)
  - [ ] 2.3 Add malformed, unknown-version, hash-mismatch, and prohibited-field contract tests. **Execution class:** `automated-test`. **Inputs:** both PFG contracts. **Outputs:** contract test report. (PFG-REQ-004, PFG-REQ-009, PFG-REQ-012)

- [ ] 3. Implement identity binding
  - [ ] 3.1 Implement `bindTargetIdentity` for local/test/staging/production read identity, including endpoint/database parsers, JWT matching, and opaque-key read-only probes. **Execution class:** `implementation`. **Inputs:** PFG contracts and allowlist. **Outputs:** identity binder. (PFG-REQ-001, PFG-REQ-003–004)
  - [ ] 3.2 Verify all operative endpoints/credentials bind before effect-capable client construction and returned dependencies cannot reread process values. **Execution class:** `automated-test`. **Inputs:** binder test matrix. **Outputs:** binding/construction report. (PFG-REQ-004–005)

- [ ] 4. Implement split policy APIs
  - [ ] 4.1 Implement `assertNonProductionMutationTarget` for fixture/rehearsal/cleanup and production refusal. **Execution class:** `implementation`. **Inputs:** validated identity. **Outputs:** guarded mutation dependency factory. (PFG-REQ-005)
  - [ ] 4.2 Implement `assertProductionReleaseTarget` with read-only dependencies and no mutation/mail constructor path. **Execution class:** `implementation`. **Inputs:** production identity. **Outputs:** read-only release factory. (PFG-REQ-005–006)
  - [ ] 4.3 Implement `assertAuthorizedMigrationTarget` with exact target and supplied migration authorization validation. **Execution class:** `implementation`. **Inputs:** identity plus migration attestation. **Outputs:** guarded migration factory. (PFG-REQ-005, PFG-REQ-013)
  - [ ] 4.4 Implement the shared scoped-attestation validator and prove operation/operator/commit/environment/target/allowlist/expiry mismatches fail. **Execution class:** `automated-test`. **Inputs:** authorization fixtures. **Outputs:** authorization validation report. (PFG-REQ-013)

- [ ] 5. Publish and run the conformance harness
  - [ ] 5.1 Implement the consumer adapter interface and reference adapter without importing STG, DHO, or PED. **Execution class:** `implementation`. **Inputs:** `PFG-NONPROD-GUARD-v1`. **Outputs:** `tests/conformance/pfg/PFG-GUARD-CONFORMANCE-HARNESS-v1.md` plus executable reference adapter. (PFG-REQ-012)
  - [ ] 5.2 Prove internal guard timing, resumable re-guarding, production refusal, no environment rereads, and standalone-preflight non-authorization. **Execution class:** `automated-test`. **Inputs:** reference adapter. **Outputs:** conformance report. (PFG-REQ-005, PFG-REQ-011–012)
  - [ ] 5.3 Prove plan uses read-only containers and mutation/mail/manifest adapter construction and call counts are zero. **Execution class:** `automated-test`. **Inputs:** instrumented reference adapter. **Outputs:** zero-effect report. (PFG-REQ-006–007)
  - [ ] 5.4 Prove evidence redaction against injected secrets, full references, addresses, PII, tokens, receipts, URLs, and provider payloads. **Execution class:** `automated-test`. **Inputs:** hostile fixtures. **Outputs:** redaction report. (PFG-REQ-009)
  - [ ] 5.5 Prove local/test never constructs network mail, separately authorized staging always overrides recipients with server-only `TEST_EMAIL_TO`, and production never falls back to staging/sandbox delivery. **Execution class:** `automated-test`. **Inputs:** environment/mail-policy matrix and scoped authorization fixtures. **Outputs:** `PFG-EMAIL-ISOLATION-REPORT-v1`. (PFG-REQ-007)
  - [ ] 5.6 Validate staging Admin custody and exposure response: reject public/browser/fixture/CI/log/evidence/handover distribution, require owner-held secret metadata, and keep privileged work blocked until supplied rotation completion plus fresh binding. **Execution class:** `security-validation`. **Inputs:** source/artifact scan, custody attestation, incident/rotation fixtures. **Outputs:** `PFG-CREDENTIAL-CUSTODY-REPORT-v1`. (PFG-REQ-008, PFG-REQ-011)

- [ ] 6. Validate PFG closure
  - [ ] 6.1 Run schema validation, strict lint, targeted tests, conformance harness, security/static checks, and production build at one commit. **Execution class:** `verification`. **Inputs:** PFG publications/reference implementation. **Outputs:** validation summary. (PFG-REQ-011–012)
  - [ ] 6.2 Publish redacted PFG evidence only under `docs/audits/phase-3-4/preflight/<commit>/<run-id>/` and validate the supplied reviewer attestation. **Execution class:** `evidence-validation`. **Inputs:** validation summary and reviewer attestation. **Outputs:** PFG evidence artifact. (PFG-REQ-009–010, PFG-REQ-013)
  - [ ] 6.3 Assert closure does not require any downstream integration/result. **Execution class:** `contract-validation`. **Inputs:** PFG closure manifest. **Outputs:** independent-closure result. (PFG-REQ-012)

## Coverage Summary

| Requirement | Tasks |
| --- | --- |
| PFG-REQ-001–004 | 1–3 |
| PFG-REQ-005–008 | 3–5 |
| PFG-REQ-009–010 | 1, 5–6 |
| PFG-REQ-011–013 | 2, 4–6 |
