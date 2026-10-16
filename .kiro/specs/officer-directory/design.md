# Officer Directory Design

## Overview

The officer directory is a public, server-rendered route backed by one reviewed static roster rather than member profiles. This avoids a schema change and prevents broadening `profiles` RLS. The route/card infrastructure can be completed with an empty, blocked publication state; real entries and public navigation are separate tasks gated by chapter-secretary approval and consent evidence.

### Goals

- Build a reusable, responsive officer grid and card structure.
- Define one typed, validated academic-year roster with review metadata.
- Provide robust initials fallback for absent or failed portraits.
- Prevent publication or navigation before D-02 is satisfied.
- Keep account data private and preserve server-first rendering.

### Non-goals

- Deriving chapter offices from the `admin` account role.
- Publishing profile fields or adding anonymous `profiles` access.
- Building a roster CMS, upload workflow, or approval UI.
- Inventing names, titles, terms, consent, portraits, branding, or approvals.

## Architecture

```text
Build/request
  -> server-only roster module
  -> schema validation + publication gate
  -> /officers Server Component
  -> responsive OfficerCard collection
  -> OfficerPortrait
       -> approved image, or
       -> deterministic initials fallback

Public navigation
  -> include /officers only after recorded D-02 approval
```

### Proposed module boundaries

| Module | Responsibility | Boundary |
| --- | --- | --- |
| `app/officers/page.tsx` | Metadata, page heading, gate state, roster grid | Server Component |
| `components/officers/OfficerCard.tsx` | Name/title/card semantics | Server Component |
| `components/officers/OfficerPortrait.tsx` | Approved image and runtime error fallback | Small Client Component only if `onError` state is required |
| `lib/officers/roster.ts` | Single typed roster and review metadata | Server-only/static module |
| `lib/officers/validation.ts` | Schema, publishability checks, initials utility | Pure server-safe module |
| Shared public navigation | Conditional `/officers` link | Server Component where session-aware behavior is needed |

The exact names may follow local conventions. The roster must not be exported through a browser API or mixed with account-profile records.

## RSC and Client Boundaries

`app/officers/page.tsx` and `OfficerCard` are Server Components. They consume validated static data and require no browser state. If the chosen image component cannot switch to fallback after a network/decode failure without browser state, only `OfficerPortrait` becomes a Client Component. Its props contain already-approved public display data and a trusted image path; it performs no fetch, mutation, upload, or approval.

A missing image known at validation time renders initials entirely on the server. This keeps JavaScript optional for the primary page content.

## Shared Artifact Dependencies

This specification consumes `PHE-ART-TEST-FOUNDATION` and `PHE-ART-PUBLIC-NAVIGATION`, both owned by `public-homepage-events`. Officer-directory work may add feature-scoped tests and a conditional `/officers` item through the recorded navigation extension point. It must not add or replace package dependencies, shared test configuration, or the base public-navigation implementation.

## Data Model

```ts
type PublicationStatus = "blocked" | "active" | "withdrawn";

interface RosterTerm {
  label: string;
  startsAt: string;
  endsAt: string;
}

interface OfficerHeadshot {
  src: string;
  width: number;
  height: number;
  trustedSource: string;
  sourceAttribution: string;
  consentEvidenceRef: string;
  consentGrantedAt: string;
  consentValidThrough: string;
}

interface OfficerEntry {
  id: string;
  displayName: string;
  executiveTitle: string;
  displayOrder: number;
  initialsApproved: true;
  headshot?: OfficerHeadshot;
}

interface BlockedOrWithdrawnRoster {
  publicationStatus: "blocked" | "withdrawn";
  officers: readonly [];
}

interface ActiveOfficerRoster {
  publicationStatus: "active";
  term: RosterTerm;
  reviewedBy: string;
  reviewedAt: string;
  approvalEvidenceRef: string;
  officers: readonly OfficerEntry[];
}

type OfficerRoster = BlockedOrWithdrawnRoster | ActiveOfficerRoster;
type OfficerRosterCandidate = Omit<ActiveOfficerRoster, "publicationStatus">;
```

