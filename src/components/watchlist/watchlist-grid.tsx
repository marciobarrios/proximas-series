import type { WatchlistItem } from "@/lib/types";
import { WatchlistCard } from "./watchlist-card";

export function WatchlistGrid({ items }: { items: WatchlistItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {items.map((item) => (
        <WatchlistCard key={item.id} item={item} />
      ))}
    </div>
  );
}
