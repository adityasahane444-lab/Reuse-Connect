"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useUser } from "@/lib/useUser";
import { BIO_MAX } from "@/lib/constants";
import { formatDateTime, timeAgo } from "@/lib/format";
import Avatar from "@/components/Avatar";
import { RatingBadge, Stars } from "@/components/StarRating";
import LoginPrompt from "@/components/LoginPrompt";

interface ProfileData {
  stats: { listings: number; completedExchanges: number; rating: { average: number | null; count: number } };
  pointsHistory: { id: string; amount: number; reason: string; createdAt: string }[];
  exchanges: { id: string; itemType: string; itemTitle: string; role: string; status: string; createdAt: string; completedAt: string | null }[];
  reviews: { id: string; score: number; comment: string; createdAt: string; from: { id: string; name: string; avatarUrl: string | null } }[];
}

export default function ProfilePage() {
  const { user, loading: userLoading, refresh } = useUser();
  const [data, setData] = useState<ProfileData | null>(null);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [uploading, setUploading] = useState(false);
  const [avatarErr, setAvatarErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/profile", { cache: "no-store" });
    if (res.ok) setData(await res.json());
  }, []);

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- seed the edit form from the freshly loaded user
    setName(user.name);
    setBio(user.bio);
    load();
  }, [user, load]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, bio }),
    });
    const body = await res.json().catch(() => ({}));
    setSavingProfile(false);
    if (!res.ok) {
      setProfileMsg({ ok: false, text: body.error ?? "Could not save." });
      return;
    }
    setProfileMsg({ ok: true, text: "Saved." });
    await refresh();
  }

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarErr("");
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/profile/avatar", { method: "POST", body: form });
    const body = await res.json().catch(() => ({}));
    setUploading(false);
    if (!res.ok) {
      setAvatarErr(body.error ?? "Could not upload photo.");
      return;
    }
    await refresh();
    if (fileRef.current) fileRef.current.value = "";
  }

  async function removeAvatar() {
    setUploading(true);
    await fetch("/api/profile/avatar", { method: "DELETE" });
    setUploading(false);
    await refresh();
  }

  if (userLoading) return <main className="flex-1 bg-[#F7FAF7] px-4 py-10" />;
  if (!user) return <LoginPrompt message="Please log in to view your profile." />;

  const inputClass =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]";

  return (
    <main className="flex-1 bg-[#F7FAF7] px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-2xl border border-[#E8F5E9] bg-white p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <Avatar name={user.name} url={user.avatarUrl} size={72} />
              <div className="flex gap-2 text-xs">
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="text-[#2E7D32] hover:underline disabled:opacity-60"
                >
                  {uploading ? "…" : "Change"}
                </button>
                {user.avatarUrl && (
                  <button onClick={removeAvatar} disabled={uploading} className="text-red-600 hover:underline disabled:opacity-60">
                    Remove
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onAvatarChange} className="hidden" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-[#1F2937]">{user.name}</h1>
              <p className="text-sm text-[#6B7280]">{user.email}</p>
              <p className="mt-1 text-sm capitalize text-[#6B7280]">{user.role}</p>
              {data && <div className="mt-1"><RatingBadge {...data.stats.rating} /></div>}
            </div>
            <div className="ml-auto grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xl font-bold text-[#2E7D32]">{user.greenPoints}</p>
                <p className="text-xs text-[#6B7280]">Green Points</p>
              </div>
              <div>
                <p className="text-xl font-bold text-[#2E7D32]">{data?.stats.listings ?? "–"}</p>
                <p className="text-xs text-[#6B7280]">Listings</p>
              </div>
              <div>
                <p className="text-xl font-bold text-[#2E7D32]">{data?.stats.completedExchanges ?? "–"}</p>
                <p className="text-xs text-[#6B7280]">Completed</p>
              </div>
            </div>
          </div>
          {avatarErr && <p className="mt-2 text-xs text-red-600">{avatarErr}</p>}

          <form onSubmit={saveProfile} className="mt-6 space-y-3 border-t border-[#E8F5E9] pt-4">
            {profileMsg && (
              <p className={`rounded-md px-3 py-1.5 text-xs ${profileMsg.ok ? "bg-[#E8F5E9] text-[#256428]" : "bg-red-50 text-red-700"}`}>
                {profileMsg.text}
              </p>
            )}
            <div>
              <label htmlFor="p-name" className="mb-1 block text-sm font-medium text-[#1F2937]">Name</label>
              <input id="p-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className={inputClass} />
            </div>
            <div>
              <label htmlFor="p-bio" className="mb-1 block text-sm font-medium text-[#1F2937]">
                Bio <span className="font-normal text-[#6B7280]">({bio.length}/{BIO_MAX})</span>
              </label>
              <textarea id="p-bio" value={bio} onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))} rows={3} className={inputClass} />
            </div>
            <button
              type="submit"
              disabled={savingProfile}
              className="rounded-lg bg-[#2E7D32] px-4 py-2 text-sm font-semibold text-white hover:bg-[#256428] disabled:opacity-60"
            >
              {savingProfile ? "Saving…" : "Save profile"}
            </button>
          </form>
        </div>

        {data && data.reviews.length > 0 && (
          <div className="rounded-2xl border border-[#E8F5E9] bg-white p-6">
            <h2 className="text-lg font-bold text-[#1F2937]">Reviews</h2>
            <div className="mt-3 space-y-3">
              {data.reviews.map((r) => (
                <div key={r.id} className="flex gap-3 border-b border-gray-50 pb-3 last:border-b-0 last:pb-0">
                  <Avatar name={r.from.name} url={r.from.avatarUrl} size={32} />
                  <div>
                    <p className="text-sm font-medium text-[#1F2937]">
                      {r.from.name} <Stars value={r.score} />
                    </p>
                    {r.comment && <p className="text-sm text-[#6B7280]">{r.comment}</p>}
                    <p className="text-xs text-[#6B7280]">{timeAgo(r.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data && data.exchanges.length > 0 && (
          <div className="rounded-2xl border border-[#E8F5E9] bg-white p-6">
            <h2 className="text-lg font-bold text-[#1F2937]">Exchange history</h2>
            <ul className="mt-3 divide-y divide-gray-50">
              {data.exchanges.map((e) => (
                <li key={e.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-[#1F2937]">
                    {e.itemType === "food" ? "🍛" : "📦"} {e.itemTitle} <span className="text-[#6B7280]">· you {e.role === "giver" ? "gave" : "received"}</span>
                  </span>
                  <span className="capitalize text-[#6B7280]">{e.status}</span>
                </li>
              ))}
            </ul>
            <Link href="/requests" className="mt-2 inline-block text-sm text-[#2E7D32] hover:underline">Manage exchanges →</Link>
          </div>
        )}

        {data && data.pointsHistory.length > 0 && (
          <div className="rounded-2xl border border-[#E8F5E9] bg-white p-6">
            <h2 className="text-lg font-bold text-[#1F2937]">Recent Green Points</h2>
            <ul className="mt-3 divide-y divide-gray-50">
              {data.pointsHistory.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-[#1F2937]">{p.reason}</span>
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-[#2E7D32]">+{p.amount}</span>
                    <span className="text-xs text-[#6B7280]" title={formatDateTime(p.createdAt)}>{timeAgo(p.createdAt)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
