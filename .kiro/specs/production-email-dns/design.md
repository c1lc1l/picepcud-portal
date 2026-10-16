# Production Email and DNS Design

## Overview

PED owns production DNS state, its access-controlled private change sheet, and PED evidence. Provider and human changes are manual gates. PED requests DHO-owned deployments and consumes the returned route artifact; it never deploys.

## Ownership and Artifact Paths

| Artifact/action | Owner | Location/reference |
| --- | --- | --- |
| DNS state history | PED | PED change record |
| Exact DNS tuples/private sheet | PED DNS owner | External access-controlled store; opaque reference only in Git |
| PED evidence | PED | `docs/audits/phase-3-4/production-email-dns/<change-id>/PED-EVIDENCE-v1.json` |
| PED-to-DHO redeployment request | PED | `docs/audits/phase-3-4/production-email-dns/<change-id>/PED-DHO-REDEPLOYMENT-REQUEST-v1.json` |
| Deployments/redeployments and records | DHO | DHO namespace/provider records |
| PFG governance | PFG | Referenced by version/hash |

## State Model and Transition Table

```ts
type ProductionMailState =
  | "blocked-inputs"
  | "ready-for-record-capture"
  | "authorized-for-dns-change"
  | "propagating"
  | "domain-verified"
  | "sender-enabled"
  | "delivery-verified"
  | "incident-blocked";
```

| From | To | Required supplied evidence/attestation | External effect | Failure destination |
| --- | --- | --- | --- | --- |
| `blocked-inputs` | `ready-for-record-capture` | Complete prerequisite matrix and owner attestations | None | `blocked-inputs` |
| `ready-for-record-capture` | `authorized-for-dns-change` | Current private-sheet fingerprint, zone snapshot hash, DNS authorization | None | `blocked-inputs` |
| `authorized-for-dns-change` | `propagating` | Immediate no-drift check and DNS-owner action record | DNS tuples applied manually | `incident-blocked` if partial; otherwise `authorized-for-dns-change` |
| `propagating` | `domain-verified` | Bounded polling result; exact domain, DNS, hosting and HTTPS verified | None | `propagating` on timeout; `incident-blocked` on conflict |
| `domain-verified` | `sender-enabled` | Sender-enable attestation, config status, fresh DHO route after requested redeploy | Provider/config change manual; DHO deploys | `incident-blocked` |
| `sender-enabled` | `delivery-verified` | Controlled-delivery attestation and sanitized one-message result | One controlled dispatch | `incident-blocked` |
| `delivery-verified` | `incident-blocked` | Incident record | Dispatch disabled | `incident-blocked` |
| `incident-blocked` with `dnsMutationOccurred=false` | `ready-for-record-capture` | Recovery-owner attestation, complete prerequisites, and fresh provider capture scope | None | `incident-blocked` |
| `incident-blocked` with `dnsMutationOccurred=true` | `propagating` | Recovery-owner attestation, fresh fingerprint/authorization/action status, and new bounded polling policy | Owner-directed DNS forward-fix occurs only as a separate manual action | `incident-blocked` |

No other transition is legal. After any DNS tuple is applied, the workflow never regresses to a pre-mutation state automatically; it remains `propagating` or moves to `incident-blocked` for owner-directed forward-fix.

## Provider Prerequisite Matrix

| Prerequisite | Manual/provider owner | Automated read-only verification |
| --- | --- | --- |
| Controlled domain and DNS access | DNS owner | Ownership/access attestation validity |
| Renewal payer/date | Renewal owner | Attestation fields and expiry |
| Current zone and provider records | DNS/mail/hosting owners | Fingerprint/provenance/schema |
| Private change sheet | DNS owner | Opaque reference, access class, fingerprint |
| PFG production binding | PFG/project owner | Version/hash/target/allowlist coherence |
| DHO production deployment | DHO | Fresh route artifact, commit, production, readiness, supersession |
| Approved role sender/config | Mail owner | Domain/sandbox/test-recipient fail-closed status |
| Controlled-test officer/recipient | Launch owner | Authorization scope; recipient remains server-side |
| Recovery/rollback owner | Launch owner | Attestation scope/window |

No executable PED task changes provider settings.

## Private Provider Record Contract

The private sheet stores exact purpose, provider, zone, type, name, value, TTL, capture time, source/account identity, and per-tuple apply result. The committed artifact stores only `privateSheetRef`, access classification, provider/purpose/count, cryptographic record-set fingerprint, capture time, and status. Any tuple or zone change produces a new fingerprint and invalidates authorization.

## Scoped Attestations

All attestations require type/version, authorization ID, operation, operator, approver, commit, private environment, `targetRefHash`, `allowlistVersion`, issue/expiry/change window, and recovery owner. DNS authorization also binds domain label and record fingerprint. Controlled delivery binds the fresh DHO route ID/hash and sender-status hash. The full environment, target, addresses, and tuples remain private.

## Bounded DNS Polling

A required polling-policy artifact contains:

```ts
type DnsPollingPolicy = Readonly<{
  artifactType: "PED-DNS-POLLING-POLICY-v1";
  schemaVersion: "1.0";
  startIntervalSeconds: number;
  maximumIntervalSeconds: number;
  maximumObservationSeconds: number;
  backoff: "fixed" | "exponential";
  authoritativeSources: readonly string[];
  approvedBy: string;
}>;
```

