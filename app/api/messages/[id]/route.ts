import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { MESSAGE_MAX } from "@/lib/constants";
import { badRequest, forbidden, isUuid, notFound, readJson, serverError, unauthorized } from "@/lib/http";

async function loadConversation(id: string, userId: string) {
  const { data } = await supabase.from("conversations").select("id, user_a, user_b").eq("id", id).maybeSingle();
  if (!data) return { error: notFound("Conversation not found.") };
  if (data.user_a !== userId && data.user_b !== userId) return { error: forbidden() };
  return { convo: data as { id: string; user_a: string; user_b: string } };
}

/**
 * GET /api/messages/:id?after=<iso> — messages in a conversation (oldest first).
 * `after` lets the client poll for just the new ones. Marks the other side's messages as read.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  if (!isUuid(id)) return notFound();

  const { convo, error: err } = await loadConversation(id, user.id);
  if (err) return err;

  const after = req.nextUrl.searchParams.get("after");
  let query = supabase
    .from("messages")
    .select("id, sender_id, body, is_system, created_at, read_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })
    .limit(200);
  if (after && !Number.isNaN(new Date(after).getTime())) query = query.gt("created_at", after);

  const otherId = convo!.user_a === user.id ? convo!.user_b : convo!.user_a;
  const [{ data, error }, { data: other }] = await Promise.all([
    query,
    supabase.from("users").select("id, name, avatar_url").eq("id", otherId).maybeSingle(),
  ]);
  if (error) return serverError();

  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", id)
    .is("read_at", null)
    .or(`sender_id.is.null,sender_id.neq.${user.id}`);

  return NextResponse.json({
    other: { id: otherId, name: other?.name ?? "Deleted user", avatarUrl: other?.avatar_url ?? null },
    messages: (data ?? []).map((m) => ({
      id: m.id,
      body: m.body,
      isSystem: m.is_system,
      mine: m.sender_id === user.id,
      createdAt: m.created_at,
    })),
  });
}

/** POST /api/messages/:id { body } — send a message. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  if (!isUuid(id)) return notFound();

  const { convo, error: err } = await loadConversation(id, user.id);
  if (err) return err;

  const body = await readJson(req);
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!text) return badRequest("Message can't be empty.");
  if (text.length > MESSAGE_MAX) return badRequest(`Messages can be at most ${MESSAGE_MAX} characters.`);

  // Don't let someone keep messaging a person who has since been banned/deleted
  const otherId = convo!.user_a === user.id ? convo!.user_b : convo!.user_a;
  const { data: other } = await supabase.from("users").select("is_banned").eq("id", otherId).maybeSingle();
  if (!other || other.is_banned) return forbidden("You can't message this person any more.");

  const { data: msg, error } = await supabase
    .from("messages")
    .insert({ conversation_id: id, sender_id: user.id, body: text })
    .select("id, body, is_system, created_at")
    .single();
  if (error || !msg) return serverError("Could not send your message.");

  await supabase.from("conversations").update({ last_message_at: msg.created_at }).eq("id", id);

  return NextResponse.json({
    message: { id: msg.id, body: msg.body, isSystem: msg.is_system, mine: true, createdAt: msg.created_at },
  });
}
