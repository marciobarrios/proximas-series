"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import Image from "next/image";
import { useSearch } from "@/hooks/use-search";
import { tmdbImage, getYear } from "@/lib/constants";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export function SearchBar({ transparent }: { transparent?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { query, setQuery, results, isLoading } = useSearch();

  const handleSelect = useCallback(
    (showId: number) => {
      setOpen(false);
      setQuery("");
      router.push(`/serie/${showId}`);
    },
    [router, setQuery]
  );

  // Only mount the dialog after first open to avoid SSR hydration mismatch
  const [mounted, setMounted] = useState(false);

  function handleOpen() {
    setMounted(true);
    setOpen(true);
  }

  return (
    <>
      <Button
        variant="outline"
        className={
          transparent
            ? "relative h-9 w-9 border-white/30 bg-white/10 text-white/90 hover:bg-white/20 hover:text-white sm:w-64 sm:justify-start sm:px-3"
            : "relative h-9 w-9 sm:w-64 sm:justify-start sm:px-3 sm:text-muted-foreground"
        }
        onClick={handleOpen}
      >
        <Search className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline-flex">Buscar series...</span>
      </Button>
      {mounted && (
        <CommandDialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) setQuery("");
          }}
          title="Buscar series"
          description="Escribe para buscar series de television"
          showCloseButton={false}
        >
        <CommandInput
          placeholder="Buscar series..."
          value={query}
          onValueChange={setQuery}
          className="text-base"
        />
        <CommandList className="max-h-72">
          {query.trim().length >= 2 && results.length === 0 && !isLoading && (
            <CommandEmpty>No se encontraron resultados</CommandEmpty>
          )}
          {results.length > 0 && (
            <CommandGroup>
              {results.slice(0, 8).map((show) => {
                const thumb = tmdbImage(show.poster_path, "w92");
                const year = getYear(show.first_air_date);
                return (
                  <CommandItem
                    key={show.id}
                    value={String(show.id)}
                    onSelect={() => handleSelect(show.id)}
                    className="flex items-center gap-3 px-3 py-2"
                  >
                    {thumb ? (
                      <Image
                        src={thumb}
                        alt=""
                        width={32}
                        height={48}
                        className="rounded object-cover"
                      />
                    ) : (
                      <div className="h-12 w-8 rounded bg-muted" />
                    )}
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-sm font-medium">
                        {show.name}
                      </p>
                      {year && (
                        <p className="text-xs text-muted-foreground">{year}</p>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
        </CommandList>
        </CommandDialog>
      )}
    </>
  );
}
