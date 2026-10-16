# Responsive Accessibility Design

## Overview

This work is a cross-cutting audit and remediation layer rather than one page. It inventories route/component patterns, fixes reusable primitives before one-off pages, validates the complete D-03 browser/viewport/zoom matrix, and stores redacted evidence linked to issues. The shared Table primitive remains the sole horizontal scroller; each consuming table adds only a suitable minimum width.

Evidence is produced initially and again against the commit identified by `RA-ART-HARDENED-COMMIT-EVIDENCE`. Real Android, real iOS Safari, and named assistive-technology runs are manual gates; emulation and automation may aid development but cannot replace their evidence.

### Goals

- Prevent unintended page overflow and preserve 200% zoom reflow.
- Establish one table overflow boundary with per-table minimum widths.
- Make controls, uploads, forms, dialogs, navigation, and async status operable across modalities.
- Verify semantics, focus, contrast, reduced motion, and route protection behavior.
- Produce durable, current, redacted evidence and track defects to closure.

### Non-goals

- Claiming conformance from automation alone.
- Changing security decisions or bypassing protected routes for testing.
- Approving exceptions, unavailable human evidence, branding, officer identities, or private data.
- Enabling dark mode solely to expand audit scope.
- Owning package/test configuration or the base public-navigation implementation.

## Audit Architecture

```text
Route/component inventory
  -> reusable primitive audit
  -> route-specific remediation
  -> targeted automated checks
  -> manual browser/device/AT gates
  -> issue remediation and manual retest gates
  -> human deferral gate
  -> initial technical closure
  -> hardened-commit evidence intake
  -> post-hardening regression and retest gates
  -> post-hardening deferral gate
  -> authoritative technical closure
  -> final human sign-off gate
```

### Audit layers

| Layer | Coverage | Output |
| --- | --- | --- |
| Static review | Landmarks, labels, ARIA relationships, client boundaries, token use | Findings linked to files/routes |
| Targeted automation | Rendered semantics, feasible keyboard behavior, regression assertions | Test results at commit |
| Desktop manual | Windows Chrome, Edge, and Firefox, widths, and zoom | `RA-MATRIX-WIN-DESKTOP` |
| Mobile manual | Real Android Chrome and real iOS Safari | `RA-MATRIX-ANDROID`, `RA-MATRIX-IOS` |
| Assistive technology | Named keyboard and screen-reader/browser combinations | `RA-MATRIX-AT` |
| Release validation | Strict lint, production build, unresolved-blocker query | Initial and authoritative gate summaries |

Automation supports but does not replace manual reflow, mobile, zoom, touch, focus, or screen-reader evidence.

## Shared Artifact Dependencies

This specification consumes, but does not own, `PHE-ART-TEST-FOUNDATION` and `PHE-ART-PUBLIC-NAVIGATION` from `public-homepage-events`. It may add accessibility-specific tests and interaction remediation. It must not add or replace package dependencies, shared test configuration, or the base navigation module. Navigation work must preserve the owner artifact's landmark, extension-point, shell, and protected-route contracts.

## Scope and Named Matrices

The canonical route inventory includes `/`, `/events`, `/officers`, `/login`, `/register`, `/dashboard`, `/admin`, `/admin/payments`, `/admin/members`, and `/admin/events`. `/officers` in a neutral publication-blocked state is a valid audited state and receives `routeState: publication-blocked`; it is not marked blocked merely because no approved roster is public. If active candidate evidence is available in a controlled non-production fixture, that state is recorded separately without publishing identities.

The matrices are exact:

- `RA-MATRIX-WIN-DESKTOP`: current stable Chrome, Edge, and Firefox on Windows; widths 360, 390, 768, 1024, and 1440 CSS pixels; zoom 100% and 200%; light theme; dark rows only when `RA-ART-THEME-EXPOSURE` records dark mode exposed.
- `RA-MATRIX-ANDROID`: current stable Chrome on a real Android device; portrait and landscape; representative device viewport recorded exactly; browser zoom rows when supported, otherwise `N/A` with rationale; text scale 100% and 200%; touch, virtual keyboard, upload, dialog, focus, and reflow procedures.
- `RA-MATRIX-IOS`: current stable Safari on a real iOS device; portrait and landscape; representative device viewport recorded exactly; browser zoom rows when supported, otherwise `N/A` with rationale; text size 100% and 200%; touch, safe area, virtual keyboard, upload, dialog, focus, and reflow procedures.
- `RA-MATRIX-AT`: keyboard-only on Windows Chrome, Edge, and Firefox; NVDA with Windows Firefox; NVDA with Windows Chrome; TalkBack with Android Chrome; and VoiceOver with Safari on a real iOS device. Current versions are recorded in evidence.

