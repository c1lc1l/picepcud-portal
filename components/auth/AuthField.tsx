import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

/** Ids an input should reference in aria-describedby for a given field. */
export function describedBy(id: string, hint?: ReactNode, error?: string) {
  return (
    [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") ||
    undefined
  );
}

/** Label, control, optional hint and validation message for auth forms. */
export function AuthField({
  id,
  label,
  hint,
  error,
  labelAction,
  children,
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  /** Optional link shown at the right of the label row. */
  labelAction?: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <Label htmlFor={id} className="text-brand-ink">
          {label}
        </Label>
        {labelAction}
      </div>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** Taller inputs for the public auth forms; portal forms keep the default. */
export const authInputClass = "h-10 bg-white px-3";
