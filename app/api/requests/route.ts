import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { ITEM_TABLE, type ItemType } from "@/lib/constants";
import { badRequest, conflict, isUuid, notFound, readJson, serverError, str, unauthorized } from "@/lib/http";
import { notify } from "@/lib/notify";

interface RequestRow {
  id: string;
  item_type: ItemType;
  item_id: string;
  item_title: string;
  owner_id: string;
  requester_id: string;
  message: string;
  status: string;
  created_at: string;
  completed_at: string | null;
}

/** GET /api/requests — everything I've sent or received, newest first. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { data, error } = await supabase
    .from("exchange_requests")
    .select("id, item_type, item_id, item_title, owner_id, requester_id, message, status, created_at, completed_at")
    .or(`owner_id.eq.${user.id},requester_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return serverError();

  const rows = (data ?? []) as RequestRow[];
  const otherIds = [...new Set(rows.map((r) => (r.owner_id === user.id ? r.requester_id : r.owner_id)))];
  const completedIds = rows.filter((r) => r.status === "completed").map((r) => r.id);

  const [{ data: people }, { data: myRatings }] = await Promise.all([
    otherIds.length
      ? supabase.from("users").select("id, name, avatar_url").in("id", otherIds)
      : Promise.resolve({ data: [] as { id: string; name: string; avatar_url: string | null }[] }),
    completedIds.length
      ? supabase.from("ratings").select("request_id, score").eq("rater_id", user.id).in("request_id", completedIds)
      : Promise.resolve({ data: [] as { request_id: string; score: number }[] }),
  ]);

  const peopleById = new Map((people ?? []).map((p) => [p.id, p]));
  const ratedByMe = new Map((myRatings ?? []).map((r) => [r.request_id, r.score]));

  const shape = (r: RequestRow) => {
    const otherId = r.owner_id === user.id ? r.requester_id : r.owner_id;
    const other = peopleById.get(otherId);
    return {
      id: r.id,
      itemType: r.item_type,
      itemId: r.item_id,
      itemTitle: r.item_title,
      status: r.status,
      message: r.message,
      createdAt: r.created_at,
      completedAt: r.completed_at,
      other: { id: otherId, name: other?.name ?? "Deleted user", avatarUrl: other?.avatar_url ?? null },
      myRating: ratedByMe.get(r.id) ?? null,
    };
  };

  return NextResponse.json({
    incoming: rows.filter((r) => r.owner_id === user.id).map(shape),
    outgoing: rows.filter((r) => r.requester_id === user.id).map(shape),
  });
}

/** POST /api/requests { itemType, itemId, message? } — ask for a listed item. */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized("Please log in to send a request.");

  const body = await readJson(req);
  const itemType = body.itemType;
  if (itemType !== "food" && itemType !== "resource") return badRequest("Invalid item type.");
  if (!isUuid(body.itemId)) return badRequest("Invalid item.");

  const { data: item } = await supabase
    .from(ITEM_TABLE[itemType])
    .select(itemType === "food" ? "id, user_id, title, status, expires_at" : "id, user_id, title, status")
    .eq("id", body.itemId)
    .maybeSingle();
  if (!item) return notFound("That listing no longer exists.");

  const listing = item as unknown as { id: string; user_id: string; title: string; status: string; expires_at?: string | null };
  if (listing.user_id === user.id) return badRequest("You can't request your own listing.");
  if (listing.status !== "available") return conflict("This item is no longer available.");
  if (listing.expires_at && new Date(listing.expires_at).getTime() <= Date.now()) {
    return conflict("This food has already expired.");
  }

  const { data: created, error } = await supabase
    .from("exchange_requests")
    .insert({
      item_type: itemType,
      item_id: listing.id,
      item_title: listing.title,
      owner_id: listing.user_id,
      requester_id: user.id,
      message: str(body.message, 300),
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return conflict("You already have an active request for this item.");
    return serverError("Could not send the request.");
  }

  await notify(listing.user_id, {
    type: "request_received",
    title: `${user.name} requested "${listing.title}"`,
    body: str(body.message, 300),
    link: "/requests",
  });

  return NextResponse.json({ ok: true, id: created?.id });
}
