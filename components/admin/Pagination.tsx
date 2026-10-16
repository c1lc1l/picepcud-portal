import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Page numbers to show: first, last, and a window around the current one. */
function pageItems(page: number, totalPages: number) {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);
  const items: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) items.push("gap");
    items.push(p);
  });
  return items;
}

/** "21–40 of 57" plus previous/next and numbered page links. */
export function Pagination({
  page,
  pageSize,
  total,
  hrefFor,
  label = "Pagination",
}: {
  page: number;
  pageSize: number;
  total: number;
  hrefFor: (page: number) => string;
  label?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (!total) return null;
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label={label}
      className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground"
    >
      <span>
        Showing <span className="font-medium text-brand-ink">{first}</span>–
        <span className="font-medium text-brand-ink">{last}</span> of{" "}
        <span className="font-medium text-brand-ink">{total}</span>
      </span>

      {totalPages > 1 && (
        <ul className="flex items-center gap-1">
          <li>
            <PageButton
              href={page > 1 ? hrefFor(page - 1) : null}
              aria-label="Previous page"
            >
              <ChevronLeftIcon />
              <span className="hidden sm:inline">Previous</span>
            </PageButton>
          </li>
          {pageItems(page, totalPages).map((item, i) =>
            item === "gap" ? (
              <li key={`gap-${i}`} aria-hidden className="px-1">
                …
              </li>
            ) : (
              <li key={item}>
                <PageButton
                  href={hrefFor(item)}
                  current={item === page}
                  aria-label={`Page ${item}`}
                >
                  {item}
                </PageButton>
              </li>
            ),
          )}
          <li>
            <PageButton
              href={page < totalPages ? hrefFor(page + 1) : null}
              aria-label="Next page"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRightIcon />
            </PageButton>
          </li>
        </ul>
      )}
    </nav>
  );
}

function PageButton({
  href,
  current,
  children,
  ...props
}: {
  href: string | null;
  current?: boolean;
  children: React.ReactNode;
  "aria-label": string;
}) {
  const className = "min-w-8 bg-card tabular-nums";
  if (!href) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className={className}
        {...props}
      >
        {children}
      </Button>
    );
  }
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={cn(
        buttonVariants({
          variant: current ? "default" : "outline",
          size: "sm",
          className: current ? "min-w-8 tabular-nums" : className,
        }),
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
