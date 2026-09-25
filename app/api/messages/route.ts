import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { badRequest, forbidden, isUuid, notFound, readJson, serverError, unauthorized } from "@/lib/http";
import { getOrCreateConversation, haveExchange, orderedPair } from "@/lib/chat";
import { normalizePreferences } from "@/lib/types";

interface ConvoRow {
  id: string;
  user_a: string;
  user_b: string;
  last_message_at: string;
}
interface MsgRow {
  conversation_id: string;
  sender_id: string | null;
  body: string;
  is_system: boolean;
  created_at: string;
  read_at: string | null;
}

/** GET /api/messages — my conversations with last message + unread count. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { data: convos, error } = await supabase
    .from("conversations")
    .select("id, user_a, user_b, last_message_at")
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .order("last_message_at", { ascending: false })
    .limit(100);
  if (error) return serverError();

  const rows = (convos ?? []) as ConvoRow[];
  if (rows.length === 0) return NextResponse.json({ conversations: [] });

  const convoIds = rows.map((c) => c.id);
  const otherIds = rows.map((c) => (c.user_a === user.id ? c.user_b : c.user_a));

  const [{ data: people }, { data: recent }, { data: unread }] = await Promise.all([
    supabase.from("users").select("id, name, avatar_url").in("id", otherIds),
    supabase
      .from("messages")
      .select("conversation_id, sender_id, body, is_system, created_at, read_at")
      .in("conversation_id", convoIds)
      .order("created_at", { ascending: false })
      .limit(Math.max(200, convoIds.length * 3)),
    supabase
      .from("messages")
      .select("conversation_id")
      .in("conversation_id", convoIds)
      .is("read_at", null)
      .or(`sender_id.is.null,sender_id.neq.${user.id}`)
      .limit(2000),
  ]);

  const peopleById = new Map((people ?? []).map((p) => [p.id, p]));
  const lastByConvo = new Map<string, MsgRow>();
  for (const m of (recent ?? []) as MsgRow[]) if (!lastByConvo.has(m.conversation_id)) lastByConvo.set(m.conversation_id, m);
  const unreadByConvo = new Map<string, number>();
  for (const m of (unread ?? []) as { conversation_id: string }[]) {
    unreadByConvo.set(m.conversation_id, (unreadByConvo.get(m.conversation_id) ?? 0) + 1);
  }

  return NextResponse.json({
    conversations: rows.map((c) => {
      const otherId = c.user_a === user.id ? c.user_b : c.user_a;
      const other = peopleById.get(otherId);
      const last = lastByConvo.get(c.id);
      return {
        id: c.id,
        other: { id: otherId, name: other?.name ?? "Deleted user", avatarUrl: other?.avatar_url ?? null },
        lastMessage: last ? { body: last.body, isSystem: last.is_system, mine: last.sender_id === user.id, createdAt: last.created_at } : null,
        lastMessageAt: c.last_message_at,
        unread: unreadByConvo.get(c.id) ?? 0,
      };
    }),
  });
}

/**
 * POST /api/messages { userId } — open (or find) a conversation with someone.
 * Blocked if they've switched off "allow messages" and you have no exchange with them
 * (an existing conversation always stays open).
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized("Please log in to send a message.");

  const body = await readJson(req);
  if (!isUuid(body.userId)) return badRequest("Invalid user.");
  if (body.userId === user.id) return badRequest("You can't message yourself.");

  const { data: target } = await supabase
    .from("users")
    .select("id, preferences, is_banned")
    .eq("id", body.userId)
    .maybeSingle();
  if (!target || target.is_banned) return notFound("That user isn't available.");

  const [a, b] = orderedPair(user.id, target.id);
  const { data: existing } = await supabase.from("conversations").select("id").eq("user_a", a).eq("user_b", b).maybeSingle();
  if (existing) return NextResponse.json({ conversationId: existing.id });

  if (!normalizePreferences(target.preferences).allowMessages && !(await haveExchange(user.id, target.id))) {
    return forbidden("This person isn't accepting new messages.");
  }

  const id = await getOrCreateConversation(user.id, target.id);
  if (!id) return serverError();
  return NextResponse.json({ conversationId: id });
}
