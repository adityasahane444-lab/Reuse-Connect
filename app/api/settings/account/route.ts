import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { clearSessionCookie, getCurrentUser, verifyPassword } from "@/lib/auth";
import { AVATAR_BUCKET } from "@/lib/constants";
import { badRequest, forbidden, readJson, serverError, unauthorized } from "@/lib/http";

/**
 * DELETE /api/settings/account { password, confirm: "DELETE" }
 * Permanently removes the account. Foreign keys cascade, so the user's posts, events they
 * organized, requests, ratings, messages, notifications and sessions are deleted with it.
 */
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await readJson(req);
  if (body.confirm !== "DELETE") return badRequest('Type "DELETE" to confirm.');
  const password = typeof body.password === "string" ? body.password : "";
  if (!password || !verifyPassword(password, user.password_salt, user.password_hash)) {
    return forbidden("Your password is incorrect.");
  }

  if (user.is_admin) {
    const { count } = await supabase.from("users").select("id", { count: "exact", head: true }).eq("is_admin", true);
    if ((count ?? 0) <= 1) {
      return forbidden("You're the only admin. Promote someone else before deleting this account.");
    }
  }

  // Remove uploaded avatars (best effort — the DB row is what matters)
  try {
    const { data: files } = await supabase.storage.from(AVATAR_BUCKET).list(user.id);
    if (files && files.length > 0) {
      await supabase.storage.from(AVATAR_BUCKET).remove(files.map((f) => `${user.id}/${f.name}`));
    }
  } catch (err) {
    console.error("avatar cleanup failed:", err);
  }

  const { error } = await supabase.from("users").delete().eq("id", user.id);
  if (error) {
    console.error("account delete failed:", error);
    return serverError("Could not delete your account. Please try again.");
  }

  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
