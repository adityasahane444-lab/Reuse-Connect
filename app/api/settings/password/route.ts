import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentUser, getSessionToken, hashPassword, verifyPassword } from "@/lib/auth";
import { MIN_PASSWORD_LENGTH } from "@/lib/constants";
import { badRequest, readJson, serverError, unauthorized } from "@/lib/http";

/** POST /api/settings/password { currentPassword, newPassword } — also signs out every other device. */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await readJson(req);
  const current = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const next = typeof body.newPassword === "string" ? body.newPassword : "";

  if (!current || !next) return badRequest("Please fill in both fields.");
  if (next.length < MIN_PASSWORD_LENGTH) return badRequest(`New password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  if (next.length > 200) return badRequest("New password is too long.");
  if (!verifyPassword(current, user.password_salt, user.password_hash)) {
    return NextResponse.json({ error: "Your current password is incorrect." }, { status: 403 });
  }
  if (next === current) return badRequest("Choose a password different from your current one.");

  const { hash, salt } = hashPassword(next);
  const { error } = await supabase.from("users").update({ password_hash: hash, password_salt: salt }).eq("id", user.id);
  if (error) return serverError("Could not change your password.");

  // Keep this device signed in, sign out all others
  const token = await getSessionToken();
  let cleanup = supabase.from("sessions").delete().eq("user_id", user.id);
  if (token) cleanup = cleanup.neq("token", token);
  await cleanup;

  return NextResponse.json({ ok: true });
}
