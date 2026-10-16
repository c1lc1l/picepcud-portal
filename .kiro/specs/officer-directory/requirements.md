# Officer Directory Requirements

## Introduction

This specification defines the route and card infrastructure for a public PICE PCUD officer directory while enforcing the D-02 publication gate. Infrastructure may be implemented before roster approval, but no unapproved identity, title, headshot, or implied consent may be published. Public navigation remains blocked until one final approved activation consumes validated roster, headshot-consent, term-validity, technical, accessibility, and human-approval evidence.

## Scope

In scope are `/officers`, a reusable officer card and portrait fallback, one typed term-bounded roster source, publication metadata, responsive/accessibility behavior, and conditional public-navigation inclusion. Account profiles, public profile RLS, roster-management administration, package/test-configuration ownership, shared public-navigation ownership, and autonomous approval are out of scope.

## Requirements

### Requirement 1: Publication-safe route infrastructure

**User Story:** As a chapter secretary, I want directory infrastructure separated from publication approval, so that development can proceed without exposing unapproved people.

#### Acceptance Criteria

1. **1.1** WHEN `/officers` infrastructure is implemented before roster approval, THE SYSTEM SHALL render no real or invented officer identity, title, or portrait.
2. **1.2** WHILE the roster publication gate is incomplete, THE SYSTEM SHALL present a neutral unavailable state or keep the route unpublished and SHALL NOT imply that placeholder content is a current roster.
3. **1.3** WHEN an implementation agent encounters missing approval evidence, THE SYSTEM SHALL keep publication-dependent tasks blocked rather than infer or grant approval.
4. **1.4** WHEN roster evidence is submitted, THE SYSTEM SHALL require the term label, term start, term end, each officer's name and title, the roster reviewer, review date, and explicit initials permission for every entry before activation.
5. **1.5** WHEN a submitted headshot is considered for activation, THE SYSTEM SHALL require a per-headshot publication-consent evidence reference, consent date and validity, trusted source, and source attribution before displaying it.

### Requirement 2: Single typed roster source

**User Story:** As a maintainer, I want one reviewed roster source, so that officer information does not diverge across the page.

#### Acceptance Criteria

1. **2.1** WHEN roster data is defined, THE SYSTEM SHALL store it in one named, typed source for one term with an explicit start and end instant.
2. **2.2** WHEN the roster source is activated, THE SYSTEM SHALL include term validity, responsible reviewer, review date, publication status, and approval-evidence reference metadata.
3. **2.3** WHEN an officer entry is defined, THE SYSTEM SHALL include a stable non-account identifier, display name, executive title, display order, explicit initials permission, and optional headshot metadata containing consent evidence, consent validity, trusted source, source attribution, dimensions, and path.
4. **2.4** WHEN the directory renders officer entries, THE SYSTEM SHALL derive all cards from the single roster source and SHALL NOT duplicate identity data in route markup.
5. **2.5** WHEN roster data is published, THE SYSTEM SHALL NOT expose student IDs, member account UUIDs, year levels, email addresses, private consent documents, or other profile-only fields.
6. **2.6** WHEN roster entries are ordered, THE SYSTEM SHALL produce deterministic order using the approved display order and a stable tie-breaker.

### Requirement 3: Officer card and portrait fallback

**User Story:** As a visitor, I want consistent officer cards even when a portrait is unavailable, so that I can identify chapter leadership without broken content.

#### Acceptance Criteria

1. **3.1** WHEN an approved officer entry renders, THE SYSTEM SHALL display the approved name and executive title in a consistent card structure.
2. **3.2** WHEN an approved square headshot with current consent is available and publishable, THE SYSTEM SHALL render it with documented dimensions, aspect ratio, alternative-text treatment, and attribution behavior.
3. **3.3** WHEN a headshot is absent, has invalid or untrusted image metadata, fails to load, has expired consent, or lacks consent/source/attribution evidence, THE SYSTEM SHALL suppress that image, render a deterministic approved-initials fallback, and SHALL NOT render a broken or unsafe image.
4. **3.4** WHEN initials are generated, THE SYSTEM SHALL derive them deterministically from the approved display name and handle whitespace, punctuation, single-word names, and multi-part names.
5. **3.5** WHEN portrait or fallback content is presented, THE SYSTEM SHALL expose an accessible name or description without redundantly announcing the visible officer name.
6. **3.6** WHEN a roster entry lacks a required non-portrait identity, initials-permission, term, or publication field, THE SYSTEM SHALL omit the entry from publication and surface a validation failure to maintainers.

### Requirement 4: Responsive and semantic presentation

**User Story:** As a visitor on any supported device, I want an orderly officer grid, so that names and roles remain readable.

#### Acceptance Criteria

1. **4.1** WHEN the directory renders from 360 through 1440 CSS pixels, THE SYSTEM SHALL adapt the grid without overlap, clipping, or page-level horizontal scrolling.
2. **4.2** WHEN the page renders at 200% zoom, THE SYSTEM SHALL reflow cards without loss of name, title, portrait fallback, or heading context.
3. **4.3** WHEN styles are applied, THE SYSTEM SHALL use semantic theme tokens and SHALL NOT introduce guessed brand colors or temporary artwork represented as approved.
4. **4.4** WHEN the page structure renders, THE SYSTEM SHALL provide one page `h1`, logical card heading order, and appropriate main/list semantics.
5. **4.5** WHEN users navigate by keyboard, THE SYSTEM SHALL avoid adding focus stops to static cards and SHALL provide visible focus for any genuine link or action.

### Requirement 5: Conditional navigation publication

**User Story:** As a visitor, I want navigation to advertise only an approved directory, so that I do not encounter unpublished or misleading roster content.

#### Acceptance Criteria

1. **5.1** WHILE D-02 evidence is incomplete, THE SYSTEM SHALL NOT include `/officers` in public navigation.
2. **5.2** WHEN the term is current, roster/headshot evidence is valid, technical and accessibility validation passes, and final human approval references the tested candidate, THE SYSTEM SHALL permit one final activation to publish the approved roster and add `/officers` to public navigation together.
3. **5.3** WHEN the directory later becomes unapproved, term-expired, consent-expired, or withdrawn, THE SYSTEM SHALL support removing the public navigation item and returning to the safe route state without deleting route infrastructure.
4. **5.4** WHEN navigation visibility changes through the extension contract in `PHE-ART-PUBLIC-NAVIGATION`, THE SYSTEM SHALL NOT alter authentication or authorization behavior for protected routes.

### Requirement 6: Data isolation and implementation boundaries

**User Story:** As a member, I want my account profile to remain private, so that a public directory does not broaden access to member records.

#### Acceptance Criteria

1. **6.1** WHEN the public directory obtains roster data, THE SYSTEM SHALL NOT query `profiles` or require a public profile RLS policy.
2. **6.2** WHEN the route and cards render static approved content, THE SYSTEM SHALL use React Server Components by default.
3. **6.3** WHEN runtime image failure handling requires browser state, THE SYSTEM SHALL isolate that behavior to the smallest portrait Client Component.
4. **6.4** WHEN image paths are accepted into the roster, THE SYSTEM SHALL restrict them to trusted local or approved configured sources and SHALL NOT accept arbitrary client-submitted URLs.
5. **6.5** WHEN activation is requested, THE SYSTEM SHALL fail closed unless roster/headshot/term validation, targeted rendering/accessibility checks, strict lint, production build, and final human approval all pass for the same candidate commit.
