import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { isUuid, notFound } from "@/lib/http";
import { toPublicProfile } from "@/lib/types";
import { ratingSummaries } from "@/lib/ratings";

/** GET /api/users/:id — public profile (no email or private settings). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return notFound("User not found.");

  const { data: user } = await supabase
    .from("users")
    .select("id, name, role, green_points, avatar_url, bio, created_at, is_banned")
    .eq("id", id)
    .maybeSingle();
  if (!user || user.is_banned) return notFound("User not found.");

  const [{ data: reviews }, ratings, { count: completed }] = await Promise.all([
    supabase
      .from("ratings")
      .select("id, score, comment, created_at, rater:users!ratings_rater_id_fkey(id, name, avatar_url)")
      .eq("ratee_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
    ratingSummaries([id]),
    supabase
      .from("exchange_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed")
      .or(`owner_id.eq.${id},requester_id.eq.${id}`),
  ]);

  type ReviewRow = { id: string; score: number; comment: string; created_at: string; rater: { id: string; name: string; avatar_url: string | null } | null };

  return NextResponse.json({
    profile: toPublicProfile(user),
    stats: { completedExchanges: completed ?? 0, rating: ratings.get(id) ?? { average: null, count: 0 } },
    reviews: ((reviews ?? []) as unknown as ReviewRow[]).map((r) => ({
      id: r.id,
      score: r.score,
      comment: r.comment,
      createdAt: r.created_at,
      from: { id: r.rater?.id ?? "", name: r.rater?.name ?? "Deleted user", avatarUrl: r.rater?.avatar_url ?? null },
    })),
  });
}
