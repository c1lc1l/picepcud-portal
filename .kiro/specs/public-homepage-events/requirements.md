# Public Homepage and Events Requirements

## Introduction

This specification defines the public homepage, shared upcoming-event behavior, and safe Luma handoff for the PICE PCUD portal. It translates the approved technical portions of decision D-01 into testable behavior. Final chapter tagline and About copy remain externally blocked; implementation may establish replaceable content structure but may not represent draft copy as approved.

## Scope

In scope are `/`, `/events`, the dashboard upcoming-event section, the admin event form validation used to create active events, and cache revalidation after event mutations. Under approved decision D-01, “future” or “upcoming” means an event instant that is not before the captured request-time instant (`event_date >= now()`). Native ticketing, QR scanning, guessed brand values, and approval of chapter copy are out of scope.

## Requirements

### Requirement 1: Public homepage structure and calls to action

**User Story:** As a prospective member, I want a clear public landing page with reliable next steps, so that I can join the chapter or access my account.

#### Acceptance Criteria

1. **1.1** WHEN a visitor opens `/`, THE SYSTEM SHALL render the homepage as a server-rendered public route using semantic theme tokens.
2. **1.2** WHEN a visitor activates the Join Chapter call to action, THE SYSTEM SHALL navigate to `/register`.
3. **1.3** WHEN a visitor activates the Login call to action, THE SYSTEM SHALL navigate to `/login`.
4. **1.4** WHILE final chapter tagline or About copy lacks recorded product-owner approval, THE SYSTEM SHALL keep that content replaceable and SHALL NOT label draft or placeholder copy as approved final content.
5. **1.5** WHEN approved tagline and About copy are supplied with approval evidence, THE SYSTEM SHALL render the approved text without requiring structural component changes.
6. **1.6** WHEN final homepage sign-off is requested, THE SYSTEM SHALL block sign-off unless criterion 1.5 is satisfied.

### Requirement 2: Consistent upcoming-event selection

**User Story:** As a visitor or member, I want every upcoming-event list to use the same eligibility rules, so that I do not see stale or contradictory event information.

#### Acceptance Criteria

1. **2.1** WHEN `/`, `/events`, or `/dashboard` requests upcoming events, THE SYSTEM SHALL return only records whose `is_active` value is true and whose `event_date` instant is greater than or equal to the request-time current instant.
2. **2.2** WHEN eligible events are returned, THE SYSTEM SHALL order them by `event_date` in ascending chronological order.
3. **2.3** WHEN the homepage requests highlights, THE SYSTEM SHALL return no more than the first two eligible events.
4. **2.4** WHEN the full events route or dashboard requests upcoming events, THE SYSTEM SHALL apply the same eligibility predicate defined by criterion 2.1.
5. **2.5** WHEN an event is inactive or its instant is before the request-time current instant, THE SYSTEM SHALL NOT present it as upcoming.
6. **2.6** WHEN the current instant is supplied in a test, THE SYSTEM SHALL evaluate boundary behavior deterministically, including an event exactly equal to that instant.

### Requirement 3: Event presentation and states

**User Story:** As a visitor, I want concise and accessible event information, so that I can decide whether to register.

#### Acceptance Criteria

1. **3.1** WHEN an eligible event is displayed, THE SYSTEM SHALL present its title, Manila-local date and time, location, description, optional banner or non-misleading fallback, and Luma registration action.
2. **3.2** WHEN an event query succeeds with no eligible records, THE SYSTEM SHALL present an accessible empty-state message distinct from an error message.
3. **3.3** WHEN an event query fails, THE SYSTEM SHALL present an accessible retry-later error state and SHALL NOT misrepresent the result as an empty schedule.
4. **3.4** WHEN event cards render at supported viewport sizes, THE SYSTEM SHALL preserve readable order, avoid content overlap, and avoid page-level horizontal scrolling.
5. **3.5** WHEN route metadata is rendered, THE SYSTEM SHALL identify the chapter and the route purpose without using unapproved marketing copy.

### Requirement 4: Safe Luma URL validation and handoff

**User Story:** As a visitor, I want registration links to lead only to approved Luma hosts, so that I am not redirected to an unsafe lookalike.

