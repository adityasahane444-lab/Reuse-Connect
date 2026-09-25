import { supabase } from "./supabase";

export type ModerationResult = { ok: true } | { ok: false; error: string };

/** Suspends an account and signs it out everywhere. Admins can't be banned. */
export async function banUser(adminId: string, targetId: string): Promise<ModerationResult> {
  if (targetId === adminId) return { ok: false, error: "You can't ban yourself." };

  const { data: target } = await supabase.from("users").select("id, is_admin").eq("id", targetId).maybeSingle();
  if (!target) return { ok: false, error: "User not found." };
  if (target.is_admin) return { ok: false, error: "Admins can't be banned. Remove their admin role first." };

  const { error } = await supabase.from("users").update({ is_banned: true }).eq("id", targetId);
  if (error) return { ok: false, error: "Could not ban the user." };
  await supabase.from("sessions").delete().eq("user_id", targetId);
  return { ok: true };
}

export async function unbanUser(targetId: string): Promise<ModerationResult> {
  const { error } = await supabase.from("users").update({ is_banned: false }).eq("id", targetId);
  return error ? { ok: false, error: "Could not unban the user." } : { ok: true };
}
