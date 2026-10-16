# Responsive Accessibility Requirements

## Introduction

This specification defines the cross-route responsive and accessibility audit for PICE PCUD public, authentication, member, and admin experiences. It establishes the approved D-03 test matrix, fixes known structural issues, and requires durable redacted evidence. Accessibility evidence must be rerun against the commit named by `RA-ART-HARDENED-COMMIT-EVIDENCE`; earlier results cannot be treated as current release evidence.

## Scope

The audit covers `/`, `/events`, `/officers` in either its valid publication-blocked state or its active state when available, `/login`, `/register`, `/dashboard`, `/admin`, `/admin/payments`, `/admin/members`, and `/admin/events`, including shared navigation, cards, tables, forms, uploads, dialogs, toasts, and row actions. It targets WCAG 2.2 AA behavior plus the product's 44-by-44 CSS-pixel primary-control target. It does not authorize branding, roster publication, production data use, security exceptions, package/test-configuration ownership, or base public-navigation ownership.

## Requirements

### Requirement 1: Required audit matrix and evidence

**User Story:** As a quality owner, I want a reproducible device and browser matrix, so that release decisions are based on current evidence rather than assumptions.

#### Acceptance Criteria

1. **1.1** WHEN responsive validation runs, THE SYSTEM SHALL test viewport widths of 360, 390, 768, 1024, and 1440 CSS pixels at both 100% and 200% browser zoom where the browser supports zoom.
2. **1.2** WHEN desktop browser validation runs, THE SYSTEM SHALL cover current Chrome, Edge, and Firefox on Windows.
3. **1.3** WHEN mobile browser validation runs, THE SYSTEM SHALL cover Chrome on a real Android device and Safari on a real iOS device rather than treating desktop emulation as real-device evidence.
4. **1.4** WHEN launch evidence is recorded, THE SYSTEM SHALL cover the light theme.
5. **1.5** WHEN a user-facing dark mode is exposed, THE SYSTEM SHALL test applicable visual, focus, and contrast rows in dark theme; otherwise THE SYSTEM SHALL complete the conditional audit by recording `status: N/A`, `theme: not-exposed`, and a verified not-exposed rationale.
6. **1.6** WHEN an audit case is recorded, THE SYSTEM SHALL include record/run/matrix IDs, commit, timestamp, route and route state, actor and synthetic fixture, browser/version, OS/device, viewport width/height, orientation, zoom, text scale, theme, assistive technology, procedure ID, expected and actual results, status (`pass`, `fail`, `blocked`, or `N/A`), reviewer, issue/blocker or N/A rationale, evidence references, and supersession links.
7. **1.7** WHEN evidence is stored, THE SYSTEM SHALL redact secrets, full member PII, receipt content, signed URLs, access tokens, private consent documents, and private configuration.

### Requirement 2: Reflow and viewport containment

**User Story:** As a user on a narrow screen or high zoom, I want content to reflow without loss, so that I can read and operate every route.

#### Acceptance Criteria

1. **2.1** WHEN any audited route is displayed at a required width and zoom, THE SYSTEM SHALL avoid unintended page-level horizontal scrolling.
2. **2.2** WHEN content reflows at 200% zoom, THE SYSTEM SHALL preserve text, controls, labels, validation messages, and primary actions without overlap, clipping, or obscuration.
3. **2.3** WHEN headings, filters, pagination, action groups, cards, or dialog footers lack horizontal room, THE SYSTEM SHALL wrap or stack them in a logical reading and keyboard order.
4. **2.4** WHEN a fixed or sticky region is present, THE SYSTEM SHALL NOT obscure focused content or required controls at supported viewport sizes.
5. **2.5** WHEN a virtual keyboard or short mobile viewport is used with a form/dialog, THE SYSTEM SHALL keep the focused field, error, and submit/cancel controls reachable.
6. **2.6** WHEN content contains long approved names, titles, locations, references, or validation text, THE SYSTEM SHALL wrap or contain it without widening the page viewport.

### Requirement 3: Administrative table overflow ownership

**User Story:** As an officer using a small screen, I want wide tables to scroll in one predictable region, so that the rest of the page remains stable.

#### Acceptance Criteria

