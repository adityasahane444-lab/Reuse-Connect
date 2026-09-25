import { supabase } from "./supabase";

export function orderedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export async function getOrCreateConversation(userA: string, userB: string): Promise<string | null> {
  const [a, b] = orderedPair(userA, userB);
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_a", a)
    .eq("user_b", b)
    .maybeSingle();
  if (existing) return existing.id as string;

  // ignoreDuplicates makes concurrent creators safe; we re-select afterwards.
  await supabase.from("conversations").upsert({ user_a: a, user_b: b }, { onConflict: "user_a,user_b", ignoreDuplicates: true });
  const { data } = await supabase.from("conversations").select("id").eq("user_a", a).eq("user_b", b).maybeSingle();
  return (data?.id as string) ?? null;
}

export async function postSystemMessage(conversationId: string, body: string) {
  await supabase.from("messages").insert({ conversation_id: conversationId, sender_id: null, body, is_system: true });
  await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conversationId);
}

/** True if the two users have (or had) an exchange request between them. */
export async function haveExchange(a: string, b: string): Promise<boolean> {
  const { data } = await supabase
    .from("exchange_requests")
    .select("id")
    .or(`and(owner_id.eq.${a},requester_id.eq.${b}),and(owner_id.eq.${b},requester_id.eq.${a})`)
    .limit(1);
  return (data ?? []).length > 0;
}
