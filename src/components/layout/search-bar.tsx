"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const SearchDialog = dynamic(
  () => import("./search-dialog").then((module) => module.SearchDialog),
  { ssr: false }
);

function preloadSearchDialog() {
  void import("./search-dialog");
}

export function SearchBar({ transparent }: { transparent?: boolean }) {
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  function handleOpen() {
    setHasOpened(true);
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
        aria-label="Buscar series"
        aria-haspopup="dialog"
        onClick={handleOpen}
        onFocus={preloadSearchDialog}
        onMouseEnter={preloadSearchDialog}
      >
        <Search className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline-flex">Buscar series...</span>
      </Button>
      {hasOpened ? <SearchDialog open={open} onOpenChange={setOpen} /> : null}
    </>
  );
}
