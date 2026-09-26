// Reject aliases (01, 1abc, 1e3) so one show cannot create many ISR entries.
export function parseTmdbId(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}
