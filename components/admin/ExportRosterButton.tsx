"use client";

import { useTransition } from "react";
import { DownloadIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { exportRosterCsv } from "@/app/actions/admin-members";
import { Button } from "@/components/ui/button";

export function ExportRosterButton({
  q,
  year,
}: {
  q?: string;
  year?: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleExport() {
    startTransition(async () => {
      const result = await exportRosterCsv(q, year);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `picepcud_member_roster_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Roster exported");
    });
  }

  return (
    <Button onClick={handleExport} disabled={isPending}>
      {isPending ? <Loader2 className="animate-spin" /> : <DownloadIcon />}
      Export Roster to CSV
    </Button>
  );
}
