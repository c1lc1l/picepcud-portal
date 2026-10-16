# Officer Directory Implementation Plan

## Execution Rules

Only executable Kiro tasks use checkboxes. Pure human evidence supply and approval appear under headings named `Manual Gate — not an executable Kiro task` and have no checkbox. Agent validation tasks must fail closed when a named gate artifact is absent, incomplete, stale, rejected, term-expired, or consent-expired.

This specification consumes `PHE-ART-TEST-FOUNDATION` and `PHE-ART-PUBLIC-NAVIGATION`, owned by `public-homepage-events`. Officer-directory tasks may add feature-scoped tests and one conditional navigation item through the recorded extension contract, but they must not add or replace package dependencies, shared test configuration, or the base public-navigation implementation.

Kiro prose dependencies are review guidance, not scheduler guarantees. Execute tasks individually in dependency order, especially at every manual gate and the final activation; do not use bulk execution across a gate.

## Tasks

- [ ] OD-T01. Read installed Next.js 16 guidance for App Router pages, Server Components, metadata, images, and client-boundary minimization.
  - Same-spec dependencies: none.
  - Validation: Record the installed documentation paths consulted in implementation notes.
  - _Requirements: 4.4, 6.2, 6.3_

- [ ] OD-T02. Verify and reuse the shared repository test foundation.
  - Same-spec dependencies: OD-T01.
  - Artifact dependency: `PHE-ART-TEST-FOUNDATION`.
  - Validation: Fail closed if the artifact is absent or its smoke test is not passing; add only officer feature fixtures/tests and execute the recorded command. Do not edit package manifests or shared test configuration in this spec.
  - _Requirements: 6.5_

- [ ] OD-T03. Define the typed blocked-by-default, term-bounded roster model and publication metadata.
  - Same-spec dependencies: OD-T01.
  - Validation: The production roster has explicit blocked status and an empty officer list; the candidate model includes term start/end, review metadata, approval evidence, initials permission, and per-headshot consent/source/attribution fields without profile data or invented identities.
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 2.1, 2.2, 2.3, 2.5_

- [ ] OD-T04. Implement roster, term, consent, and image-metadata validation with focused unit tests.
  - Same-spec dependencies: OD-T02, OD-T03.
  - Validation: Tests cover missing approval metadata; invalid, not-yet-valid, and expired terms; duplicate IDs; deterministic order; blank identity fields; missing initials permission; per-headshot consent evidence/date/expiry; missing source/attribution; non-square dimensions; untrusted paths; and forbidden profile data. Every activation-time failure fails closed.
  - _Requirements: 1.4, 1.5, 2.2, 2.3, 2.5, 2.6, 3.2, 3.3, 3.6, 5.3, 6.4_

- [ ] OD-T05. Implement deterministic initials generation with focused unit tests.
  - Same-spec dependencies: OD-T02, OD-T03.
  - Validation: Tests cover whitespace, punctuation, one-word and multi-part names, hyphenated and Unicode names, and the neutral no-character fallback.
  - _Requirements: 3.3, 3.4, 3.5_

- [ ] OD-T06. Build OfficerPortrait with valid-headshot and approved-initials fallback states.
  - Same-spec dependencies: OD-T04, OD-T05.
  - Validation: Synthetic render tests prove invalid consent, expired consent, missing source/attribution, untrusted paths, non-square metadata, absent images, and simulated load failure suppress the image and use the same accessible fallback; any Client Component boundary is limited to runtime image error state.
  - _Requirements: 3.2, 3.3, 3.4, 3.5, 6.3, 6.4_

- [ ] OD-T07. Build the server-rendered OfficerCard component.
  - Same-spec dependencies: OD-T06.
  - Validation: Synthetic tests verify name/title output, heading structure, semantic-token styling, no unnecessary focus stop, and fail-closed omission for invalid required identity/publication fields.
  - _Requirements: 3.1, 3.6, 4.3, 4.4, 4.5, 6.2_

- [ ] OD-T08. Build `/officers` with a responsive grid and blocked publication state.
  - Same-spec dependencies: OD-T04, OD-T07.
  - Validation: Before activation, the route renders a neutral unavailable state, contains no officer identity or misleading placeholder, does not query `profiles`, and is documented as a valid accessibility audit state.
  - _Requirements: 1.1, 1.2, 2.4, 4.1, 4.2, 4.4, 6.1, 6.2_

- [ ] OD-T09. Verify the owned public navigation excludes `/officers` while blocked.
  - Same-spec dependencies: OD-T08.
  - Artifact dependency: `PHE-ART-PUBLIC-NAVIGATION`.
  - Validation: Fail closed if the artifact is absent; navigation tests prove `/officers` is absent in anonymous and authenticated public shells without changing the base navigation or protected-route behavior.
  - _Requirements: 5.1, 5.4_

- [ ] OD-T10. Run infrastructure-level directory validation.
  - Same-spec dependencies: OD-T02, OD-T03, OD-T04, OD-T05, OD-T06, OD-T07, OD-T08, OD-T09.
  - Validation: Roster, initials, portrait, card, blocked-route, and navigation tests plus `npm run lint -- --max-warnings=0` and `npm run build` pass without implying publication approval.
  - _Requirements: 1.1, 1.2, 3.3, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 6.1, 6.2, 6.3, 6.4, 6.5_

## Manual Gate — not an executable Kiro task: roster evidence intake

