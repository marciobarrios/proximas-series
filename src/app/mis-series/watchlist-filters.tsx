"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { WatchlistStatus } from "@/lib/types";

const filters: ReadonlyArray<{
  label: string;
  value: WatchlistStatus | undefined;
}> = [
  { label: "Todas", value: undefined },
  { label: "Pendientes", value: "pending" },
  { label: "Viendo", value: "watching" },
  { label: "Esperando temporada", value: "waiting" },
  { label: "Vistas", value: "seen" },
];

export function WatchlistFilters({ current }: { current?: WatchlistStatus }) {
  return (
    <div className="flex max-w-full gap-1 overflow-x-auto rounded-lg bg-muted p-1">
      {filters.map((f) => {
        const isActive = current === f.value;
        const href = f.value ? `/mis-series?filtro=${f.value}` : "/mis-series";
        return (
          <Link
            key={f.label}
            href={href}
            prefetch={false}
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
          </Link>
        );
      })}
    </div>
  );
}