1. **3.1** WHEN `/admin/payments`, `/admin/members`, or `/admin/events` renders a data table, THE SYSTEM SHALL use the shared Table primitive's existing full-width horizontal overflow container as the only table overflow boundary.
2. **3.2** WHEN a consuming admin table is too wide for its viewport, THE SYSTEM SHALL NOT add a nested horizontal overflow wrapper around the shared Table primitive.
3. **3.3** WHEN each admin table is implemented, THE SYSTEM SHALL apply a suitable semantic minimum width to the table element based on its columns and actions.
4. **3.4** WHEN a table overflows horizontally, THE SYSTEM SHALL confine scrolling to the shared table container and SHALL keep page headings, filters, and pagination within the page viewport.
5. **3.5** WHEN table semantics are audited, THE SYSTEM SHALL provide programmatic header relationships and an accessible name or caption appropriate to each table.
6. **3.6** WHEN table row actions are reached by keyboard or touch, THE SYSTEM SHALL remain operable without requiring hover or precision dragging.

### Requirement 4: Control targets and interaction modes

**User Story:** As a touch, keyboard, or pointer user, I want controls that are easy to identify and activate, so that I can complete workflows accurately.

#### Acceptance Criteria

1. **4.1** WHEN a primary button, navigation item, upload control, dialog action, or frequently used row action is presented, THE SYSTEM SHALL provide a 44-by-44 CSS-pixel target or larger.
2. **4.2** WHEN a control uses an applicable WCAG target-size exception, THE SYSTEM SHALL remain operable and distinguishable and SHALL have the exception and rationale recorded in the issue/evidence log.
3. **4.3** WHEN a custom upload surface is available to pointer users, THE SYSTEM SHALL also support keyboard activation and expose its accessible name, instructions, disabled state, and busy state.
4. **4.4** WHEN a function is available through drag-and-drop, THE SYSTEM SHALL provide an equivalent file-picker or keyboard path.
5. **4.5** WHEN a control is disabled or busy, THE SYSTEM SHALL expose that state programmatically and SHALL prevent duplicate destructive or submission actions.
6. **4.6** WHEN controls are audited, THE SYSTEM SHALL verify mouse, touch, keyboard, and screen-reader operation as applicable rather than relying on visual size alone.

### Requirement 5: Keyboard, focus, dialogs, and navigation

**User Story:** As a keyboard user, I want predictable focus behavior, so that I can navigate without losing context.

#### Acceptance Criteria

1. **5.1** WHEN a user navigates an audited route by keyboard, THE SYSTEM SHALL provide a logical focus order and a visible focus indicator with sufficient contrast.
2. **5.2** WHEN a dialog opens, THE SYSTEM SHALL move focus into the dialog, contain focus while modal, support the documented close path, and prevent background interaction.
3. **5.3** WHEN a dialog closes normally or after an action, THE SYSTEM SHALL restore focus to the invoking control when that control still exists.
4. **5.4** WHEN a mobile navigation menu opens and closes, THE SYSTEM SHALL manage focus, current expanded state, escape behavior, and focus restoration.
5. **5.5** WHEN repeated navigation precedes main content, THE SYSTEM SHALL provide an operable mechanism to reach main content efficiently where needed.
6. **5.6** WHEN an action is available only on hover visually, THE SYSTEM SHALL also expose it on keyboard focus and touch.
7. **5.7** WHEN protected routes redirect actors, THE SYSTEM SHALL preserve correct anonymous/member/admin routing without using focus or hidden UI as authorization.

### Requirement 6: Forms, validation, and async status

**User Story:** As a form user with assistive technology, I want labels, errors, and progress to be announced, so that I understand and recover from problems.

#### Acceptance Criteria

