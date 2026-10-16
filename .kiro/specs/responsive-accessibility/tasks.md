# Responsive Accessibility Implementation Plan

## Execution Rules

Only executable Kiro tasks use checkboxes. Pure human browser/device/assistive-technology execution, retesting, deferral decisions, and final approval appear under headings named `Manual Gate — not an executable Kiro task` and have no checkbox. Agent tasks consume named gate artifacts and fail closed when evidence is absent, stale, incomplete, failed, or blocked.

This specification consumes `PHE-ART-TEST-FOUNDATION` and `PHE-ART-PUBLIC-NAVIGATION`, owned by `public-homepage-events`. It may add accessibility-specific tests and interaction fixes, but must not add or replace package dependencies, shared test configuration, or the base public-navigation implementation.

Kiro prose dependencies are review guidance, not scheduler guarantees. Execute tasks individually in stated dependency order, especially immediately before and after manual gates; do not use bulk execution across a gate.

## Tasks

- [ ] RA-T01. Read installed Next.js 16 guidance and inventory the current route/component accessibility surface.
  - Same-spec dependencies: none.
  - Validation: Inventory all scoped routes, route states, layouts, RSC/client boundaries, forms, dialogs, tables, uploads, live feedback, images, and navigation; record installed documentation paths.
  - _Requirements: 1.6, 7.1, 8.1_

- [ ] RA-T02. Create canonical redacted matrix, evidence, and issue-log templates.
  - Same-spec dependencies: RA-T01.
  - Validation: Templates implement every exact field in criteria 1.6, 1.7, and 8.1; enumerate `RA-MATRIX-WIN-DESKTOP`, `RA-MATRIX-ANDROID`, `RA-MATRIX-IOS`, and `RA-MATRIX-AT`; enforce `pass`, `fail`, `blocked`, or `N/A`; publish `RA-ART-MATRIX-TEMPLATES` with paths and commit.
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 8.1, 8.3_

- [ ] RA-T03. Verify and reuse the shared repository test foundation.
  - Same-spec dependencies: RA-T01.
  - Artifact dependency: `PHE-ART-TEST-FOUNDATION`.
  - Validation: Fail closed if the owner artifact is absent or failing; execute its command with one semantic smoke test. Do not edit package manifests or shared test configuration in this spec.
  - _Requirements: 8.4_

- [ ] RA-T04. Add one minimum width and accessible name/caption to each admin table without adding overflow wrappers.
  - Same-spec dependencies: RA-T01, RA-T03.
  - Validation: DOM tests prove exactly one shared `data-slot="table-container"` scroller per table, no nested horizontal overflow wrapper, native header semantics, and tested minimum widths for payments, members, and events.
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] RA-T05. Remediate admin page headers, filters, pagination, and row-action layouts.
  - Same-spec dependencies: RA-T04.
  - Validation: Automated and inspectable checks at 360 and 390 CSS pixels plus 200% zoom show wrapping/stacking without page overflow; table scrolling remains confined and actions remain keyboard/touch operable.
  - _Requirements: 2.1, 2.2, 2.3, 2.6, 3.4, 3.6, 4.6_

- [ ] RA-T06. Remediate shared control target sizes.
  - Same-spec dependencies: RA-T01.
  - Validation: Primary navigation/actions, uploads, dialog controls, and frequent row actions measure at least 44 by 44 CSS pixels where no exception is proposed.
  - _Requirements: 4.1, 4.6_

- [ ] RA-T07. Record proposed target-size exceptions without approving them.
  - Same-spec dependencies: RA-T06.
  - Validation: Each proposal records issue ID, applicable exception, non-overlap, operability, rationale, affected controls, and proposed human approver; publish proposals for the initial deferral gate.
  - _Requirements: 4.2, 8.1, 8.3_

- [ ] RA-T08. Remediate custom upload controls for multimodal operation and status exposure.
  - Same-spec dependencies: RA-T06.
  - Validation: Receipt and banner uploads have persistent names/instructions, Enter/Space and file-picker paths, drag/drop alternatives, `aria-disabled`/`aria-busy`, deduplicated status, and recoverable errors.
  - _Requirements: 4.3, 4.4, 4.5, 6.1, 6.4, 6.5_

- [ ] RA-T09. Remediate labels, descriptions, validation errors, and form-level status.
  - Same-spec dependencies: RA-T01, RA-T03.
  - Validation: Targeted tests prove no placeholder-only labels, field errors are ID-associated, invalid state is exposed, server outcomes persist in alert/status semantics, and color is not the sole signal.
  - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.6, 6.7_

