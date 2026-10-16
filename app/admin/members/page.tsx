import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SearchIcon } from "lucide-react";
import {
  AdminPageHeader,
  tableFrameClass,
} from "@/components/admin/AdminPageHeader";
import { ExportRosterButton } from "@/components/admin/ExportRosterButton";
import { Pagination } from "@/components/admin/Pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  parseYear,
  sanitizeSearch,
  YEAR_FILTERS,
  yearLevelLabel,
} from "@/lib/members";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Members | Admin | PICE PCUD" };

const PAGE_SIZE = 20;

const dateFormat = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeZone: "Asia/Manila",
});

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; year?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = sanitizeSearch(params.q);
  const year = parseYear(params.year);
  const requestedPage = Math.max(
    1,
    Number.parseInt(params.page ?? "1", 10) || 1,
  );

  const supabase = await createClient();
  const from = (requestedPage - 1) * PAGE_SIZE;

  let query = supabase
    .from("profiles")
    .select("id, full_name, student_id, year_level, role, created_at", {
      count: "exact",
    })
    .order("full_name", { ascending: true })
    .order("id", { ascending: true })
    .range(from, from + PAGE_SIZE - 1);
  if (year) query = query.eq("year_level", Number(year));
  if (q) query = query.or(`full_name.ilike.%${q}%,student_id.ilike.%${q}%`);

  const { data: members, count, error } = await query;
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);

  const pageHref = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (year) sp.set("year", year);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `/admin/members${qs ? `?${qs}` : ""}`;
  };

  // Past the last page (e.g. after filtering): jump to the last one.
  if (!error && total && requestedPage > totalPages) redirect(pageHref(page));

  const filtered = Boolean(q || year);

  return (
    <>
      <AdminPageHeader
        title="Members"
        description={`${total} ${filtered ? "matching" : "registered"} ${total === 1 ? "profile" : "profiles"}.`}
        actions={<ExportRosterButton q={q || undefined} year={year} />}
      />

      <form
        method="get"
        role="search"
        className="flex flex-wrap items-center gap-2"
      >
        <div className="relative w-full sm:w-72">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search name or student ID"
            aria-label="Search name or student ID"
            className="h-9 bg-card pl-8"
          />
        </div>
        <select
          name="year"
          defaultValue={year ?? ""}
          aria-label="Filter by year level"
          className="h-9 rounded-lg border border-input bg-card px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">All years</option>
          {YEAR_FILTERS.map((y) => (
            <option key={y} value={y}>
              {yearLevelLabel(Number(y))}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline" className="h-9 bg-card">
          Apply
        </Button>
        {filtered && (
          <Button
            variant="ghost"
            className="h-9"
            nativeButton={false}
            render={<Link href="/admin/members" />}
          >
            Clear
          </Button>
        )}
      </form>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          Failed to load members: {error.message}
        </p>
      ) : (
        <div className={tableFrameClass}>
          <Table className="min-w-160">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead>Year level</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Registered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!members?.length ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {filtered
                      ? "No members match these filters."
                      : "No members have registered yet."}
                  </TableCell>
                </TableRow>
              ) : (
                members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium text-brand-ink">
                      {m.full_name}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {m.student_id}
                    </TableCell>
                    <TableCell>{yearLevelLabel(m.year_level)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={m.role === "admin" ? "default" : "secondary"}
                      >
                        {m.role === "admin" ? "Admin" : "Member"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {dateFormat.format(new Date(m.created_at))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {!error && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          hrefFor={pageHref}
          label="Members pages"
        />
      )}
    </>
  );
}
