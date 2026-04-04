import type { TMDBShow } from "@/lib/types";
import { ShowCard } from "./show-card";

export function ShowGrid({ shows }: { shows: TMDBShow[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {shows.map((show) => (
        <ShowCard key={show.id} show={show} />
      ))}
    </div>
  );
}
