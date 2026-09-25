"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/useUser";
import { timeAgo } from "@/lib/format";
import { pingActivity } from "@/lib/useActivity";
import LoginPrompt from "@/components/LoginPrompt";
import { NOTIFICATION_ICONS, type NotificationItem } from "@/components/NotificationBell";

export default function NotificationsPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[] | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch("/api/notifications?limit=100", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setItems(d.notifications ?? []);
        pingActivity();
      });
  }, [user]);

  async function markRead(ids: string[] | "all") {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ids === "all" ? { all: true } : { ids }),
    });
    setItems((prev) => prev?.map((n) => (ids === "all" || ids.includes(n.id) ? { ...n, read: true } : n)) ?? prev);
    pingActivity();
  }

  if (userLoading) return <main className="flex-1 bg-[#F7FAF7] px-4 py-10" />;
  if (!user) return <LoginPrompt message="Please log in to see your notifications." />;

  const unread = items?.filter((n) => !n.read).length ?? 0;

  return (
    <main className="flex-1 bg-[#F7FAF7] px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-[#1F2937]">Notifications</h1>
          {unread > 0 && (
            <button onClick={() => markRead("all")} className="rounded-md border border-[#2E7D32] px-3 py-1.5 text-sm text-[#2E7D32] hover:bg-[#E8F5E9]">
              Mark all as read
            </button>
          )}
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-[#E8F5E9] bg-white">
          {items === null ? (
            <p className="p-6 text-[#6B7280]">Loading…</p>
          ) : items.length === 0 ? (
            <p className="p-10 text-center text-[#6B7280]">
              Nothing here yet. You&apos;ll be notified when someone requests your items, joins your events, or a pickup is about to expire.
            </p>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  if (!n.read) markRead([n.id]);
                  if (n.link) router.push(n.link);
                }}
                className={`flex w-full gap-3 border-b border-gray-100 px-5 py-4 text-left last:border-b-0 hover:bg-gray-50 ${n.read ? "" : "bg-[#F1F8F2]"}`}
              >
                <span className="text-xl" aria-hidden="true">{NOTIFICATION_ICONS[n.type] ?? "🔔"}</span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm ${n.read ? "text-[#1F2937]" : "font-semibold text-[#1F2937]"}`}>{n.title}</span>
                  {n.body && <span className="block text-sm text-[#6B7280]">{n.body}</span>}
                  <span className="block text-xs text-[#6B7280]">{timeAgo(n.createdAt)}</span>
                </span>
                {!n.read && <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#2E7D32]" aria-label="Unread" />}
              </button>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