- [ ] RA-T10. Remediate dialog focus, busy state, and focus restoration.
  - Same-spec dependencies: RA-T08, RA-T09.
  - Validation: Keyboard tests cover initial focus, tab containment, Escape/close behavior, duplicate-action prevention, restoration to an existing invoker, and logical fallback focus.
  - _Requirements: 2.5, 4.5, 5.1, 5.2, 5.3, 6.4, 6.5_

- [ ] RA-T11. Remediate shared public/mobile navigation interaction and bypass behavior.
  - Same-spec dependencies: RA-T06.
  - Artifact dependency: `PHE-ART-PUBLIC-NAVIGATION`.
  - Validation: Fail closed if the owner artifact is absent; tests cover skip-to-main, `aria-expanded`, controlled-region relationship, logical menu focus, Escape, close, invoker restoration, visible focus, and all owner non-regression tests. Do not replace base navigation.
  - _Requirements: 4.1, 5.1, 5.4, 5.5, 5.7_

- [ ] RA-T12. Add reduced-motion behavior.
  - Same-spec dependencies: RA-T08, RA-T09, RA-T10, RA-T11.
  - Validation: Reduced-motion settings suppress non-essential animation while retaining text/status meaning for dialogs, transitions, and busy indicators.
  - _Requirements: 7.3, 7.4_

- [ ] RA-T13. Audit and remediate light-theme semantic-token contrast.
  - Same-spec dependencies: RA-T06, RA-T12.
  - Validation: Text, controls, focus, status, and required boundaries pass applicable AA contrast checks with no guessed brand colors.
  - _Requirements: 6.7, 7.5_

- [ ] RA-T14. Resolve the dark-mode conditional audit.
  - Same-spec dependencies: RA-T13.
  - Validation: Publish `RA-ART-THEME-EXPOSURE`. If user-facing dark mode is exposed, applicable dark visual/focus/contrast tests pass; otherwise record `status: N/A`, `theme: not-exposed`, verification procedure, reviewer, commit, and rationale. A failed dark check or missing record leaves this task incomplete.
  - _Requirements: 1.5, 7.5_

- [ ] RA-T15. Remediate public, authentication, and officer-route reflow.
  - Same-spec dependencies: RA-T06, RA-T07, RA-T08, RA-T09, RA-T10, RA-T11, RA-T12, RA-T13, RA-T14.
  - Validation: Long synthetic content and all required widths at 200% zoom show no clipping, overlap, obscuration, or unintended page-level scroll. `/officers` with `routeState: publication-blocked` is a valid passing audit state; an active fixture is additional when available.
  - _Requirements: 2.1, 2.2, 2.3, 2.6, 7.6_

- [ ] RA-T16. Remediate dashboard and payment-workflow reflow.
  - Same-spec dependencies: RA-T06, RA-T07, RA-T08, RA-T09, RA-T10, RA-T11, RA-T12, RA-T13, RA-T14.
  - Validation: Long synthetic data, short mobile viewports, virtual keyboards, upload states, and payment history remain reachable and contained at required widths and 200% zoom.
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 4.1, 7.6_

- [ ] RA-T17. Remediate admin-route reflow and freeze the initial audit candidate.
  - Same-spec dependencies: RA-T04, RA-T05, RA-T15, RA-T16.
  - Validation: Admin routes keep page chrome within the viewport at required widths and 200% zoom while only the table primitive scrolls horizontally. After all initial route remediation is present, publish `RA-ART-INITIAL-AUDIT-CANDIDATE` with exact commit, `RA-ART-MATRIX-TEMPLATES` version, enumerated route states, synthetic fixture version, and `RA-ART-THEME-EXPOSURE` reference.
  - _Requirements: 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 7.6_

## Manual Gate — not an executable Kiro task: Windows desktop matrix

A named human executes `RA-MATRIX-WIN-DESKTOP` against the exact `RA-ART-INITIAL-AUDIT-CANDIDATE` commit and records `RA-GATE-WINDOWS-EVIDENCE`. Every route/state row for current Windows Chrome, Edge, and Firefox at widths 360, 390, 768, 1024, and 1440 CSS pixels, zoom 100% and 200%, light theme, and applicable dark theme must use the exact evidence fields and statuses. Every row records the initial-candidate artifact/version; missing, mismatched, or `blocked` required rows do not pass.

