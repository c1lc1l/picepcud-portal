# Production Email and DNS Requirements

## Introduction

Production Email and DNS (PED) governs a blocked, human-authorized transition to verified production DNS and controlled transactional delivery. PED owns DNS state, its external private change sheet, and PED evidence. It requests DHO-owned redeployments and never deploys.

Requirement IDs are stable; amendments add IDs.

## Scope and Dependencies

PED consumes PFG identity/governance references and DHO deployment/route artifacts. `server-actions-email-exports` retains application approval, recipient resolution, delivery persistence, and retry ownership. PED is the single writer for DNS state, the private provider change sheet, and `PED-EVIDENCE-v1` under `docs/audits/phase-3-4/production-email-dns/<change-id>/`.

PED does not buy a domain, guess records, mutate application data, write deployment records, execute a deployment/redeployment, or copy private DNS values into committed evidence.

## Requirements

### PED-REQ-001: Explicit blocked prerequisites

1. **PED-AC-001.1:** Missing controlled domain, DNS owner/access, renewal owner/date, approved role sender, change authorizer, test officer, recovery owner, provider output, or current DHO route/deployment artifact SHALL retain `blocked-inputs` and permit no external mutation or delivery.
2. **PED-AC-001.2:** Placeholders and inferred provider/domain values SHALL be rejected.

### PED-REQ-002: Scoped human authorization boundaries

1. **PED-AC-002.1:** DNS application, sender enablement, controlled delivery, redeployment request, and gate closure SHALL each require a separate supplied attestation with schema/version, ID, operation, operator, approver, commit, environment, `targetRefHash`, `allowlistVersion`, issue/expiry/change window, and recovery owner; DNS changes also bind domain and record-set fingerprint.
2. **PED-AC-002.2:** Executable tasks SHALL validate attestations and remain blocked if absent, expired, malformed, or mismatched; automation SHALL not create approvals.
3. **PED-AC-002.3:** Environment and full target identity remain private; committed evidence stores safe references/hashes only.

### PED-REQ-003: Provider record provenance and private sheet

1. **PED-AC-003.1:** The DNS owner SHALL retain exact current provider tuples and provenance only in the access-controlled PED private change sheet.
2. **PED-AC-003.2:** PED evidence SHALL contain only an opaque private-sheet reference, provider/purpose/count, fingerprint, capture time, status, and authorization references.
3. **PED-AC-003.3:** Tuple or zone drift SHALL invalidate prior review and authorization.

### PED-REQ-004: Fail-closed production mail configuration

1. **PED-AC-004.1:** Production dispatch SHALL remain zero unless the API key is server-only, environment/target are production, the exact approved role sender belongs to the verified domain, and test/sandbox recipient/sender configuration is absent.
2. **PED-AC-004.2:** Exposure SHALL disable dispatch until rotation/removal, a DHO-owned clean redeployment, and fresh verification.

### PED-REQ-005: Controlled DNS application

1. **PED-AC-005.1:** Only the DNS owner, after a valid change attestation, SHALL apply exact reviewed provider tuples and preserve unrelated records.
2. **PED-AC-005.2:** A fresh read-only zone drift/conflict check SHALL occur immediately before application and block on mismatch.

### PED-REQ-006: Verification before sender enablement

1. **PED-AC-006.1:** Exact-domain verification, hosting ownership, HTTPS, DKIM, non-conflicting SPF, sender identity, and application-link origin SHALL pass before sender enablement.
2. **PED-AC-006.2:** Provider setting changes are manual gates; executable tasks SHALL perform read-only verification.

### PED-REQ-007: Controlled delivery and approval isolation

1. **PED-AC-007.1:** One controlled delivery SHALL require a valid attestation bound to the fresh DHO route/deployment artifact, commit, sender, operator, and window, and SHALL resolve the recipient server-side.
2. **PED-AC-007.2:** Delivery/retry failure SHALL preserve payment approval and recipient isolation and persist only sanitized status.