The exported production roster begins blocked with an empty `officers` array. Real identities remain in a non-public candidate artifact until the final activation task. Tests use synthetic fixtures colocated with tests, never production roster data.

### Roster validation

Before candidate validation or activation, validation requires:

- one non-empty term label, valid ISO start and end instants, `startsAt < endsAt`, and a server-owned current instant within that inclusive validity window;
- reviewer, review date, and roster approval evidence for activation;
- unique stable IDs and deterministic, non-negative display order with a stable tie-breaker;
- trimmed non-empty display name and executive title;
- `initialsApproved: true` for every entry;
- for every headshot, square dimensions, trusted path/source, non-empty source attribution, per-headshot consent evidence reference, consent date, and consent-valid-through instant covering activation;
- no profile-only fields or private consent documents in the public bundle.

Term, roster, or required identity failures prevent activation. A candidate headshot with missing, expired, or invalid consent/source/attribution data is not activation-ready; after activation, a runtime decode/load failure suppresses only the image and degrades to the separately approved initials. Diagnostics are explicit during validation and sanitized on public requests.

## Components and Presentation

### Officers page

The route defines descriptive metadata without listing unapproved names. It renders a main landmark, one `h1`, a term label only for an active and current roster, and a semantic list/grid of cards. Before activation or after term expiry/withdrawal, it renders a neutral message such as “The officer directory is not available yet.” That blocked route is a valid responsive-accessibility audit state and is not a publication failure.

### Officer card

Each list item contains one article/card. The visible name is the card heading and the executive title follows as text. Static cards are not buttons and receive no `tabIndex`. Shadcn primitives are imported from `@/components/ui/*`; visual color uses semantic tokens only.

### Portrait and initials fallback

Active headshots use a square aspect ratio and fixed intrinsic dimensions to prevent layout shift. Because the visible name already identifies the person, the image may use empty alt text when purely illustrative. If the approver determines the image conveys additional information, the approved alt treatment must be recorded; filenames are never used as alt text. Attribution follows the recorded display rule and remains available wherever required by the source.

Fallback generation normalizes whitespace, splits the display name into meaningful tokens, and uses the first Unicode letter/number from the first and last tokens; a single-token name uses up to its first two meaningful characters. If no meaningful characters exist, it uses a neutral symbol. The fallback container can use `role="img"` and an accessible label such as “Portrait unavailable for {name},” while visible initials are hidden from duplicate announcement. An image load error switches once to the same fallback and avoids a retry loop.

## Data Flow and Publication Gate

1. Infrastructure ships with `publicationStatus: "blocked"` and no public identities.
2. A human secretary supplies `OD-GATE-ROSTER-EVIDENCE-INTAKE`; this is evidence intake, not approval.
3. An agent fails closed unless every roster, term, initials, and per-headshot consent/source/attribution field validates, then records `OD-ART-VALIDATED-ROSTER-EVIDENCE`.
4. An agent builds a non-public `OD-ART-ROSTER-CANDIDATE` exclusively from that evidence.
5. Targeted automated rendering validation produces `OD-ART-ACCESSIBILITY-CANDIDATE` without adding identities or `/officers` to public navigation.
6. Named human accessibility reviewers exercise that exact candidate and record `OD-GATE-CANDIDATE-ACCESSIBILITY-EVIDENCE` for the applicable `RA-MATRIX-AT`, reflow, keyboard, focus, portrait, fallback, and attribution procedures.
7. An agent fails closed unless technical validation and the named accessibility gate match the candidate hash/commit; passing results form `OD-ART-PUBLICATION-CANDIDATE`.
8. One named human roster reviewer approves that exact publication candidate in `OD-GATE-FINAL-PUBLICATION-APPROVAL`.
9. One final activation task verifies the gate and candidate commit, then adds the approved roster and conditional navigation item together.
10. Withdrawal, term expiry, or consent expiry returns the roster to a safe non-publication state and removes the nav item without removing infrastructure.

Approval must not be inferred from non-empty data, image existence, email, Git authorship, or the `admin` role. Private consent evidence is referenced by stable redacted identifiers; source documents do not enter the public bundle.

## Error and Empty States

