import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentAdmin } from "@/lib/auth";
import { forbidden, serverError } from "@/lib/http";
import { sanitizeSearch } from "@/lib/search";

/** GET /api/admin/users?q=&banned=1 — find users by name/email. */
export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return forbidden("Admins only.");

  const q = sanitizeSearch(req.nextUrl.searchParams.get("q"));
  let query = supabase
    .from("users")
    .select("id, name, email, role, green_points, is_admin, is_banned, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (req.nextUrl.searchParams.get("banned") === "1") query = query.eq("is_banned", true);
  if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) return serverError();

  return NextResponse.json({
    users: (data ?? []).map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      greenPoints: u.green_points,
      isAdmin: u.is_admin,
      isBanned: u.is_banned,
      createdAt: u.created_at,
    })),
  });
}
