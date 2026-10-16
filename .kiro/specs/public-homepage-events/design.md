# Public Homepage and Events Design

## Overview

The feature replaces the client-only theme test currently at `app/page.tsx` with a server-first public homepage and consolidates event eligibility, validation, presentation, and cache invalidation rules. The public Supabase read path continues to use the cookie-aware anonymous client and existing RLS; event row mutations remain admin-only Server Actions.

The design deliberately separates approved behavior from blocked content. Layout, components, validation, and data access can ship to a non-production review environment while the final tagline and About text remain absent or explicitly marked as pending review. Production sign-off cannot be inferred by the implementation task.

### Goals

- Provide a responsive, semantic-token homepage with fixed Join and Login destinations.
- Make active future-event selection identical on `/`, `/events`, and `/dashboard`.
- Validate Luma URLs and Manila-local event times once and reuse the rules.
- Make successful event mutations visible on the next request to every affected route.
- Preserve RLS, server-side authorization, accessible states, and external Luma ticketing.

### Non-goals

- Native event registration, ticket storage, QR generation, or door scanning.
- Approval or invention of chapter copy, logos, colors, or event data.
- Replacing Supabase RLS with privileged reads.
- Broad redesign of the admin console beyond event-related validation and feedback.

## Architecture

```text
Public request
  -> Server route (/ | /events | /dashboard)
  -> shared upcoming-events query
  -> cookie-aware Supabase server client
  -> events RLS (public may read active records)
  -> shared EventCard / accessible state
  -> HTTPS Luma handoff

Admin event submission
  -> minimal Client Component for form/banner interaction
  -> admin Server Action
  -> getCurrentUser() role check
  -> shared URL + Manila date validation
  -> Supabase mutation under RLS
  -> revalidate affected paths
  -> canonical ActionResponse
```

### Proposed module boundaries

| Module | Responsibility | Boundary |
| --- | --- | --- |
| `app/page.tsx` | Homepage composition and metadata | Server Component |
| `components/home/Hero.tsx` | Semantic hero structure and internal CTAs | Server Component |
| `components/events/UpcomingHighlights.tsx` | Fetch/render at most two upcoming events | Async Server Component |
| `components/events/EventCard.tsx` | Shared event presentation and safe outbound action | Server Component |
| `lib/events/queries.ts` | Shared projections and active-future query builder/helper | Server-only module |
| `lib/events/date-time.ts` | Manila parse, strict round trip, and display helpers | Server-safe pure module |
| `lib/validations/events.ts` | Shared Zod schemas and exact Luma host rule | Server-safe pure module |
| `app/events/page.tsx` | Full public upcoming-event list | Server Component |
| `app/dashboard/page.tsx` | Protected member view using shared event rule | Server Component |
| `components/admin/CreateEventDialog.tsx` | Browser form events and optional banner upload | Client Component |
| `app/actions/admin-events.ts` | Authorized row mutations and path revalidation | Server Action module |

Names may be adjusted to fit adjacent code, but responsibilities and trust boundaries must remain distinct.

## RSC and Client Boundaries

The homepage, hero, highlights, event list, and event cards require no browser state and remain Server Components. Internal links use Next.js `Link`; an outbound Luma anchor does not require a Client Component. The admin dialog remains client-side only because it owns dialog state, browser file APIs, compression, and form interaction. It passes untrusted values to a Server Action, which repeats all authoritative validation.

No Supabase service-role credential is used. Server Components instantiate `@/lib/supabase/server`; the admin upload leaf may use `@/lib/supabase/client` for the narrowly approved banner Storage upload, while the event database mutation stays in the Server Action.

## Components and Interfaces

### Event projection

```ts
interface UpcomingEvent {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  location: string;
  bannerUrl: string | null;
  lumaUrl: string;
}
```

The query must select only fields needed by the consumer. Mapping database snake_case fields at the module boundary prevents pages from duplicating query details.

### Upcoming query contract

```ts
interface UpcomingEventQuery {
  now?: Date;     // injected by tests; production defaults at request time
  limit?: number; // homepage passes 2
}

type EventQueryResult =
  | { status: "success"; events: UpcomingEvent[] }
  | { status: "error"; message: string };
```