Every enumerated row has exactly one status: `pass`, `fail`, `blocked`, or `N/A`. `N/A` requires a concrete rationale and reviewer; `blocked` requires a blocker reason and issue reference and cannot satisfy a required release row. Missing rows are failures of evidence completeness.

## Component Remediation Strategy

### Layouts and page shells

Use mobile-first spacing and flexible containers. Header/action rows wrap or stack before overflow. Main regions receive stable focus targets for skip navigation. Fixed/sticky elements account for focused controls and mobile safe areas. RSC remains the default; Client Components are limited to interactions such as mobile-menu state, dialogs, uploads, filters, and action feedback.

### Administrative tables

The `components/ui/table.tsx` wrapper is the only horizontal overflow boundary. Payments, events, and members tables must not add an outer `overflow-x-auto`. Each supplies a tested semantic minimum width based on columns and actions. Each table has an accessible caption or equivalent name, native header relationships, and keyboard/touch-operable scrolling. Filters and pagination remain outside the scroller.

### Controls, forms, and async feedback

Primary navigation, primary actions, uploads, dialog buttons, and frequent row actions target at least 44 by 44 CSS pixels. Proposed exceptions remain unapproved until the applicable manual deferral gate. No workflow requires hover, drag-and-drop, or fine pointer control.

Every form control receives a persistent programmatic label. Error text uses stable relationships and invalid state. Compression, upload, save, review, event creation, and export expose concise busy state and one persistent outcome. Sonner is not the only feedback channel. Announcements are deduplicated.

### Dialogs and navigation

Use the shared dialog primitive and test initial focus, containment, Escape/close behavior, busy state, and restoration. Shared navigation remediation consumes `PHE-ART-PUBLIC-NAVIGATION`, adds skip-to-main and mobile menu behavior through its extension contract, and reruns owner non-regression tests without replacing the base module.

### Motion, themes, and blocked routes

Honor `prefers-reduced-motion: reduce` for non-essential transitions and retain text/status meaning. Semantic tokens cover foreground, background, borders, status, destructive, muted, and focus visuals. `RA-ART-THEME-EXPOSURE` is complete only when dark mode either passes applicable checks or records `status: N/A`, `theme: not-exposed`, and how exposure was verified. The publication-blocked `/officers` route is valid content for reflow and semantic checks.

## Evidence Model

Canonical audit material is stored under the implementation evidence location with stable artifact IDs. Before any initial manual gate, the remediation tasks publish `RA-ART-INITIAL-AUDIT-CANDIDATE` with the exact commit, `RA-ART-MATRIX-TEMPLATES` version, enumerated route states, synthetic fixture version, and `RA-ART-THEME-EXPOSURE` reference. Every initial manual evidence row and deferral decision must identify that artifact/version exactly; a mismatch is stale evidence. Each matrix record has exactly these fields:

```ts
interface AccessibilityEvidence {
  recordId: string;
  runId: string;
  matrixId:
    | "RA-MATRIX-WIN-DESKTOP"
    | "RA-MATRIX-ANDROID"
    | "RA-MATRIX-IOS"
    | "RA-MATRIX-AT";
  commit: string;
  recordedAt: string;
  route: string;
  routeState: string;
  actor: "anonymous" | "member" | "admin";
  syntheticFixture: string;
  browserName: string;
  browserVersion: string;
  osDevice: string;
  viewportCssWidth: number;
  viewportCssHeight: number;
  orientation: "portrait" | "landscape" | "not-applicable";
  zoom: "100%" | "200%" | "not-supported";
  textScale: "100%" | "200%" | "not-applicable";
  theme: "light" | "dark" | "not-exposed";
  assistiveTechnology: string;
  procedureId: string;
  expected: string;
  actual: string;
  status: "pass" | "fail" | "blocked" | "N/A";
  reviewer: string;
  issueRef?: string;
  blockerReason?: string;
  naRationale?: string;
  evidenceRefs: readonly string[];
  supersedes: readonly string[];
  supersededBy?: string;
}
```

