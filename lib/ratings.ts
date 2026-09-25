import { supabase } from "./supabase";

export interface RatingSummary {
  average: number | null;
  count: number;
}

/** Average rating + count for a set of users (computed in one query). */
export async function ratingSummaries(userIds: string[]): Promise<Map<string, RatingSummary>> {
  const out = new Map<string, RatingSummary>();
  const ids = [...new Set(userIds)];
  if (ids.length === 0) return out;

  const { data } = await supabase.from("ratings").select("ratee_id, score").in("ratee_id", ids);
  const sums = new Map<string, { total: number; count: number }>();
  for (const r of (data ?? []) as { ratee_id: string; score: number }[]) {
    const s = sums.get(r.ratee_id) ?? { total: 0, count: 0 };
    s.total += r.score;
    s.count += 1;
    sums.set(r.ratee_id, s);
  }
  for (const id of ids) {
    const s = sums.get(id);
    out.set(id, s ? { average: Math.round((s.total / s.count) * 10) / 10, count: s.count } : { average: null, count: 0 });
  }
  return out;
}
