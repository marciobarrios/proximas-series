"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function ensureProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: { id: string; email?: string; user_metadata?: Record<string, string> }
) {
  await supabase.from("profiles").upsert(
    {
      id: user.id,
      display_name: user.user_metadata?.full_name ?? user.email,
      avatar_url: user.user_metadata?.avatar_url ?? null,
    },
    { onConflict: "id" }
  );
}

export async function addToWatchlist(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  await ensureProfile(supabase, user);

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
      user_id: user.id,
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const tmdb_id = Number(formData.get("tmdb_id"));

  const { error } = await supabase
    .from("watchlist")
    .delete()
    .eq("user_id", user.id)
    .eq("tmdb_id", tmdb_id);

  if (error) throw new Error(error.message);

  revalidatePath("/mis-series");
  revalidatePath(`/serie/${tmdb_id}`);
}

export async function toggleSeen(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const tmdb_id = Number(formData.get("tmdb_id"));
  const currentSeen = formData.get("seen") === "true";

  const { error } = await supabase
    .from("watchlist")
    .update({
      seen: !currentSeen,
      seen_at: !currentSeen ? new Date().toISOString() : null,
    })
    .eq("user_id", user.id)
    .eq("tmdb_id", tmdb_id);

  if (error) throw new Error(error.message);

  revalidatePath("/mis-series");
}