The helper applies `is_active = true`, `event_date >= now.toISOString()`, ascending order, and an optional limit. It does not collapse a provider error into an empty array. If a query-builder helper is preferable to returning UI-oriented results, pages must still preserve the error/empty distinction.

### Homepage content contract

Approved copy should be represented by a small typed content object or constants module so it can be replaced without restructuring the hero. Until approval evidence exists, the implementation may render neutral structural labels that are objectively descriptive, but tasks must not insert a fabricated tagline or mark it final. The approval record remains a human-owned dependency.

### Event card

`EventCard` receives validated event data. It renders semantic headings, a Manila-formatted `<time dateTime={eventDate}>`, location, description, optional banner, and a Luma link. A missing banner uses a neutral decorative fallback; it must not imply an approved logo. If a legacy stored Luma URL fails validation, the card displays event details but suppresses the outbound action and records a sanitized server-side diagnostic.

## Shared Foundation Ownership

This specification is the sole producer for two cross-spec artifacts:

- `PHE-ART-TEST-FOUNDATION`: exact pinned test dependencies, shared test configuration, commands, smoke-test result, and producing commit. Officer-directory and responsive-accessibility work may add feature tests but must not replace package or shared test-config ownership.
- `PHE-ART-PUBLIC-NAVIGATION`: the minimal shared public-navigation module and its stable landmark, link-order, extension-point, shell, and protected-route non-regression contract. Other specs may add conditional items or interaction remediation without replacing the foundation.

## Data Flow

### Public read

1. A request captures one current instant.
2. The route calls the shared query helper with that instant and its limit.
3. Supabase RLS permits public reads only for active events; the query additionally excludes past rows.
4. The route renders an error, empty, or event collection state.
5. Event instants are formatted in `Asia/Manila`; valid Luma links open externally with safe attributes.

A single captured instant avoids boundary inconsistency inside one render. The database stores UTC `timestamptz`; timezone conversion occurs only at validated input and presentation boundaries.

### Admin mutation and revalidation

The supported mutation inventory is limited to implemented event creation, active-status transition, and deletion. This specification does not invent or claim a general event-update action.

1. Client-side constraints provide immediate feedback but are not trusted.
2. The Server Action calls `getCurrentUser()` and requires admin role.
3. Shared validation parses applicable fields and converts a strict Manila local time to UTC.
4. Supabase performs the mutation under RLS.
5. Only after a successful commit, the action calls `revalidatePath` for the literal paths `/`, `/events`, `/dashboard`, `/admin`, and `/admin/events`.
6. The action returns the canonical `ActionResponse`; the client shows accessible persistent feedback in addition to Sonner.

`PHE-ART-EVENT-REVALIDATION-CONTRACT` is a deterministic mutation-by-route matrix. Server Action tests prove call ordering, exact paths, and no successful-path revalidation for failed or unauthorized mutations. A separate human-run non-production gate produces `PHE-GATE-NONPROD-REVALIDATION`, whose first-request observations validate environment integration without making a manual execution an agent checkbox.

## Validation

### Luma URLs

The validator first inspects the raw authority segment before URL normalization, then parses with the platform `URL` implementation. It requires:

- no explicit port token in the raw authority, including an explicit default `:443`;
- `protocol === "https:"`;
- `hostname` exactly in `lu.ma`, `luma.com`, `www.luma.com` after parser normalization;
- empty `username` and `password`;
- no malformed or relative input.

It rejects HTTP, protocol-relative values, explicit default and non-default ports, suffix/prefix lookalikes, Unicode/punycode lookalikes not equal to an allowlisted ASCII host, arbitrary subdomains, and embedded credentials. Raw-authority inspection must account for credentials and bracket syntax without relying on a fragile substring match; parsing still supplies the authoritative host comparison. The same schema is imported by the admin form where feasible and by the Server Action authoritatively.

### Manila local date-time

