import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { badRequest, conflict, forbidden, isUuid, notFound, readJson, serverError, str, unauthorized } from "@/lib/http";
import { notify } from "@/lib/notify";

/** POST /api/ratings { requestId, score (1-5), comment? } — rate the other person after a completed handover. */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await readJson(req);
  const score = Number(body.score);
  if (!isUuid(body.requestId)) return badRequest("Invalid request.");
  if (!Number.isInteger(score) || score < 1 || score > 5) return badRequest("Rating must be between 1 and 5.");

  const { data: request } = await supabase
    .from("exchange_requests")
    .select("id, owner_id, requester_id, status, item_title")
    .eq("id", body.requestId)
    .maybeSingle();
  if (!request) return notFound("Exchange not found.");
  if (request.owner_id !== user.id && request.requester_id !== user.id) return forbidden();
  if (request.status !== "completed") return badRequest("You can rate once the handover is marked complete.");

  const rateeId = request.owner_id === user.id ? request.requester_id : request.owner_id;
  const { error } = await supabase.from("ratings").insert({
    request_id: request.id,
    rater_id: user.id,
    ratee_id: rateeId,
    score,
    comment: str(body.comment, 300),
  });
  if (error) {
    if (error.code === "23505") return conflict("You've already rated this exchange.");
    return serverError("Could not save your rating.");
  }

  await notify(rateeId, {
    type: "rating_received",
    title: `${user.name} rated you ${"★".repeat(score)}`,
    body: `For "${request.item_title}"`,
    link: "/profile",
  });

  return NextResponse.json({ ok: true });
}
