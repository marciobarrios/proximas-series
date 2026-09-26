"use client";

import { useSyncExternalStore } from "react";
import { Badge } from "@/components/ui/badge";

const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    // One browser timer for all episodes; no network requests or server work.
    timer = setInterval(notify, 60_000);
    window.addEventListener("focus", notify);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(timer);
      window.removeEventListener("focus", notify);
    }
  };
}

function getTodayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function EpisodeStatus({
  airDate,
  renderedToday,
}: {
  airDate: string;
  renderedToday: string;
}) {
  // Hydrate with the cached HTML's date, then use the visitor's current date.
  const today = useSyncExternalStore(subscribe, getTodayKey, () => renderedToday);
  const label = airDate === today ? "Hoy" : airDate > today ? "Próximo" : "Emitido";
  return (
    <Badge
      variant={label === "Hoy" ? "default" : "outline"}
      className="h-4 px-1.5 text-[10px]"
    >
      {label}
    </Badge>
  );
}
