import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { badRequest, readJson, serverError, unauthorized } from "@/lib/http";
import { DEFAULT_PREFERENCES, normalizePreferences, type Preferences } from "@/lib/types";

/** PATCH /api/settings/preferences { allowMessages?, notifyExchanges?, notifyEvents?, notifyExpiry? } */
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await readJson(req);
  const next: Preferences = normalizePreferences(user.preferences);
  let changed = false;
  for (const key of Object.keys(DEFAULT_PREFERENCES) as (keyof Preferences)[]) {
    if (key in body) {
      if (typeof body[key] !== "boolean") return badRequest(`"${key}" must be true or false.`);
      next[key] = body[key] as boolean;
      changed = true;
    }
  }
  if (!changed) return badRequest("Nothing to update.");

  const { error } = await supabase.from("users").update({ preferences: next }).eq("id", user.id);
  if (error) return serverError("Could not save your preferences.");
  return NextResponse.json({ preferences: next });
}
