"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const filters = [
  { label: "Todas", value: undefined },
  { label: "Pendientes", value: "pending" },
  { label: "Viendo", value: "watching" },
  { label: "Vistas", value: "seen" },
] as const;

export function WatchlistFilters({ current }: { current?: string }) {
  return (
    <div className="flex gap-1 rounded-lg bg-muted p-1">
      {filters.map((f) => {
        const isActive = current === f.value;
        const href = f.value ? `/mis-series?filtro=${f.value}` : "/mis-series";
        return (
          <Link
            key={f.label}
            href={href}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
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
