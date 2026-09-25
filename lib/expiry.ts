import { supabase } from "./supabase";
import { notify } from "./notify";
import { EXPIRY_ALERT_WINDOW_MS, TIME_ZONE } from "./constants";

/**
 * Creates "food expiring soon" alerts for anyone involved in an ACCEPTED food pickup whose
 * post expires within the alert window. Idempotent (one alert per user per post), and called
 * whenever the app polls for activity, so no cron job is required.
 */
export async function sweepExpiryAlerts(userId: string): Promise<void> {
  try {
    const now = new Date();
    const soon = new Date(now.getTime() + EXPIRY_ALERT_WINDOW_MS);

    // Reserved posts I own + food posts I have an accepted request for
    const [{ data: owned }, { data: accepted }] = await Promise.all([
      supabase.from("food_posts").select("id").eq("user_id", userId).eq("status", "reserved"),
      supabase
        .from("exchange_requests")
        .select("item_id")
        .eq("requester_id", userId)
        .eq("item_type", "food")
        .eq("status", "accepted"),
    ]);

    const ids = [
      ...new Set([
        ...(owned ?? []).map((r: { id: string }) => r.id),
        ...(accepted ?? []).map((r: { item_id: string }) => r.item_id),
      ]),
    ];
    if (ids.length === 0) return;

    const { data: expiring } = await supabase
      .from("food_posts")
      .select("id, title, expires_at")
      .in("id", ids)
      .gt("expires_at", now.toISOString())
      .lte("expires_at", soon.toISOString());

    for (const p of (expiring ?? []) as { id: string; title: string; expires_at: string }[]) {
      const at = new Date(p.expires_at).toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: TIME_ZONE,
      });
      await notify(userId, {
        type: "food_expiring",
        title: `"${p.title}" expires soon`,
        body: `Pick it up before ${at}.`,
        link: "/requests",
        dedupeKey: `expiry:${userId}:${p.id}`,
      });
    }
  } catch (err) {
    console.error("sweepExpiryAlerts failed:", err);
  }
}
