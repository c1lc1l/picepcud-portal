# Staging Operations Design

## Overview and Artifact Pipeline

STG is a consumer/executor between DHO phases:

```text
PFG-TARGET-BINDING-v1 + PFG-NONPROD-GUARD-v1
                         + DHO-ROUTE-TARGET-v1
                         + DHO-ROUTE-LIFECYCLE-v1 (DHO Phase A/live status)
  -> STG plan or staging workflow rehearsal
  -> cleanup/reconciliation
  -> STG-WORKFLOW-EVIDENCE-v1
  -> DHO Phase B
```

STG validates exact versions, IDs, hashes, commit, environment, target binding, route readiness, and lease before work. It never writes PFG governance or DHO deployment records.

## Operating Model

| Execution class | Target | Effect policy | Mail | Evidence |
| --- | --- | --- | --- | --- |
| `plan` | Eligible local/test/staging | Read-only; no manifest write | No transport | Plan output only |
| `execute-local-rehearsal` | Local/test | Disposable fixtures | Mock only | Local/test rehearsal |
| `execute-staging-rehearsal` | Dedicated enabled staging | Authorized fixtures | Forced `TEST_EMAIL_TO` | Cloud-staging rehearsal |
| production | Production | Refused | Refused | None |

The mutating operation is always called **staging workflow rehearsal**, mode **execute**. “Dry run” is synonymous only with zero-effect `plan`.

## Ownership and Paths

- PFG owns environment matrix, allowlist, decision register, budget/branch state, and shared envelope.
- STG owns `.staging/manifests/<run-id>/STG-FIXTURE-MANIFEST-v1.json` (gitignored), gitignored machine-readable run artifacts under `.staging/runs/<run-id>/`, and `docs/audits/phase-3-4/staging/<commit>/<run-id>/STG-WORKFLOW-EVIDENCE-v1.json`.
- DHO owns deployments, deployment records, route targets, previews, and local harnesses.
- PED owns production DNS/mail state and evidence.

## Provider Prerequisite Matrix

| Prerequisite | Owner/action class | STG executable verification | Required reference |
| --- | --- | --- | --- |
| Capacity and target allowlist | PFG/manual provider gate | Validate PFG branch/binding | PFG artifact ID/hash/version |
| Route deployment/readiness | DHO Phase A | Validate DHO route and lease read-only | DHO artifact ID/hash/version |
| Auth Site URL/redirect/callback | Provider owner/manual setting | Read-only compare with route origin | Attestation ID + status fingerprint |
| Database schema/migrations | Migration owner/manual authorization | Probe, authorized bootstrap, digest | Migration attestation + hashes/range |
| Private receipt bucket/policies | Provider owner/manual creation/config | Read-only capability/privacy checks | Provider-state fingerprint |
| Preserved admin | Project owner | Read-only Auth/profile/role check | Private UUID hash/reference |
| Controlled Resend readiness | Mail owner/manual config | Read-only sender/sandbox/recipient policy check | Authorization/config status hash |
| Luma URL | Event owner | Validate HTTPS URL only | Safe URL status |
| Fixture QR | Operations owner | Verify non-payable label and asset isolation | Artifact hash |

Project creation and provider setting changes never occur through STG executable tasks.

## Authorization Contract

Seed, schema bootstrap, controlled mail, and cleanup use separate required `OPERATION-AUTHORIZATION-v1` attestations. Each binds operation, operator, approver, commit, private environment, `targetRefHash`, `allowlistVersion`, issue/expiry/change window, recovery owner, and exact scope IDs/hashes. Seed binds DHO route/lifecycle, run, and schema digest; schema bootstrap binds DHO route/lifecycle plus ordered migration hashes/range; controlled mail additionally binds configuration/recipient-policy fingerprint; cleanup binds DHO route/lifecycle and manifest/run ID+hash. Evidence keeps only safe IDs/hashes. Cross-run, cross-route, cross-schema, cross-config, and cross-manifest replay fails.

## Schema Bootstrap

After a provider project is created and before seed:

1. Validate PFG and DHO artifacts and schema-bootstrap authorization.
2. Enumerate the exact ordered candidate migration set and compute its digest.
3. Run a read-only schema probe.
4. If the required schema is absent, invoke `assertAuthorizedMigrationTarget` and apply migrations sequentially to local/test or dedicated staging only.
5. Stop on first failure and publish no seed-ready result.
6. Read-only verify required tables, functions, RLS policies, private receipt bucket, and Storage policies.
7. Record migration hashes/range and resulting schema digest in the manifest/evidence chain.

## Structural Plan Mode

Plan receives only read-only identity, schema/status probes, manifest parser, and redacted renderer. It receives no manifest writer, mutation-capable database/Auth/Storage client, provider-setting adapter, deployment adapter, or mail transport. Tests assert construction count and call count zero for every excluded adapter. Plan can validate an existing manifest but cannot create or alter one.

## Manifest Contract

