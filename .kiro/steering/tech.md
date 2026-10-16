---
inclusion: always
---
# Technology Stack & Constraints

## Core Stack
- **Framework:** Next.js 16 (App Router), React 19, TypeScript (strict mode).
- **Styling:** Tailwind CSS, Shadcn UI primitives, Lucide React icons.
- **Backend & Auth:** Supabase Cloud (@supabase/ssr, PostgreSQL with RLS).
- **Transactional Email:** Resend API + React Email templates.
- **Image Processing:** `browser-image-compression` (Client-side WebP conversion).

## Architectural Mandates
- **Server-First Execution:** Default to React Server Components (RSC). Use `'use client'` strictly when handling browser events, React state, or client APIs.
- **Mutation Boundary:** All database mutations, status transitions, and email triggers must reside in Next.js Server Actions under `app/actions/*`. Never write mutations inside Route Handlers (`app/api/*`) unless handling external webhooks.
- **Security & Authorization:** Never trust client-submitted IDs or hidden buttons. All Server Actions and protected layouts must verify session identity and admin privileges using `#[[file:lib/auth/get-current-user.ts]]`.
- **Environment Isolation:** Never expose `RESEND_API_KEY`, Supabase service role keys, or database credentials to the browser. Only prefix public keys with `NEXT_PUBLIC_`.