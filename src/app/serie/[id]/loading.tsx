import { Skeleton } from "@/components/ui/skeleton";

export default function ShowDetailLoading() {
  return (
    <>
      <div className="relative h-[336px] w-full overflow-hidden sm:h-[416px]">
        <header className="absolute top-0 z-40 w-full backdrop-blur-sm">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-8 w-24" />
          </div>
        </header>
        <Skeleton className="h-full w-full" />
      </div>
      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="-mt-32 relative z-10 flex flex-col gap-6 sm:flex-row sm:gap-8">
          <Skeleton className="mx-auto aspect-[2/3] w-[180px] rounded-lg sm:mx-0 sm:w-[220px]" />
          <div className="flex-1 space-y-4 pb-8">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