```ts
type FixtureManifest = Readonly<{
  artifactType: "STG-FIXTURE-MANIFEST-v1";
  schemaVersion: "1.0";
  artifactId: string;
  artifactHash: string;
  runId: string;
  sourceCommit: string;
  environment: "local" | "test" | "staging";
  targetRefHash: string;
  allowlistVersion: string;
  pfgBindingArtifactId: string;
  pfgBindingArtifactHash: string;
  pfgGuardVersion: string;
  dhoRouteArtifactId: string;
  dhoRouteArtifactHash: string;
  dhoLifecycleArtifactId: string;
  dhoLifecycleArtifactHash: string;
  schemaDigest: string;
  preservedAdminRefHash: string;
  phases: Readonly<Record<string, "planned" | "started" | "complete" | "failed">>;
  authUserIds: readonly string[];
  profileIds: readonly string[];
  paymentIds: readonly string[];
  eventIds: readonly string[];
  storageObjectKeys: readonly string[];
}>;
```

Only execute mode can create/update the manifest. Writes are create-new or atomic replace. Interrupted phases reconcile using immutable IDs and deterministic private correlation keys; duplicates, ambiguity, and unowned resources abort.

## Rehearsal Workflow

After schema/provider readiness and authorized seed:

1. Create disposable users/profiles, two pending payments and private receipt objects, events, and required display fixture.
2. Verify registration/confirmation and returning login against the exact route.
3. Submit two fixture payments; approve one and reject one.
4. Exercise controlled mail only under its own authorization and recipient override.
5. Validate roster and liquidation CSVs.
6. Publish an active future event and verify public/member visibility.
7. Follow its HTTPS Luma handoff without testing Luma ticketing.
8. Verify the fixture QR label when in scope.
9. Verify the preserved admin before and after rehearsal.

A failed case stops dependent work. Cleanup is never implicitly authorized.

## Cleanup Saga

Cleanup separately revalidates PFG artifacts, `DHO-ROUTE-TARGET-v1`, current `DHO-ROUTE-LIFECYCLE-v1`, its authorization, manifest/commit/schema binding, and preserved admin before each resumable phase:

1. Reconcile exact expected resources.
2. Delete manifest-listed Storage keys.
3. Delete manifest-listed Auth users, explicitly excluding preserved admin.
4. Transactionally delete remaining manifest-listed rows after expected-cascade checks.
5. Prove zero remaining manifest resources and preserved-admin integrity.

Already-absent resources are skips. Partial service success remains recorded; no cross-service rollback/atomicity is claimed.

## Evidence Contract

`STG-WORKFLOW-EVIDENCE-v1` contains:

```ts
type StagingWorkflowEvidence = Readonly<{
  artifactType: "STG-WORKFLOW-EVIDENCE-v1";
  schemaVersion: "1.0";
  artifactId: string;
  artifactHash: string;
  runId: string;
  sourceCommit: string;
  environmentClass: "local-test-rehearsal" | "dedicated-staging-rehearsal";
  executionMode: "execute";
  pfgBindingArtifactId: string;
  pfgBindingArtifactHash: string;
  pfgGuardVersion: string;
  allowlistVersion: string;
  targetRefHash: string;
  dhoRouteArtifactId: string;
  dhoRouteArtifactHash: string;
  dhoLifecycleArtifactId: string;
  dhoLifecycleArtifactHash: string;
  schemaDigest: string;
  migrationRangeHash: string;
  manifestHash: string;
  authorizationIds: readonly string[];
  caseResults: Readonly<Record<string, "pass" | "fail" | "blocked">>;
  cleanupRemainingCount: number;
  preservedAdminResult: "pass" | "fail";
  operator: string;
  reviewerAttestationId: string;
  redactionResult: "pass" | "fail";
  exceptions: readonly string[];
  deferredFindings: readonly string[];
  publishedAt: string;
}>;
```

Publication rejects local/staging misclassification, unsupported upstream versions, route/binding mismatch, stale/closed route, nonzero cleanup, failed admin integrity, invalid reviewer attestation, or redaction failure.

## Manual Gate — Not an Executable Kiro Task

Capacity/project creation, Auth/Storage/Resend provider changes, schema/seed/mail/cleanup authorization, browser workflow actions, and reviewer approval are supplied human/provider attestations. They are prose gates, not checkboxes. Agent tasks only validate supplied artifacts and remain blocked until valid input exists.

## Recovery and Invalidation

A commit, target, allowlist, route, schema, provider config, credential, or authorization change invalidates affected plan/manifest/evidence. DHO owns route lifecycle; STG requests no restart and never starts/tears down a route target. The current operator contains a run, project owner handles staging/credential recovery, and application maintainer handles code forward-fix.

## Correctness Properties

1. Plan constructs and calls no effect-capable dependency and writes no manifest.
2. Every mutation matches PFG binding, DHO route, commit, schema, operation authorization, and allowlist version.
3. Seed/cleanup access only manifest-owned immutable IDs/keys.
4. Interrupted reruns converge or abort without touching unowned resources.
5. Production targets cannot enter rehearsal.
6. Evidence references exactly the consumed route artifact and classifies its environment accurately.
7. Cleanup reaches zero while preserving admin integrity.

## Requirement Traceability

| Design element | Requirements |
| --- | --- |
| Pipeline, ownership, prerequisite matrix | STG-REQ-001–003, STG-REQ-011–012 |
| Plan and authorization | STG-REQ-002, STG-REQ-004 |
| Bootstrap, manifest, seed | STG-REQ-005, STG-REQ-012 |
| Rehearsal/mail | STG-REQ-006–007 |
| Cleanup/recovery | STG-REQ-008–009 |
| Evidence contract | STG-REQ-010–011 |