#### Acceptance Criteria

1. **4.1** WHEN an administrator submits an event URL, THE SYSTEM SHALL accept it only when parsing succeeds, its scheme is exactly `https:`, and its hostname is exactly `lu.ma`, `luma.com`, or `www.luma.com`.
2. **4.2** WHEN a submitted URL contains credentials, an explicit port, a malformed value, a lookalike hostname, or an unapproved subdomain, THE SYSTEM SHALL reject it with a sanitized validation message.
3. **4.3** WHEN a valid Luma action is rendered, THE SYSTEM SHALL open it in a new browsing context with `target="_blank"` and `rel="noopener noreferrer"`.
4. **4.4** WHEN a stored event contains a URL that fails the shared validator, THE SYSTEM SHALL NOT render that value as an actionable outbound link.
5. **4.5** WHEN URL validation runs in the admin interface and Server Action, THE SYSTEM SHALL use the same approved-host rule and SHALL treat server-side validation as authoritative.

### Requirement 5: Manila event-time validation

**User Story:** As an administrator, I want event times interpreted consistently in Philippine time, so that visitors see the intended schedule.

#### Acceptance Criteria

1. **5.1** WHEN an administrator submits a local event date and time, THE SYSTEM SHALL interpret it in `Asia/Manila` and store the corresponding UTC instant.
2. **5.2** WHEN the submitted local date-time is malformed, impossible, or fails an exact `Asia/Manila` round trip, THE SYSTEM SHALL reject it.
3. **5.3** WHEN an active event is newly created, THE SYSTEM SHALL reject an event instant that is not strictly in the future at authoritative server validation time.
4. **5.4** WHEN an event instant is displayed on `/`, `/events`, or `/dashboard`, THE SYSTEM SHALL format it using `Asia/Manila` regardless of server or browser host time zone.
5. **5.5** WHEN validation is tested, THE SYSTEM SHALL cover leap-day validity, month/day limits, boundary minutes, and host-time-zone independence.

### Requirement 6: Event mutation visibility

**User Story:** As an administrator, I want event changes to appear consistently across the portal, so that visitors receive current information.

#### Acceptance Criteria

1. **6.1** WHEN an authorized event creation, active-status transition, or deletion succeeds, THE SYSTEM SHALL revalidate `/`, `/events`, `/dashboard`, `/admin`, and `/admin/events` after the database commit.
2. **6.2** WHEN the first request after successful mutation reaches one of those event-reading routes, THE SYSTEM SHALL reflect the committed event state rather than a stale cached result.
3. **6.3** WHEN an event mutation fails, THE SYSTEM SHALL return the canonical structured action error, SHALL NOT invoke successful-path revalidation, and SHALL NOT report successful visibility.
4. **6.4** WHEN an unauthenticated or non-admin actor invokes an event mutation directly, THE SYSTEM SHALL reject it after server-side identity and role verification.
5. **6.5** WHEN a client hides or exposes an administrative control, THE SYSTEM SHALL NOT use that visibility as authorization evidence.

### Requirement 7: Accessible, server-first, and brand-neutral implementation

**User Story:** As a user of assistive technology or a constrained device, I want the homepage and event experience to remain operable and understandable, so that I can access chapter information.

#### Acceptance Criteria

1. **7.1** WHEN non-interactive homepage or event content renders, THE SYSTEM SHALL use React Server Components and SHALL isolate browser state or event handlers to the smallest necessary Client Component.
2. **7.2** WHEN users navigate the homepage and event cards by keyboard, THE SYSTEM SHALL provide logical heading order, descriptive link names, and visible focus indicators.
3. **7.3** WHEN an event query changes from loading to success, empty, or error in any client-enhanced region, THE SYSTEM SHALL expose the resulting status to assistive technology.
4. **7.4** WHEN visual styles are implemented, THE SYSTEM SHALL use semantic theme tokens and SHALL NOT introduce guessed brand colors or temporary artwork represented as approved.
5. **7.5** WHEN the feature is validated, THE SYSTEM SHALL pass targeted tests, strict lint, and a production build before implementation completion is claimed.
