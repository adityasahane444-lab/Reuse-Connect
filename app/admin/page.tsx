"use client";

import { useCallback, useEffect, useState } from "react";
import { useUser } from "@/lib/useUser";
import { timeAgo } from "@/lib/format";
import LoginPrompt from "@/components/LoginPrompt";

interface Stats {
  users: number;
  bannedUsers: number;
  newUsersThisWeek: number;
  foodPosts: number;
  resourcePosts: number;
  events: number;
  pendingRequests: number;
  openReports: number;
  impact: { itemsDiverted: number; foodShared: number; resourcesReused: number };
}
interface Report {
  id: string;
  itemType: "food" | "resource" | "event";
  itemTitle: string;
  itemDescription: string;
  itemExists: boolean;
  reason: string;
  status: string;
  createdAt: string;
  reporter: { id: string; name: string };
  owner: { id: string; name: string; isBanned: boolean; isAdmin: boolean } | null;
}
interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  greenPoints: number;
  isAdmin: boolean;
  isBanned: boolean;
  createdAt: string;
}

const ITEM_EMOJI: Record<Report["itemType"], string> = { food: "🍛", resource: "📦", event: "🌳" };

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-[#E8F5E9] bg-white p-4 text-center">
      <p className="text-2xl font-bold text-[#2E7D32]">{value}</p>
      <p className="text-xs text-[#6B7280]">{label}</p>
    </div>
  );
}

