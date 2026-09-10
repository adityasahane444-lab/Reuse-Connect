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
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await supabase.from("sessions").delete().eq("token", token);
  }
  store.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<UserRow | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const { data: session } = await supabase
    .from("sessions")
    .select("user_id")
    .eq("token", token)
    .maybeSingle();
  if (!session) return null;

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", session.user_id)
    .maybeSingle();

  return (user as UserRow) ?? null;
}

export { toPublicUser as publicUser };

export async function awardPoints(userId: string, amount: number, reason: string) {
  await supabase.from("points_tx").insert({ user_id: userId, amount, reason });
  await supabase.rpc("increment_green_points", { p_user_id: userId, p_amount: amount });
}