- [ ] RA-T18. Validate the Windows desktop gate artifact.
  - Same-spec dependencies: RA-T02, RA-T17.
  - Artifact dependency: `RA-ART-INITIAL-AUDIT-CANDIDATE`.
  - Gate artifact dependency: `RA-GATE-WINDOWS-EVIDENCE`.
  - Validation: Fail closed on absent, stale, candidate-mismatched, incomplete, failed-without-issue, or blocked required rows; import every failure into the issue log.
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.6, 1.7, 8.1_

- [ ] RA-T19. Remediate Windows matrix findings.
  - Same-spec dependencies: RA-T18.
  - Validation: Each failed row has a focused change and impact list or a proposed non-blocking deferral; blockers stay open until fixed.
  - _Requirements: 8.1, 8.2, 8.3_

## Manual Gate — not an executable Kiro task: Windows retest

A named human retests all changed or impacted Windows rows and records `RA-GATE-WINDOWS-RETEST-EVIDENCE`, linking original record ID, fix commit, retest record ID, and result.

- [ ] RA-T20. Validate Windows retest evidence.
  - Same-spec dependencies: RA-T19.
  - Gate artifact dependency: `RA-GATE-WINDOWS-RETEST-EVIDENCE`.
  - Validation: Fail closed if required retests are absent, stale, failed, or blocked; close only issues with linked passing retests.
  - _Requirements: 8.2, 8.5_

## Manual Gate — not an executable Kiro task: real Android Chrome matrix

A named human executes `RA-MATRIX-ANDROID` on a real Android device against the exact `RA-ART-INITIAL-AUDIT-CANDIDATE` commit and records `RA-GATE-ANDROID-EVIDENCE`. Desktop emulation is supplemental only. Every row records the initial-candidate artifact/version. Unsupported browser zoom is `N/A` with rationale and required text-scale rows remain executed.

- [ ] RA-T21. Validate real Android gate evidence.
  - Same-spec dependencies: RA-T02, RA-T17.
  - Artifact dependency: `RA-ART-INITIAL-AUDIT-CANDIDATE`.
  - Gate artifact dependency: `RA-GATE-ANDROID-EVIDENCE`.
  - Validation: Fail closed on absent, stale, candidate-mismatched, incomplete, failed-without-issue, or blocked required rows; import failures into the issue log.
  - _Requirements: 1.1, 1.3, 1.4, 1.6, 1.7, 2.5, 4.6, 8.1_

- [ ] RA-T22. Remediate Android findings.
  - Same-spec dependencies: RA-T21.
  - Validation: Each failed row has a focused change and impact list or a proposed non-blocking deferral; blockers stay open until fixed.
  - _Requirements: 8.1, 8.2, 8.3_

## Manual Gate — not an executable Kiro task: real Android retest

A named human retests changed or impacted rows on a real Android device and records `RA-GATE-ANDROID-RETEST-EVIDENCE` with original record ID, fix commit, retest record ID, and result.

- [ ] RA-T23. Validate Android retest evidence.
  - Same-spec dependencies: RA-T22.
  - Gate artifact dependency: `RA-GATE-ANDROID-RETEST-EVIDENCE`.
  - Validation: Fail closed if required real-device retests are absent, stale, failed, or blocked; close only linked passing issues.
  - _Requirements: 8.2, 8.5_

## Manual Gate — not an executable Kiro task: real iOS Safari matrix

A named human executes `RA-MATRIX-IOS` on a real iOS device against the exact `RA-ART-INITIAL-AUDIT-CANDIDATE` commit and records `RA-GATE-IOS-EVIDENCE`. Every row records the initial-candidate artifact/version. Emulation cannot satisfy any real-device row. Lack of hardware is `blocked`, requires an issue, and blocks technical closure.

- [ ] RA-T24. Validate real iOS Safari gate evidence.
  - Same-spec dependencies: RA-T02, RA-T17.
  - Artifact dependency: `RA-ART-INITIAL-AUDIT-CANDIDATE`.
  - Gate artifact dependency: `RA-GATE-IOS-EVIDENCE`.
  - Validation: Fail closed on absent, stale, candidate-mismatched, incomplete, failed-without-issue, or blocked required rows; import failures into the issue log.
  - _Requirements: 1.1, 1.3, 1.4, 1.6, 1.7, 8.1, 8.2_

- [ ] RA-T25. Remediate iOS Safari findings.
  - Same-spec dependencies: RA-T24.
  - Validation: Each failed row has a focused change and impact list or a proposed non-blocking deferral; blockers stay open until fixed.
  - _Requirements: 8.1, 8.2, 8.3_

## Manual Gate — not an executable Kiro task: real iOS Safari retest

