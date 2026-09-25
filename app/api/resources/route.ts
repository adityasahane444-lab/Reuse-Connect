import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentUser, awardPoints } from "@/lib/auth";
import { RESOURCE_CATEGORIES } from "@/lib/constants";
import { badRequest, readJson, str, unauthorized } from "@/lib/http";
import { parseTags, sanitizeSearch, slugTag } from "@/lib/search";
import { ratingSummaries } from "@/lib/ratings";

interface ResourcePostRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  price: string;
  tags: string[] | null;
  status: string;
  created_at: string;
  users: { name: string } | null;
}

/**
 * GET /api/resources?q=&category=&tag=&include=all
 *  - q:        matches title, description or an exact tag
 *  - category: exact category
 *  - tag:      posts carrying this tag
 *  - include=all also returns completed (already handed over) items
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const q = sanitizeSearch(params.get("q"));
  const category = params.get("category");
  const tag = slugTag(params.get("tag") ?? "");

  let query = supabase
    .from("resource_posts")
    .select("id, user_id, title, description, category, condition, price, tags, status, created_at, users(name)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (params.get("include") !== "all") query = query.neq("status", "completed");
  if (category) query = query.eq("category", category);
  if (tag) query = query.contains("tags", [tag]);
  if (q) {
    const tagQ = slugTag(q);
    const clauses = [`title.ilike.%${q}%`, `description.ilike.%${q}%`];
    if (tagQ) clauses.push(`tags.cs.{${tagQ}}`);
    query = query.or(clauses.join(","));
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as unknown as ResourcePostRow[];
  const ratings = await ratingSummaries(rows.map((p) => p.user_id));

  const posts = rows.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    category: p.category,
    condition: p.condition,
    price: p.price,
    tags: p.tags ?? [],
    status: p.status,
    createdAt: p.created_at,
    postedBy: p.users?.name ?? "Unknown",
    postedById: p.user_id,
    posterRating: ratings.get(p.user_id) ?? { average: null, count: 0 },
  }));

  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized("Please log in to post an item.");

  const body = await readJson(req);
  const title = str(body.title, 120);
  const category = str(body.category, 60);
  if (!title || !category) return badRequest("Title and category are required.");
  if (!(RESOURCE_CATEGORIES as readonly string[]).includes(category)) return badRequest("Unknown category.");

  const { data: post, error } = await supabase
    .from("resource_posts")
    .insert({
      user_id: user.id,
      title,
      description: str(body.description, 1000),
      category,
      condition: str(body.condition, 80),
      price: str(body.price, 40) || "Free",
      tags: parseTags(body.tags),
    })
    .select()
    .single();

  if (error || !post) {
    return NextResponse.json({ error: "Could not post. Please try again." }, { status: 500 });
  }

  await awardPoints(user.id, 30, `Posted item: ${post.title}`);
  return NextResponse.json({ post });
}
