import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { sweepExpiryAlerts } from "@/lib/expiry";
import { badRequest, isUuid, readJson, serverError, unauthorized } from "@/lib/http";

/** GET /api/notifications?limit=30 — latest notifications + unread count. */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  await sweepExpiryAlerts(user.id);

  const limit = Math.min(Math.max(Number(req.nextUrl.searchParams.get("limit")) || 30, 1), 100);
  const [{ data, error }, { count }] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, type, title, body, link, read_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null),
  ]);
  if (error) return serverError();

  return NextResponse.json({
    unread: count ?? 0,
    notifications: (data ?? []).map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      link: n.link,
      read: Boolean(n.read_at),
      createdAt: n.created_at,
    })),
  });
}

/** PATCH /api/notifications { all: true } | { ids: string[] } — mark as read. */
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await readJson(req);
  let query = supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (body.all === true) {
    // mark everything
  } else if (Array.isArray(body.ids) && body.ids.length > 0 && body.ids.every(isUuid)) {
    query = query.in("id", body.ids as string[]);
  } else {
    return badRequest("Nothing to mark as read.");
  }

  const { error } = await query;
  if (error) return serverError();
  return NextResponse.json({ ok: true });
}
