"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/useUser";

interface LeaderboardEntry {
  id: string;
  name: string;
  role: string;
  greenPoints: number;
}

const pointsTable = [
  { action: "Post Surplus Food", points: 50 },
  { action: "Donate / Post an Item", points: 30 },
  { action: "Organize an Event", points: 50 },
  { action: "Join an Event", points: 20 },
];

const medals = ["🥇", "🥈", "🥉"];

export default function RewardsPage() {
  const { user } = useUser();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setLeaderboard(d.leaderboard ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="flex-1 bg-[#F7FAF7] px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl bg-[#2E7D32] px-5 py-8 sm:px-8 sm:py-12 text-center text-white shadow-xl">
          <div className="text-5xl">🌱</div>
          <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-green-100">Green Score</p>
          <div className="mt-1 text-4xl font-extrabold sm:text-5xl">{user ? user.greenPoints : "—"}</div>
          <p className="mt-3 text-green-50">
            {user ? "You're doing great! Keep reusing and helping your community." : "Log in to see your Green Score."}
          </p>
        </div>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-[#1F2937]">How you earn Green Points</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {pointsTable.map((p) => (
              <div
                key={p.action}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E8F5E9] bg-white px-4 py-3"
              >
                <span className="text-sm font-medium text-[#1F2937]">{p.action}</span>
                <span className="rounded-full bg-[#E8F5E9] px-3 py-1 text-sm font-bold text-[#2E7D32]">
                  +{p.points}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-[#1F2937]">🏆 Green Champions</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-[#E8F5E9] bg-white">
            {loading ? (
              <p className="p-6 text-[#6B7280]">Loading leaderboard...</p>
            ) : leaderboard.length === 0 ? (
              <p className="p-6 text-[#6B7280]">No one has earned Green Points yet. Be the first!</p>
            ) : (
              <table className="w-full min-w-[34rem] text-left text-sm">
                <thead className="bg-[#E8F5E9] text-[#256428]">
                  <tr>
                    <th className="px-4 py-3">Rank</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3 text-right">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, i) => (
                    <tr key={entry.id} className={`border-t border-[#E8F5E9] ${user?.id === entry.id ? "bg-[#E8F5E9]/60" : ""}`}>
                      <td className="px-4 py-3 font-semibold">{medals[i] ?? i + 1}</td>
                      <td className="px-4 py-3 font-medium text-[#1F2937]">{entry.name}</td>
                      <td className="px-4 py-3 capitalize text-[#6B7280]">{entry.role}</td>
                      <td className="px-4 py-3 text-right font-bold text-[#2E7D32]">{entry.greenPoints.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
