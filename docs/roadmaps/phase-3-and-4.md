# PICE PCUD Portal Phase 3 and 4 Program Roadmap

## Purpose

This document is the program-level roadmap, decision register, dependency index, and release-control record for Phases 3 and 4. It is **not** an executable Kiro Spec. Executable work is defined in focused directories under `.kiro/specs/<name>/`, each containing `requirements.md`, `design.md`, and `tasks.md`.

Sprints 1 through 12 provide the current implementation baseline. The focused specs below harden that baseline and deliver the remaining public experience, accessibility, staging, handover, and launch work. Requirements, designs, and tasks are authoritative for implementation detail; this roadmap is authoritative for cross-spec order, approved decisions, unresolved external inputs, and release gates.

## Table of Contents

- [Kiro Execution Model](#kiro-execution-model)
- [Focused Spec Index](#focused-spec-index)
- [Program Sequence](#program-sequence)
- [Decision Register](#decision-register)
- [Outstanding Human Inputs](#outstanding-human-inputs)
- [Evidence and Change Control](#evidence-and-change-control)
- [Release Gates](#release-gates)

## Kiro Execution Model

- Execute work from each focused spec's `tasks.md`, not from this roadmap.
- Use per-task execution for migrations, privileged credentials, fixture creation, destructive cleanup, DNS changes, sender enablement, controlled production delivery, and human approvals.
- Do not use a cross-spec or program-wide **Run all Tasks** operation.
- Human approvals and external assets remain incomplete until an authorized person supplies evidence. An implementation agent cannot infer or self-approve them.
- Requirements-First specs lead with product behavior. Design-First specs lead with security, data, or operational architecture.
- When a decision or requirement changes, update the roadmap decision, synchronize the affected spec's requirements/design/tasks, and rerun impacted validation and evidence.
- Every implementation task must follow workspace steering and the installed Next.js 16 guidance under `node_modules/next/dist/docs/`.

## Focused Spec Index

| Order | Spec | Workflow | Scope | Current state |
| --- | --- | --- | --- | --- |
| 1 | [`preflight-environment-guards`](../../.kiro/specs/preflight-environment-guards/) | Design-First | Environment isolation, target binding, dry-run, credential custody, evidence | Ready to execute |
| 2 | [`public-homepage-events`](../../.kiro/specs/public-homepage-events/) | Requirements-First | Homepage structure, events, Luma validation, Manila time, revalidation | Infrastructure ready; final copy blocked |
| 3 | [`officer-directory`](../../.kiro/specs/officer-directory/) | Requirements-First | Publication-safe route/card infrastructure and roster gate | Infrastructure ready; publication blocked |
| 4 | [`payment-security-lifecycle`](../../.kiro/specs/payment-security-lifecycle/) | Design-First | Payment schema, transitions, history, academic years, receipts, retention, banner keys | Additive work ready; cutover inputs remain |
| 5 | [`server-actions-email-exports`](../../.kiro/specs/server-actions-email-exports/) | Design-First | Action contract, confirmation, delivery persistence/retry, roster and liquidation exports | Depends on payment lifecycle contracts |
| 6 | [`responsive-accessibility`](../../.kiro/specs/responsive-accessibility/) | Requirements-First | Responsive/a11y remediation, browser/device evidence, post-hardening regression | Initial work ready; final evidence follows hardening |
| 7 | [`deployment-handover`](../../.kiro/specs/deployment-handover/) | Design-First | Commit-matched deployment target, Auth origins, migration order, smoke tests, handover | Preparation ready |
| 8 | [`staging-operations`](../../.kiro/specs/staging-operations/) | Design-First | Conditional staging, fixtures, controlled workflow, phased cleanup | Cloud branch depends on free capacity |
| 9 | [`production-email-dns`](../../.kiro/specs/production-email-dns/) | Design-First | Domain/DNS, sender enablement, controlled delivery, recovery | Blocked pending domain inputs |

## Program Sequence

### Wave 0: Safety foundation

Complete `preflight-environment-guards` before any non-production migration rehearsal, security fixture creation, staging seed, cleanup, or controlled mail execution.

### Wave 1: Independent public and additive preparation

After Preflight:

- Implement the unblocked infrastructure tasks in `public-homepage-events` and `officer-directory`.
- Begin additive, non-destructive schema and profiler work in `payment-security-lifecycle`.
- Begin reusable remediation and evidence templates in `responsive-accessibility`.

Blocked copy, roster, branding, and live QR inputs do not prevent these lanes.

### Wave 2: Security and application cutover

1. Complete payment lifecycle profiling, approved mappings, migrations, direct boundary tests, and staged cutover.
2. Complete `server-actions-email-exports` against the immutable approval/version contract.
3. Run strict lint, direct Supabase tests, HTTP lifecycle tests, and production build at recorded commits.

Do not enable payment cutover until an explicit academic year exists and legacy payment mappings pass their zero-blocker gate.

### Wave 3: Accessibility authority

Complete the initial responsive/accessibility matrix after affected public routes exist. After payment/action/email/export hardening, run the required post-hardening regression; the later evidence supersedes overlapping earlier evidence.

### Wave 4: Commit-matched staging target

Use `deployment-handover` to establish the exact preview or local production-server lifecycle and configure matching Supabase Auth Site URL, redirect allowlist, and `/auth/confirm` callback before staging workflow execution.

### Wave 5: Staging workflow and cleanup

Use `staging-operations` to choose the free-capacity branch, seed manifest-owned fixtures, execute registration/confirmation/login/payment/export/event cases, and perform separately authorized phased cleanup. Local/test evidence must never be relabeled as dedicated cloud-staging evidence.

### Wave 6: Handover and launch preparation

Complete deployment, migration, recovery, ownership, audit-playbook, officer-guide, and gate evidence. Resolve all launch-blocking external inputs.

### Wave 7: Production email and DNS

Execute `production-email-dns` only after all domain inputs and named human authorizations exist. Provider-issued records are authoritative. Production mail must never fall back to sandbox or test-recipient behavior.

## Decision Register

Decisions recorded on September 28, 2026 remain authoritative until a dated amendment is approved. Preflight copies these records into `docs/operations/decision-register.md` and preserves later history.

### D-01: Homepage and events — Partially approved

- Join Chapter routes to `/register`; Login routes to `/login`.
- Luma URLs require HTTPS and exact host `lu.ma`, `luma.com`, or `www.luma.com`.
- Upcoming lists contain active events with `event_date >= request-time now`, ordered ascending.
- New active events must be future instants interpreted in `Asia/Manila` and stored as UTC.
- Successful event mutations are visible on affected routes on the next request.
- Final tagline and About copy remain open.

### D-02: Officer publication — Blocked for publication

Route/card infrastructure may proceed. Public navigation and real identities/photos require an approved academic-year roster, reviewer, titles, and initials/headshot consent.

### D-03: Browser and accessibility coverage — Approved

Test 360, 390, 768, 1024, and 1440 CSS pixels at 100% and 200% zoom. Cover current Chrome, Edge, and Firefox on Windows, Chrome on Android, and Safari on a real iOS device. Light theme is required; dark-theme checks become required only if dark mode is exposed.

### D-04: Payment validation and correction — Approved

- Amount: PHP `1.00` through `100,000.00`, at most two decimals.
- Reference: exactly 13 ASCII digits and globally unique.
- Initial state: member-owned `pending` with server-owned privileged fields.
- Legal review transitions: `pending -> approved` and `pending -> rejected`.
- Admins may reopen approved or rejected payments to pending through a dedicated operation requiring a trimmed 10–500 character reason and immutable history.
- Reapproval creates a new approval version and at most one automatic delivery attempt for that version.

### D-05: Academic year and retention — Partially/provisionally approved

- Every payment stores an explicit academic-year identity; no year is inferred from timestamps.
- Payment metadata retention defaults to five years.
- Receipt retention defaults to 24 months after the explicit academic-year end, subject to dispute/audit holds.
- Production deletion remains disabled until Treasurer/data-owner ratification and operator assignment.
- Current academic-year label, start date, and end date remain unresolved and must not be guessed.

### D-06: Treasurer exports — Partially approved

- Provide both member-roster and liquidation-ledger exports.
- A roster member without a current approved payment shows `No approved payment` with blank reference and amount.
- Liquidation includes current approved payments and filters by immutable `approved_at` over an inclusive Manila calendar-date range.
- CSVs are admin-only, bounded to 10,000 rows or 5 MiB, UTF-8 with BOM, and not retained server-side.
- The approved private location for downloaded files remains open.

### D-07: Staging and credential custody — Partially approved

Create a separate staging Supabase project only when a dated free-tier check confirms an available slot; otherwise keep cloud staging blocked and use local/test preparation. The project owner alone may hold the server-only staging Admin credential. Capture the staging admin UUID during setup. Configure `TEST_EMAIL_TO` only when the controlled staging-mail task is reached.

### D-08: GCash QR — Partially approved

A clearly labeled, non-payable fixture QR may be used for staging workflow tests. The verified live QR, account display name, number-publication choice, and second-officer verification remain mandatory for the launch candidate.

### D-09: Production domain and transactional email — Blocked

Web deployment may use the free Vercel subdomain. Full production launch remains blocked until the chapter controls a Resend-verifiable domain and supplies the DNS owner, renewal payer, approved role sender, change authorizer, controlled-test officer, and recovery owner.

### D-10: Branding — Partially approved

Development proceeds with neutral semantic tokens. Before launch, integrate approved branding or record a dated neutral-theme waiver. Temporary artwork and an unverified live QR are never covered by the waiver.

### D-11: Mandatory email ownership confirmation — Approved

Registration requires email ownership confirmation through `/auth/confirm`. A valid confirmation establishes the SSR session, verifies profile readiness, and redirects to `/dashboard`. Missing, invalid, reused, expired, or unsupported confirmation credentials redirect to `/login?message=confirmation_failed` without exposing account or token details.

### D-12: Receipt preview authorization — Approved

A receipt owner may mint a 60-second signed URL only for their associated receipt; an admin may mint one for any associated receipt. Other actors cannot mint a URL. The signed URL is a bearer capability usable by anyone who possesses it until expiry, so it is never logged, persisted, or included in evidence.

## Outstanding Human Inputs

| Input | Blocks | Does not block |
| --- | --- | --- |
| Final homepage tagline and About copy | Homepage content sign-off | Homepage/event infrastructure |
| Approved officer roster and consent | Officer publication/navigation | Officer route/card infrastructure |
| Current academic-year label/start/end and legacy mapping | Payment enforcing cutover and new submissions | Additive schema, profilers, tests |
| Retention ratification and authorized operator | Production retention/deletion | Reporting and fail-closed implementation |
| Private CSV download-storage location | Data Gate | Export implementation/testing |
| `TEST_EMAIL_TO` configuration | Controlled staging-mail case | Local/test mail simulation |
| Verified live GCash QR/account/verifier | Launch candidate | Non-payable staging workflow |
| Controlled domain and production email owners | Production email/DNS and full launch | Staging and Vercel-subdomain deployment |
| Approved branding or dated waiver | Operational/Launch Gates | Neutral-theme development |

## Evidence and Change Control

Store redacted evidence under `docs/audits/phase-3-4/`. Each record includes commit/date, environment and target class, exact procedure or command, expected/actual result, reviewer/date, and exceptions. Never record secrets, full email addresses, member PII, receipt content or keys, signed URLs, cookies, tokens, private DNS values, or raw provider payloads.

For every schema, policy, provider, or deployment change:

1. profile current state and dependencies;
2. define prechecks and zero-blocker/abort thresholds;
3. rehearse against approved non-production infrastructure;
4. obtain the required human authorization;
5. apply one independently reviewable concern;
6. verify results and invalidate stale evidence after changes; and
7. use rollback only when compatibility is proven, otherwise use a named forward fix.

## Release Gates

These gates govern full production launch, not completion of unaffected spec tasks.

### Security Gate

- Direct RLS, routine, trigger, RPC, Storage, route, mail, and export tests pass against non-production infrastructure.
- Production-ref guards and credential/bundle redaction checks pass.
- Payment and event-banner migration blocker counts are zero or explicitly quarantined through approved evidence.

### Data Gate

- D-05 retention is ratified and production deletion remains correctly gated.
- Staging fixtures reconcile to zero while the preserved admin remains intact.
- D-06 export semantics and private downloaded-PII handling are Treasurer-approved.

### Quality Gate

- Strict lint, targeted/unit/property tests, direct Supabase tests, HTTP lifecycle tests, and production build pass at recorded commits.
- D-03 browser/device evidence has no unresolved blocker.
- Post-security-hardening accessibility evidence is authoritative.

### Operational Gate

- The protected officer guide has officer sign-off.
- Deployment, migration, recovery, secret rotation, incident escalation, domain renewal, and evidence owners are named.
- The live D-08 QR is independently verified.
- Branding is complete or D-10 records a dated neutral-theme waiver.

### Infrastructure Gate

- Environment isolation, Auth origins, callback behavior, and commit-matched deployment identity are verified.
- Free-tier usage remains below documented thresholds with no automatic paid upgrade.
- D-09's Resend-verifiable domain and DNS ownership are verified.

### Launch Gate

- Authentication confirmation and protected-route redirects behave as specified.
- Receipt privacy, payment lifecycle, delivery-failure isolation/retry, both exports, event publication, and Luma handoff pass.
- Production sender and controlled delivery work without sandbox dependencies.
- No dummy record, payable placeholder, temporary artwork, or unapproved officer identity remains.
- Named reviewers record final approval, launch responsibility, and recovery ownership.
