---
inclusion: fileMatch
fileMatchPattern: ["app/**/*.tsx", "components/**/*.tsx"]
---

# UI Theming & Component Conventions

## Theme Token Abstraction (Active Rebranding)

The organization is actively rebranding. Never hardcode arbitrary hex values (`#1a365d`, `#f59e0b`) into Tailwind class lists. All visual colors must reference semantic CSS variable tokens defined in #[[file:app/globals.css]].

```tsx
// ❌ BAD: Hardcoded hex codes break brand updates
<button className="bg-[#1e3a8a] text-white hover:bg-[#172554]">
  Submit Receipt
</button>

// ✅ GOOD: Semantic tokens update instantly when globals.css variables change
<Button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Submit Receipt
</Button>
```

## Data Table Viewport Safety

All administrative data tables (`/admin/payments`, `/admin/members`, `/admin/events`) must have exactly one overflow container to prevent horizontal viewport clipping on mobile screens. Prefer the shared table primitive when it already owns that boundary; do not add redundant nested scrolling wrappers.

```tsx
<div className="w-full overflow-x-auto rounded-md border border-border">
  <Table className="min-w-650px">
    {/* Table headers and rows */}
  </Table>
</div>
```

## Component Standards & Outbound Links

- **Primitive Imports:** Use Shadcn UI primitives exclusively from `@/components/ui/*`.
- **Feedback Alerts:** Use Sonner toasts (`import { toast } from "sonner"`) for action outcomes.
- **External Luma Ticketing:** Outbound links to Luma registration pages (`luma_url`) must include security rel attributes:

  ```tsx
  <a href={event.luma_url} target="_blank" rel="noopener noreferrer">
    Register on Luma ↗
  </a>
  ```
