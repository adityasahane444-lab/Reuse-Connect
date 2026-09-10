"use client";
import { useCallback, useEffect, useState } from "react";

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: string;
  greenPoints: number;
  createdAt: string;
}

export function useUser() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    const data = await res.json();
    setUser(data.user);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    refresh();
  }, [refresh]);

  return { user, loading, refresh };
}
