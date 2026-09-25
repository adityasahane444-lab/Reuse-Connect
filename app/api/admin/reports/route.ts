import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentAdmin } from "@/lib/auth";
import { ITEM_TABLE, type ReportItemType } from "@/lib/constants";
import { forbidden, serverError } from "@/lib/http";

interface ReportRow {
  id: string;
  reporter_id: string;
  item_type: ReportItemType;
  item_id: string;
  item_title: string;
  reason: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

/** GET /api/admin/reports?status=open|dismissed|actioned|all — flagged posts, newest first. */
export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return forbidden("Admins only.");

  const status = req.nextUrl.searchParams.get("status") ?? "open";
  let query = supabase
    .from("reports")
    .select("id, reporter_id, item_type, item_id, item_title, reason, status, created_at, resolved_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (status !== "all") query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return serverError();
  const reports = (data ?? []) as ReportRow[];

  // Look up the reported items (may already be deleted) and who owns them
  const idsByType: Record<ReportItemType, string[]> = { food: [], resource: [], event: [] };
  for (const r of reports) idsByType[r.item_type].push(r.item_id);

  const items = new Map<string, { title: string; description: string; ownerId: string }>();
  await Promise.all(
    (Object.keys(idsByType) as ReportItemType[]).map(async (type) => {
      if (idsByType[type].length === 0) return;
      const ownerCol = type === "event" ? "organizer_id" : "user_id";
      const { data: rows } = await supabase
        .from(ITEM_TABLE[type])
        .select(`id, title, description, ${ownerCol}`)
        .in("id", idsByType[type]);
      for (const row of (rows ?? []) as unknown as Record<string, string>[]) {
        items.set(`${type}:${row.id}`, { title: row.title, description: row.description, ownerId: row[ownerCol] });
      }
    })
  );

  const userIds = [...new Set([...reports.map((r) => r.reporter_id), ...[...items.values()].map((i) => i.ownerId)])];
  const { data: people } = userIds.length
    ? await supabase.from("users").select("id, name, is_banned, is_admin").in("id", userIds)
    : { data: [] as { id: string; name: string; is_banned: boolean; is_admin: boolean }[] };
  const peopleById = new Map((people ?? []).map((p) => [p.id, p]));

  return NextResponse.json({
    reports: reports.map((r) => {
      const item = items.get(`${r.item_type}:${r.item_id}`);
      const owner = item ? peopleById.get(item.ownerId) : undefined;
      return {
        id: r.id,
        itemType: r.item_type,
        itemId: r.item_id,
        itemTitle: item?.title ?? r.item_title,
        itemDescription: item?.description ?? "",
        itemExists: Boolean(item),
        reason: r.reason,
        status: r.status,
        createdAt: r.created_at,
        resolvedAt: r.resolved_at,
        reporter: { id: r.reporter_id, name: peopleById.get(r.reporter_id)?.name ?? "Deleted user" },
        owner: owner ? { id: owner.id, name: owner.name, isBanned: owner.is_banned, isAdmin: owner.is_admin } : null,
      };
    }),
  });
}
