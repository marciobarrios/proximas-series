"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { Star } from "lucide-react";
import { useSearch } from "@/hooks/use-search";
import { getYear, tmdbImage } from "@/lib/constants";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter();
  const { query, setQuery, results, isLoading } = useSearch();

  const handleSelect = useCallback(
    (showId: number) => {
      onOpenChange(false);
      setQuery("");
      router.push(`/serie/${showId}`);
    },
    [onOpenChange, router, setQuery]
  );

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      onOpenChange(nextOpen);
      if (!nextOpen) setQuery("");
    },
    [onOpenChange, setQuery]
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
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
      <CommandList className="max-h-96">
        {isLoading && query.trim().length >= 2 ? (
          <div className="flex items-center justify-center py-6">
            <div className="size-5 animate-spin rounded-full border-2 border-muted-foreground/25 border-t-muted-foreground" />
          </div>
        ) : null}
        {query.trim().length >= 2 && results.length === 0 && !isLoading ? (
          <CommandEmpty>No se encontraron resultados</CommandEmpty>
        ) : null}
        {!isLoading && results.length > 0 ? (
          <CommandGroup>
            {results.slice(0, 6).map((show) => {
              const thumb = tmdbImage(show.poster_path, "w154");
              const year = getYear(show.first_air_date);
              const score = show.vote_average?.toFixed(1);

              return (
                <CommandItem
                  key={show.id}
                  value={String(show.id)}
                  onSelect={() => handleSelect(show.id)}
                  className="flex items-start gap-3 px-3 py-2.5"
                >
                  {thumb ? (
                    <Image
                      src={thumb}
                      alt=""
                      width={56}
                      height={84}
                      className="shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="h-[84px] w-[56px] shrink-0 rounded bg-muted" />
                  )}
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-medium">{show.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {year ? <span>{year}</span> : null}
                      {score && Number(score) > 0 ? (
                        <span className="flex items-center gap-0.5">
                          <Star className="size-3 fill-yellow-500 text-yellow-500" />
                          {score}
                        </span>
                      ) : null}
                    </div>
                    {show.overview ? (
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {show.overview}
                      </p>
                    ) : null}
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
