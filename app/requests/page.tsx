"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/lib/useUser";
import { timeAgo } from "@/lib/format";
import { pingActivity } from "@/lib/useActivity";
import Avatar from "@/components/Avatar";
import LoginPrompt from "@/components/LoginPrompt";
import { StarInput, Stars } from "@/components/StarRating";

interface ExchangeRequest {
  id: string;
  itemType: "food" | "resource";
  itemId: string;
  itemTitle: string;
  status: "pending" | "accepted" | "declined" | "cancelled" | "completed";
  message: string;
  createdAt: string;
  completedAt: string | null;
  other: { id: string; name: string; avatarUrl: string | null };
  myRating: number | null;
}

const STATUS_STYLE: Record<ExchangeRequest["status"], string> = {
  pending: "bg-amber-50 text-amber-700",
  accepted: "bg-[#E8F5E9] text-[#256428]",
  completed: "bg-blue-50 text-blue-700",
  declined: "bg-gray-100 text-[#6B7280]",
  cancelled: "bg-gray-100 text-[#6B7280]",
};

export default function RequestsPage() {
  const { user, loading: userLoading, refresh } = useUser();
  const [tab, setTab] = useState<"incoming" | "outgoing">("incoming");
  const [data, setData] = useState<{ incoming: ExchangeRequest[]; outgoing: ExchangeRequest[] } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [rating, setRating] = useState<Record<string, { score: number; comment: string }>>({});

  const load = useCallback(async () => {
    const res = await fetch("/api/requests", { cache: "no-store" });
    if (res.ok) setData(await res.json());
  }, []);

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch once we know who's logged in
    load();
  }, [user, load]);

  async function act(id: string, action: "accept" | "decline" | "cancel" | "complete") {
    setBusyId(id);
    setError("");
    const res = await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const body = await res.json().catch(() => ({}));
    setBusyId(null);
    if (!res.ok) setError(body.error ?? "Something went wrong.");
    await load();
    pingActivity();
    await refresh();
  }

  async function submitRating(id: string) {
    const r = rating[id];
    if (!r?.score) {
      setError("Pick a star rating first.");
      return;
    }
    setBusyId(id);
    setError("");
    const res = await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: id, score: r.score, comment: r.comment }),
    });
    const body = await res.json().catch(() => ({}));
    setBusyId(null);
    if (!res.ok) setError(body.error ?? "Could not save your rating.");
    await load();
  }

  if (userLoading) return <main className="flex-1 bg-[#F7FAF7] px-4 py-6 sm:py-10" />;
  if (!user) return <LoginPrompt message="Please log in to manage your exchanges." />;

  const list = data?.[tab] ?? [];
  const pendingIncoming = data?.incoming.filter((r) => r.status === "pending").length ?? 0;

  const btn = "rounded-md px-3 py-1.5 text-sm font-semibold disabled:opacity-60";

  return (
    <main className="flex-1 bg-[#F7FAF7] px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold sm:text-3xl text-[#1F2937]">My exchanges</h1>
        <p className="mt-1 text-[#6B7280]">Requests for your listings, and requests you&apos;ve made.</p>

        <div className="mt-6 flex w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-sm sm:inline-flex sm:w-auto" role="tablist">
          {(["incoming", "outgoing"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`min-w-0 flex-1 px-3 py-2 text-xs font-medium sm:flex-none sm:px-5 sm:text-sm ${tab === t ? "bg-[#2E7D32] text-white" : "text-[#1F2937] hover:bg-gray-50"}`}
            >
              {t === "incoming" ? `Requests for my items${pendingIncoming ? ` (${pendingIncoming})` : ""}` : "My requests"}
            </button>
          ))}
        </div>

        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

        <div className="mt-6 space-y-4">
          {data === null ? (
            <p className="text-[#6B7280]">Loading…</p>
          ) : list.length === 0 ? (
            <p className="rounded-2xl border border-[#E8F5E9] bg-white p-5 text-center sm:p-8 text-[#6B7280]">
              {tab === "incoming" ? (
                <>No one has requested your items yet.</>
              ) : (
                <>
                  You haven&apos;t requested anything yet. Browse{" "}
                  <Link href="/food" className="text-[#2E7D32] underline">food</Link> or{" "}
                  <Link href="/resources" className="text-[#2E7D32] underline">resources</Link>.
                </>
              )}
            </p>
          ) : (
            list.map((r) => {
              const isOwner = tab === "incoming";
              const busy = busyId === r.id;
              const draft = rating[r.id] ?? { score: 0, comment: "" };
              return (
                <div key={r.id} className="rounded-2xl border border-[#E8F5E9] bg-white p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <Avatar name={r.other.name} url={r.other.avatarUrl} size={40} />
                      <div>
                        <p className="font-semibold text-[#1F2937]">
                          {r.itemType === "food" ? "🍛" : "📦"} {r.itemTitle}
                        </p>
                        <p className="text-sm text-[#6B7280]">
                          {isOwner ? "Requested by" : "Posted by"}{" "}
                          <Link href={`/users/${r.other.id}`} className="font-medium text-[#2E7D32] hover:underline">
                            {r.other.name}
                          </Link>{" "}
                          · {timeAgo(r.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                  </div>

                  {r.message && <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-[#1F2937]">“{r.message}”</p>}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {isOwner && r.status === "pending" && (
                      <>
                        <button disabled={busy} onClick={() => act(r.id, "accept")} className={`${btn} bg-[#2E7D32] text-white hover:bg-[#256428]`}>
                          Accept
                        </button>
                        <button disabled={busy} onClick={() => act(r.id, "decline")} className={`${btn} border border-gray-300 text-[#1F2937] hover:bg-gray-50`}>
                          Decline
                        </button>
                      </>
                    )}
                    {!isOwner && (r.status === "pending" || r.status === "accepted") && (
                      <button disabled={busy} onClick={() => act(r.id, "cancel")} className={`${btn} border border-gray-300 text-[#1F2937] hover:bg-gray-50`}>
                        Cancel request
                      </button>
                    )}
                    {r.status === "accepted" && (
                      <>
                        <button disabled={busy} onClick={() => act(r.id, "complete")} className={`${btn} bg-[#2E7D32] text-white hover:bg-[#256428]`}>
                          Mark handover complete
                        </button>
                        <Link href={`/messages?to=${r.other.id}&about=${encodeURIComponent(r.itemTitle)}`} className={`${btn} border border-[#2E7D32] text-[#2E7D32] hover:bg-[#E8F5E9]`}>
                          💬 Arrange pickup
                        </Link>
                      </>
                    )}
                    {r.status === "pending" && isOwner && (
                      <Link href={`/messages?to=${r.other.id}&about=${encodeURIComponent(r.itemTitle)}`} className={`${btn} text-[#2E7D32] hover:bg-[#E8F5E9]`}>
                        💬 Message
                      </Link>
                    )}
                  </div>

                  {r.status === "completed" && (
                    <div className="mt-4 border-t border-[#E8F5E9] pt-4">
                      {r.myRating !== null ? (
                        <p className="flex items-center gap-2 text-sm text-[#6B7280]">
                          You rated {r.other.name}: <Stars value={r.myRating} />
                        </p>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-[#1F2937]">How did the handover go with {r.other.name}?</p>
                          <StarInput value={draft.score} onChange={(score) => setRating((s) => ({ ...s, [r.id]: { ...draft, score } }))} />
                          <textarea
                            value={draft.comment}
                            onChange={(e) => setRating((s) => ({ ...s, [r.id]: { ...draft, comment: e.target.value } }))}
                            maxLength={300}
                            rows={2}
                            placeholder="Optional comment (be kind and specific)"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                          />
                          <button disabled={busy} onClick={() => submitRating(r.id)} className={`${btn} bg-[#2E7D32] text-white hover:bg-[#256428]`}>
                            Submit rating
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
