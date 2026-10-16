"use client";

import { useTransition } from "react";
import Link from "next/link";
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  setRosterPublished,
  updateRosterTerm,
} from "@/app/actions/admin-officers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "./DatePicker";

export type RosterTermValues = {
  termLabel: string;
  /** YYYY-MM-DD in Philippine time, or "" when unset. */
  termStart: string;
  termEnd: string;
  isPublished: boolean;
  isLive: boolean;
  /** Reason publishing is blocked for the saved term, if any. */
  blocker: string | null;
};

export function RosterTermCard({ initial }: { initial: RosterTermValues }) {
  const [saving, startSaving] = useTransition();
  const [toggling, startToggling] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startSaving(async () => {
      const result = await updateRosterTerm(formData);
      if ("error" in result) toast.error(result.error);
      else toast.success("Term saved");
    });
  }

  function togglePublished() {
    const next = !initial.isPublished;
    startToggling(async () => {
      const result = await setRosterPublished(next);
      if ("error" in result) toast.error(result.error);
      else toast.success(next ? "Roster published" : "Roster hidden");
    });
  }

  const status = initial.isLive
    ? { label: "Public", className: "bg-green-100 text-green-800" }
    : initial.isPublished
      ? { label: "Outside term", className: "bg-yellow-100 text-yellow-800" }
      : { label: "Hidden", className: "bg-muted text-muted-foreground" };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="contents">
        <CardHeader>
          <CardTitle>Term &amp; visibility</CardTitle>
          <CardDescription>
            The public officers page shows this roster only while it&apos;s
            published and today is within the term.
          </CardDescription>
          <CardAction>
            <Badge variant="outline" className={`border-0 ${status.className}`}>
              {status.label}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-4 pt-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-2">
            <Label htmlFor="termLabel">Term name</Label>
            <Input
              id="termLabel"
              name="termLabel"
              defaultValue={initial.termLabel}
              placeholder="A.Y. 2026–2027"
              required
              className="h-9"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="termStart">Starts</Label>
            <DatePicker
              id="termStart"
              name="termStart"
              defaultValue={initial.termStart}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="termEnd">Ends</Label>
            <DatePicker
              id="termEnd"
              name="termEnd"
              defaultValue={initial.termEnd}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex-wrap justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {initial.isLive ? (
              <>
                Visible at{" "}
                <Link
                  href="/officers"
                  className="font-medium text-brand-indigo underline-offset-4 hover:underline"
                >
                  /officers
                </Link>
                .
              </>
            ) : initial.isPublished ? (
              "Published, but today is outside the term, so it's not shown."
            ) : (
              (initial.blocker ?? "Ready to publish when you are.")
            )}
          </p>
          <div className="flex gap-2">
            <Button type="submit" variant="outline" disabled={saving}>
              {saving && <Loader2 className="animate-spin" />}
              Save term
            </Button>
            <Button
              type="button"
              variant={initial.isPublished ? "outline" : "default"}
              disabled={toggling || (!initial.isPublished && !!initial.blocker)}
              onClick={togglePublished}
            >
              {toggling ? (
                <Loader2 className="animate-spin" />
              ) : initial.isPublished ? (
                <EyeOffIcon />
              ) : (
                <EyeIcon />
              )}
              {initial.isPublished ? "Unpublish" : "Publish"}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
