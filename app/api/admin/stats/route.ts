import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentAdmin } from "@/lib/auth";
import { forbidden } from "@/lib/http";

const head = (table: string) => supabase.from(table).select("id", { count: "exact", head: true });

/** GET /api/admin/stats — platform totals, including impact numbers. */
export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return forbidden("Admins only.");

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [users, banned, newUsers, food, resources, events, handovers, foodHandovers, pending, openReports] =
    await Promise.all([
      head("users"),
      head("users").eq("is_banned", true),
      head("users").gte("created_at", weekAgo),
      head("food_posts"),
      head("resource_posts"),
      head("events"),
      head("exchange_requests").eq("status", "completed"),
      head("exchange_requests").eq("status", "completed").eq("item_type", "food"),
      head("exchange_requests").eq("status", "pending"),
      head("reports").eq("status", "open"),
    ]);

  const total = handovers.count ?? 0;
  const foodShared = foodHandovers.count ?? 0;

  return NextResponse.json({
    users: users.count ?? 0,
    bannedUsers: banned.count ?? 0,
    newUsersThisWeek: newUsers.count ?? 0,
    foodPosts: food.count ?? 0,
    resourcePosts: resources.count ?? 0,
    events: events.count ?? 0,
    pendingRequests: pending.count ?? 0,
    openReports: openReports.count ?? 0,
    impact: {
      // Each completed handover is one item (or meal) that found a new home instead of the bin
      itemsDiverted: total,
      foodShared,
      resourcesReused: total - foodShared,
    },
  });
}