| Condition | Result |
| --- | --- |
| Gate blocked, route unpublished, or roster intentionally empty | Neutral directory-unavailable state; no identities |
| Term not started, expired, invalid, or withdrawn | No publication and no public navigation item |
| Candidate unexpectedly has zero entries | Validation failure; no activation |
| Required roster approval metadata is invalid | No activation; sanitized diagnostic |
| Required officer identity or initials permission is invalid | No activation for that candidate |
| Headshot consent/source/attribution is absent, invalid, or expired before activation | Candidate validation failure; no headshot activation |
| Active portrait load/decode fails | Runtime approved-initials fallback |
| Navigation gate blocked | No `/officers` public navigation item |

The user-facing state must not expose internal approval paths, reviewer contact data, stack traces, or local filesystem details.

## Accessibility

- One page `h1`; officer names use consistent subordinate headings.
- Use semantic list/list-item or equivalent grid semantics; cards preserve DOM reading order.
- Static cards and portraits do not add unnecessary keyboard focus stops.
- The fallback has an accessible description without repeating both initials and the nearby visible name.
- Portrait sizing and card text reflow at 200% zoom; long candidate names/titles wrap without clipping.
- Focus styles apply to genuine navigation links after activation.
- Contrast and colors derive from semantic tokens and are tested through responsive-accessibility evidence; the safe blocked `/officers` route is a valid pre-activation audit state.

## Security and Privacy

- The feature does not query Supabase `profiles`, modify RLS, or expose member identifiers.
- The active roster contains only approved public display fields.
- Image paths are trusted static/configured references, never arbitrary client input.
- No mutation or upload endpoint is introduced.
- Approval metadata references redacted evidence records; private consent documents and PII do not enter the public bundle.
- Navigation extension does not replace the owner artifact or weaken protected route checks.

## Testing Strategy

### Unit tests

- Roster schema: term bounds/current-time predicate, required review metadata, unique IDs, ordering, publication states, initials permission, per-headshot consent reference/date/validity, trusted source, source attribution, square dimensions, and rejection of profile-only fields.
- Initials generation: extra whitespace, punctuation, single-word, multi-part, hyphenated, accented/Unicode, and empty/invalid names.
- Publication predicate: blocked, active/current, withdrawn, not-yet-valid, term-expired, consent-expired, and invalid candidate states.

### Component and route tests

- Blocked route contains no fixture or real identity and is accepted as an auditable route state.
- Candidate fixture renders once per entry in deterministic order without activating production data.
- Name/title heading structure and semantic list markup are correct.
- Missing image and simulated runtime image failure render the same approved accessible fallback.
- `/officers` navigation is absent before final activation and present only for the active/current predicate.

### Manual and release validation

Human evidence intake and final approval are defined as uncheckable manual gates in `tasks.md`. Agent tasks validate their named artifacts and fail closed when evidence is absent or stale. Candidate checks cover 360, 390, 768, 1024, and 1440 CSS-pixel widths at 100% and 200% zoom through responsive-accessibility artifacts, plus keyboard order, focus visibility, portrait/fallback announcements, and long-name wrapping. Targeted tests, `npm run lint -- --max-warnings=0`, and `npm run build` run before final human approval. Activation is the last task and introduces both approved data and navigation.

## Requirements Traceability

| Requirements | Design elements | Primary verification |
| --- | --- | --- |
| 1.1, 1.2, 1.3, 1.4, 1.5 | Publication gate and safe route state | Gate-artifact validation and blocked-route tests |
| 2.1, 2.2, 2.3, 2.4, 2.5, 2.6 | Typed term-bounded roster and validator | Schema, expiry, and order tests |
| 3.1, 3.2, 3.3, 3.4, 3.5, 3.6 | OfficerCard and portrait fallback | Component, consent, and initials tests |
| 4.1, 4.2, 4.3, 4.4, 4.5 | Grid and semantics | Candidate accessibility evidence |
| 5.1, 5.2, 5.3, 5.4 | One final conditional activation | Navigation predicate and non-regression tests |
| 6.1, 6.2, 6.3, 6.4, 6.5 | Static server architecture and privacy | Code review, tests, lint, and build |
