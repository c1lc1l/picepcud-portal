import type { ReactNode } from "react";

/** Title row for admin pages: heading, one-line description, actions. */
export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-headline text-5xl leading-none uppercase text-brand-ink">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** Bordered frame for admin tables. The Table primitive owns overflow. */
export const tableFrameClass =
  "rounded-xl bg-card px-2 py-1 ring-1 ring-foreground/10";
