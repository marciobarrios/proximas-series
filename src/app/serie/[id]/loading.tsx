import { Skeleton } from "@/components/ui/skeleton";

export default function ShowDetailLoading() {
  return (
    <>
      {/* Backdrop + transparent header */}
      <div className="relative h-[336px] w-full overflow-hidden sm:h-[416px]">
        <header className="absolute top-0 z-40 w-full backdrop-blur-sm">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-8 w-24" />
          </div>
        </header>
        <Skeleton className="h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="-mt-32 relative z-10 flex flex-col gap-6 sm:flex-row sm:gap-8">
          {/* Poster */}
          <div className="mx-auto w-[180px] shrink-0 sm:mx-0 sm:w-[220px]">
            <div className="relative aspect-[2/3] overflow-hidden rounded-lg shadow-xl">
              <Skeleton className="h-full w-full" />
            </div>
          </div>

          {/* Metadata */}
          <div className="flex-1 space-y-4 pb-8">
            <div>
              <Skeleton className="h-8 w-64" />
              <div className="mt-1 flex items-center gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-10 rounded-full" />
              </div>
            </div>

            {/* Watchlist button */}
            <Skeleton className="h-9 w-44 rounded-md" />

            {/* Genre badges */}
            <div className="flex flex-wrap gap-1.5">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>

            {/* Synopsis */}
            <div>
              <Skeleton className="mb-1 h-4 w-16" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>

            {/* Cast */}
            <div>
              <Skeleton className="mb-2 h-4 w-16" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-32 rounded-full" />
                ))}
              </div>
            </div>

            {/* Networks */}
            <div>
              <Skeleton className="mb-1 h-4 w-24" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
