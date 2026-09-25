"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { timeAgo } from "@/lib/format";
import { pingActivity } from "@/lib/useActivity";
import { useDismiss } from "@/lib/useDismiss";

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: string;
}

export const NOTIFICATION_ICONS: Record<string, string> = {
  request_received: "📥",
  request_accepted: "✅",
  request_declined: "🚫",
  request_cancelled: "↩️",
  request_completed: "🎉",
  rating_received: "⭐",
  event_joined: "🌳",
  food_expiring: "⏰",
  post_removed: "🛑",
};

export default function NotificationBell({ unread }: { unread: number }) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[] | null>(null);

  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      const res = await fetch("/api/notifications?limit=8", { cache: "no-store" });
      if (res.ok) setItems((await res.json()).notifications);
      pingActivity(); // the fetch above may have created expiry alerts
    }
  }

  async function markRead(ids: string[] | "all") {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ids === "all" ? { all: true } : { ids }),
    });
    setItems((prev) => prev?.map((n) => (ids === "all" || ids.includes(n.id) ? { ...n, read: true } : n)) ?? prev);
    pingActivity();
  }

  function openItem(n: NotificationItem) {
    setOpen(false);
    if (!n.read) markRead([n.id]);
    if (n.link) router.push(n.link);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        aria-haspopup="true"
        className="relative rounded-full p-2 text-lg hover:bg-[#E8F5E9]"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 max-w-[calc(100vw-1.5rem)] rounded-xl border border-[#E8F5E9] bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-[#E8F5E9] px-4 py-2.5">
            <span className="text-sm font-semibold text-[#1F2937]">Notifications</span>
            {unread > 0 && (
              <button onClick={() => markRead("all")} className="text-xs text-[#2E7D32] hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items === null ? (
              <p className="px-4 py-6 text-center text-sm text-[#6B7280]">Loading…</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-[#6B7280]">You&apos;re all caught up.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => openItem(n)}
                  className={`flex w-full gap-3 border-b border-gray-50 px-4 py-3 text-left hover:bg-gray-50 ${n.read ? "" : "bg-[#F1F8F2]"}`}
                >
                  <span aria-hidden="true">{NOTIFICATION_ICONS[n.type] ?? "🔔"}</span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm ${n.read ? "text-[#1F2937]" : "font-semibold text-[#1F2937]"}`}>{n.title}</span>
                    {n.body && <span className="block truncate text-xs text-[#6B7280]">{n.body}</span>}
                    <span className="block text-xs text-[#6B7280]">{timeAgo(n.createdAt)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
          <Link
            href="/notifications"
            onClick={close}
            className="block border-t border-[#E8F5E9] px-4 py-2.5 text-center text-sm font-medium text-[#2E7D32] hover:bg-gray-50"
          >
            View all
          </Link>
        </div>
      )}
    </div>
  );
}
