"use client";

import useSWR from "swr";
import { useState, useEffect, useRef } from "react";
import type { TMDBSearchResponse } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function useDebouncedValue(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => setDebounced(value), delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, delay]);

  return debounced;
}

export function useSearch() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);

  const { data, isLoading } = useSWR<TMDBSearchResponse>(
    debouncedQuery.trim().length >= 2
      ? `/api/tmdb/search?q=${encodeURIComponent(debouncedQuery.trim())}`
      : null,
    fetcher,
    { keepPreviousData: true }
  );

  const isDebouncing = query !== debouncedQuery && query.trim().length >= 2;

  return {
    query,
    setQuery,
    results: data?.results ?? [],
    isLoading: isLoading || isDebouncing,
  };
}
