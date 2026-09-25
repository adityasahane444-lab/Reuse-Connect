"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { PublicUser } from "./types";

interface UserContextValue {
  user: PublicUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

/**
 * One shared login-state fetch for the whole app. Without this, every component that needs
 * to know "who's logged in" (the navbar, every page) ran its own independent fetch — so the
 * navbar (which persists across client-side navigations) never learned about a login that
 * happened on the page below it. Calling refresh() from anywhere now updates everyone at once.
 */
export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const inFlight = useRef<Promise<void> | null>(null);

  const refresh = useCallback(async () => {
    if (inFlight.current) return inFlight.current;
    const p = (async () => {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      setUser(data.user);
      setLoading(false);
    })();
    inFlight.current = p;
    try {
      await p;
    } finally {
      inFlight.current = null;
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    refresh();
  }, [refresh]);

  return <UserContext.Provider value={{ user, loading, refresh }}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within <UserProvider>");
  return ctx;
}

export type { PublicUser };