A named human retests changed or impacted rows on a real iOS device and records `RA-GATE-IOS-RETEST-EVIDENCE` with original record ID, fix commit, retest record ID, and result.

- [ ] RA-T26. Validate iOS Safari retest evidence.
  - Same-spec dependencies: RA-T25.
  - Gate artifact dependency: `RA-GATE-IOS-RETEST-EVIDENCE`.
  - Validation: Fail closed if required real-device retests are absent, stale, failed, or blocked; close only linked passing issues.
  - _Requirements: 1.3, 8.2, 8.5_

## Manual Gate — not an executable Kiro task: keyboard and assistive-technology matrix

Named human reviewers execute `RA-MATRIX-AT` against the exact `RA-ART-INITIAL-AUDIT-CANDIDATE` commit: keyboard-only on Windows Chrome, Edge, and Firefox; NVDA with Windows Firefox; NVDA with Windows Chrome; TalkBack with Android Chrome; and VoiceOver with Safari on real iOS. They record `RA-GATE-AT-EVIDENCE` for anonymous, member, and admin representative workflows, and every row records the initial-candidate artifact/version.

- [ ] RA-T27. Validate keyboard and assistive-technology gate evidence.
  - Same-spec dependencies: RA-T02, RA-T17.
  - Artifact dependency: `RA-ART-INITIAL-AUDIT-CANDIDATE`.
  - Gate artifact dependency: `RA-GATE-AT-EVIDENCE`.
  - Validation: Fail closed on absent, stale, candidate-mismatched, incomplete, failed-without-issue, or blocked required rows; verify names, roles, states, headings/landmarks, focus, errors, busy/outcome announcements, images, tables, and alternatives.
  - _Requirements: 3.5, 3.6, 4.3, 4.4, 4.5, 4.6, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 7.1, 7.2_

- [ ] RA-T28. Remediate keyboard and assistive-technology findings.
  - Same-spec dependencies: RA-T27.
  - Validation: Each failed workflow has a focused change and impact list or a proposed non-blocking deferral; blockers stay open until fixed.
  - _Requirements: 8.1, 8.2, 8.3_

## Manual Gate — not an executable Kiro task: keyboard and assistive-technology retest

Named human reviewers retest changed or impacted AT rows and record `RA-GATE-AT-RETEST-EVIDENCE` with original record ID, fix commit, retest record ID, and result.

- [ ] RA-T29. Validate keyboard and assistive-technology retest evidence.
  - Same-spec dependencies: RA-T28.
  - Gate artifact dependency: `RA-GATE-AT-RETEST-EVIDENCE`.
  - Validation: Fail closed if required retests are absent, stale, failed, or blocked; close only issues with linked passing retests.
  - _Requirements: 8.2, 8.5_

## Manual Gate — not an executable Kiro task: initial exceptions and deferrals

Before technical closure, the named quality/release reviewer records `RA-GATE-INITIAL-DEFERRAL-APPROVAL` against `RA-ART-INITIAL-AUDIT-CANDIDATE`. It contains `artifactId`, exact candidate artifact/version and commit, every proposal ID and decision, approver, decision date, rationale, follow-up owner/date, and overall decision (`approved`, `rejected`, or `no-deferrals`). Accessibility blockers cannot be approved for closure.

- [ ] RA-T30. Run initial technical closure.
  - Same-spec dependencies: RA-T07, RA-T20, RA-T23, RA-T26, RA-T29.
  - Artifact dependency: `RA-ART-INITIAL-AUDIT-CANDIDATE`.
  - Gate artifact dependency: `RA-GATE-INITIAL-DEFERRAL-APPROVAL`.
  - Validation: Fail closed if the gate artifact is absent, stale, candidate-mismatched, rejected, omits a proposal, or approves a blocker. Targeted tests, `npm run lint -- --max-warnings=0`, and `npm run build` pass at the exact candidate commit; required rows are complete and the issue query reports no unresolved blocker. Publish `RA-ART-INITIAL-CLOSURE`.
  - _Requirements: 4.2, 8.2, 8.3, 8.4, 8.5_

- [ ] RA-T31. Freeze the initial evidence index and impact baseline.
  - Same-spec dependencies: RA-T30.
  - Validation: Record run IDs, matrix completeness query, accepted non-blocking deferrals, issue summary, commit, and all evidence references in `RA-ART-INITIAL-EVIDENCE`; later affected changes mark rows stale.
  - _Requirements: 1.6, 8.1, 8.5_

