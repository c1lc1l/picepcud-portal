"use server";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { parseYear, sanitizeSearch } from "@/lib/members";
import { createClient } from "@/lib/supabase/server";

export type ExportRosterResult = { error: string } | { csv: string };

const HEADER = [
  "Full Name",
  "Student ID",
  "Year Level",
  "Role",
  "Payment Status",
  "Reference No",
  "Amount Paid",
  "Date Registered",
];

// Quotes fields, and defuses spreadsheet formulas in user-supplied text.
function csvCell(value: string | number | null | undefined) {
  let s = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

const PAGE = 1000;

// Supabase caps a single response, so read large tables in batches.
async function fetchAll<T>(
  query: (from: number, to: number) => PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
  }>
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await query(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) return rows;
  }
}

type ProfileRow = {
  id: string;
  full_name: string;
  student_id: string;
  year_level: number;
  role: string;
  created_at: string;
};

type PaymentRow = {
  user_id: string;
  status: string;
  reference_no: string;
  amount: number | string;
  created_at: string;
};

// Exports every member matching the current search/year filter (not just the
// visible page). Payment columns show the member's latest approved payment,
// falling back to their latest payment of any status.
export async function exportRosterCsv(
  q?: string,
  year?: string
): Promise<ExportRosterResult> {
  const { isAdmin } = await getCurrentUser();
  if (!isAdmin) return { error: "Only admins can export the roster" };

  const search = sanitizeSearch(q);
  const yearLevel = parseYear(year);
  const supabase = await createClient();

  try {
    const profiles = await fetchAll<ProfileRow>((from, to) => {
      let query = supabase
        .from("profiles")
        .select("id, full_name, student_id, year_level, role, created_at")
        .order("full_name", { ascending: true })
        .order("id", { ascending: true })
        .range(from, to);
      if (yearLevel) query = query.eq("year_level", Number(yearLevel));
      if (search) {
        query = query.or(
          `full_name.ilike.%${search}%,student_id.ilike.%${search}%`
        );
      }
      return query;
    });

    const payments = await fetchAll<PaymentRow>((from, to) =>
      supabase
        .from("payments")
        .select("user_id, status, reference_no, amount, created_at")
        .order("created_at", { ascending: false })
        .order("id", { ascending: true })
        .range(from, to)
    );

    // Payments arrive newest-first; approved beats anything else.
    const best = new Map<string, PaymentRow>();
    for (const p of payments) {
      const current = best.get(p.user_id);
      if (!current || (p.status === "approved" && current.status !== "approved")) {
        best.set(p.user_id, p);
      }
    }

    const date = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Manila",
    });
    const lines = profiles.map((m) => {
      const p = best.get(m.id);
      return [
        m.full_name,
        m.student_id,
        m.year_level,
        m.role,
        p?.status ?? "no payment",
        p?.reference_no ?? "",
        p ? Number(p.amount).toFixed(2) : "",
        date.format(new Date(m.created_at)),
      ]
        .map(csvCell)
        .join(",");
    });

    // BOM so Excel reads UTF-8 names (e.g. ñ) correctly.
    return {
      csv: "﻿" + [HEADER.map(csvCell).join(","), ...lines].join("\r\n"),
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Export failed" };
  }
}
