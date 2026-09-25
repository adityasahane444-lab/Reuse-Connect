import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { BIO_MAX } from "@/lib/constants";
import { badRequest, readJson, serverError, str, unauthorized } from "@/lib/http";
import { toPublicUser } from "@/lib/types";
import { ratingSummaries } from "@/lib/ratings";

/** GET /api/profile — my profile, eco-points history, exchange history and reviews received. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const [
    { data: pointsHistory },
    { data: exchanges },
    { data: reviews },
    { count: higher },
    { count: foodCount },
    { count: resourceCount },
    ratings,
  ] = await Promise.all([
    supabase
      .from("points_tx")
      .select("id, amount, reason, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("exchange_requests")
      .select("id, item_type, item_title, owner_id, requester_id, status, created_at, completed_at")
      .or(`owner_id.eq.${user.id},requester_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("ratings")
      .select("id, score, comment, created_at, rater:users!ratings_rater_id_fkey(id, name, avatar_url)")
      .eq("ratee_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase.from("users").select("id", { count: "exact", head: true }).gt("green_points", user.green_points),
    supabase.from("food_posts").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("resource_posts").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ratingSummaries([user.id]),
  ]);

  const exRows = (exchanges ?? []) as {
    id: string;
    item_type: string;
    item_title: string;
    owner_id: string;
    requester_id: string;
    status: string;
    created_at: string;
    completed_at: string | null;
  }[];

  const { count: completed } = await supabase
    .from("exchange_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "completed")
    .or(`owner_id.eq.${user.id},requester_id.eq.${user.id}`);

  type ReviewRow = { id: string; score: number; comment: string; created_at: string; rater: { id: string; name: string; avatar_url: string | null } | null };

  return NextResponse.json({
    user: toPublicUser(user),
    rank: (higher ?? 0) + 1,
    stats: {
      listings: (foodCount ?? 0) + (resourceCount ?? 0),
      completedExchanges: completed ?? 0,
      rating: ratings.get(user.id) ?? { average: null, count: 0 },
    },
    pointsHistory: (pointsHistory ?? []).map((p) => ({
      id: p.id,
      amount: p.amount,
      reason: p.reason,
      createdAt: p.created_at,
    })),
    exchanges: exRows.map((e) => ({
      id: e.id,
      itemType: e.item_type,
      itemTitle: e.item_title,
      role: e.owner_id === user.id ? "giver" : "receiver",
      status: e.status,
      createdAt: e.created_at,
      completedAt: e.completed_at,
    })),
    reviews: ((reviews ?? []) as unknown as ReviewRow[]).map((r) => ({
      id: r.id,
      score: r.score,
      comment: r.comment,
      createdAt: r.created_at,
      from: { id: r.rater?.id ?? "", name: r.rater?.name ?? "Deleted user", avatarUrl: r.rater?.avatar_url ?? null },
    })),
  });
}

/** PATCH /api/profile { name?, bio? } */
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await readJson(req);
  const update: Record<string, string> = {};

  if ("name" in body) {
    const name = str(body.name, 60);
    if (name.length < 2) return badRequest("Please enter your name.");
    update.name = name;
  }
  if ("bio" in body) {
    const bio = typeof body.bio === "string" ? body.bio.trim() : "";
    if (bio.length > BIO_MAX) return badRequest(`Bio can be at most ${BIO_MAX} characters.`);
    update.bio = bio;
  }
  if (Object.keys(update).length === 0) return badRequest("Nothing to update.");

  const { data, error } = await supabase.from("users").update(update).eq("id", user.id).select("*").single();
  if (error || !data) return serverError("Could not save your profile.");
  return NextResponse.json({ user: toPublicUser(data) });
}
