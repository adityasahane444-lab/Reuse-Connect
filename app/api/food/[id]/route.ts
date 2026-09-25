import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { FOOD_CATEGORIES } from "@/lib/constants";
import { badRequest, isUuid, notFound, readJson, str, unauthorized, serverError } from "@/lib/http";
import { parseLat, parseLng } from "@/lib/search";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) return unauthorized();
  const { id } = await params; if (!isUuid(id)) return notFound();
  const body = await readJson(req);
  const title = str(body.title, 120), category = str(body.category, 60);
  if (!title || !category) return badRequest("Title and category are required.");
  if (!(FOOD_CATEGORIES as readonly string[]).includes(category)) return badRequest("Unknown category.");
  let expiresAt: string | null = null;
  if (body.expiresAt) { const d = new Date(String(body.expiresAt)); if (Number.isNaN(d.getTime())) return badRequest("Invalid expiry time."); if (d.getTime() <= Date.now()) return badRequest("Expiry time must be in the future."); expiresAt = d.toISOString(); }
  const latitude = parseLat(body.latitude), longitude = parseLng(body.longitude);
  const { data: existing } = await supabase.from("food_posts").select("id, user_id").eq("id", id).maybeSingle();
  if (!existing) return notFound("Food post not found.");
  if (existing.user_id !== user.id) return NextResponse.json({ error: "You can only edit your own post." }, { status: 403 });
  const { data: post, error } = await supabase.from("food_posts").update({ title, description: str(body.description, 1000), category, quantity: str(body.quantity, 80), location: str(body.location, 160), expires_at: expiresAt, latitude, longitude }).eq("id", id).select().single();
  if (error || !post) return serverError("Could not update the post.");
  return NextResponse.json({ post });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) return unauthorized();
  const { id } = await params; if (!isUuid(id)) return notFound();
  const { data: existing } = await supabase.from("food_posts").select("id, user_id, title").eq("id", id).maybeSingle();
  if (!existing) return notFound("Food post not found.");
  if (existing.user_id !== user.id) return NextResponse.json({ error: "You can only delete your own post." }, { status: 403 });
  const now = new Date().toISOString();
  await supabase.from("exchange_requests").update({ status: "cancelled", updated_at: now }).eq("item_type", "food").eq("item_id", id).in("status", ["pending", "accepted"]);
  const { error } = await supabase.from("food_posts").delete().eq("id", id);
  if (error) return serverError("Could not delete the post.");
  return NextResponse.json({ ok: true });
}
