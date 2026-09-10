"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useUser } from "@/lib/useUser";

interface EventItem {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  time: string;
  location: string;
  participants: string[];
  organizedBy: string;
  participantCount: number;
}

const categories = ["Tree Plantation", "Clean-up", "Donation Drive", "Workshop", "Other"];

export default function EventsPage() {
  const { user, refresh } = useUser();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");

  async function loadEvents() {
    setLoading(true);
    const res = await fetch("/api/events", { cache: "no-store" });
    const data = await res.json();
    setEvents(data.events ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    loadEvents();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!user) {
      setError("Please log in to create an event.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, category, date, time, location }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Could not create event. Please try again.");
      return;
    }
    setTitle("");
    setDescription("");
    setDate("");
    setTime("");
    setLocation("");
    setShowForm(false);
    await loadEvents();
    await refresh();
  }

  async function onJoin(id: string) {
    if (!user) {
      setError("Please log in to join an event.");
      return;
    }
    setError("");
    setNotice("");
    setJoiningId(id);
    const res = await fetch(`/api/events/${id}/join`, { method: "POST" });
    const data = await res.json();
    setJoiningId(null);
    if (!res.ok) {
      setNotice(data.error ?? "Could not join event.");
      return;
    }
    await loadEvents();
    await refresh();
  }

  return (
    <main className="flex-1 bg-[#F7FAF7] px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1F2937]">Community Events</h1>
            <p className="mt-1 text-[#6B7280]">Join local activities that make your community greener.</p>
          </div>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="rounded-xl bg-[#2E7D32] px-5 py-3 font-semibold text-white hover:bg-[#256428]"
          >
            + Create Event
          </button>
        </div>

        {!user && (
          <p className="mt-4 rounded-lg bg-[#E8F5E9] px-4 py-3 text-sm text-[#256428]">
            Log in to organize (+50 pts) or join (+20 pts) events.
          </p>
        )}
        {notice && <p className="mt-4 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-700">{notice}</p>}

        {showForm && (
          <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-2xl border border-[#E8F5E9] bg-white p-6">
            {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
            <div>
              <label className="mb-1 block text-sm font-medium text-[#1F2937]">Event Name</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Tree Plantation Drive"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#1F2937]">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-[#1F2937]">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#1F2937]">Location</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Community Park"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#1F2937]">Date</label>
                <input
                  required
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#1F2937]">Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#2E7D32] px-6 py-2.5 font-semibold text-white hover:bg-[#256428] disabled:opacity-60"
            >
              {submitting ? "Creating..." : "Create Event (+50 pts)"}
            </button>
          </form>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {loading ? (
            <p className="text-[#6B7280]">Loading...</p>
          ) : events.length === 0 ? (
            <p className="text-[#6B7280]">No events yet. Create the first one!</p>
          ) : (
            events.map((ev) => {
              const alreadyJoined = user ? ev.participants.includes(user.id) : false;
              return (
                <div key={ev.id} className="rounded-2xl border border-[#E8F5E9] bg-white p-5">
                  <span className="rounded-full bg-[#E8F5E9] px-3 py-1 text-xs font-semibold text-[#2E7D32]">
                    {ev.category}
                  </span>
                  <h3 className="mt-3 text-lg font-bold text-[#1F2937]">🌳 {ev.title}</h3>
                  {ev.description && <p className="mt-1 text-sm text-[#6B7280]">{ev.description}</p>}
                  <p className="mt-2 text-sm text-[#6B7280]">
                    📅 {ev.date} {ev.time}
                  </p>
                  {ev.location && <p className="text-sm text-[#6B7280]">📍 {ev.location}</p>}
                  <p className="mt-1 text-sm text-[#6B7280]">Organized by {ev.organizedBy}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-[#1F2937]">{ev.participantCount} people joined</span>
                    <button
                      onClick={() => onJoin(ev.id)}
                      disabled={alreadyJoined || joiningId === ev.id}
                      className="rounded-lg bg-[#2E7D32] px-4 py-2 text-sm font-semibold text-white hover:bg-[#256428] disabled:opacity-60"
                    >
                      {alreadyJoined ? "Joined ✓" : joiningId === ev.id ? "Joining..." : "Join Event"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
