---
inclusion: manual
---
# End-to-End System Audit Playbook

Execute the following verification procedures when running milestone checks or system audits:

## 1. Static Type & Compilation Check
Run the production build in the terminal to verify zero type mismatches or App Router dynamic context errors:
```bash
npm run build
```

## 2. Route Protection Smoke Test
- Navigate to `/dashboard` in an unauthenticated Incognito window -> verify redirect to `/login`.
- Log in as a student member (`role === 'member'`) and visit `/admin` -> verify redirect to `/dashboard`.
- Log in as an administrator (`role === 'admin'`) -> verify access to `/admin/payments`, `/admin/events`, and `/admin/members`.

## 3. Storage Privacy & Compression Check
- Submit a test receipt via #[[file:components/payments/GcashUploadDialog.tsx]].
- Check the file size in the Supabase Dashboard -> Storage -> `gcash-receipts`: verify the uploaded file is `<200KB` (confirming client-side WebP compression).
- Open the receipt preview modal in `/admin/payments`: verify the image URL uses a signed token (`token=...`) and is not an open public URL.

## 4. Treasurer CSV Export Validation
- Navigate to `/admin/members` and click "Export Roster to CSV".
- Open the resulting file and verify column headers:
  `Full Name,Student ID,Year Level,Role,Payment Status,Reference No,Amount Paid,Date Registered`
- Verify that empty or optional fields resolve to `N/A` or empty strings rather than `"undefined"` or `"null"`.

## 5. Direct Database Sanity Query
Run in the Supabase SQL Editor to verify recent submission records:
```sql
SELECT 
  p.id, 
  pr.full_name, 
  pr.student_id, 
  p.amount, 
  p.reference_no, 
  p.status 
FROM public.payments p
JOIN public.profiles pr ON p.user_id = pr.id
ORDER BY p.created_at DESC
LIMIT 5;
```