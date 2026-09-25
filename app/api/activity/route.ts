import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { sweepExpiryAlerts } from "@/lib/expiry";

/**
 * GET /api/activity — cheap summary the navbar polls: unread notifications + unread messages.
 * Also triggers the (idempotent) food-expiry sweep so alerts appear without a cron job.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ notifications: 0, messages: 0 });

  await sweepExpiryAlerts(user.id);

  const [{ count: notifications }, { data: convos }] = await Promise.all([
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null),
    supabase.from("conversations").select("id").or(`user_a.eq.${user.id},user_b.eq.${user.id}`),
  ]);

  let messages = 0;
  const ids = (convos ?? []).map((c: { id: string }) => c.id);
  if (ids.length > 0) {
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in("conversation_id", ids)
      .is("read_at", null)
      .or(`sender_id.is.null,sender_id.neq.${user.id}`);
    messages = count ?? 0;
  }

  return NextResponse.json({ notifications: notifications ?? 0, messages });
}