All numeric limits must be positive and finite, and current elapsed time must never exceed `maximumObservationSeconds`. Polling records start/end, attempt count, cadence, sources, final safe status/fingerprint, owner, and next review time. Timeout retains `propagating`; sender enablement, redeployment request, and delivery remain blocked. Continued observation requires a new bounded policy/window, not an unbounded loop.

## DNS and Sender Workflow

1. Validate prerequisites; remain `blocked-inputs` on any gap.
2. DNS owner captures current zone/provider tuples privately.
3. Reviewer verifies provenance/conflicts and fingerprint.
4. Validate supplied DNS authorization.
5. Read-only recheck zone drift immediately before the manual DNS action.
6. DNS owner applies only approved tuples and records per-tuple result privately.
7. Run bounded read-only polling and exact-domain/HTTPS verification.
8. Validate sender-enable attestation; mail owner changes provider/server config manually.
9. PED creates a redeployment request; DHO validates its own authorization, deploys, and returns fresh `DHO-ROUTE-TARGET-v1`.
10. PED read-only validates the returned production route, config, sender, and links.
11. Validate controlled-delivery attestation and dispatch exactly one server-resolved message.
12. Publish evidence and validate reviewer attestations.

## DHO Redeployment Request/Response

```ts
type PedRedeploymentRequest = Readonly<{
  artifactType: "PED-DHO-REDEPLOYMENT-REQUEST-v1";
  schemaVersion: "1.0";
  requestId: string;
  requestHash: string;
  changeId: string;
  commitSha: string;
  environment: "production";
  targetRefHash: string;
  allowlistVersion: string;
  configurationStatusHash: string;
  reason: string;
  requiredChecks: readonly string[];
  requester: string;
  authorizationId: string;
  issuedAt: string;
  expiresAt: string;
  changeWindow: string;
}>;
```

DHO returns a fresh production `DHO-ROUTE-TARGET-v1` referencing its deployment record/request result. PED can validate or reject that artifact only. It cannot call the deployment provider or mark completion. Every fresh deployment invalidates prior delivery authorization/evidence.

## Read-Only Provider Verification

Executable checks read provider/DNS status and verify schema, fingerprint, domain, sender, HTTPS, links, target, and DHO artifact freshness. Mutation-capable DNS/provider/deployment adapters are absent from their dependency container. Human/provider actions provide attestations/status records for validation.

## Controlled Delivery

Production configuration requires server-only API key, production PFG/DHO target, exact verified role sender, no `TEST_EMAIL_TO`, no sandbox sender, and server-side recipient resolution. One authorized message records only sanitized state and provider message-ID hash. Delivery/retry failure does not reverse payment approval or accept a client recipient.

## Recovery

- Partial DNS: preserve completed/unrelated tuples; stay `propagating` or enter `incident-blocked`; use fresh provider output and authorization.
- Propagation timeout: record owner/next review and start a new bounded observation window when authorized.
- Sender/config defect or key exposure: disable dispatch, correct/rotate manually, request DHO-owned clean redeployment, validate fresh route, and reauthorize delivery.
- Domain/renewal loss: disable sender and remain `incident-blocked`.
- Delivery failure: retain approval truth and use the server-side admin retry path.

Automation never guesses values, approvals, rollback, or replacement records.

## Manual Gate — Not an Executable Kiro Task

Domain/renewal decisions, DNS access, tuple capture/review, DNS application, provider setting changes, sender enablement, delivery approval, recovery choice, and final reviewer/launch decisions are non-checkbox gates. PED executable tasks validate supplied scoped attestations and read-only provider state and remain blocked when absent.

## Evidence Contract

`PED-EVIDENCE-v1` contains artifact/version/ID/hash, change ID, state history, PFG and DHO safe references, private-sheet opaque reference/fingerprint, provider purposes/count/status, authorization IDs, polling policy/result, redeployment request/result references, sender/config status, controlled-delivery status/message-ID hash, renewal/recovery status, reviewer-attestation IDs, exceptions, and publication time.

It excludes exact tuples, account credentials, keys, full addresses, message content, member/payment PII, tokens, and raw provider output.

## Correctness Properties

1. Missing prerequisites prevent movement beyond `blocked-inputs` and all effects.
2. Every legal transition matches the explicit table.
3. DNS effects match the authorized fingerprint; drift invalidates authorization.
4. Polling always terminates within its finite policy window.
5. PED never constructs/calls deployment capability.
6. Sender/delivery are unreachable before exact-domain verification and a fresh DHO route.
7. Delivery failure preserves payment approval and recipient isolation.
8. Evidence excludes all prohibited values.

## Requirement Traceability

| Design element | Requirements |
| --- | --- |
| State/prerequisites/manual gates | PED-REQ-001–002, PED-REQ-011–012 |
| Private sheet/DNS/polling | PED-REQ-003, PED-REQ-005, PED-REQ-011 |
| Mail configuration/sender | PED-REQ-004, PED-REQ-006 |
| DHO request/response | PED-REQ-010 |
| Delivery/recovery | PED-REQ-007–008 |
| Evidence | PED-REQ-009 |
