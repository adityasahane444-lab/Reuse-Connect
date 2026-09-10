import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentUser, awardPoints } from "@/lib/auth";

interface EventRow {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  time: string;
  location: string;
  created_at: string;
  users: { name: string } | null;
  event_participants: { user_id: string }[] | null;
}

export async function GET() {
  const { data, error } = await supabase
    .from("events")
    .select(
      "id, title, description, category, date, time, location, created_at, users(name), event_participants(user_id)"
    )
    .order("date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const events = ((data ?? []) as unknown as EventRow[]).map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    category: e.category,
    date: e.date,
    time: e.time,
    location: e.location,
    organizedBy: e.users?.name ?? "Unknown",
    participants: (e.event_participants ?? []).map((p) => p.user_id),
    participantCount: (e.event_participants ?? []).length,
  }));

  return NextResponse.json({ events });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in to create an event." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { title, description, category, date, time, location } = body ?? {};
  if (!title || !date) {
    return NextResponse.json({ error: "Title and date are required." }, { status: 400 });
  }

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      organizer_id: user.id,
      title: String(title).trim(),
      description: String(description ?? "").trim(),
      category: String(category ?? "Other"),
      date: String(date),
      time: String(time ?? "").trim(),
      location: String(location ?? "").trim(),
    })
    .select()
    .single();

  if (error || !event) {
    return NextResponse.json({ error: "Could not create event. Please try again." }, { status: 500 });
  }

  await awardPoints(user.id, 50, `Organized event: ${event.title}`);
  return NextResponse.json({ event });
}
