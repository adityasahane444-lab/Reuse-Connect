import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentUser, awardPoints } from "@/lib/auth";

interface ResourcePostRow {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  price: string;
  created_at: string;
  users: { name: string } | null;
}

export async function GET() {
  const { data, error } = await supabase
    .from("resource_posts")
    .select("id, title, description, category, condition, price, created_at, users(name)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const posts = ((data ?? []) as unknown as ResourcePostRow[]).map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    category: p.category,
    condition: p.condition,
    price: p.price,
    createdAt: p.created_at,
    postedBy: p.users?.name ?? "Unknown",
  }));

  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in to post an item." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { title, description, category, condition, price } = body ?? {};
  if (!title || !category) {
    return NextResponse.json({ error: "Title and category are required." }, { status: 400 });
  }

  const { data: post, error } = await supabase
    .from("resource_posts")
    .insert({
      user_id: user.id,
      title: String(title).trim(),
      description: String(description ?? "").trim(),
      category: String(category),
      condition: String(condition ?? "").trim(),
      price: String(price ?? "Free").trim(),
    })
    .select()
    .single();

  if (error || !post) {
    return NextResponse.json({ error: "Could not post. Please try again." }, { status: 500 });
  }

  await awardPoints(user.id, 30, `Posted item: ${post.title}`);
  return NextResponse.json({ post });
}
