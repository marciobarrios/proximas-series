// Only compare claims returned by Supabase getClaims() (verified signature).
export const PRIVATE_CACHE_CONTROL = "private, no-store, max-age=0";

export function ownerId() {
  const id = process.env.OWNER_USER_ID?.trim();
  return id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    ? id.toLowerCase() : null;
}

export function isOwner(claims: { sub?: string; is_anonymous?: boolean } | null | undefined) {
  const owner = ownerId();
  return !!owner && claims?.sub === owner && claims.is_anonymous !== true;
}

export function safeReturnPath(value: string | null) {
  // Callback URLs are never allowed to select an external origin.
  return value?.startsWith("/") && !value.startsWith("//") && !value.includes("\\")
    && !/[\u0000-\u001f]/.test(value) ? value : "/";
}