The accepted input shape is exactly `YYYY-MM-DDTHH:mm`. Parsing extracts numeric components, validates calendar ranges and leap years, constructs the corresponding UTC instant for `Asia/Manila`, and formats that instant back to the same local minute. Any mismatch is rejected. Active creation additionally compares the resulting instant to a server-owned `now` and requires it to be strictly later.

`Asia/Manila` is the named application timezone for formatting and tests. The implementation must not rely on the host process timezone or silently normalize impossible dates such as February 30.

## Error and Empty States

| Condition | User-visible behavior | Logging behavior |
| --- | --- | --- |
| Query succeeds with zero events | Neutral “no upcoming events” state | None required |
| Query fails | Distinct retry-later error with appropriate status semantics | Sanitized server diagnostic; no secrets |
| Legacy event has unsafe Luma URL | Event remains readable; registration action omitted | Event ID and validation category only |
| Admin validation fails | Field/action error; form remains recoverable | No raw submitted URL in routine logs |
| Mutation fails | Canonical action error and Sonner error feedback | Sanitized provider context |
| Mutation succeeds | Success feedback; next request reflects state | Optional audit context without PII |

## Accessibility

- Use one page `h1`, logical section headings, landmarks, semantic lists/grids, and meaningful link text.
- Use `<time>` with a machine-readable UTC value and visible Manila-local text.
- Banner alt text describes useful event-banner content; neutral fallback icons are hidden from assistive technology when adjacent text already names the event.
- Empty and error messages are distinct in wording and semantics. Client-enhanced async states use an appropriate live region without repeatedly announcing static server content.
- Focus indicators come from shared primitives and remain visible against semantic token backgrounds.
- CTAs and registration actions meet the product touch-target standard addressed by the responsive-accessibility spec.
- Layouts must reflow without clipping at the matrix defined by the responsive-accessibility spec.

## Security and Privacy

- Public reads use the normal Supabase server client and retain RLS on `events`.
- Event row mutations remain in `app/actions/*`, verify identity and admin role through `getCurrentUser()`, and return sanitized canonical responses.
- Client validation and hidden admin controls never substitute for authorization.
- Outbound URLs are allowlisted and rendered with opener isolation.
- Only trusted banner configuration or validated object references may produce public banner URLs; this feature does not broaden Storage writes.
- No secret, service-role key, member data, or draft approval record is exposed in client bundles.

## Testing Strategy

### Unit tests

- Luma parser: approved hosts, HTTPS, credentials, ports, malformed values, protocol-relative input, unapproved subdomains, suffix/prefix lookalikes, case normalization, and Unicode/punycode cases.
- Manila parser: valid values, impossible dates, leap years, boundary minutes, strict round trip, future/past equality, and independence from host timezone.
- Upcoming selection/query construction: active/inactive, past/equal/future, chronological order, homepage limit two, and injected `now`.

### Component and integration tests

- Hero CTA destinations and no client-only homepage dependency.
- Event card content, `<time>`, banner fallback, safe Luma attributes, and suppressed unsafe legacy URL.
- Separate error and empty states.
- `/`, `/events`, and `/dashboard` use the shared eligibility rule.
- Authorized mutation changes the first subsequent response for affected routes; unauthorized direct invocation fails.

### Manual and release validation

- Keyboard and responsive checks defer to the full matrix in the responsive-accessibility spec.
- Run targeted tests for changed modules, `npm run lint -- --max-warnings=0`, and `npm run build`.
- Final content review is performed by the named human approver; passing automated checks cannot satisfy criteria 1.5 or 1.6.

## Requirements Traceability

| Requirements | Design elements | Primary verification |
| --- | --- | --- |
| 1.1–1.6 | Homepage composition and content contract | Route, CTA, and approval-gate review |
| 2.1–2.6 | Shared query contract | Unit and route integration tests |
| 3.1–3.5 | EventCard and state model | Component and route tests |
| 4.1–4.5 | Shared Luma validator | Adversarial URL tests |
| 5.1–5.5 | Manila date-time module | Deterministic timezone tests |
| 6.1–6.5 | Server Action and revalidation flow | Auth and first-request integration tests |
| 7.1–7.5 | RSC boundaries, accessibility, tokens | Static review, matrix, lint, build |
