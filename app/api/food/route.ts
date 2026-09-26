import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentUser, awardPoints } from "@/lib/auth";
import { FOOD_CATEGORIES } from "@/lib/constants";
import { badRequest, readJson, str, unauthorized } from "@/lib/http";
import { parseLat, parseLng, sanitizeSearch } from "@/lib/search";
import { ratingSummaries } from "@/lib/ratings";
import { parseListingRequest, uploadListingImage, removeListingImage } from "@/lib/post-images";

interface FoodPostRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  quantity: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  expires_at: string | null;
  status: string;
  created_at: string;
  image_url: string | null;
  users: { name: string } | null;
}

/**
 * GET /api/food?q=&category=&include=all
 * By default hides food that has been handed over or has already expired.
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const q = sanitizeSearch(params.get("q"));
  const category = params.get("category");

  let query = supabase
    .from("food_posts")
    .select(
      "id, user_id, title, description, category, quantity, location, latitude, longitude, expires_at, status, created_at, image_url, users(name)"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (params.get("include") !== "all") {
    query = query.neq("status", "completed").or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
  }
  if (category) query = query.eq("category", category);
  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,location.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as unknown as FoodPostRow[];
  const ratings = await ratingSummaries(rows.map((p) => p.user_id));

  const posts = rows.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    category: p.category,
    quantity: p.quantity,
    location: p.location,
    latitude: p.latitude,
    longitude: p.longitude,
    expiresAt: p.expires_at,
    status: p.status,
    createdAt: p.created_at,
    imageUrl: p.image_url,
    postedBy: p.users?.name ?? "Unknown",
    postedById: p.user_id,
    posterRating: ratings.get(p.user_id) ?? { average: null, count: 0 },
  }));

  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized("Please log in to post food.");

  const { body, image } = await parseListingRequest(req);
  const title = str(body.title, 120);
  const category = str(body.category, 60);
  if (!title || !category) return badRequest("Title and category are required.");
  if (!(FOOD_CATEGORIES as readonly string[]).includes(category)) return badRequest("Unknown category.");

  let expiresAt: string | null = null;
  if (body.expiresAt) {
    const d = new Date(String(body.expiresAt));
    if (Number.isNaN(d.getTime())) return badRequest("Invalid expiry time.");
    if (d.getTime() <= Date.now()) return badRequest("Expiry time must be in the future.");
    expiresAt = d.toISOString();
  }

  const latitude = parseLat(body.latitude);
  const longitude = parseLng(body.longitude);
  const hasCoords = latitude !== null && longitude !== null;

  let uploaded: { publicUrl: string; path: string } | null = null;
  try {
    uploaded = await uploadListingImage(user.id, "food", image);
  } catch (err) {
    return badRequest(err instanceof Error ? err.message : "Could not upload the image.");
  }

  const { data: post, error } = await supabase
    .from("food_posts")
    .insert({
      user_id: user.id,
      title,
      description: str(body.description, 1000),
      category,
      quantity: str(body.quantity, 80),
      location: str(body.location, 160),
      latitude: hasCoords ? latitude : null,
      longitude: hasCoords ? longitude : null,
      expires_at: expiresAt,
      image_url: uploaded?.publicUrl ?? null,
    })
    .select()
    .single();

  if (error || !post) {
    if (uploaded) await removeListingImage(uploaded.publicUrl);
    return NextResponse.json({ error: "Could not post. Please try again." }, { status: 500 });
  }

  await awardPoints(user.id, 50, `Posted surplus food: ${post.title}`);
  return NextResponse.json({ post });
}
