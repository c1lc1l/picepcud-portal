# Preflight Environment Guards Design

## Overview

PFG is an upstream control-plane producer. It publishes two versioned contracts and a consumer conformance harness without implementing or waiting for downstream integrations.

```text
PFG governance + provider attestations
  -> PFG-TARGET-BINDING-v1
  -> PFG-NONPROD-GUARD-v1
  -> guard conformance harness
  -> downstream consumers
```

## Ownership and Paths

PFG is the sole writer of:

| Artifact | Canonical location |
| --- | --- |
| Environment matrix | `docs/operations/environment-matrix.md` |
| Project allowlist | `config/supabase-projects.json` |
| Decision register | `docs/operations/decision-register.md` |
| Free-tier budget | `docs/operations/free-tier-budget.md` |
| Capacity branch state | `docs/operations/PFG-STAGING-BRANCH-STATE-v1.json` |
| Shared evidence envelope | `docs/audits/phase-3-4/PFG-EVIDENCE-ENVELOPE-v1.schema.json` |
| Target-binding schema | `docs/contracts/pfg/PFG-TARGET-BINDING-v1.schema.json` |
| Guard schema | `docs/contracts/pfg/PFG-NONPROD-GUARD-v1.schema.json` |
| Conformance harness contract | `tests/conformance/pfg/PFG-GUARD-CONFORMANCE-HARNESS-v1.md` |
| PFG evidence | `docs/audits/phase-3-4/preflight/<commit>/<run-id>/PFG-PREFLIGHT-EVIDENCE-v1.json` |

STG owns manifests/run evidence, DHO owns deployment records/deployments, and PED owns DNS state/private sheets/PED evidence. Consumers reference PFG versions and hashes rather than copying these sources.

## Environment and Capacity Model

`bindTargetIdentity` recognizes `local`, `test`, `staging`, and `production` for read identity. Mutating non-production policy accepts only local/test/staging; production release policy is read-only.

The single capacity artifact has required fields:

```ts
type StagingBranchState = Readonly<{
  artifactType: "PFG-STAGING-BRANCH-STATE-v1";
  schemaVersion: "1.0";
  state: "enabled-free" | "blocked-capacity";
  allowanceVersion: string;
  observedAt: string;
  sourceReference: string;
  ownerAttestationId: string;
  bindingId: string;
}>;
```

The provider-slot observation, capacity decision, project creation/deletion, and allowlist approval are manual/provider gates. One executable validator checks either state; no mutually exclusive task branch exists.

## Published Contracts

### `PFG-TARGET-BINDING-v1`

```ts
type TargetBindingArtifact = Readonly<{
  artifactType: "PFG-TARGET-BINDING-v1";
  schemaVersion: "1.0";
  artifactId: string;
  artifactHash: string;
  bindingId: string;
  environment: "local" | "test" | "staging" | "production";
  targetRefHash: string;
  targetSuffix: string;
  allowlistVersion: string;
  originPolicy: "loopback-http" | "hosted-https";
  capacityState: "not-applicable" | "enabled-free" | "blocked-capacity";
  issuedAt: string;
  expiresAt: string;
  producerCommit: string;
}>;
```

The full project reference and endpoint values stay in private runtime state. They are never serialized into this evidence-safe artifact. Any required field change creates a new artifact ID/hash.

### `PFG-NONPROD-GUARD-v1`

The contract publishes these distinct entry points:

```ts
bindTargetIdentity(input): ReadonlyTargetIdentity
assertNonProductionMutationTarget(identity, operation): GuardedMutationDependencies
assertProductionReleaseTarget(identity): ReadonlyReleaseDependencies
assertAuthorizedMigrationTarget(identity, migrationAuthorization): GuardedMigrationDependencies
```

- `bindTargetIdentity` performs read-only identity binding for all four environments and never attests human intent.
- `assertNonProductionMutationTarget` rejects production and permits only declared fixture/rehearsal/cleanup capabilities.
- `assertProductionReleaseTarget` returns only read-only HTTP/config/status dependencies. Mutation and mail-dispatch constructors are absent.
- `assertAuthorizedMigrationTarget` validates exact identity and a supplied human migration authorization before returning migration dependencies.

The result captures validated values in private closure state. Consumers cannot reread process environment values through the result.

### Compatibility and errors

Every artifact has an exact `artifactType`, semantic `schemaVersion`, `artifactId`, and `artifactHash`. Consumers support declared versions and fail closed on unknown/incompatible versions. Stable errors include `CONFIGURATION_ERROR`, `TARGET_MISMATCH`, `PRODUCTION_REFUSED`, `CAPACITY_BLOCKED`, `AUTHORIZATION_INVALID`, `READ_ONLY_PROBE_FAILED`, `CONTRACT_VERSION_UNSUPPORTED`, and `INTERNAL_FAILURE`.

