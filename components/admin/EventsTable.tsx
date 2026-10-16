"use client";

import { useState, useTransition } from "react";
import { ExternalLinkIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { deleteEvent, toggleEventStatus } from "@/app/actions/admin-events";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type EventRow = {
  id: string;
  title: string;
  event_date: string;
  location: string;
  luma_url: string;
  is_active: boolean;
  is_past: boolean;
};

const dateFormat = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

export function EventsTable({
  events,
  emptyMessage = "No events yet. Click “Add Event” to create one.",
}: {
  events: EventRow[];
  emptyMessage?: string;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [toDelete, setToDelete] = useState<EventRow | null>(null);
  const [deleting, startDelete] = useTransition();
  // Optimistic overrides until the revalidated data arrives.
  const [active, setActive] = useState<Record<string, boolean>>({});

  function toggle(event: EventRow, next: boolean) {
    setPendingId(event.id);
    startTransition(async () => {
      const result = await toggleEventStatus(event.id, next);
      setPendingId(null);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setActive((s) => ({ ...s, [event.id]: next }));
      toast.success(next ? "Event activated" : "Event deactivated");
    });
  }

  function confirmDelete() {
    if (!toDelete) return;
    const event = toDelete;
    startDelete(async () => {
      const result = await deleteEvent(event.id);
      setToDelete(null);
      if ("error" in result) toast.error(result.error);
      else toast.success("Event deleted");
    });
  }

  function statusBadge(isActive: boolean) {
    return (
      <Badge
        variant="outline"
        className={
          isActive
            ? "border-0 bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300"
            : "border-0 bg-muted text-muted-foreground"
        }
      >
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  }

  // Shared by the phone cards and the table rows.
  function actions(ev: EventRow, isActive: boolean) {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={
            <a href={ev.luma_url} target="_blank" rel="noopener noreferrer" />
          }
        >
          <ExternalLinkIcon />
          Luma
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={pendingId === ev.id}
          onClick={() => toggle(ev, !isActive)}
        >
          {isActive ? "Deactivate" : "Activate"}
        </Button>
        <Button variant="destructive" size="sm" onClick={() => setToDelete(ev)}>
          <Trash2Icon />
          Delete
        </Button>
      </>
    );
  }

  return (
    <>
      {/* Phones: one card per event instead of a sideways-scrolling table. */}
      {events.length === 0 ? (
        <p className="px-2 py-8 text-center text-sm text-muted-foreground md:hidden">
          {emptyMessage}
        </p>
      ) : (
        <ul className="divide-y divide-border md:hidden">
          {events.map((ev) => {
            const isActive = active[ev.id] ?? ev.is_active;
            return (
              <li key={ev.id} className="flex flex-col gap-3 px-2 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-brand-ink">{ev.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {dateFormat.format(new Date(ev.event_date))}
                      {ev.is_past && " · Past"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {ev.location}
                    </p>
                  </div>
                  {statusBadge(isActive)}
                </div>
                <div className="flex gap-2 *:flex-1">
                  {actions(ev, isActive)}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="hidden md:block">
        <Table className="min-w-160">
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              events.map((ev) => {
                const isActive = active[ev.id] ?? ev.is_active;
                return (
                  <TableRow key={ev.id}>
                    <TableCell className="font-medium text-brand-ink">
                      {ev.title}
                    </TableCell>
                    <TableCell>
                      {dateFormat.format(new Date(ev.event_date))}
                      {ev.is_past && (
                        <span className="block text-xs text-muted-foreground">
                          Past
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{ev.location}</TableCell>
                    <TableCell>{statusBadge(isActive)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {actions(ev, isActive)}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && !deleting && setToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete event?</DialogTitle>
            <DialogDescription>
              “{toDelete?.title}” will be permanently removed. This can’t be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={deleting}
              onClick={() => setToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={confirmDelete}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