### PED-REQ-008: Non-atomic recovery

1. **PED-AC-008.1:** Partial DNS success SHALL record completed tuples privately, preserve known-good/unrelated records, and require owner-directed forward-fix or restoration from fresh provider output.
2. **PED-AC-008.2:** Propagation timeout, conflict, exposure, config defect, domain loss, or delivery failure SHALL enter/retain a blocked state and invalidate affected attestations/evidence.

### PED-REQ-009: PED evidence and launch gate

1. **PED-AC-009.1:** PED SHALL publish schema-valid `PED-EVIDENCE-v1` at `docs/audits/phase-3-4/production-email-dns/<change-id>/PED-EVIDENCE-v1.json` with state history, safe upstream artifact references, provider fingerprints/status, polling result, redeployment request/result references, delivery result, exceptions, recovery readiness, and reviewer attestation references.
2. **PED-AC-009.2:** Evidence SHALL exclude exact private tuples, account credentials, keys, full addresses, message content, PII, tokens, and raw provider output.
3. **PED-AC-009.3:** Launch closure SHALL remain blocked until supplied Infrastructure, Operational, and launch-owner attestations validate.

### PED-REQ-010: DHO-owned redeployment boundary

1. **PED-AC-010.1:** When sender/config/key work requires deployment, PED SHALL publish `docs/audits/phase-3-4/production-email-dns/<change-id>/PED-DHO-REDEPLOYMENT-REQUEST-v1.json`, bound to commit, environment, target hash, allowlist version, PED change ID, safe configuration fingerprint/status, reason, required checks, requester, authorization reference, and expiry/window.
2. **PED-AC-010.2:** DHO alone SHALL authorize and execute deployment/redeployment and own its records; PED SHALL wait for and validate a fresh, non-superseded production `DHO-ROUTE-TARGET-v1` response.
3. **PED-AC-010.3:** PED SHALL never invoke a deployment provider or mark deployment complete.
4. **PED-AC-010.4:** A fresh deployment SHALL invalidate prior controlled-delivery authorization and affected PED evidence.

### PED-REQ-011: Explicit state transitions and bounded polling

1. **PED-AC-011.1:** PED SHALL enforce the design transition table; invalid transitions SHALL fail closed.
2. **PED-AC-011.2:** Once any DNS tuple is applied, failures SHALL remain `propagating` or enter `incident-blocked`; they SHALL not regress to a pre-mutation state or claim automatic rollback.
3. **PED-AC-011.3:** Polling SHALL record start/end, approved cadence/backoff, maximum observation window, authoritative sources, final safe status/fingerprint, owner, and next review time.
4. **PED-AC-011.4:** Timeout SHALL remain blocked and prohibit sender enablement, redeployment request, and controlled delivery until exact-domain verification passes.

### PED-REQ-012: Provider prerequisite matrix and artifact classes

1. **PED-AC-012.1:** PED SHALL validate a matrix for domain control, DNS access, renewal, private-sheet reference, current provider records, DHO production route/deployment, verified HTTPS origin, sender/config state, delivery officer, and recovery ownership.
2. **PED-AC-012.2:** Artifact-consuming or artifact-publishing executable phases/leaves SHALL, where applicable, declare execution class, machine-readable artifact name/version/ID/hash, canonical discovery path, and output; human/provider actions SHALL remain non-checkbox manual gates.

## Requirement Traceability

| Requirement | Design sections | Task coverage |
| --- | --- | --- |
| PED-REQ-001–003, 012 | Prerequisites; private change control | 1–3 |
| PED-REQ-004, 006 | Configuration/provider verification | 4, 6 |
| PED-REQ-005, 011 | Transition table; bounded DNS workflow | 5 |
| PED-REQ-007 | Controlled delivery | 7 |
| PED-REQ-008 | Recovery | 8 |
| PED-REQ-009 | Evidence | 9 |
| PED-REQ-010 | DHO redeployment request/response | 6, 8 |
