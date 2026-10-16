---
inclusion: always
---
# Project Structure & Routing

## Directory Layout
- `app/(auth)/`: Unauthenticated login and registration routes (`/login`, `/register`).
- `app/dashboard/`: Protected member portal (payment history, upload modal, upcoming events).
- `app/admin/`: Protected officer administrative console (`/admin/payments`, `/admin/events`, `/admin/members`).
- `app/actions/`: Next.js Server Actions grouped by domain (`admin-payments.ts`, `admin-events.ts`, `auth.ts`).
- `components/ui/`: Base Shadcn UI primitives.
- `components/payments/`: Member payment upload dialogues and preview components.
- `components/admin/`: Admin datatables, action dialogs, and verification tools.
- `lib/supabase/`: Supabase client factories (`client.ts`, `server.ts`).
- `lib/auth/`: Session retrieval and role verification helpers.
- `supabase/migrations/`: Sequential PostgreSQL migration scripts.
- `emails/`: React Email transactional templates.

## Route Protection Architecture
- Edge session refreshing is handled via `proxy.ts` (Next 16 convention) or `middleware.ts`.
- Unauthenticated requests to `/dashboard` or `/admin/*` must redirect to `/login`.
- The layout at `app/admin/layout.tsx` must verify `profile.role === 'admin'` server-side and redirect unauthorized members to `/dashboard`.