export default function AdminPage() {
  const { user, loading: userLoading } = useUser();
  const [tab, setTab] = useState<"reports" | "users">("reports");
  const [stats, setStats] = useState<Stats | null>(null);
  const [reports, setReports] = useState<Report[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [userQuery, setUserQuery] = useState("");
  const [users, setUsers] = useState<AdminUser[] | null>(null);

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/admin/stats", { cache: "no-store" });
    if (res.ok) setStats(await res.json());
  }, []);
  const loadReports = useCallback(async () => {
    const res = await fetch("/api/admin/reports?status=open", { cache: "no-store" });
    if (res.ok) setReports((await res.json()).reports);
  }, []);
  const loadUsers = useCallback(async (q: string) => {
    const res = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}`, { cache: "no-store" });
    if (res.ok) setUsers((await res.json()).users);
  }, []);

  useEffect(() => {
    if (!user?.isAdmin) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch once admin status is known
    loadStats();
    loadReports();
    loadUsers("");
  }, [user, loadStats, loadReports, loadUsers]);

  async function actOnReport(id: string, action: "dismiss" | "remove" | "remove_and_ban") {
    if (action === "remove_and_ban" && !confirm("Remove this post and suspend the poster's account?")) return;
    setBusyId(id);
    setError("");
    const res = await fetch(`/api/admin/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const body = await res.json().catch(() => ({}));
    setBusyId(null);
    if (!res.ok) {
      setError(body.error ?? "Something went wrong.");
      return;
    }
    await Promise.all([loadReports(), loadStats()]);
  }

  async function toggleBan(u: AdminUser) {
    if (!u.isBanned && !confirm(`Suspend ${u.name}'s account?`)) return;
    setBusyId(u.id);
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: u.isBanned ? "unban" : "ban" }),
    });
    setBusyId(null);
    if (res.ok) await loadUsers(userQuery);
  }

  if (userLoading) return <main className="mobile-page flex-1 bg-[#F7FAF7] px-4 py-6 sm:py-10" />;
  if (!user) return <LoginPrompt message="Please log in." />;
  if (!user.isAdmin) {
    return (
      <main className="flex flex-1 items-center justify-center bg-[#F7FAF7] px-4 py-10 sm:py-16">
        <p className="text-[#6B7280]">This page is for moderators only.</p>
      </main>
    );
  }

  return (
    <main className="mobile-page flex-1 bg-[#F7FAF7] px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold sm:text-3xl text-[#1F2937]">Admin dashboard</h1>

        {stats && (
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            <StatCard label="Users" value={stats.users} />
            <StatCard label="Food posts" value={stats.foodPosts} />
            <StatCard label="Resource posts" value={stats.resourcePosts} />
            <StatCard label="Events" value={stats.events} />
            <StatCard label="Items diverted from landfill" value={stats.impact.itemsDiverted} />
            <StatCard label="Pending requests" value={stats.pendingRequests} />
            <StatCard label="Open reports" value={stats.openReports} />
            <StatCard label="Suspended users" value={stats.bannedUsers} />
          </div>
        )}

        <div className="mt-6 flex w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-sm sm:inline-flex sm:w-auto" role="tablist">
          {(["reports", "users"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`min-w-0 flex-1 px-3 py-2 text-xs font-medium sm:flex-none sm:px-5 sm:text-sm ${tab === t ? "bg-[#2E7D32] text-white" : "text-[#1F2937] hover:bg-gray-50"}`}
            >
              {t === "reports" ? `Flagged posts${stats ? ` (${stats.openReports})` : ""}` : "Users"}
            </button>
          ))}
        </div>

        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

        {tab === "reports" && (
          <div className="mt-6 space-y-4">
            {reports === null ? (
              <p className="text-[#6B7280]">Loading…</p>
            ) : reports.length === 0 ? (
              <p className="rounded-2xl border border-[#E8F5E9] bg-white p-5 text-center sm:p-8 text-[#6B7280]">No open reports. 🎉</p>
            ) : (
              reports.map((r) => {
                const busy = busyId === r.id;
                return (
                  <div key={r.id} className="rounded-2xl border border-[#E8F5E9] bg-white p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-[#1F2937]">
                          {ITEM_EMOJI[r.itemType]} {r.itemTitle}
                          {!r.itemExists && <span className="ml-2 text-xs font-normal text-[#6B7280]">(already removed)</span>}
                        </p>
                        {r.itemDescription && <p className="mt-1 text-sm text-[#6B7280]">{r.itemDescription}</p>}
                        <p className="mt-1 text-sm text-[#1F2937]">Reason: {r.reason}</p>
                        <p className="text-xs text-[#6B7280]">
                          Reported by {r.reporter.name} · {timeAgo(r.createdAt)}
                          {r.owner && ` · Posted by ${r.owner.name}${r.owner.isBanned ? " (suspended)" : ""}`}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button disabled={busy} onClick={() => actOnReport(r.id, "dismiss")} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-[#1F2937] hover:bg-gray-50 disabled:opacity-60">
                        Dismiss
                      </button>
                      {r.itemExists && (
                        <button disabled={busy} onClick={() => actOnReport(r.id, "remove")} className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60">
                          Remove post
                        </button>
                      )}
                      {r.owner && !r.owner.isAdmin && !r.owner.isBanned && (
                        <button disabled={busy} onClick={() => actOnReport(r.id, "remove_and_ban")} className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                          Remove & suspend user
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === "users" && (
          <div className="mt-6">
            <input
              value={userQuery}
              onChange={(e) => {
                setUserQuery(e.target.value);
                loadUsers(e.target.value);
              }}
              placeholder="Search by name or email…"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
            />
            <div className="mt-4 overflow-hidden rounded-2xl border border-[#E8F5E9] bg-white">
              {users === null ? (
                <p className="p-6 text-[#6B7280]">Loading…</p>
              ) : users.length === 0 ? (
                <p className="p-6 text-[#6B7280]">No users found.</p>
              ) : (
                users.map((u) => (
                  <div key={u.id} className="flex flex-col gap-3 border-b border-gray-50 px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#1F2937]">
                        {u.name} {u.isAdmin && <span className="text-xs text-[#2E7D32]">· admin</span>} {u.isBanned && <span className="text-xs text-red-600">· suspended</span>}
                      </p>
                      <p className="truncate text-xs text-[#6B7280]">{u.email} · {u.greenPoints} pts · joined {timeAgo(u.createdAt)}</p>
                    </div>
                    {!u.isAdmin && (
                      <button
                        disabled={busyId === u.id}
                        onClick={() => toggleBan(u)}
                        className={`self-start rounded-md border px-3 py-1.5 text-xs font-semibold disabled:opacity-60 sm:self-auto ${
                          u.isBanned ? "border-[#2E7D32] text-[#2E7D32] hover:bg-[#E8F5E9]" : "border-red-300 text-red-700 hover:bg-red-50"
                        }`}
                      >
                        {u.isBanned ? "Unsuspend" : "Suspend"}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
