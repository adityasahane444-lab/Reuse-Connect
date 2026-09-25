import { supabase } from "./supabase";
import { normalizePreferences, type Preferences } from "./types";

export type NotificationType =
  | "request_received"
  | "request_accepted"
  | "request_declined"
  | "request_cancelled"
  | "request_completed"
  | "rating_received"
  | "event_joined"
  | "food_expiring"
  | "post_removed";

/** Which user preference (if any) can switch a notification type off. */
const GATE: Partial<Record<NotificationType, keyof Preferences>> = {
  request_received: "notifyExchanges",
  request_accepted: "notifyExchanges",
  request_declined: "notifyExchanges",
  request_cancelled: "notifyExchanges",
  request_completed: "notifyExchanges",
  rating_received: "notifyExchanges",
  event_joined: "notifyEvents",
  food_expiring: "notifyExpiry",
  // post_removed is a moderation notice and is always delivered
};

interface NotifyInput {
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  /** If set, the same key is only ever stored once (e.g. one expiry alert per item). */
  dedupeKey?: string;
}

/** Best-effort: notification failures must never break the action that triggered them. */
export async function notify(userId: string, input: NotifyInput): Promise<void> {
  try {
    const gate = GATE[input.type];
    if (gate) {
      const { data } = await supabase.from("users").select("preferences").eq("id", userId).maybeSingle();
      if (!normalizePreferences(data?.preferences)[gate]) return;
    }
    const row = {
      user_id: userId,
      type: input.type,
      title: input.title,
      body: input.body ?? "",
      link: input.link ?? "",
      dedupe_key: input.dedupeKey ?? null,
    };
    if (input.dedupeKey) {
      await supabase.from("notifications").upsert(row, { onConflict: "dedupe_key", ignoreDuplicates: true });
    } else {
      await supabase.from("notifications").insert(row);
    }
  } catch (err) {
    console.error("notify failed:", err);
  }
}
