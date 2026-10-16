---
inclusion: always
---
# Product Overview: PICE PCUD Web Portal

## Context & Purpose
Official web platform for the Philippine Institute of Civil Engineers – PCU Dasmariñas Student Chapter (PICE PCUD). It replaces fragmented Google Sheets and Facebook Messenger screenshot tracking with an automated, auditable digital workflow.

## Target Personas
- **Student Members:** Civil engineering students registering for accounts, checking event announcements, submitting GCash payment receipts, and accessing chapter perks.
- **Chapter Officers (Admins):** Executive board members verifying GCash transactions, exporting Treasurer liquidation CSVs, and publishing event updates.

## Core Value Proposition & Scope Boundaries
- **Zero Recurring Liability:** The organization requires a **₱0.00/month** cloud operating baseline. Architecture must strictly avoid paid managed services or compute instances.
- **Decoupled QR Ticketing (Luma Bridge):** Do NOT build native camera door scanners or real-time barcode ticket validators. Event announcements link externally to Luma.com (`luma_url`), offloading ticketing overhead to a free, proven engine.
- **GCash Receipt Verification:** Members upload proof-of-payment screenshots. Officers review them via a private review queue and click Approve/Reject. Approvals dispatch automated transactional email receipts.