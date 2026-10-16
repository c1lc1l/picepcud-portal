# Production Email and DNS Implementation Plan

## Execution Rules

All checkboxes are executable contract, read-only verification, test, or evidence tasks with declared artifact inputs/outputs. Human/provider actions are non-checkbox manual gates. Kiro validates supplied attestations and remains blocked when absent. PED never executes deployment, DNS mutation, or provider-setting mutation.

## Manual Gate — not an executable Kiro task

Domain/renewal ownership, DNS access, provider tuple capture/review, DNS authorization/application, sender/config changes, redeployment authorization/action, controlled-delivery approval/action, recovery choice, and Infrastructure/Operational/launch decisions occur outside this task list. Each produces a scoped attestation/action record bound to operation/operator/approver/commit/private environment/`targetRefHash`/`allowlistVersion`/issue/expiry/change window/recovery owner and purpose-specific fingerprint. Exact DNS values remain only in the private sheet.

## Executable Tasks

- [ ] 1. Define state and prerequisite contracts
  - [ ] 1.1 Define/schema-test PED state history and enforce exactly the design transition table, including post-DNS partial-state behavior. **Execution class:** `contract-publication`. **Inputs:** PED requirements. **Outputs:** state schema/transition validator. (PED-REQ-001, PED-REQ-011)
  - [ ] 1.2 Implement the provider prerequisite matrix validator for domain/DNS/renewal, private sheet, provider records, PFG binding, DHO production route, sender/config, test officer, and recovery ownership. **Execution class:** `read-only-validation`. **Inputs:** supplied artifacts/attestations. **Outputs:** prerequisite report. (PED-REQ-001–002, PED-REQ-012)
  - [ ] 1.3 Prove missing/placeholders retain `blocked-inputs` with zero deployment/DNS/provider/mail adapter construction/calls. **Execution class:** `automated-test`. **Inputs:** blocked-state scenarios. **Outputs:** blocked non-effect report. (PED-REQ-001, PED-REQ-004)

- [ ] 2. Implement private change-control validation
  - [ ] 2.1 Define the external private-sheet schema and committed opaque-reference schema; reject exact tuples in repository evidence. **Execution class:** `contract-publication`. **Inputs:** private-sheet metadata. **Outputs:** private/committed schemas. (PED-REQ-003, PED-REQ-009)
  - [ ] 2.2 Implement stable tuple fingerprinting without changing tuple semantics and invalidate review/authorization on tuple or zone drift. **Execution class:** `implementation`. **Inputs:** private tuples in controlled test fixtures. **Outputs:** fingerprint validator. (PED-REQ-002–003)
  - [ ] 2.3 Validate operation-specific attestations across operation/operator/commit/environment/target/allowlist/domain/fingerprint/expiry/recovery scope. **Execution class:** `automated-test`. **Inputs:** authorization fixtures. **Outputs:** authorization report. (PED-REQ-002)

- [ ] 3. Implement bounded polling and read-only DNS verification
  - [ ] 3.1 Define/schema-test `PED-DNS-POLLING-POLICY-v1` with positive finite initial/max intervals and maximum observation window. **Execution class:** `contract-publication`. **Inputs:** approved policy attestation. **Outputs:** polling schema/validator. (PED-REQ-011)
  - [ ] 3.2 Implement authoritative/provider read-only polling with bounded attempts/time, recorded cadence/sources/status/fingerprint/owner/next-review, and no automatic rollback. **Execution class:** `implementation`. **Inputs:** valid polling policy and DNS action record. **Outputs:** polling result. (PED-REQ-005, PED-REQ-011)
  - [ ] 3.3 Test success, timeout, conflict, cancellation, and source failure; prove timeout remains `propagating` and blocks later transitions. **Execution class:** `automated-test`. **Inputs:** polling scenarios. **Outputs:** bounded-polling report. (PED-REQ-008, PED-REQ-011)

- [ ] 4. Implement production configuration guards
  - [ ] 4.1 Validate server-only key presence, production PFG/DHO identity, exact verified role sender/domain, and absence of `TEST_EMAIL_TO`/sandbox settings. **Execution class:** `read-only-validation`. **Inputs:** safe config status plus PFG/DHO artifacts. **Outputs:** production-config result. (PED-REQ-004, PED-REQ-006)
  - [ ] 4.2 Test every invalid/exposed configuration and assert network-mail, provider-setting, DNS, and deployment construction/call counts are zero. **Execution class:** `automated-test`. **Inputs:** invalid config matrix. **Outputs:** fail-closed report. (PED-REQ-004)
  - [ ] 4.3 Read-only verify exact-domain, hosting ownership, HTTPS, DKIM, SPF, sender identity, and application links. **Execution class:** `read-only-validation`. **Inputs:** provider status fingerprints. **Outputs:** domain/sender-readiness result. (PED-REQ-006)

- [ ] 5. Validate DNS action records and transitions
  - [ ] 5.1 Validate supplied zone snapshot, private-sheet fingerprint, DNS authorization, immediate no-drift result, and DNS-owner action record without applying records. **Execution class:** `evidence-validation`. **Inputs:** private-reference metadata and attestations/action record. **Outputs:** DNS-action validation result. (PED-REQ-002–003, PED-REQ-005)
  - [ ] 5.2 Validate per-tuple private results only through safe counts/purposes/fingerprint/status and transition to `propagating` or `incident-blocked` as defined. **Execution class:** `contract-validation`. **Inputs:** sanitized DNS action summary. **Outputs:** state-transition result. (PED-REQ-005, PED-REQ-008, PED-REQ-011)
  - [ ] 5.3 Combine bounded polling and exact-domain checks to permit `domain-verified` only on complete success. **Execution class:** `read-only-validation`. **Inputs:** polling/domain results. **Outputs:** domain-verification result. (PED-REQ-006, PED-REQ-011)

