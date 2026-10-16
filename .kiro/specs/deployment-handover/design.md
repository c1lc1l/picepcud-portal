# Deployment Handover Design

## Overview and Phase Graph

DHO is the sole deployment/deployment-record owner. Its two phases break the DHO/STG cycle:

```text
PFG contracts -> DHO Phase A -> DHO-ROUTE-TARGET-v1
                              -> STG rehearsal/cleanup
                              -> STG-WORKFLOW-EVIDENCE-v1
              -> DHO Phase B -> handover evidence
```

Phase A never depends on STG evidence. Phase B never accepts prose/screenshot substitution for the versioned STG artifact.

## Ownership and Artifact Paths

| Artifact/action | Owner | Canonical path |
| --- | --- | --- |
| Deployments, redeployments, deployment records | DHO | `docs/audits/phase-3-4/deployment-handover/<commit>/<run-id>/DHO-DEPLOYMENT-RECORD-v1.json` |
| Route/lifecycle schemas | DHO | `docs/contracts/dho/DHO-ROUTE-TARGET-v1.schema.json` and `docs/contracts/dho/DHO-ROUTE-LIFECYCLE-v1.schema.json` |
| Route target | DHO Phase A | `docs/audits/phase-3-4/deployment-handover/<commit>/<run-id>/DHO-ROUTE-TARGET-v1.json` |
| Current route lifecycle | DHO Phase A/lifecycle owner | `docs/audits/phase-3-4/deployment-handover/<commit>/<run-id>/DHO-ROUTE-LIFECYCLE-v1.json` |
| Handover evidence | DHO Phase B | `docs/audits/phase-3-4/deployment-handover/<commit>/<run-id>/DHO-HANDOVER-EVIDENCE-v1.json` |
| Staging manifest/evidence | STG | STG namespace; DHO reads only |
| DNS state/private sheet/evidence | PED | PED namespace; DHO references only |

PED redeployment requests are inputs. DHO alone authorizes, executes, records, supersedes, and returns deployment artifacts.

## `DHO-ROUTE-TARGET-v1`

```ts
type RouteTargetArtifact = Readonly<{
  artifactType: "DHO-ROUTE-TARGET-v1";
  schemaVersion: "1.0";
  artifactId: string;
  artifactHash: string;
  kind: "local-production" | "preview" | "production-deployment";
  environment: "local" | "test" | "staging" | "production";
  commitSha: string;
  origin: string;
  targetRefHash: string;
  allowlistVersion: string;
  pfgBindingArtifactId: string;
  pfgBindingArtifactHash: string;
  deploymentRecordId: string;
  migrationRangeHash: string;
  authOriginStatusHash: string;
  readiness: "ready";
  allowedExecutionClass: "stg-local-rehearsal" | "stg-cloud-rehearsal" | "read-only-release-smoke";
  lifecycleState: "retained-for-stg" | "active-production";
  lifecycleOwner: string;
  issuedAt: string;
  expiresAt: string;
  maximumLifetimeSeconds: number;
  teardownTrigger: string;
  supersedesArtifactId: string;
  superseded: false;
}>;
```

All fields are required. For the first artifact, `supersedesArtifactId` uses the schema-defined sentinel `none`; omission is invalid. Production always uses `read-only-release-smoke`.

Current status is supplied by a second required artifact:

```ts
type RouteLifecycleArtifact = Readonly<{
  artifactType: "DHO-ROUTE-LIFECYCLE-v1";
  schemaVersion: "1.0";
  artifactId: string;
  artifactHash: string;
  routeArtifactId: string;
  routeArtifactHash: string;
  state: "retained-for-stg" | "active-production" | "closed" | "expired" | "superseded";
  observedAt: string;
  expiresAt: string;
  lifecycleOwner: string;
  supersedingRouteArtifactId: string;
}>;
```

Every consumer re-reads and validates the current lifecycle ID/hash immediately before an effect. A stopped, closed, expired, or superseded target cannot be consumed as ready even when its immutable route artifact remains within its original expiry.