- [ ] RA-T32. Validate hardened-commit evidence and perform impact analysis.
  - Same-spec dependencies: RA-T31.
  - Artifact dependency: `RA-ART-HARDENED-COMMIT-EVIDENCE`.
  - Validation: Fail closed if the artifact is absent, blocked, lacks exact commit/base/changed-file/affected-workflow/security-owner/date/evidence fields, or cannot be checked out. Map protected layouts, redirects, receipt preview/upload, payment review, events, tables, exports, errors/status, focus, and reflow to exact rerun rows; include mandatory critical rows even when no relevant UI change is reported.
  - _Requirements: 9.1, 9.2, 9.4_

## Manual Gate — not an executable Kiro task: post-hardening browser, device, and AT execution

At the exact hardened commit, named human reviewers execute all critical and RA-T32-identified manual rows, including any impacted real Android, real iOS, Windows browser, and AT combinations. They record `RA-GATE-POST-HARDENING-EXECUTION` with exact evidence fields and links to superseded records.

- [ ] RA-T33. Run deterministic post-hardening checks and validate manual execution evidence.
  - Same-spec dependencies: RA-T32.
  - Gate artifact dependency: `RA-GATE-POST-HARDENING-EXECUTION`.
  - Validation: Automated critical and impact-identified tests run at the hardened commit; fail closed if required manual rows are absent, stale, failed-without-issue, or blocked. Every failure reopens or creates an issue, and every repeated row links `supersedes` and `supersededBy`.
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] RA-T34. Remediate post-hardening findings.
  - Same-spec dependencies: RA-T33.
  - Validation: Each failure has a focused change and impact list or a proposed non-blocking deferral; blockers remain open until fixed.
  - _Requirements: 9.3, 9.5_

## Manual Gate — not an executable Kiro task: post-hardening retest

Named human reviewers retest every changed or impacted manual row at the linked remediation descendant and record `RA-GATE-POST-HARDENING-RETEST-EVIDENCE`. Real-device and AT rows remain real-device and AT executions; automation or emulation is supplemental only.

- [ ] RA-T35. Validate post-hardening retests and assemble the authoritative-evidence candidate.
  - Same-spec dependencies: RA-T34.
  - Gate artifact dependency: `RA-GATE-POST-HARDENING-RETEST-EVIDENCE`.
  - Validation: Fail closed if required retests are absent, stale, failed, or blocked; close only linked passing issues and assemble `RA-ART-AUTHORITATIVE-EVIDENCE-CANDIDATE` with hardened artifact reference, final commit, run IDs, supersession map, proposed deferrals, and current issue query.
  - _Requirements: 9.2, 9.3, 9.5_

## Manual Gate — not an executable Kiro task: post-hardening exceptions and deferrals

Before authoritative technical closure, the named quality/release reviewer records `RA-GATE-POST-HARDENING-DEFERRAL-APPROVAL` with the same fields and decision rules as the initial gate, but against `RA-ART-AUTHORITATIVE-EVIDENCE-CANDIDATE`. Blockers cannot be approved for closure.

- [ ] RA-T36. Run final technical validation and publish authoritative evidence.
  - Same-spec dependencies: RA-T35.
  - Gate artifact dependency: `RA-GATE-POST-HARDENING-DEFERRAL-APPROVAL`.
  - Validation: Fail closed if the gate is absent, stale, rejected, omits a proposal, or approves a blocker. Targeted accessibility tests, `npm run lint -- --max-warnings=0`, and `npm run build` pass at the recorded commit; required rows are complete and no blocker remains. Publish `RA-ART-AUTHORITATIVE-EVIDENCE` with the accepted-deferral gate, final technical results, and candidate contents.
  - _Requirements: 8.2, 8.3, 8.4, 8.5, 9.5_

## Manual Gate — not an executable Kiro task: final accessibility sign-off

The named quality/release reviewer reviews `RA-ART-AUTHORITATIVE-EVIDENCE` and records `RA-GATE-FINAL-ACCESSIBILITY-SIGNOFF` with `artifactId`, authoritative commit, authoritative evidence version, approver, approved date, status (`approved` or `rejected`), and notes reference.

- [ ] RA-T37. Validate final accessibility sign-off.
  - Same-spec dependencies: RA-T36.
  - Gate artifact dependency: `RA-GATE-FINAL-ACCESSIBILITY-SIGNOFF`.
  - Validation: Fail closed if the artifact is absent, rejected, incomplete, stale, or references a different commit/evidence version; record completion without substituting agent approval.
  - _Requirements: 1.6, 8.3, 8.5, 9.5_
