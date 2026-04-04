import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tv } from "lucide-react";

export function EmptyWatchlist() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <Tv className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold">Tu lista esta vacia</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Busca series y anadilas a tu lista para llevar un control de lo que
        quieres ver.
      </p>
      <Button render={<Link href="/" />} className="mt-6" size="sm">
        Explorar series
      </Button>
    </div>
  );
}
