"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isWatchlistStatus } from "@/lib/types";

async function ensureProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profile: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
  }
) {
  await supabase.from("profiles").upsert(
    {
      id: profile.id,
      display_name: profile.displayName,
      avatar_url: profile.avatarUrl,
    },
    { onConflict: "id" }
  );
}

async function getAuthenticatedSupabase() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || !claims) throw new Error("No autenticado");

  return { supabase, claims };
}

export async function addToWatchlist(formData: FormData) {
  const { supabase, claims } = await getAuthenticatedSupabase();
  const userMetadata = claims.user_metadata;

  await ensureProfile(supabase, {
    id: claims.sub,
    displayName:
      typeof userMetadata?.full_name === "string"
        ? userMetadata.full_name
        : claims.email ?? null,
    avatarUrl:
      typeof userMetadata?.avatar_url === "string"
        ? userMetadata.avatar_url
        : null,
  });

  const tmdb_id = Number(formData.get("tmdb_id"));
  const title = formData.get("title") as string;
  const poster_path = formData.get("poster_path") as string | null;
  const overview = formData.get("overview") as string | null;
  const first_air_date = formData.get("first_air_date") as string | null;
  const vote_average = formData.get("vote_average")
    ? Number(formData.get("vote_average"))
    : null;
  const number_of_seasons = formData.get("number_of_seasons")
    ? Number(formData.get("number_of_seasons"))
    : null;

  const { error } = await supabase.from("watchlist").upsert(
    {
      user_id: claims.sub,
      tmdb_id,
      title,
      poster_path,
      overview,
      first_air_date,
      vote_average,
      number_of_seasons,
    },
    { onConflict: "user_id,tmdb_id" }
  );

  if (error) throw new Error(error.message);

  revalidatePath("/mis-series");
  revalidatePath(`/serie/${tmdb_id}`);
}

export async function removeFromWatchlist(formData: FormData) {
  const { supabase, claims } = await getAuthenticatedSupabase();

  const tmdb_id = Number(formData.get("tmdb_id"));

  const { error } = await supabase
    .from("watchlist")
    .delete()
    .eq("user_id", claims.sub)
    .eq("tmdb_id", tmdb_id);

  if (error) throw new Error(error.message);

  revalidatePath("/mis-series");
  revalidatePath(`/serie/${tmdb_id}`);
}

export async function updateStatus(formData: FormData) {
  const { supabase, claims } = await getAuthenticatedSupabase();

  const tmdb_id = Number(formData.get("tmdb_id"));
  const status = formData.get("status");
  if (!isWatchlistStatus(status)) throw new Error("Estado no valido");

  const { error } = await supabase
    .from("watchlist")
    .update({
      status,
      seen_at: status === "seen" ? new Date().toISOString() : null,
    })
    .eq("user_id", claims.sub)
    .eq("tmdb_id", tmdb_id);

  if (error) throw new Error(error.message);

  revalidatePath("/mis-series");
  revalidatePath(`/serie/${tmdb_id}`);
}