- [ ] 6. Implement the PED-to-DHO redeployment boundary
  - [ ] 6.1 Define/schema-test `PED-DHO-REDEPLOYMENT-REQUEST-v1` with commit/environment/target/allowlist/change/config/reason/checks/requester/authorization/expiry fields and no secrets. **Execution class:** `contract-publication`. **Inputs:** PED change/config status. **Outputs:** canonical request schema and fixtures with request ID/hash. (PED-REQ-010)
  - [ ] 6.2 Publish a request only after valid sender/config and redeployment attestations; do not call deployment providers. **Execution class:** `evidence-publication`. **Inputs:** validated attestations and config status. **Outputs:** `docs/audits/phase-3-4/production-email-dns/<change-id>/PED-DHO-REDEPLOYMENT-REQUEST-v1.json` with version/request ID/hash. (PED-REQ-002, PED-REQ-010)
  - [ ] 6.3 Validate DHO's fresh production `DHO-ROUTE-TARGET-v1`, `DHO-ROUTE-LIFECYCLE-v1`, and `DHO-PED-REQUEST-RESULT-v1` against request ID/hash, exact commit/target/allowlist, readiness, and non-superseded state. **Execution class:** `read-only-validation`. **Inputs:** canonical PED request and DHO result/route/lifecycle artifacts. **Outputs:** PED redeployment-response result with ID/hash. (PED-REQ-006, PED-REQ-010)
  - [ ] 6.4 Assert PED has no deployment adapter and cannot mark deployment complete; stale route response fails. **Execution class:** `automated-test`. **Inputs:** boundary scenarios. **Outputs:** single-writer report. (PED-REQ-010)

- [ ] 7. Validate controlled delivery
  - [ ] 7.1 Validate supplied delivery attestation against fresh DHO route ID/hash, commit, sender status, operator, and window and validate server-side recipient resolution without exposing the address. **Execution class:** `read-only-validation`. **Inputs:** delivery attestation and fresh DHO route. **Outputs:** delivery-gate result. (PED-REQ-002, PED-REQ-007)
  - [ ] 7.2 Validate the supplied one-message action result, sanitized provider message-ID hash, delivery/link status, and approved sender. **Execution class:** `evidence-validation`. **Inputs:** controlled-delivery action record. **Outputs:** delivery result. (PED-REQ-007, PED-REQ-009)
  - [ ] 7.3 Use non-network tests to prove delivery/retry failure preserves payment approval, uses server-side recipient resolution, and does not dispatch another production test. **Execution class:** `automated-test`. **Inputs:** failure/retry scenarios. **Outputs:** approval-isolation report. (PED-REQ-007–008)

- [ ] 8. Verify recovery and invalidation
  - [ ] 8.1 Test stale tuples, drift, expired authorization, conflicts, timeout, wrong-domain verification, sender mismatch, and domain loss as explicit blocked transitions. **Execution class:** `automated-test`. **Inputs:** recovery matrix. **Outputs:** recovery-state report. (PED-REQ-001–002, PED-REQ-005–008, PED-REQ-011)
  - [ ] 8.2 Validate supplied exposure/config recovery records require a PED request, DHO-owned clean redeployment, fresh route validation, and new delivery authorization. **Execution class:** `evidence-validation`. **Inputs:** recovery attestation/request/DHO response. **Outputs:** recovery-chain result. (PED-REQ-004, PED-REQ-008, PED-REQ-010)
  - [ ] 8.3 Test evidence redaction against tuples, credentials, keys, addresses, message content, PII, tokens, and provider payloads. **Execution class:** `automated-test`. **Inputs:** hostile fixtures. **Outputs:** redaction report. (PED-REQ-009)

- [ ] 9. Publish or retain the PED block
  - [ ] 9.1 Build/schema-validate `PED-EVIDENCE-v1` with state history, safe PFG/DHO/private-sheet references, fingerprints/status, bounded polling, request/result, delivery, renewal/recovery, exceptions, and reviewer-attestation IDs. **Execution class:** `evidence-publication`. **Inputs:** validated PED chain and supplied reviewer attestations. **Outputs:** `docs/audits/phase-3-4/production-email-dns/<change-id>/PED-EVIDENCE-v1.json` with schema version/artifact ID/hash. (PED-REQ-009–012)
  - [ ] 9.2 Retain the explicit launch block unless Infrastructure, Operational, and launch-owner attestations and every required transition validate. **Execution class:** `evidence-validation`. **Inputs:** candidate PED evidence. **Outputs:** launch-block status. (PED-REQ-001–002, PED-REQ-009)

## Coverage Summary

| Requirement | Tasks |
| --- | --- |
| PED-REQ-001–003 | 1–2, 5 |
| PED-REQ-004–006 | 3–6, 8 |
| PED-REQ-007–008 | 7–8 |
| PED-REQ-009–010 | 2, 6–9 |
| PED-REQ-011–012 | 1, 3, 5, 9 |
