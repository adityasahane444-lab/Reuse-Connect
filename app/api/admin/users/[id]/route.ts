import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { badRequest, forbidden, isUuid, notFound, readJson } from "@/lib/http";
import { banUser, unbanUser } from "@/lib/moderation";

/** PATCH /api/admin/users/:id { action: "ban" | "unban" } */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return forbidden("Admins only.");

  const { id } = await params;
  if (!isUuid(id)) return notFound();

  const body = await readJson(req);
  if (body.action !== "ban" && body.action !== "unban") return badRequest("Unknown action.");

  const result = body.action === "ban" ? await banUser(admin.id, id) : await unbanUser(id);
  if (!result.ok) return badRequest(result.error);
  return NextResponse.json({ ok: true });
}
