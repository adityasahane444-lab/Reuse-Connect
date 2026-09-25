import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { toPublicUser } from "@/lib/types";

interface OrganizedEventRow {
  id: string;
  title: string;
  date: string;
  event_participants: { user_id: string }[] | null;
}

interface JoinedRow {
  events: { id: string; title: string; date: string } | null;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const [
    { data: foodPosts },
    { data: resourcePosts },
    { data: organizedEvents },
    { data: joinedRows },
    { data: pointsHistory },
    { data: allUsers },
  ] = await Promise.all([
    supabase.from("food_posts").select("id, title, created_at").eq("user_id", user.id),
    supabase.from("resource_posts").select("id, title, created_at").eq("user_id", user.id),
    supabase
      .from("events")
      .select("id, title, date, event_participants(user_id)")
      .eq("organizer_id", user.id),
    supabase.from("event_participants").select("events(id, title, date)").eq("user_id", user.id),
    supabase
      .from("points_tx")
      .select("id, amount, reason, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(25),
    supabase.from("users").select("id, green_points").order("green_points", { ascending: false }),
  ]);

  const rank = (allUsers ?? []).findIndex((u: { id: string }) => u.id === user.id) + 1;

  return NextResponse.json({
    user: toPublicUser(user),
    rank,
    foodPosts: (foodPosts ?? []).map((p: { id: string; title: string; created_at: string }) => ({
      id: p.id,
      title: p.title,
      createdAt: p.created_at,
    })),
    resourcePosts: (resourcePosts ?? []).map((p: { id: string; title: string; created_at: string }) => ({
      id: p.id,
      title: p.title,
      createdAt: p.created_at,
    })),
    organizedEvents: ((organizedEvents ?? []) as unknown as OrganizedEventRow[]).map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      participants: (e.event_participants ?? []).map((p) => p.user_id),
    })),
    joinedEvents: ((joinedRows ?? []) as unknown as JoinedRow[])
      .filter((r) => r.events)
      .map((r) => ({ id: r.events!.id, title: r.events!.title, date: r.events!.date })),
    pointsHistory: pointsHistory ?? [],
  });
}