## Authorization Contracts

### Migration authorization

```ts
type MigrationAuthorization = Readonly<{
  attestationType: "DHO-MIGRATION-AUTHORIZATION-v1";
  schemaVersion: "1.0";
  authorizationId: string;
  operation: "apply-migrations";
  operator: string;
  approver: string;
  commitSha: string;
  environment: "local" | "test" | "staging" | "production";
  targetRefHash: string;
  allowlistVersion: string;
  migrationHashes: readonly string[];
  migrationRangeStart: string;
  migrationRangeEnd: string;
  issuedAt: string;
  expiresAt: string;
  changeWindow: string;
  recoveryOwner: string;
}>;
```

`assertAuthorizedMigrationTarget` validates exact target, ordered hashes/range, commit, operator, expiry/window, and recovery owner before a migration client exists.

Deployment/redeployment authorization has the same identity/timing fields plus operation (`deploy` or `redeploy`), deployment class, and request reference. Human decisions are private attestations; committed evidence uses safe IDs/hashes.

## Provider Prerequisite Matrix

| Prerequisite | Manual/provider owner | Automated read-only validation |
| --- | --- | --- |
| PFG binding, allowlist, budget | PFG/project owner | Version/hash/environment/headroom |
| Candidate/lockfile | Deployment owner | Clean commit and lockfile identity |
| Provider project/account | Deployment owner | Account/target status and free-tier policy |
| Auth Site URL/redirect/callback | Auth/provider owner | Exact origin status fingerprint |
| Migration authorization/recovery | Migration/recovery owner | Schema, range, hashes, expiry |
| Deployment authorization | Deployment owner | Commit/target/window/request scope |
| HTTPS/readiness/metadata | Provider owner | Exact commit, origin, bounded health |
| PED redeploy request | PED requester | Request schema/hash/authorization when present |

Executable tasks do not change provider settings. They validate supplied attestations and observed state.

## Phase A — Publish Route Target

1. Freeze candidate commit, lockfile, migration hashes/range, target, operators, reviewers, and change window.
2. Validate PFG contracts and provider prerequisite matrix.
3. Read-only verify Auth-origin settings supplied through a manual provider gate.
4. For production, validate migration authorization, invoke `assertAuthorizedMigrationTarget`, and apply sequentially; stop on first failure. For local/test/staging, record the expected hashes/range and delegate the sole schema-bootstrap mutation to STG after route publication.
5. Validate deployment authorization and build/deploy exact commit.
6. Validate provider/local commit metadata and bounded readiness.
7. Establish an owned, bounded route lease.
8. Publish schema-valid `DHO-ROUTE-TARGET-v1` and current `DHO-ROUTE-LIFECYCLE-v1`.

For a PED request, DHO records request/result linkage and returns a fresh production route artifact. PED never executes this phase.

## One-Command Local Route Harness

Local verification uses one command such as `npm run verify:route-local -- --commit <sha> --environment <local-or-test>`. The implementation is one bounded harness process, not a foreground-server task:

1. Perform clean lockfile install/build for the exact commit.
2. Select a free port and spawn the production server directly with `shell: false`, host `127.0.0.1`, isolated local/test configuration, and a new process group/job object suitable for Windows process-tree control.
3. Poll readiness until the configured readiness timeout; abort on child exit.
4. Publish ephemeral `DHO-ROUTE-TARGET-v1` and current `DHO-ROUTE-LIFECYCLE-v1` to the child invocation, run DHO read-only checks, invoke the STG execute-mode local rehearsal and cleanup in-process or as a bounded child, and wait for `STG-WORKFLOW-EVIDENCE-v1` within the total harness timeout.
5. In `finally`, terminate the complete process tree on success, failure, timeout, or cancellation.
6. Verify every descendant exited and bind/listen on the same port to prove release.
7. Fail route evidence if process-tree termination or port rebind fails.

