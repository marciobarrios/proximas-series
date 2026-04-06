"use client";

import Link from "next/link";
import { SearchBar } from "./search-bar";
import { UserMenu } from "@/components/auth/user-menu";
import { useSession } from "@/hooks/use-session";
import { User } from "lucide-react";

export function Header({
  variant = "default",
}: {
  variant?: "default" | "transparent";
}) {
  const { session, isLoading } = useSession();

  return (
    <header
      className={
        variant === "transparent"
          ? "absolute top-0 z-40 w-full text-white backdrop-blur-sm"
          : "sticky top-0 z-40 border-b bg-background/80 backdrop-blur-sm"
      }
    >
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight transition-opacity hover:opacity-80"
        >
          📺 Próximas series
        </Link>

        <div className="flex items-center gap-2">
          <SearchBar transparent={variant === "transparent"} />
          {!isLoading && session ? (
            <UserMenu user={session.user} />
          ) : (
            <Link
              href="/mis-series"
              className="flex h-9 items-center gap-1.5 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Mis series</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
