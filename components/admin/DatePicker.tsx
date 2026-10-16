"use client";

import { useRef, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  addDays,
  longDateLabel,
  manilaDateKey,
  monthGrid,
  monthLabel,
  parseDateKey,
  shiftKeyByMonths,
  shiftMonth,
  shortDateLabel,
  WEEKDAYS,
  type YearMonth,
} from "@/lib/calendar";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  id?: string;
  /** Submits the value as YYYY-MM-DD under this name. */
  name?: string;
  /** Uncontrolled initial value (YYYY-MM-DD). */
  defaultValue?: string;
  /** Controlled value (YYYY-MM-DD, or "" for none). */
  value?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

/**
 * Date field with a site-styled month calendar in place of the browser's
 * native picker. Arrow keys move by day/week, Page Up/Down by month.
 */
export function DatePicker({
  id,
  name,
  defaultValue = "",
  value: controlled,
  onValueChange,
  required,
  disabled,
  placeholder = "Pick a date",
  className,
}: DatePickerProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const value = controlled ?? uncontrolled;
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(value || manilaDateKey());
  const [view, setView] = useState<YearMonth>(() => monthOf(focused));
  const gridRef = useRef<HTMLDivElement>(null);
  const today = manilaDateKey();

  function select(key: string) {
    if (controlled === undefined) setUncontrolled(key);
    onValueChange?.(key);
    setOpen(false);
  }

  function moveFocus(key: string) {
    setFocused(key);
    setView(monthOf(key));
    // Wait for the new month to render before moving focus.
    requestAnimationFrame(() =>
      gridRef.current
        ?.querySelector<HTMLButtonElement>(`[data-key="${key}"]`)
        ?.focus(),
    );
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    const moves: Record<string, () => string> = {
      ArrowLeft: () => addDays(focused, -1),
      ArrowRight: () => addDays(focused, 1),
      ArrowUp: () => addDays(focused, -7),
      ArrowDown: () => addDays(focused, 7),
      PageUp: () => shiftKeyByMonths(focused, -1),
      PageDown: () => shiftKeyByMonths(focused, 1),
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    moveFocus(move());
  }

  return (
    <div className={cn("relative", className)}>
      <Popover.Root
        open={open}
        onOpenChange={(next) => {
          if (next) {
            const start = value || today;
            setFocused(start);
            setView(monthOf(start));
          }
          setOpen(next);
        }}
      >
        <Popover.Trigger
          id={id}
          disabled={disabled}
          className={cn(
            "flex h-9 w-full min-w-0 items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 text-left text-sm transition-colors outline-none hover:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-popup-open:border-ring",
            !value && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="size-4 shrink-0 text-brand-violet" />
          <span className="truncate">
            {value ? shortDateLabel(value) : placeholder}
          </span>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner sideOffset={6} align="start" className="z-50">
            <Popover.Popup
              initialFocus={() =>
                gridRef.current?.querySelector<HTMLButtonElement>(
                  "[tabindex='0']",
                ) ?? true
              }
              className="w-72 origin-(--transform-origin) rounded-xl bg-popover p-3 text-sm text-popover-foreground shadow-[0_16px_40px_-12px_rgb(12_1_48/0.35)] ring-1 ring-foreground/10 outline-none transition-[opacity,transform] duration-200 ease-smooth data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.97] data-starting-style:opacity-0"
            >
              <div className="mb-2 flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Previous month"
                  onClick={() => setView((v) => shiftMonth(v, -1))}
                >
                  <ChevronLeftIcon />
                </Button>
                <Popover.Title
                  className="font-medium text-brand-ink"
                  aria-live="polite"
                >
                  {monthLabel(view)}
                </Popover.Title>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Next month"
                  onClick={() => setView((v) => shiftMonth(v, 1))}
                >
                  <ChevronRightIcon />
                </Button>
              </div>

              <div
                ref={gridRef}
                role="group"
                aria-label={monthLabel(view)}
                onKeyDown={handleKeyDown}
                className="grid grid-cols-7 gap-0.5"
              >
                {WEEKDAYS.map((d) => (
                  <span
                    key={d}
                    aria-hidden
                    className="pb-1 text-center text-xs text-muted-foreground"
                  >
                    {d.slice(0, 2)}
                  </span>
                ))}
                {monthGrid(view).map((cell) => {
                  const selected = cell.key === value;
                  // Only one day is tabbable: the focused one if it's in
                  // view, otherwise the first of the month.
                  const tabbable =
                    monthOf(focused).month === view.month &&
                    monthOf(focused).year === view.year
                      ? cell.key === focused
                      : cell.inMonth && cell.day === 1;
                  return (
                    <button
                      key={cell.key}
                      type="button"
                      data-key={cell.key}
                      tabIndex={tabbable ? 0 : -1}
                      aria-label={longDateLabel(cell.key)}
                      aria-pressed={selected}
                      aria-current={cell.key === today ? "date" : undefined}
                      onFocus={() => setFocused(cell.key)}
                      onClick={() => select(cell.key)}
                      className={cn(
                        "flex aspect-square items-center justify-center rounded-md text-sm tabular-nums transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        cell.inMonth
                          ? "text-brand-ink"
                          : "text-muted-foreground/50",
                        selected
                          ? "bg-brand-indigo font-semibold text-white"
                          : "hover:bg-brand-silver/60",
                        !selected &&
                          cell.key === today &&
                          "font-semibold text-brand-indigo ring-1 ring-brand-periwinkle/60",
                      )}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 flex justify-between border-t border-border pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => select(today)}
                >
                  Today
                </Button>
                {!required && value && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => select("")}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>

      {/* Carries the value into FormData and lets the browser enforce
          `required` (hidden inputs skip constraint validation). */}
      <input
        tabIndex={-1}
        aria-hidden
        name={name}
        value={value}
        required={required}
        disabled={disabled}
        onChange={() => {}}
        className="pointer-events-none absolute bottom-0 left-4 h-px w-px opacity-0"
      />
    </div>
  );
}

function monthOf(key: string): YearMonth {
  const d = parseDateKey(key) ?? parseDateKey(manilaDateKey())!;
  return { year: d.year, month: d.month };
}
