"use client";
import { useCallback, useEffect, useState } from "react";

/** Keys the caller's live outgoing requests as "food:<id>" / "resource:<id>" → status. */
export function useMyRequests(loggedIn: boolean) {
  const [active, setActive] = useState<Record<string, string>>({});

  const refresh = useCallback(async () => {
    if (!loggedIn) {
      setActive({});
      return;
    }
    const res = await fetch("/api/requests", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as {
      outgoing: { itemType: string; itemId: string; status: string }[];
    };
    const next: Record<string, string> = {};
    for (const r of data.outgoing) {
      if (r.status === "pending" || r.status === "accepted") next[`${r.itemType}:${r.itemId}`] = r.status;
    }
    setActive(next);
  }, [loggedIn]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount / login change
    refresh();
  }, [refresh]);

  return { active, refresh };
}
