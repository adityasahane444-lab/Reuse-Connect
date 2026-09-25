import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { RESOURCE_CATEGORIES } from "@/lib/constants";
import { badRequest, isUuid, notFound, readJson, str, unauthorized, serverError } from "@/lib/http";
import { parseTags } from "@/lib/search";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) return unauthorized();
  const { id } = await params; if (!isUuid(id)) return notFound();
  const body = await readJson(req);
  const title = str(body.title, 120), category = str(body.category, 60);
  if (!title || !category) return badRequest("Title and category are required.");
  if (!(RESOURCE_CATEGORIES as readonly string[]).includes(category)) return badRequest("Unknown category.");
  const { data: existing } = await supabase.from("resource_posts").select("id, user_id").eq("id", id).maybeSingle();
  if (!existing) return notFound("Resource post not found.");
  if (existing.user_id !== user.id) return NextResponse.json({ error: "You can only edit your own post." }, { status: 403 });
  const { data: post, error } = await supabase.from("resource_posts").update({ title, description: str(body.description, 1000), category, condition: str(body.condition, 80), price: str(body.price, 40) || "Free", tags: parseTags(body.tags) }).eq("id", id).select().single();
  if (error || !post) return serverError("Could not update the post.");
  return NextResponse.json({ post });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) return unauthorized();
  const { id } = await params; if (!isUuid(id)) return notFound();
  const { data: existing } = await supabase.from("resource_posts").select("id, user_id").eq("id", id).maybeSingle();
  if (!existing) return notFound("Resource post not found.");
  if (existing.user_id !== user.id) return NextResponse.json({ error: "You can only delete your own post." }, { status: 403 });
  const now = new Date().toISOString();
  await supabase.from("exchange_requests").update({ status: "cancelled", updated_at: now }).eq("item_type", "resource").eq("item_id", id).in("status", ["pending", "accepted"]);
  const { error } = await supabase.from("resource_posts").delete().eq("id", id);
  if (error) return serverError("Could not delete the post.");
  return NextResponse.json({ ok: true });
}