## Identity Binding Algorithm

1. Parse declared environment and requested execution class without constructing network clients.
2. Load one versioned allowlist entry and reject zero/multiple matches.
3. Parse every declared operative endpoint and database host/user.
4. Bind JWT claims or run an authenticated read-only identity probe for opaque credentials.
5. Validate application-origin policy and environment-specific email policy.
6. Produce the evidence-safe binding artifact and private `ReadonlyTargetIdentity`.
7. Apply the operation-specific assertion at the effect boundary.
8. Construct only the dependencies returned by that assertion.
9. Rebind/reassert before each independently resumable mutation phase.

A standalone preflight result never authorizes another process or later phase.

## Authorization Attestation Schema

PFG owns the shared validator, not the human decision:

```ts
type OperationAuthorization = Readonly<{
  attestationType: "OPERATION-AUTHORIZATION-v1";
  schemaVersion: "1.0";
  authorizationId: string;
  operation: string;
  operator: string;
  approver: string;
  commitSha: string;
  environment: "local" | "test" | "staging" | "production";
  targetRefHash: string;
  allowlistVersion: string;
  issuedAt: string;
  expiresAt: string;
  changeWindow: string;
  recoveryOwner: string;
  scopeArtifactIds: readonly string[];
  scopeArtifactHashes: readonly string[];
  scopeHash: string;
}>;
```

Full environment/target/provider data remains in the private attestation store. `scopeArtifactIds`, `scopeArtifactHashes`, and `scopeHash` bind an approval to its exact route, run, schema, manifest, configuration, or migration instance as required by the owning operation. Committed evidence records only authorization ID and safe binding/hash/version references.

## Structural Non-Mutation

Plan/dry-run obtains a `ReadonlyPlanDependencies` container containing parsers, read-only probes, and redacted output only. Mutation-capable database/Auth/Storage/provider/DNS clients, manifest writers, and mail transports have no constructor path in this container. Tests assert both construction count and call count are zero. Plan can print intended phases but cannot create or update a manifest.

## Credential and Email Boundaries

The project owner retains the staging Admin secret. Browser testers may exercise unprivileged application behavior without receiving it. Local/test mail transport is an in-process mock. Controlled staging mail additionally needs STG authorization and always resolves to server-only `TEST_EMAIL_TO`. Production mail rules belong to PED.

## Manual Gate — Not an Executable Kiro Task

The following decisions/actions are supplied as scoped attestations and are never checkboxes in `tasks.md`: provider allowance observation, capacity decision, project creation/deletion, allowlist approval, credential provisioning/rotation, and PFG gate reviewer decision. Executable tasks validate the supplied artifacts and remain blocked when they are absent or invalid.

## Conformance Harness

The harness accepts a consumer adapter describing declared endpoints, client factories, phases, mode, and expected artifact versions. It proves:

- unsupported contract versions fail;
- all endpoints/credentials bind before effect-capable construction;
- consumer code cannot reread process values after binding;
- production is refused by non-production mutation policy;
- production release dependencies are read-only;
- plan mode has mutation/mail/manifest construction and call counts of zero;
- each resumable mutation phase re-guards;
- standalone preflight cannot replace internal guarding;
- supplied authorization scope is exact; and
- hostile values are redacted.

PFG closure runs the harness against a PFG-owned reference adapter only. Consumer integrations run the same harness in their own specs.

## Evidence and Recovery

PFG evidence uses the PFG namespace and shared envelope. It records contract versions, binding/artifact IDs/hashes, allowlist/branch-state versions, commit, UTC time, execution class, expected/actual result, validator version, reviewer-attestation reference, exceptions, and deferred findings. It excludes secrets, full references, addresses, PII, tokens, receipts, credential-bearing URLs, and provider payloads.

Any environment, endpoint, key, allowlist, target, capacity, or contract-version change invalidates prior binding results. Recovery rotates exposed secrets, corrects governance/provider state, and performs a full fresh bind; it never changes target silently or buys capacity.

## Correctness Properties

1. Identity binding is deterministic for one allowlist version and declared input set.
2. No effect-capable dependency exists before the applicable assertion succeeds.
3. Production never passes non-production mutation policy.
4. Plan constructs/calls zero mutation, manifest-write, and mail dependencies.
5. Authorization identity never substitutes for target identity or vice versa.
6. Evidence never contains prohibited values.

## Requirement Traceability

| Design element | Requirements |
| --- | --- |
| Ownership, branch state | PFG-REQ-002, PFG-REQ-009–010 |
| Binding contract | PFG-REQ-001, PFG-REQ-003–004, PFG-REQ-012 |
| Split APIs/attestations | PFG-REQ-005, PFG-REQ-013 |
| Structural non-mutation/email/custody | PFG-REQ-006–008 |
| Harness, failure, recovery | PFG-REQ-011–012 |
