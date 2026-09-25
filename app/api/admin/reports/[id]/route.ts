import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentAdmin } from "@/lib/auth";
import { ITEM_TABLE, type ReportItemType } from "@/lib/constants";
import { badRequest, forbidden, isUuid, notFound, readJson, serverError } from "@/lib/http";
import { notify } from "@/lib/notify";
import { banUser } from "@/lib/moderation";

/**
 * PATCH /api/admin/reports/:id { action: "dismiss" | "remove" | "remove_and_ban" }
 *  dismiss         — report was unfounded; closes it
 *  remove          — deletes the reported post/event (and cancels its open requests), notifies the owner
 *  remove_and_ban  — same, and suspends the owner's account
 * All open reports about the same item are closed together.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return forbidden("Admins only.");

  const { id } = await params;
  if (!isUuid(id)) return notFound();

  const body = await readJson(req);
  const action = body.action;
  if (action !== "dismiss" && action !== "remove" && action !== "remove_and_ban") return badRequest("Unknown action.");

  const { data: report } = await supabase
    .from("reports")
    .select("id, item_type, item_id, item_title, status")
    .eq("id", id)
    .maybeSingle();
  if (!report) return notFound("Report not found.");
  const type = report.item_type as ReportItemType;
  const now = new Date().toISOString();

  if (action === "dismiss") {
    await supabase
      .from("reports")
      .update({ status: "dismissed", resolved_by: admin.id, resolved_at: now })
      .eq("item_type", type)
      .eq("item_id", report.item_id)
      .eq("status", "open");
    return NextResponse.json({ ok: true });
  }

  // Find the owner before the item disappears
  const ownerCol = type === "event" ? "organizer_id" : "user_id";
  const { data: item } = await supabase.from(ITEM_TABLE[type]).select(`id, title, ${ownerCol}`).eq("id", report.item_id).maybeSingle();
  const ownerId = item ? (item as unknown as Record<string, string>)[ownerCol] : null;

  if (action === "remove_and_ban") {
    if (!ownerId) return badRequest("This post is already gone, so its owner can't be determined. Ban them from the Users tab.");
    const result = await banUser(admin.id, ownerId);
    if (!result.ok) return badRequest(result.error);
  }

  if (item) {
    if (type !== "event") {
      // Free anyone waiting on this listing
      const { data: cancelled } = await supabase
        .from("exchange_requests")
        .update({ status: "cancelled", updated_at: now })
        .eq("item_type", type)
        .eq("item_id", report.item_id)
        .in("status", ["pending", "accepted"])
        .select("requester_id");
      for (const c of (cancelled ?? []) as { requester_id: string }[]) {
        await notify(c.requester_id, {
          type: "request_cancelled",
          title: `"${report.item_title}" was removed by moderators`,
          link: "/requests",
        });
      }
    }
    const { error } = await supabase.from(ITEM_TABLE[type]).delete().eq("id", report.item_id);
    if (error) return serverError("Could not remove the post.");

    if (ownerId && action === "remove") {
      await notify(ownerId, {
        type: "post_removed",
        title: `Your post "${report.item_title}" was removed`,
        body: "It was reported and moderators found it broke the community guidelines.",
      });
    }
  }

  await supabase
    .from("reports")
    .update({ status: "actioned", resolved_by: admin.id, resolved_at: now })
    .eq("item_type", type)
    .eq("item_id", report.item_id)
    .eq("status", "open");

  return NextResponse.json({ ok: true });
}
