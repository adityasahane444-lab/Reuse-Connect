import crypto from "crypto";
import { cookies } from "next/headers";
import { supabase } from "./supabase";
import { UserRow, toPublicUser } from "./types";

const SESSION_COOKIE = "rc_session";

export function hashPassword(password: string, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

export function verifyPassword(password: string, salt: string, hash: string) {
  const check = crypto.scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(check);
  const b = Buffer.from(hash);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const { error } = await supabase.from("sessions").insert({ token, user_id: userId });
  if (error) throw new Error(`Could not create session: ${error.message}`);

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await supabase.from("sessions").delete().eq("token", token);
  }
  store.delete(SESSION_COOKIE);
}

/**
 * One joined query instead of two sequential ones (session lookup, then a separate user
 * lookup) — this runs on every authenticated request, so halving its round-trips matters.
 */
export async function getCurrentUser(): Promise<UserRow | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const { data: session } = await supabase
    .from("sessions")
    .select("user:users(*)")
    .eq("token", token)
    .maybeSingle();

  const user = (session as { user: UserRow | null } | null)?.user;
  if (!user) return null;
  // Banned users are treated as logged out everywhere.
  if (user.is_banned) return null;
  return user;
}

/** Returns the current user only if they are a moderator/admin. */
export async function getCurrentAdmin(): Promise<UserRow | null> {
  const user = await getCurrentUser();
  return user && user.is_admin ? user : null;
}

export { toPublicUser as publicUser };

export async function awardPoints(userId: string, amount: number, reason: string) {
  await supabase.from("points_tx").insert({ user_id: userId, amount, reason });
  await supabase.rpc("increment_green_points", { p_user_id: userId, p_amount: amount });
}