1. **6.1** WHEN an input, textarea, select, or file control renders, THE SYSTEM SHALL provide a persistent programmatic label and any necessary instructions.
2. **6.2** WHEN field validation fails, THE SYSTEM SHALL set the invalid state, associate the specific error text with the field, and move or announce focus according to a consistent error-summary strategy.
3. **6.3** WHEN a form-level server error or success occurs, THE SYSTEM SHALL expose the message through an appropriate alert or status mechanism without depending solely on color or a transient toast.
4. **6.4** WHEN compression, upload, save, review, export, or other asynchronous work begins, THE SYSTEM SHALL expose a concise busy/progress state to assistive technology.
5. **6.5** WHEN asynchronous work completes or fails, THE SYSTEM SHALL announce the outcome once, restore operability, and retain actionable error information long enough to use.
6. **6.6** WHEN placeholder text exists, THE SYSTEM SHALL NOT use it as the only label.
7. **6.7** WHEN status, warning, approval, or rejection is conveyed, THE SYSTEM SHALL use text/icon/semantics in addition to color.

### Requirement 7: Semantic structure, media, and motion

**User Story:** As a user with visual, cognitive, or motion sensitivity needs, I want meaningful structure and adaptable presentation, so that content remains understandable and comfortable.

#### Acceptance Criteria

1. **7.1** WHEN a route renders, THE SYSTEM SHALL use appropriate landmarks, one primary page heading, logical heading levels, and semantic lists/tables/forms.
2. **7.2** WHEN an informative image renders, THE SYSTEM SHALL provide meaningful alternative text; WHEN an image or icon is decorative, THE SYSTEM SHALL hide it from assistive technology.
3. **7.3** WHEN animation or transition is non-essential, THE SYSTEM SHALL reduce or remove it for users who request reduced motion.
4. **7.4** WHEN a spinner or animated indicator appears, THE SYSTEM SHALL pair it with a text/status alternative and SHALL respect reduced-motion preferences.
5. **7.5** WHEN text, focus indicators, status colors, borders needed to identify controls, or interactive states render in a required theme, THE SYSTEM SHALL meet applicable WCAG 2.2 AA contrast requirements.
6. **7.6** WHEN browser text scaling or zoom increases, THE SYSTEM SHALL preserve content and function without requiring two-dimensional scrolling except for exempt data tables.

### Requirement 8: Issue closure and release gating

**User Story:** As a release owner, I want accessibility findings tracked to closure, so that unresolved blockers are visible and cannot be silently waived.

#### Acceptance Criteria

1. **8.1** WHEN an audit identifies a defect, THE SYSTEM SHALL record severity, affected criteria/routes, reproduction steps, owner, status, and remediation or proposed deferral rationale.
2. **8.2** WHEN an accessibility blocker remains unresolved or required evidence is `blocked`, THE SYSTEM SHALL prevent D-03 technical closure.
3. **8.3** WHEN an exception or deferral is proposed, THE SYSTEM SHALL require a named human approval artifact before the corresponding initial or post-hardening technical closure and SHALL NOT allow an implementation agent to approve it autonomously.
4. **8.4** WHEN responsive/accessibility fixes are completed, THE SYSTEM SHALL run targeted tests, strict lint, and a production build.
5. **8.5** WHEN initial or final evidence is closed, THE SYSTEM SHALL show no unresolved accessibility blocker and no unapproved deferral in the required matrix.

### Requirement 9: Post-security-hardening regression

**User Story:** As a release owner, I want accessibility evidence refreshed after security hardening, so that later route, storage, action, or dialog changes do not invalidate earlier results.

#### Acceptance Criteria

1. **9.1** WHEN `RA-ART-HARDENED-COMMIT-EVIDENCE` identifies changes to protected layouts, direct-route behavior, event validation, receipt previews, actions, exports, or related UI, THE SYSTEM SHALL rerun accessibility regression checks for every affected route and workflow.
2. **9.2** WHEN post-hardening regression runs, THE SYSTEM SHALL use the exact recorded hardened commit and produce evidence newer than, and linked to, superseded pre-hardening records.
3. **9.3** WHEN a post-hardening regression fails, THE SYSTEM SHALL reopen or create linked issues and SHALL block accessibility completion until blockers are resolved and retested.
4. **9.4** WHEN the hardened artifact reports no relevant UI behavior change, THE SYSTEM SHALL still record a reviewed impact analysis and rerun critical protected-route, dialog, table, form-status, and focus checks.
5. **9.5** WHEN release evidence is summarized, THE SYSTEM SHALL identify `RA-ART-AUTHORITATIVE-EVIDENCE` at the post-hardening commit and SHALL NOT rely only on stale pre-hardening results.
