import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentUser, awardPoints } from "@/lib/auth";
import { notify } from "@/lib/notify";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in to join an event." }, { status: 401 });

  const { id } = await params;

  const { data: event } = await supabase.from("events").select("id, title, organizer_id").eq("id", id).maybeSingle();
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

  const { data: existing } = await supabase
    .from("event_participants")
    .select("id")
    .eq("event_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "You already joined this event." }, { status: 409 });
  }

  const { error } = await supabase.from("event_participants").insert({ event_id: id, user_id: user.id });
  if (error) {
    return NextResponse.json({ error: "Could not join event. Please try again." }, { status: 500 });
  }

  await awardPoints(user.id, 20, `Joined event: ${event.title}`);
  if (event.organizer_id !== user.id) {
    await notify(event.organizer_id, {
      type: "event_joined",
      title: `${user.name} joined "${event.title}"`,
      link: "/events",
    });
  }
  return NextResponse.json({ ok: true });
}
