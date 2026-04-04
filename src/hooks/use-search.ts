"use client";

import useSWR from "swr";
import { useState, useDeferredValue } from "react";
import type { TMDBSearchResponse } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useSearch() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const { data, isLoading } = useSWR<TMDBSearchResponse>(
    deferredQuery.trim().length >= 2
      ? `/api/tmdb/search?q=${encodeURIComponent(deferredQuery.trim())}`
      : null,
    fetcher,
    { keepPreviousData: true }
  );

  return {
    query,
    setQuery,
    results: data?.results ?? [],
    isLoading,
    isStale: query !== deferredQuery,
  };
}
