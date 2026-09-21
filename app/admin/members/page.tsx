import Link from "next/link";
import { ExportRosterButton } from "@/components/admin/ExportRosterButton";
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
import { parseYear, sanitizeSearch, YEAR_FILTERS } from "@/lib/members";
import { createClient } from "@/lib/supabase/server";

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
  const requestedPage = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Members</h1>
          <p className="text-muted-foreground">
            Registered student profiles ({total}).
          </p>
        </div>
        <ExportRosterButton q={q || undefined} year={year} />
      </div>

      <form method="get" className="flex flex-wrap gap-2">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search name or student ID"
          className="max-w-xs"
        />
        <select
          name="year"
          defaultValue={year ?? ""}
          aria-label="Filter by year level"
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">All</option>
          {YEAR_FILTERS.map((y) => (
            <option key={y} value={y}>
              Year {y}
            </option>
          ))}
        </select>
        <Button type="submit">Search</Button>
        {(q || year) && (
          <Button
            variant="ghost"
            nativeButton={false}
            render={<Link href="/admin/members" />}
          >
            Clear
          </Button>
        )}
      </form>

      {error ? (
        <p className="text-sm text-destructive">
          Failed to load members: {error.message}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Full Name</TableHead>
              <TableHead>Student ID</TableHead>
              <TableHead>Year Level</TableHead>
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
                  No members found.
                </TableCell>
              </TableRow>
            ) : (
              members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.full_name}</TableCell>
                  <TableCell>{m.student_id}</TableCell>
                  <TableCell>Year {m.year_level}</TableCell>
                  <TableCell>
                    <Badge
                      variant={m.role === "admin" ? "default" : "secondary"}
                      className="capitalize"
                    >
                      {m.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {dateFormat.format(new Date(m.created_at))}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            nativeButton={false}
            render={<Link href={pageHref(page - 1)} aria-disabled={page <= 1} />}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            nativeButton={false}
            render={
              <Link href={pageHref(page + 1)} aria-disabled={page >= totalPages} />
            }
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
