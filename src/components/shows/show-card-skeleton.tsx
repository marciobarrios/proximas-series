import { Skeleton } from "@/components/ui/skeleton";

export function ShowCardSkeleton() {
  return (
    <div className="flex flex-col">
      <Skeleton className="aspect-[2/3] w-full rounded-lg" />
      <div className="px-1 pt-2 pb-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="mt-1 h-3 w-1/3" />
      </div>
    </div>
  );
}

export function ShowGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: count }, (_, i) => (
        <ShowCardSkeleton key={i} />
      ))}
    </div>
  );
}
