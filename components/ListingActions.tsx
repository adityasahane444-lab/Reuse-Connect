"use client";

import { useState } from "react";
import Link from "next/link";
import { REPORT_REASONS, type ReportItemType } from "@/lib/constants";
import EditListing, { type ListingEditData } from "./EditListing";

interface Props {
  itemType: ReportItemType;
  itemId: string;
  itemTitle: string;
  ownerId: string;
  currentUserId: string | null;
  /** Listing status: available | reserved | completed (events have none). */
  status?: string;
  /** My own live request on this listing, if any. */
  myRequest?: string | null;
  onRequested?: () => void;
  editData?: ListingEditData;
  onChanged?: (deleted?: boolean) => void;
}

/** Request / Message / Report controls shown on every listing and event card. */
export default function ListingActions({
  itemType,
  itemId,
  itemTitle,
  ownerId,
  currentUserId,
  status,
  myRequest,
  onRequested,
  editData,
  onChanged,
}: Props) {
  const [mode, setMode] = useState<"none" | "request" | "report">("none");
  const [note, setNote] = useState("");
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [editing, setEditing] = useState(false);

  const isOwner = currentUserId === ownerId;
  const canRequest = itemType !== "event";

  async function send(url: string, body: unknown, success: string) {
    setBusy(true);
    setFeedback(null);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setFeedback({ ok: false, text: data.error ?? "Something went wrong." });
      return false;
    }
    setFeedback({ ok: true, text: success });
    setMode("none");
    return true;
  }

  async function submitRequest() {
    const ok = await send("/api/requests", { itemType, itemId, message: note }, "Request sent! You'll be notified when they respond.");
    if (ok) {
      setNote("");
      onRequested?.();
    }
  }

  async function submitReport() {
    await send("/api/reports", { itemType, itemId, reason }, "Thanks — moderators will review this post.");
  }

  if (!currentUserId) {
    return (
      <p className="mt-4 text-sm text-[#6B7280]">
        <Link href="/login" className="font-medium text-[#2E7D32] hover:underline">
          Log in
        </Link>{" "}
        to {canRequest ? "request this or " : ""}message the poster.
      </p>
    );
  }

  const messageHref = `/messages?to=${ownerId}&about=${encodeURIComponent(itemTitle)}`;

  return (
    <div className="mt-4 border-t border-[#E8F5E9] pt-3">
      {isOwner ? (
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs text-[#6B7280]">
          This is your post.{" "}
          {canRequest && (
            <Link href="/requests" className="text-[#2E7D32] hover:underline">
              Manage requests
            </Link>
          )}
          </p>
          {editData && <button onClick={() => setEditing(true)} className="rounded-lg border border-[#2E7D32] px-3 py-1.5 text-xs font-semibold text-[#2E7D32] hover:bg-[#E8F5E9]">✏️ Edit</button>}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {canRequest &&
            (myRequest === "accepted" ? (
              <Link href={messageHref} className="rounded-lg bg-[#2E7D32] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#256428]">
                Accepted — arrange pickup
              </Link>
            ) : myRequest === "pending" ? (
              <span className="rounded-lg bg-[#E8F5E9] px-3 py-1.5 text-sm font-medium text-[#256428]">Request sent ✓</span>
            ) : status && status !== "available" ? (
              <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-[#6B7280]">
                {status === "reserved" ? "Reserved" : "Taken"}
              </span>
            ) : (
              <button
                onClick={() => setMode(mode === "request" ? "none" : "request")}
                className="rounded-lg bg-[#2E7D32] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#256428]"
              >
                Request
              </button>
            ))}
          <Link href={messageHref} className="rounded-lg border border-[#2E7D32] px-3 py-1.5 text-sm text-[#2E7D32] hover:bg-[#E8F5E9]">
            💬 Message
          </Link>
          <button
            onClick={() => setMode(mode === "report" ? "none" : "report")}
            aria-label="Report this post"
            title="Report this post"
            className="ml-auto rounded-lg px-2 py-1.5 text-sm text-[#6B7280] hover:bg-gray-100"
          >
            🚩
          </button>
        </div>
      )}

      {mode === "request" && (
        <div className="mt-3 space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={300}
            rows={2}
            placeholder="Optional note, e.g. when you're free to pick up"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
          />
          <div className="flex gap-2">
            <button
              onClick={submitRequest}
              disabled={busy}
              className="rounded-md bg-[#2E7D32] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#256428] disabled:opacity-60"
            >
              {busy ? "Sending…" : "Send request"}
            </button>
            <button onClick={() => setMode("none")} className="rounded-md px-3 py-1.5 text-sm text-[#6B7280] hover:bg-gray-100">
              Cancel
            </button>
          </div>
        </div>
      )}

      {mode === "report" && (
        <div className="mt-3 space-y-2">
          <label className="block text-xs font-medium text-[#1F2937]" htmlFor={`report-${itemId}`}>
            Why are you reporting this?
          </label>
          <select
            id={`report-${itemId}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
          >
            {REPORT_REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={submitReport}
              disabled={busy}
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {busy ? "Sending…" : "Submit report"}
            </button>
            <button onClick={() => setMode("none")} className="rounded-md px-3 py-1.5 text-sm text-[#6B7280] hover:bg-gray-100">
              Cancel
            </button>
          </div>
        </div>
      )}

      {editing && editData && <EditListing itemType={itemType} itemId={itemId} initial={editData} onCancel={() => setEditing(false)} onDone={(deleted) => { setEditing(false); setFeedback({ ok: true, text: deleted ? "Post deleted." : "Changes saved." }); onChanged?.(deleted); }} />}

      {feedback && (
        <p
          role="status"
          className={`mt-2 rounded-md px-3 py-1.5 text-xs ${feedback.ok ? "bg-[#E8F5E9] text-[#256428]" : "bg-red-50 text-red-700"}`}
        >
          {feedback.text}
        </p>
      )}
    </div>
  );
}
