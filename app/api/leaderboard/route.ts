import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, role, green_points")
    .order("green_points", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const leaderboard = (data ?? []).map((u: { id: string; name: string; role: string; green_points: number }) => ({
    id: u.id,
    name: u.name,
    role: u.role,
    greenPoints: u.green_points,
  }));

  return NextResponse.json({ leaderboard });
}
