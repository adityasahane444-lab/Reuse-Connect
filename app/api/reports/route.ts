import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { ITEM_TABLE, type ReportItemType } from "@/lib/constants";
import { badRequest, conflict, isUuid, notFound, readJson, serverError, str, unauthorized } from "@/lib/http";

/** POST /api/reports { itemType, itemId, reason } — flag a listing or event for moderators. */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized("Please log in to report a post.");

  const body = await readJson(req);
  const itemType = body.itemType as ReportItemType;
  if (!(itemType in ITEM_TABLE)) return badRequest("Invalid item type.");
  if (!isUuid(body.itemId)) return badRequest("Invalid item.");
  const reason = str(body.reason, 300);
  if (!reason) return badRequest("Please choose a reason.");

  const owner = itemType === "event" ? "organizer_id" : "user_id";
  const { data: item } = await supabase
    .from(ITEM_TABLE[itemType])
    .select(`id, title, ${owner}`)
    .eq("id", body.itemId)
    .maybeSingle();
  if (!item) return notFound("That post no longer exists.");

  const row = item as unknown as Record<string, string>;
  if (row[owner] === user.id) return badRequest("You can't report your own post.");

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    item_type: itemType,
    item_id: row.id,
    item_title: row.title,
    reason,
  });
  if (error) {
    if (error.code === "23505") return conflict("You've already reported this post. Thanks — moderators will take a look.");
    return serverError("Could not submit the report.");
  }
  return NextResponse.json({ ok: true });
}