A `fail` row requires an issue reference. A `blocked` row requires an issue and blocker reason. An `N/A` row requires a specific rationale. Pass rows must contain actual observations, not merely restate expected behavior. Evidence references are redacted and never contain receipt data, credentials, tokens, member PII, or private officer-consent documents.

Issue records include `issueId`, severity, requirement IDs, routes, reproduction steps, owner, status, fix commit, retest record IDs, and optional proposed-deferral rationale. Human decisions are stored only in `RA-GATE-INITIAL-DEFERRAL-APPROVAL` or `RA-GATE-POST-HARDENING-DEFERRAL-APPROVAL`. Blockers cannot be deferred into technical closure.

## Hardened Commit and Supersession

`RA-ART-HARDENED-COMMIT-EVIDENCE` replaces every prose dependency on a sprint. It contains `artifactId`, exact `commit`, parent/base commit, changed-file inventory, affected-route/workflow inventory, security owner, recorded date, evidence reference, and `status` (`ready` or `blocked`). Impact analysis fails closed if this artifact is absent or blocked.

Post-hardening evidence runs at that exact commit or at a linked remediation descendant. Every repeated row names prior records in `supersedes`; prior records point to the new run through `supersededBy`. The authoritative index `RA-ART-AUTHORITATIVE-EVIDENCE` contains the hardened artifact reference, final commit, run IDs, complete matrix query, zero-blocker query, accepted-deferral gate reference, technical validation results, and supersession map. Later changes to affected routes, final homepage copy, officer roster/navigation, event behavior, or accessibility remediation invalidate the affected rows and require scoped reruns.

## Gate Semantics

Pure human actions are uncheckable manual gates in `tasks.md`. Agent tasks consume gate artifacts and fail closed if artifacts are absent, stale, incomplete, failed, or blocked. Initial deferral approval occurs before initial technical closure. An equivalent post-hardening deferral approval occurs before authoritative technical closure. Real Android, real iOS, screen-reader, manual browser, retest, and final sign-off work is never represented as an executable checkbox.

## Testing and Release Strategy

Targeted automation covers semantic structure, headings, labels, error/status relationships, image alternatives, feasible keyboard interaction, dialog behavior, table overflow ownership, responsive-class regressions, and protected-route behavior. It reuses `PHE-ART-TEST-FOUNDATION` and introduces no competing package/test configuration.

Manual gates execute the four named matrices using synthetic data. Initial and post-hardening retest gates link fixes to original reproduction record IDs. Technical closure runs targeted tests, `npm run lint -- --max-warnings=0`, and `npm run build`, then verifies complete required rows, no unresolved blockers, and no unapproved deferrals. Final sign-off is a human gate over `RA-ART-AUTHORITATIVE-EVIDENCE`, followed by an agent task that validates the signed artifact.

## Requirements Traceability

| Requirements | Design elements | Primary verification |
| --- | --- | --- |
| 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7 | Named matrices and exact evidence model | Manual gate artifact validation |
| 2.1, 2.2, 2.3, 2.4, 2.5, 2.6 | Layout/page-shell remediation | Zoom and reflow evidence |
| 3.1, 3.2, 3.3, 3.4, 3.5, 3.6 | Shared Table ownership strategy | DOM assertions and table evidence |
| 4.1, 4.2, 4.3, 4.4, 4.5, 4.6 | Control target and modality strategy | Measurement, AT, and deferral gates |
| 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7 | Dialog/navigation focus model | Keyboard, route, and AT matrix |
| 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7 | Form/status architecture | Error and async workflow evidence |
| 7.1, 7.2, 7.3, 7.4, 7.5, 7.6 | Semantics, motion, themes | Static, contrast, zoom, and motion checks |
| 8.1, 8.2, 8.3, 8.4, 8.5 | Issue lifecycle and pre-closure human gates | Gate validation and zero-blocker query |
| 9.1, 9.2, 9.3, 9.4, 9.5 | Hardened artifact and supersession | `RA-ART-AUTHORITATIVE-EVIDENCE` |
