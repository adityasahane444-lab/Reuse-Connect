import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { ITEM_TABLE, type ItemType } from "@/lib/constants";
import { badRequest, conflict, forbidden, isUuid, notFound, readJson, unauthorized } from "@/lib/http";
import { notify } from "@/lib/notify";
import { getOrCreateConversation, postSystemMessage } from "@/lib/chat";

type Action = "accept" | "decline" | "cancel" | "complete";

interface RequestRow {
  id: string;
  item_type: ItemType;
  item_id: string;
  item_title: string;
  owner_id: string;
  requester_id: string;
  status: string;
}

/**
 * PATCH /api/requests/:id { action }
 *  accept   — owner, pending  → accepted (item reserved, other pending requests declined, chat opened)
 *  decline  — owner, pending  → declined
 *  cancel   — requester, pending|accepted → cancelled (item freed if it was reserved)
 *  complete — owner or requester, accepted → completed (item handed over; both can now rate)
 *
 * Every transition is a conditional update on the previous status, so two people clicking at once
 * can never both "win".
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { id } = await params;
  if (!isUuid(id)) return notFound();

  const body = await readJson(req);
  const action = body.action as Action;
  if (!["accept", "decline", "cancel", "complete"].includes(action)) return badRequest("Unknown action.");

  const { data } = await supabase
    .from("exchange_requests")
    .select("id, item_type, item_id, item_title, owner_id, requester_id, status")
    .eq("id", id)
    .maybeSingle();
  if (!data) return notFound("Request not found.");
  const r = data as RequestRow;

  const isOwner = r.owner_id === user.id;
  const isRequester = r.requester_id === user.id;
  if (!isOwner && !isRequester) return forbidden();

  const table = ITEM_TABLE[r.item_type];
  const now = new Date().toISOString();

  async function transition(from: string[], to: string, extra: Record<string, unknown> = {}) {
    const { data: updated } = await supabase
      .from("exchange_requests")
      .update({ status: to, updated_at: now, ...extra })
      .eq("id", r.id)
      .in("status", from)
      .select("id");
    return (updated ?? []).length > 0;
  }

  const other = isOwner ? r.requester_id : r.owner_id;

  switch (action) {
    case "accept": {
      if (!isOwner) return forbidden("Only the person who posted this can accept.");
      if (!(await transition(["pending"], "accepted"))) return conflict("This request is no longer pending.");

      await supabase.from(table).update({ status: "reserved" }).eq("id", r.item_id);

      // Decline everyone else who was waiting on this item
      const { data: others } = await supabase
        .from("exchange_requests")
        .update({ status: "declined", updated_at: now })
        .eq("item_type", r.item_type)
        .eq("item_id", r.item_id)
        .eq("status", "pending")
        .neq("id", r.id)
        .select("requester_id");
      for (const o of (others ?? []) as { requester_id: string }[]) {
        await notify(o.requester_id, {
          type: "request_declined",
          title: `"${r.item_title}" went to someone else`,
          link: "/requests",
        });
      }

      const convo = await getOrCreateConversation(r.owner_id, r.requester_id);
      if (convo) {
        await postSystemMessage(
          convo,
          `Request accepted for "${r.item_title}". Use this chat to agree a pickup place and time — no need to share phone numbers.`
        );
      }
      await notify(r.requester_id, {
        type: "request_accepted",
        title: `${user.name} accepted your request`,
        body: `"${r.item_title}" — say when and where you can pick it up.`,
        link: convo ? `/messages?c=${convo}` : "/requests",
      });
      break;
    }

    case "decline": {
      if (!isOwner) return forbidden("Only the person who posted this can decline.");
      if (!(await transition(["pending"], "declined"))) return conflict("This request is no longer pending.");
      await notify(r.requester_id, {
        type: "request_declined",
        title: `Your request for "${r.item_title}" was declined`,
        link: "/requests",
      });
      break;
    }

    case "cancel": {
      if (!isRequester) return forbidden("Only the requester can cancel.");
      const wasAccepted = r.status === "accepted";
      if (!(await transition(["pending", "accepted"], "cancelled"))) {
        return conflict("This request can't be cancelled any more.");
      }
      if (wasAccepted) {
        await supabase.from(table).update({ status: "available" }).eq("id", r.item_id).eq("status", "reserved");
      }
      await notify(r.owner_id, {
        type: "request_cancelled",
        title: `${user.name} cancelled their request`,
        body: `"${r.item_title}"`,
        link: "/requests",
      });
      break;
    }

    case "complete": {
      if (!(await transition(["accepted"], "completed", { completed_at: now }))) {
        return conflict("Only an accepted request can be marked complete.");
      }
      await supabase.from(table).update({ status: "completed" }).eq("id", r.item_id);
      await notify(other, {
        type: "request_completed",
        title: `Handover of "${r.item_title}" marked complete`,
        body: "How did it go? Leave a quick rating.",
        link: "/requests",
      });
      break;
    }
  }

  return NextResponse.json({ ok: true });
}
