# Public Homepage and Events Implementation Plan

## Execution Rules

Only executable Kiro tasks use checkboxes. Every pure human action, approval, or real-environment execution appears under a heading named `Manual Gate — not an executable Kiro task` and has no checkbox. An agent may validate a named gate artifact, but it must fail closed and leave its task incomplete when the artifact is absent, incomplete, stale, or failed.

`public-homepage-events` is the sole owner of shared repository test infrastructure and the minimal shared public-navigation foundation. `PHE-ART-TEST-FOUNDATION` records the pinned test dependencies, configuration files, commands, and smoke-test commit produced by PHE-T02. `PHE-ART-PUBLIC-NAVIGATION` records the shared public-navigation module, anonymous/authenticated shell contract, protected-route non-regression tests, and producing commit from PHE-T08. Other specs may add feature tests and navigation items, but must not own or replace package/test configuration or the base navigation artifact.

Kiro prose dependencies are review guidance, not scheduler guarantees. Execute tasks individually in the stated dependency order, especially immediately before and after every manual gate; do not use bulk execution across a gate.

## Tasks

- [ ] PHE-T01. Read installed Next.js 16 guidance for App Router pages, Server Components, metadata, Server Actions, and cache revalidation.
  - Same-spec dependencies: none.
  - Validation: Record the installed documentation paths, including `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidatePath.md`, and note that literal paths are revalidated from a Server Action after successful mutation.
  - _Requirements: 1.1, 6.1, 7.1_

- [ ] PHE-T02. Create the minimal shared repository test foundation.
  - Same-spec dependencies: PHE-T01.
  - Validation: Reuse existing capability or add reviewed, exactly pinned test dependencies and minimal configuration; execute one smoke test; publish `PHE-ART-TEST-FOUNDATION` with dependency versions, config paths, command, result, and commit. This is the only task in these three specs allowed to own package or shared test-config changes.
  - _Requirements: 7.5_

- [ ] PHE-T03. Add the shared exact-host Luma URL validator and focused unit tests.
  - Same-spec dependencies: PHE-T02.
  - Artifact dependency: `PHE-ART-TEST-FOUNDATION`.
  - Validation: Tests accept only HTTPS `lu.ma`, `luma.com`, and `www.luma.com`, and reject credentials, malformed input, lookalikes, unapproved subdomains, non-default ports, and explicit default `:443` ports before URL normalization can hide them.
  - _Requirements: 4.1, 4.2, 4.4, 4.5_

- [ ] PHE-T04. Add the strict `Asia/Manila` local date-time parser, formatter, and focused unit tests.
  - Same-spec dependencies: PHE-T02.
  - Artifact dependency: `PHE-ART-TEST-FOUNDATION`.
  - Validation: Tests cover valid round trips, impossible dates, leap days, boundary minutes, future/equal/past instants, and non-Manila host time zones.
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] PHE-T05. Implement the shared server-only upcoming-event query contract.
  - Same-spec dependencies: PHE-T02.
  - Artifact dependency: `PHE-ART-TEST-FOUNDATION`.
  - Validation: A deterministic test proves active/not-before-now filtering, equality inclusion under D-01, ascending order, selected columns, optional limit, and distinct provider-error handling.
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 3.2, 3.3_

- [ ] PHE-T06. Implement a shared server-rendered EventCard using the validation and Manila formatting helpers.
  - Same-spec dependencies: PHE-T03, PHE-T04.
  - Validation: Rendered-output tests cover content, `<time>`, banner fallback, safe Luma attributes, unsafe-link suppression, headings, and focusable action naming.
  - _Requirements: 3.1, 3.4, 4.3, 4.4, 5.4, 7.2, 7.4_

- [ ] PHE-T07. Replace the temporary client homepage with a Server Component hero and fixed internal CTA destinations.
  - Same-spec dependencies: PHE-T01.
  - Validation: `/` renders without a page-level `use client`, Join resolves to `/register`, Login resolves to `/login`, metadata is descriptive, and no guessed brand value or artwork is introduced.
  - _Requirements: 1.1, 1.2, 1.3, 3.5, 7.1, 7.4_

- [ ] PHE-T08. Create the minimal shared public-navigation foundation.
  - Same-spec dependencies: PHE-T02, PHE-T07.
  - Validation: Implement one reusable public navigation used by anonymous and authenticated public shells; preserve protected-route authorization; test stable landmark, link-order, and extension-point contracts; publish `PHE-ART-PUBLIC-NAVIGATION` with module paths, test paths, contract version, and commit. Feature-specific menu interaction remediation remains in the responsive-accessibility spec.
  - _Requirements: 1.2, 1.3, 7.1, 7.2_

- [ ] PHE-T09. Add the homepage Upcoming Highlights Server Component.
  - Same-spec dependencies: PHE-T05, PHE-T06, PHE-T07.
  - Validation: Route tests show at most two ascending active upcoming events and distinct accessible empty and error states.
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 7.3_

- [ ] PHE-T10. Migrate `/events` to the shared upcoming query and EventCard.
  - Same-spec dependencies: PHE-T05, PHE-T06.
  - Validation: Targeted route tests prove no inactive/past rows appear, event order is chronological, query failures are not empty states, and Luma links are safe.
  - _Requirements: 2.1, 2.2, 2.4, 2.5, 3.1, 3.2, 3.3, 4.3_

