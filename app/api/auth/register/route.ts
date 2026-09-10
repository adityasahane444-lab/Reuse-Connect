import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { hashPassword, createSession } from "@/lib/auth";
import { toPublicUser, Role } from "@/lib/types";

const VALID_ROLES: Role[] = ["student", "teacher", "individual", "organization", "business"];

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { name, email, password, role } = body ?? {};

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "Please fill in all fields." }, { status: 400 });
  }
  if (String(password).length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .ilike("email", String(email).trim())
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const { hash, salt } = hashPassword(password);
  const { data: user, error } = await supabase
    .from("users")
    .insert({
      name: String(name).trim(),
      email: String(email).trim(),
      password_hash: hash,
      password_salt: salt,
      role,
    })
    .select()
    .single();

  if (error || !user) {
    return NextResponse.json({ error: "Could not create account. Please try again." }, { status: 500 });
  }

  await createSession(user.id);
  return NextResponse.json({ user: toPublicUser(user) });
}