The chapter secretary supplies `OD-GATE-ROSTER-EVIDENCE-INTAKE`; this is evidence intake, not publication approval. It must contain `termLabel`, `termStartsAt`, `termEndsAt`, `reviewer`, `reviewedAt`, and for every officer `stableId`, `displayName`, `executiveTitle`, `displayOrder`, and `initialsPermissionEvidenceRef`. Each proposed headshot must additionally contain `headshotPath`, `width`, `height`, `trustedSource`, `sourceAttribution`, `consentEvidenceRef`, `consentGrantedAt`, and `consentValidThrough`. Private source documents remain outside the public bundle.

- [ ] OD-T11. Validate the roster evidence intake before candidate creation.
  - Same-spec dependencies: OD-T10.
  - Gate artifact dependency: `OD-GATE-ROSTER-EVIDENCE-INTAKE`.
  - Validation: Fail closed if evidence is absent, incomplete, inconsistent, not yet valid, term-expired, consent-expired, or lacks any per-headshot consent/source/attribution field; publish `OD-ART-VALIDATED-ROSTER-EVIDENCE` with the source artifact version, validation instant, validator result, and content hash.
  - _Requirements: 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 5.3_

- [ ] OD-T12. Build a non-public roster candidate exclusively from validated evidence.
  - Same-spec dependencies: OD-T11.
  - Artifact dependency: `OD-ART-VALIDATED-ROSTER-EVIDENCE`.
  - Validation: Deterministic field-by-field comparison and schema tests prove every candidate field matches evidence and no account/profile identifier or private consent document is present; publish `OD-ART-ROSTER-CANDIDATE` with content hash and commit without activating identities or navigation.
  - _Requirements: 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] OD-T13. Validate candidate rendering while preserving the blocked public state.
  - Same-spec dependencies: OD-T12.
  - Validation: In tests or an access-controlled non-production review fixture, candidate entries render exactly once in deterministic order; portrait failures use approved initials; invalid required fields, withdrawal, term expiry, or consent expiry fail closed. Production/public source and navigation remain blocked. Publish `OD-ART-ACCESSIBILITY-CANDIDATE` with candidate hash, exact commit, controlled route-state/fixture reference, and test result.
  - _Requirements: 1.1, 1.2, 2.4, 2.6, 3.1, 3.2, 3.3, 3.6, 5.1, 5.3_

## Manual Gate — not an executable Kiro task: officer candidate accessibility review

Named human accessibility reviewers exercise the exact `OD-ART-ACCESSIBILITY-CANDIDATE` without activating production identities or navigation and record `OD-GATE-CANDIDATE-ACCESSIBILITY-EVIDENCE`. It must contain `candidateHash`, `candidateCommit`, `routeState`, `fixtureRef`, `reviewer`, `recordedAt`, matrix record IDs, actual observations, issue references, and status (`pass`, `fail`, or `blocked`). Required coverage includes reflow and keyboard/focus checks plus the applicable named `RA-MATRIX-AT` combinations for card headings, portraits, initials fallback, and attribution. An agent cannot execute or approve this gate.

- [ ] OD-T14. Run publication-candidate technical validation and validate accessibility evidence before approval.
  - Same-spec dependencies: OD-T13.
  - Artifact dependencies: `PHE-ART-TEST-FOUNDATION`, `PHE-ART-PUBLIC-NAVIGATION`, and `OD-ART-ACCESSIBILITY-CANDIDATE`.
  - Gate artifact dependency: `OD-GATE-CANDIDATE-ACCESSIBILITY-EVIDENCE`.
  - Validation: Fail closed if the manual artifact is absent, stale, failed, blocked, or does not match the exact candidate hash/commit. Automated candidate roster, long-name, attribution, initials/fallback, heading/list, and reflow tests pass; `npm run lint -- --max-warnings=0` and `npm run build` pass at the same commit. Publish `OD-ART-PUBLICATION-CANDIDATE` with candidate hash, commit, test results, and named accessibility evidence references.
  - _Requirements: 2.4, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5, 6.5_

## Manual Gate — not an executable Kiro task: final directory publication approval

The chapter secretary or delegated roster reviewer reviews the exact `OD-ART-PUBLICATION-CANDIDATE` and records the single human approval artifact `OD-GATE-FINAL-PUBLICATION-APPROVAL`. It must contain `candidateCommit`, `candidateHash`, `evidenceIntakeRef`, `approver`, `approvedAt`, `status` (`approved` or `rejected`), and `notesRef`. No earlier intake or review is a second approval.

- [ ] OD-T15. Validate final directory publication approval.
  - Same-spec dependencies: OD-T14.
  - Gate artifact dependency: `OD-GATE-FINAL-PUBLICATION-APPROVAL`.
  - Validation: Fail closed if the gate is absent, rejected, incomplete, term-expired, consent-expired, or references a commit/hash other than `OD-ART-PUBLICATION-CANDIDATE`; record the validated gate version.
  - _Requirements: 1.3, 1.4, 1.5, 5.2, 5.3, 6.5_

- [ ] OD-T16. Perform the one final activation of the approved roster and public-navigation item.
  - Same-spec dependencies: OD-T15.
  - Artifact dependencies: `OD-ART-PUBLICATION-CANDIDATE`, `OD-GATE-FINAL-PUBLICATION-APPROVAL`, and `PHE-ART-PUBLIC-NAVIGATION`.
  - Validation: In one final change, copy only the approved candidate into the active roster and add the conditional `/officers` item through the owned navigation extension point. Targeted activation tests prove approved/current visibility, blocked/withdrawn/term-expired/consent-expired removal, and unchanged protected-route authorization; publish `OD-ART-ACTIVATION` with commit and test result. No later task introduces roster data or navigation.
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 2.2, 2.4, 3.1, 5.1, 5.2, 5.3, 5.4, 6.5_