- [ ] PHE-T11. Migrate the dashboard upcoming section to the shared query rule.
  - Same-spec dependencies: PHE-T05.
  - Validation: Targeted route tests prove the protected route uses the same boundary predicate and preserves distinct event-query failure handling.
  - _Requirements: 2.1, 2.2, 2.4, 2.5, 3.2, 3.3_

- [ ] PHE-T12. Migrate the admin event form and every implemented event Server Action to shared validation and a declared mutation inventory.
  - Same-spec dependencies: PHE-T03, PHE-T04.
  - Validation: Inventory only implemented creation, active-status transition, and deletion actions; remove no behavior by assumption. Client feedback and authoritative Server Action tests agree, and direct malformed, unsafe, impossible, non-future, or unauthorized submissions return sanitized canonical responses.
  - _Requirements: 4.1, 4.2, 4.5, 5.1, 5.2, 5.3, 6.3, 6.4, 6.5_

- [ ] PHE-T13. Add deterministic action and revalidation tests for the declared mutation inventory.
  - Same-spec dependencies: PHE-T09, PHE-T10, PHE-T11, PHE-T12.
  - Validation: Mocked/deterministic Server Action tests prove each successful implemented creation, active-status transition, and deletion invokes revalidation after commit for `/`, `/events`, `/dashboard`, `/admin`, and `/admin/events`; failed and unauthorized mutations invoke no successful-path revalidation. Publish `PHE-ART-EVENT-REVALIDATION-CONTRACT` with the mutation-by-route matrix, test paths, command, result, and commit. Do not add or claim a general event-update action.
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

## Manual Gate — not an executable Kiro task: non-production event visibility

A named human operator executes the declared creation, active-status transition, and deletion flows in a non-production environment and records `PHE-GATE-NONPROD-REVALIDATION`. The artifact must contain `environment`, `commit`, `operator`, `date`, `mutation`, `affectedRoute`, `firstRequestObservedAt`, `expectedState`, `actualState`, `status` (`pass` or `fail`), and redacted evidence references for every mutation-by-route row. Production execution is not required, and an agent must not fabricate this evidence.

- [ ] PHE-T14. Validate the non-production revalidation gate artifact.
  - Same-spec dependencies: PHE-T13.
  - Gate artifact dependency: `PHE-GATE-NONPROD-REVALIDATION`.
  - Validation: Fail closed if the gate artifact is absent, stale, incomplete, contains a failed row, or does not cover every row in `PHE-ART-EVENT-REVALIDATION-CONTRACT`; otherwise record the validated artifact version and commit.
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] PHE-T15. Run infrastructure-level feature validation.
  - Same-spec dependencies: PHE-T08, PHE-T09, PHE-T10, PHE-T11, PHE-T12, PHE-T13, PHE-T14.
  - Validation: Focused tests, `npm run lint -- --max-warnings=0`, and `npm run build` pass; responsive/accessibility findings are handed off by named issue IDs and no copy approval is implied.
  - _Requirements: 3.4, 7.2, 7.3, 7.5_

## Manual Gate — not an executable Kiro task: homepage copy approval

The product owner supplies and approves the final chapter tagline and About paragraph in `PHE-GATE-COPY-APPROVAL`. The artifact must contain `artifactId`, exact approved text, `approver`, `approvedAt`, `sourceRef`, and `status` (`approved` or `rejected`). It is absent or blocking until supplied by that human owner.

- [ ] PHE-T16. Validate the homepage copy-approval artifact.
  - Same-spec dependencies: PHE-T15.
  - Gate artifact dependency: `PHE-GATE-COPY-APPROVAL`.
  - Validation: Fail closed if the artifact is absent, rejected, incomplete, or does not identify exact text, approver, date, and source.
  - _Requirements: 1.4, 1.5, 1.6_

- [ ] PHE-T17. Insert only the recorded approved homepage copy into replaceable content slots.
  - Same-spec dependencies: PHE-T16.
  - Validation: A content diff exactly matches `PHE-GATE-COPY-APPROVAL` and does not alter component structure.
  - _Requirements: 1.5, 1.6_

- [ ] PHE-T18. Re-run targeted homepage validation after approved copy insertion.
  - Same-spec dependencies: PHE-T17.
  - Validation: Homepage route tests, `npm run lint -- --max-warnings=0`, and `npm run build` pass at a recorded commit; publish `PHE-ART-FINAL-HOMEPAGE-CANDIDATE` with the commit and results.
  - _Requirements: 1.5, 1.6, 7.5_

## Manual Gate — not an executable Kiro task: final homepage sign-off

The named product owner reviews `PHE-ART-FINAL-HOMEPAGE-CANDIDATE` and records `PHE-GATE-FINAL-HOMEPAGE-SIGNOFF` with `candidateCommit`, `approver`, `approvedAt`, `status` (`approved` or `rejected`), and `notesRef`. This gate is not satisfied by earlier copy approval.

- [ ] PHE-T19. Validate final homepage sign-off.
  - Same-spec dependencies: PHE-T18.
  - Gate artifact dependency: `PHE-GATE-FINAL-HOMEPAGE-SIGNOFF`.
  - Validation: Fail closed if the artifact is absent, rejected, incomplete, or references a commit other than `PHE-ART-FINAL-HOMEPAGE-CANDIDATE`.
  - _Requirements: 1.5, 1.6, 7.5_
