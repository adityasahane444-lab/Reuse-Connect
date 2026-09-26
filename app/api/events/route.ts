import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentUser, awardPoints } from "@/lib/auth";
import { EVENT_CATEGORIES } from "@/lib/constants";
import { parseLat, parseLng, sanitizeSearch } from "@/lib/search";
import { parseListingRequest, uploadListingImage, removeListingImage } from "@/lib/post-images";

interface EventRow {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  time: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  organizer_id: string;
  created_at: string;
  image_url: string | null;
  users: { name: string } | null;
  event_participants: { user_id: string }[] | null;
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const q = sanitizeSearch(params.get("q"));
  const category = params.get("category");

  let query = supabase
    .from("events")
    .select(
      "id, organizer_id, title, description, category, date, time, location, latitude, longitude, created_at, image_url, users(name), event_participants(user_id)"
    )
    .order("date", { ascending: true })
    .limit(200);
  if (category) query = query.eq("category", category);
  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,location.ilike.%${q}%`);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const events = ((data ?? []) as unknown as EventRow[]).map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    category: e.category,
    date: e.date,
    time: e.time,
    location: e.location,
    latitude: e.latitude,
    longitude: e.longitude,
    organizedById: e.organizer_id,
    organizedBy: e.users?.name ?? "Unknown",
    imageUrl: e.image_url,
    participants: (e.event_participants ?? []).map((p) => p.user_id),
    participantCount: (e.event_participants ?? []).length,
  }));

  return NextResponse.json({ events });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in to create an event." }, { status: 401 });

  const parsed = await parseListingRequest(req);
  const body = parsed.body;
  const image = parsed.image;
  const { title, description, category, date, time, location } = body ?? {};
  if (!title || !date) {
    return NextResponse.json({ error: "Title and date are required." }, { status: 400 });
  }
  if (category && !(EVENT_CATEGORIES as readonly string[]).includes(String(category))) {
    return NextResponse.json({ error: "Unknown category." }, { status: 400 });
  }
  const latitude = parseLat(body?.latitude);
  const longitude = parseLng(body?.longitude);
  const hasCoords = latitude !== null && longitude !== null;

  let uploaded: { publicUrl: string; path: string } | null = null;
  try {
    uploaded = await uploadListingImage(user.id, "event", image);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not upload the image." }, { status: 400 });
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
      latitude: hasCoords ? latitude : null,
      longitude: hasCoords ? longitude : null,
      image_url: uploaded?.publicUrl ?? null,
    })
    .select()
    .single();

  if (error || !event) {
    if (uploaded) await removeListingImage(uploaded.publicUrl);
    return NextResponse.json({ error: "Could not create event. Please try again." }, { status: 500 });
  }

  await awardPoints(user.id, 50, `Organized event: ${event.title}`);
  return NextResponse.json({ event });
}
