"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface DashboardData {
  user: { id: string; name: string; email: string; role: string; greenPoints: number; createdAt: string };
  rank: number;
  foodPosts: { id: string; title: string; createdAt: string }[];
  resourcePosts: { id: string; title: string; createdAt: string }[];
  organizedEvents: { id: string; title: string; date: string; participants: string[] }[];
  joinedEvents: { id: string; title: string; date: string }[];
  pointsHistory: { id: string; amount: number; reason: string; createdAt: string }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notLoggedIn, setNotLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/dashboard", { cache: "no-store" })
      .then(async (r) => {
        if (r.status === 401) {
          setNotLoggedIn(true);
          return null;
        }
        return r.json();
      })
      .then((d) => d && setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="mobile-page flex-1 bg-[#F7FAF7] px-4 py-6 sm:py-10">
        <p className="mx-auto max-w-4xl text-[#6B7280]">Loading dashboard...</p>
      </main>
    );
  }

  if (notLoggedIn || !data) {
    return (
      <main className="flex flex-1 items-center justify-center bg-[#F7FAF7] px-4 py-10 sm:py-16">
        <div className="rounded-2xl border border-[#E8F5E9] bg-white p-10 text-center">
          <p className="text-[#1F2937]">Please log in to view your dashboard.</p>
          <button
            onClick={() => router.push("/login")}
            className="mt-4 rounded-xl bg-[#2E7D32] px-6 py-2.5 font-semibold text-white hover:bg-[#256428]"
          >
            Go to Login
          </button>
        </div>
      </main>
    );
  }

  const { user, rank, foodPosts, resourcePosts, organizedEvents, joinedEvents, pointsHistory } = data;

  return (
    <main className="mobile-page flex-1 bg-[#F7FAF7] px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-4 rounded-2xl border border-[#E8F5E9] bg-white p-5 sm:p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1F2937]">👤 {user.name}</h1>
            <p className="text-sm text-[#6B7280]">
              {user.email} · <span className="capitalize">{user.role}</span>
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-extrabold text-[#2E7D32]">{user.greenPoints}</div>
            <div className="text-xs text-[#6B7280]">Green Points · Rank #{rank}</div>
          </div>
        </div>

        <div className="mobile-quick-actions mt-4 md:hidden">
          <Link href="/food" className="mobile-quick-action">
            <span className="mobile-quick-icon">🍛</span><span><b>Share Food</b><small>Help reduce waste</small></span>
          </Link>
          <Link href="/resources" className="mobile-quick-action">
            <span className="mobile-quick-icon">📦</span><span><b>Post an Item</b><small>Give things a second life</small></span>
          </Link>
          <Link href="/events" className="mobile-quick-action">
            <span className="mobile-quick-icon">🌳</span><span><b>Create / Join Event</b><small>Act with your community</small></span>
          </Link>
        </div>

        <div className="mobile-stat-grid mt-6 grid gap-4 sm:grid-cols-4">
          <Stat label="Food Posts" value={foodPosts.length} />
          <Stat label="Items Posted" value={resourcePosts.length} />
          <Stat label="Events Organized" value={organizedEvents.length} />
          <Stat label="Events Joined" value={joinedEvents.length} />
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <Section title="My Food Posts" emptyText="No food posts yet." href="/food">
            {foodPosts.map((p) => (
              <ListRow key={p.id} title={p.title} date={p.createdAt} />
            ))}
          </Section>

          <Section title="My Items" emptyText="No items posted yet." href="/resources">
            {resourcePosts.map((p) => (
              <ListRow key={p.id} title={p.title} date={p.createdAt} />
            ))}
          </Section>

          <Section title="Events I Organized" emptyText="No events organized yet." href="/events">
            {organizedEvents.map((e) => (
              <ListRow key={e.id} title={e.title} date={e.date} extra={`${e.participants.length} joined`} />
            ))}
          </Section>

          <Section title="Events I Joined" emptyText="You haven't joined any events yet." href="/events">
            {joinedEvents.map((e) => (
              <ListRow key={e.id} title={e.title} date={e.date} />
            ))}
          </Section>
        </div>

        <section className="mt-8">
          <h2 className="text-lg font-bold text-[#1F2937]">Green Points Activity</h2>
          <div className="mt-3 overflow-hidden rounded-2xl border border-[#E8F5E9] bg-white">
            {pointsHistory.length === 0 ? (
              <p className="p-5 text-sm text-[#6B7280]">No activity yet. Post food, items, or join an event to start earning.</p>
            ) : (
              <ul className="divide-y divide-[#E8F5E9]">
                {pointsHistory.map((tx) => (
                  <li key={tx.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                    <span className="text-[#1F2937]">{tx.reason}</span>
                    <span className="font-bold text-[#2E7D32]">+{tx.amount}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#E8F5E9] bg-white p-4 text-center">
      <div className="text-2xl font-bold text-[#1F2937]">{value}</div>
      <div className="text-xs text-[#6B7280]">{label}</div>
    </div>
  );
}

function Section({
  title,
  emptyText,
  href,
  children,
}: {
  title: string;
  emptyText: string;
  href: string;
  children: ReactNode;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <div className="rounded-2xl border border-[#E8F5E9] bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-bold text-[#1F2937]">{title}</h3>
        <Link href={href} className="text-sm font-medium text-[#2E7D32]">
          + Add
        </Link>
      </div>
      <div className="mt-3 space-y-2">
        {hasChildren ? children : <p className="text-sm text-[#6B7280]">{emptyText}</p>}
      </div>
    </div>
  );
}

function ListRow({ title, date, extra }: { title: string; date: string; extra?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
      <span className="text-[#1F2937]">{title}</span>
      <span className="text-[#6B7280]">{extra ?? new Date(date).toLocaleDateString()}</span>
    </div>
  );
}
