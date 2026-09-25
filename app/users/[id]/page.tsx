"use client";

import { useEffect, useState } from "react";
import { use as usePromise } from "react";
import Link from "next/link";
import { useUser } from "@/lib/useUser";
import { timeAgo } from "@/lib/format";
import Avatar from "@/components/Avatar";
import { RatingBadge, Stars } from "@/components/StarRating";

interface PublicProfileData {
  profile: { id: string; name: string; role: string; greenPoints: number; avatarUrl: string | null; bio: string; createdAt: string };
  stats: { completedExchanges: number; rating: { average: number | null; count: number } };
  reviews: { id: string; score: number; comment: string; createdAt: string; from: { id: string; name: string; avatarUrl: string | null } }[];
}

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const { user } = useUser();
  const [data, setData] = useState<PublicProfileData | null | "not_found">(null);

  useEffect(() => {
    fetch(`/api/users/${id}`, { cache: "no-store" })
      .then(async (r) => (r.ok ? setData(await r.json()) : setData("not_found")))
      .catch(() => setData("not_found"));
  }, [id]);

  if (id === user?.id) {
    return (
      <main className="flex flex-1 items-center justify-center bg-[#F7FAF7] px-4 py-16">
        <p className="text-[#1F2937]">
          That&apos;s you!{" "}
          <Link href="/profile" className="text-[#2E7D32] underline">
            View your own profile
          </Link>
          .
        </p>
      </main>
    );
  }

  if (data === "not_found") {
    return (
      <main className="flex flex-1 items-center justify-center bg-[#F7FAF7] px-4 py-16">
        <p className="text-[#6B7280]">This user couldn&apos;t be found.</p>
      </main>
    );
  }
  if (data === null) return <main className="flex-1 bg-[#F7FAF7] px-4 py-10" />;

  const { profile, stats, reviews } = data;

  return (
    <main className="flex-1 bg-[#F7FAF7] px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-2xl border border-[#E8F5E9] bg-white p-6">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar name={profile.name} url={profile.avatarUrl} size={72} />
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-[#1F2937]">{profile.name}</h1>
              <p className="text-sm capitalize text-[#6B7280]">{profile.role}</p>
              <div className="mt-1"><RatingBadge {...stats.rating} /></div>
            </div>
            <div className="ml-auto grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xl font-bold text-[#2E7D32]">{profile.greenPoints}</p>
                <p className="text-xs text-[#6B7280]">Green Points</p>
              </div>
              <div>
                <p className="text-xl font-bold text-[#2E7D32]">{stats.completedExchanges}</p>
                <p className="text-xs text-[#6B7280]">Completed</p>
              </div>
            </div>
          </div>
          {profile.bio && <p className="mt-4 whitespace-pre-wrap text-sm text-[#1F2937]">{profile.bio}</p>}
          <p className="mt-2 text-xs text-[#6B7280]">Member since {new Date(profile.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>
          {user && (
            <Link
              href={`/messages?to=${profile.id}`}
              className="mt-4 inline-block rounded-lg border border-[#2E7D32] px-4 py-2 text-sm font-semibold text-[#2E7D32] hover:bg-[#E8F5E9]"
            >
              💬 Message
            </Link>
          )}
        </div>

        {reviews.length > 0 && (
          <div className="rounded-2xl border border-[#E8F5E9] bg-white p-6">
            <h2 className="text-lg font-bold text-[#1F2937]">Reviews</h2>
            <div className="mt-3 space-y-3">
              {reviews.map((r) => (
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
      </div>
    </main>
  );
}
