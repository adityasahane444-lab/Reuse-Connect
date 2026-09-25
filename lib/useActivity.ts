"use client";
import { useEffect, useState } from "react";

export const ACTIVITY_EVENT = "rc:activity";
/** Tell the navbar to re-check its unread badges now (e.g. after reading a message). */
export const pingActivity = () => window.dispatchEvent(new Event(ACTIVITY_EVENT));

/** Unread notification + message counts, refreshed every 30s while the tab is visible. */
export function useActivity(enabled: boolean) {
  const [counts, setCounts] = useState({ notifications: 0, messages: 0 });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const load = async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const res = await fetch("/api/activity", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled) setCounts({ notifications: data.notifications ?? 0, messages: data.messages ?? 0 });
      } catch {
        /* offline — try again on the next tick */
      }
    };

    load();
    const timer = setInterval(load, 30_000);
    window.addEventListener(ACTIVITY_EVENT, load);
    document.addEventListener("visibilitychange", load);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener(ACTIVITY_EVENT, load);
      document.removeEventListener("visibilitychange", load);
    };
  }, [enabled]);

  return enabled ? counts : { notifications: 0, messages: 0 };
}
