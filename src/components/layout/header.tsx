"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchBar } from "./search-bar";
import { UserMenu } from "@/components/auth/user-menu";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import { List } from "lucide-react";

export function Header({
  variant = "default",
}: {
  variant?: "default" | "transparent";
}) {
  const { session, isLoading } = useSession();
  const pathname = usePathname();
  const isTransparent = variant === "transparent";
  const isMisSeriesActive = pathname === "/mis-series";

  return (
    <header
      className={
        isTransparent
          ? "absolute top-0 z-40 w-full text-white backdrop-blur-sm"
          : "sticky top-0 z-40 border-b bg-background/80 backdrop-blur-sm"
      }
    >
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          title="Próximas series"
          className="text-lg font-bold tracking-tight transition-opacity hover:opacity-80"
        >
          📺🍿✨
        </Link>

        <div className="flex items-center gap-2">
          <SearchBar transparent={isTransparent} />
          <Link
            href="/mis-series"
            aria-current={isMisSeriesActive ? "page" : undefined}
            className={cn(
              "flex h-9 items-center gap-1.5 rounded-full px-2.5 text-sm font-medium transition-colors sm:px-3",
              isTransparent
                ? "text-white/90 hover:bg-white/15 hover:text-white"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
              isMisSeriesActive &&
                (isTransparent
                  ? "bg-white/20 text-white shadow-sm"
                  : "bg-foreground text-background hover:bg-foreground hover:text-background")
            )}
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Mis series</span>
          </Link>
          {!isLoading && session && (
            <UserMenu user={session.user} />
          )}
        </div>
      </div>
    </header>
  );
}
