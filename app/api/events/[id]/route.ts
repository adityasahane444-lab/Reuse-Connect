import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { EVENT_CATEGORIES } from "@/lib/constants";
import { badRequest, isUuid, notFound, readJson, str, unauthorized, serverError } from "@/lib/http";
import { parseLat, parseLng } from "@/lib/search";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) return unauthorized();
  const { id } = await params; if (!isUuid(id)) return notFound();
  const body = await readJson(req);
  const title = str(body.title, 120), date = str(body.date, 30), category = str(body.category, 60) || "Other";
  if (!title || !date) return badRequest("Title and date are required.");
  if (!(EVENT_CATEGORIES as readonly string[]).includes(category)) return badRequest("Unknown category.");
  const { data: existing } = await supabase.from("events").select("id, organizer_id").eq("id", id).maybeSingle();
  if (!existing) return notFound("Event not found.");
  if (existing.organizer_id !== user.id) return NextResponse.json({ error: "You can only edit your own event." }, { status: 403 });
  const latitude = parseLat(body.latitude), longitude = parseLng(body.longitude);
  const { data: event, error } = await supabase.from("events").update({ title, description: str(body.description, 1000), category, date, time: str(body.time, 30), location: str(body.location, 160), latitude, longitude }).eq("id", id).select().single();
  if (error || !event) return serverError("Could not update the event.");
  return NextResponse.json({ event });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) return unauthorized();
  const { id } = await params; if (!isUuid(id)) return notFound();
  const { data: existing } = await supabase.from("events").select("id, organizer_id").eq("id", id).maybeSingle();
  if (!existing) return notFound("Event not found.");
  if (existing.organizer_id !== user.id) return NextResponse.json({ error: "You can only delete your own event." }, { status: 403 });
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return serverError("Could not delete the event.");
  return NextResponse.json({ ok: true });
}
