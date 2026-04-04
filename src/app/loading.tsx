import { ShowGridSkeleton } from "@/components/shows/show-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-8 w-24" />
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <Skeleton className="mb-6 h-7 w-56" />
        <ShowGridSkeleton count={20} />
      </main>
    </>
  );
}
