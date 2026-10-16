---
inclusion: fileMatch
fileMatchPattern: ["supabase/**", "lib/supabase/**", "app/actions/**"]
---

# Database & Storage Security Standards

## Supabase Client Instantiation

- In Server Components, Server Actions, and Route Handlers:

  ```ts
  import { createClient } from "@/lib/supabase/server";
  const supabase = await createClient();
  ```

- In Client Components:

  ```ts
  import { createClient } from "@/lib/supabase/client";
  const supabase = createClient();
  ```

## Row-Level Security (RLS) & Trigger Bypasses

- RLS must remain active on `profiles`, `events`, and `payments`.
- The `protect_profile_role()` trigger prevents client-side role privilege escalation. When updating roles in migration scripts or backend jobs, the function must bypass checks when run by backend roles or without a user JWT:

  ```sql
  IF current_user IN ('postgres', 'service_role') OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  ```

## Storage Bucket Conventions & Privacy

- **Bucket `gcash-receipts` (STRICTLY PRIVATE):**
  - Object key: `${userId}/${timestamp}.webp` inside the `gcash-receipts` bucket; the bucket name is not part of the object key.
  - **Never** call `getPublicUrl()` on payment receipts.
  - Previews must generate short-lived signed URLs with a 60-second validity window:

    ```ts
    const { data, error } = await supabase.storage
      .from("gcash-receipts")
      .createSignedUrl(proofPath, 60);
    ```

- **Bucket `event-banners` (PUBLIC):**
  - Public read-only for event cards; uploads and deletions restricted to users with `role = 'admin'`.
- **Client-Side Compression:**
  - Receipt uploads must pass through `browser-image-compression` (<200KB WebP) before upload in #[[file:components/payments/GcashUploadDialog.tsx]] to preserve Supabase free-tier storage quotas.