No task starts `next start` or another server in the foreground. A local target used by STG must remain owned by this bounded DHO harness for the full rehearsal in the same command; otherwise DHO publishes no consumable local route artifact.

## Preview and Production Lifecycle

Preview publication requires immutable exact-commit provider metadata, HTTPS readiness, owner, expiry, maximum lifetime, and teardown trigger. Phase A retains it for STG only until expiry. Phase B, abort, or expiry performs close/retain processing. Retention requires a fresh scoped attestation and a new bounded expiry. Closed/expired previews are invalidated; no mutable alias can prove commit identity.

Production deployments remain `active-production` but a new deployment supersedes the old route artifact. Production smoke is read-only.

## Phase B — Consume STG and Handover

1. Validate supported `STG-WORKFLOW-EVIDENCE-v1` schema/artifact hash and its current `DHO-ROUTE-LIFECYCLE-v1` reference.
2. Require its DHO route and lifecycle IDs/hashes, commit, target hash, allowlist version, and environment classification to match Phase A.
3. Require zero remaining fixtures, preserved-admin pass, redaction pass, and valid reviewer attestation.
4. Run DHO-owned read-only route/release smoke using `assertProductionReleaseTarget` for production.
5. Validate Security, Data, Quality, Operational, Infrastructure, and launch attestations.
6. Publish DHO handover evidence and close/retain bounded preview/local resources.
7. Retain PED as a referenced launch dependency until PED evidence closes.

Local/test STG evidence may close rehearsal preparation only; it is never cloud-staging evidence.

## Read-Only Smoke Structure

Production smoke invokes exactly `assertProductionReleaseTarget` at its effect boundary and receives only that API's HTTP/read-only status dependencies. Database/Auth/Storage mutation factories, migration adapters, fixture builders, and mail transports are absent. The DHO smoke adapter runs the PFG conformance harness, and tests assert construction count and call count zero. Checks cover public routes, callback destination, anonymous/member/admin route matrix, receipt privacy, event banner access, and existing transactional-link destinations.

## Manual Gate — Not an Executable Kiro Task

Candidate approval, provider project/config changes, Auth settings, migration authorization, deployment/redeployment authorization, recovery choice, preview retention, and handover reviewer decisions are supplied attestations. They are not checkboxes. Executable tasks validate them and remain blocked until supplied and valid.

## Invalidation and Recovery

Commit, migration set/result, target, binding, allowlist, provider config, Auth origin, credential, readiness, deployment, or PED configuration change invalidates affected route/STG/handover evidence. Recovery-owner attestation selects rollback only when schema-compatible; otherwise forward-fix. A fresh deployment creates a new route artifact and supersedes the prior one.

## Evidence and Redaction

DHO evidence includes artifact IDs/hashes/versions, commit/date, safe target identity, migration range hash, deployment/request records, readiness/lifecycle, procedures/results, authorization and reviewer references, exceptions, and deferred findings. It excludes secrets, full references, addresses/PII, tokens, receipts, raw provider payloads, and PED private values.

## Correctness Properties

1. Phase A route identity always equals the deployed/built commit and PFG binding.
2. Phase B accepts only STG evidence referencing that exact route artifact.
3. Production smoke constructs/calls zero effect-capable dependencies.
4. Every local outcome terminates its process tree and permits port rebind.
5. Every preview has bounded ownership/expiry and cannot outlive policy unnoticed.
6. Every migration/deployment matches a valid scoped attestation.
7. Redeployment is single-writer DHO behavior.

## Requirement Traceability

| Design element | Requirements |
| --- | --- |
| Route contract/lifecycle | DHO-REQ-001, DHO-REQ-010, DHO-REQ-012 |
| Prerequisites/authorizations | DHO-REQ-002–004, DHO-REQ-012 |
| Local harness/read-only smoke | DHO-REQ-005, DHO-REQ-011 |
| Ownership/handback | DHO-REQ-006–007, DHO-REQ-010 |
| Recovery/evidence | DHO-REQ-008–009 |
