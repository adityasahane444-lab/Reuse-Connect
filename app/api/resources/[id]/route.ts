import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentUser, reverseExchangeReward } from "@/lib/auth";
import { RESOURCE_CATEGORIES } from "@/lib/constants";
import { badRequest, isUuid, notFound, readJson, str, unauthorized, serverError } from "@/lib/http";
import { parseTags } from "@/lib/search";
import { parseListingRequest, uploadListingImage, removeListingImage } from "@/lib/post-images";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) return unauthorized();
  const { id } = await params; if (!isUuid(id)) return notFound();
  const { body, image } = await parseListingRequest(req);
  const title = str(body.title, 120), category = str(body.category, 60);
  if (!title || !category) return badRequest("Title and category are required.");
  if (!(RESOURCE_CATEGORIES as readonly string[]).includes(category)) return badRequest("Unknown category.");
  const { data: existing } = await supabase.from("resource_posts").select("id, user_id, title, image_url").eq("id", id).maybeSingle();
  if (!existing) return notFound("Resource post not found.");
  if (existing.user_id !== user.id) return NextResponse.json({ error: "You can only edit your own post." }, { status: 403 });
  let uploaded: { publicUrl: string; path: string } | null = null;
  try { uploaded = await uploadListingImage(user.id, "resource", image); } catch (err) { return badRequest(err instanceof Error ? err.message : "Could not upload the image."); }
  const removeImage = String(body.removeImage ?? "") === "true";
  const imageUrl = uploaded?.publicUrl ?? (removeImage ? null : existing.image_url ?? null);
  const { data: post, error } = await supabase.from("resource_posts").update({ title, description: str(body.description, 1000), category, condition: str(body.condition, 80), price: str(body.price, 40) || "Free", tags: parseTags(body.tags), image_url: imageUrl }).eq("id", id).select().single();
  if (error || !post) { if (uploaded) await removeListingImage(uploaded.publicUrl); return serverError("Could not update the post."); }
  if ((uploaded || removeImage) && existing.image_url) await removeListingImage(existing.image_url);
  return NextResponse.json({ post });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) return unauthorized();
  const { id } = await params; if (!isUuid(id)) return notFound();
  const { data: existing } = await supabase.from("resource_posts").select("id, user_id, title, image_url").eq("id", id).maybeSingle();
  if (!existing) return notFound("Resource post not found.");
  if (existing.user_id !== user.id) return NextResponse.json({ error: "You can only delete your own post." }, { status: 403 });
  const now = new Date().toISOString();
  const { data: completedRequests } = await supabase
    .from("exchange_requests")
    .select("id")
    .eq("item_type", "resource")
    .eq("item_id", id)
    .eq("owner_id", existing.user_id)
    .eq("status", "completed");
  for (const request of (completedRequests ?? []) as { id: string }[]) {
    await reverseExchangeReward(request.id, "resource", existing.user_id, existing.title);
  }
  await supabase.from("exchange_requests").update({ status: "cancelled", updated_at: now }).eq("item_type", "resource").eq("item_id", id).in("status", ["pending", "accepted"]);
  const { error } = await supabase.from("resource_posts").delete().eq("id", id);
  if (error) return serverError("Could not delete the post.");
  await removeListingImage(existing.image_url);
  return NextResponse.json({ ok: true });
}
