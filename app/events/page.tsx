"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useUser } from "@/lib/useUser";
import { EVENT_CATEGORIES } from "@/lib/constants";
import ListingActions from "@/components/ListingActions";
import SearchFilters from "@/components/SearchFilters";
import LocationPicker from "@/components/LocationPicker";
import LeafletMap, { type MapMarker } from "@/components/Map";

interface EventItem {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  time: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  participants: string[];
  organizedBy: string;
  organizedById: string;
  participantCount: number;
}

export default function EventsPage() {
  const { user, refresh } = useUser();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "map">("list");
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState<{ key: string; events: EventItem[] } | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(EVENT_CATEGORIES[0]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const key = `${debouncedQuery}|${activeCategory ?? ""}|${reload}`;
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (activeCategory) params.set("category", activeCategory);
    fetch(`/api/events?${params}`, { cache: "no-store", signal: controller.signal })
      .then((r) => r.json())
      .then((data) => setResult({ key, events: data.events ?? [] }))
      .catch(() => {});
    return () => controller.abort();
  }, [key, debouncedQuery, activeCategory]);

  const loading = result?.key !== key;
  const events = result?.events ?? [];

  const markers: MapMarker[] = events
    .filter((e) => e.latitude !== null && e.longitude !== null)
    .map((e) => ({
      id: e.id,
      lat: e.latitude as number,
      lng: e.longitude as number,
      title: e.title,
      subtitle: `${e.date} ${e.time}`.trim(),
      emoji: "🌳",
    }));
  const unpinned = events.length - markers.length;

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
      body: JSON.stringify({ title, description, category, date, time, location, latitude: pin?.lat, longitude: pin?.lng }),
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
    setPin(null);
    setShowForm(false);
    setReload((n) => n + 1);
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
    setReload((n) => n + 1);
    await refresh();
  }

  const inputClass =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]";

  return (
    <main className="mobile-page flex-1 bg-[#F7FAF7] px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl text-[#1F2937]">Community Events</h1>
            <p className="mt-1 text-[#6B7280]">Join local activities that make your community greener.</p>
          </div>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="w-full rounded-xl bg-[#2E7D32] px-5 py-3 font-semibold text-white hover:bg-[#256428] sm:w-auto"
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
          <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-2xl border border-[#E8F5E9] bg-white p-4 sm:p-6">
            {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
            <div>
              <label htmlFor="ev-title" className="mb-1 block text-sm font-medium text-[#1F2937]">Event Name</label>
              <input id="ev-title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Tree Plantation Drive" className={inputClass} />
            </div>
            <div>
              <label htmlFor="ev-desc" className="mb-1 block text-sm font-medium text-[#1F2937]">Description</label>
              <textarea id="ev-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputClass} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="ev-cat" className="mb-1 block text-sm font-medium text-[#1F2937]">Category</label>
                <select id="ev-cat" value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                  {EVENT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="ev-loc" className="mb-1 block text-sm font-medium text-[#1F2937]">Location</label>
                <input id="ev-loc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Community Park" className={inputClass} />
              </div>
              <div>
                <label htmlFor="ev-date" className="mb-1 block text-sm font-medium text-[#1F2937]">Date</label>
                <input id="ev-date" required type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="ev-time" className="mb-1 block text-sm font-medium text-[#1F2937]">Time</label>
                <input id="ev-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputClass} />
              </div>
            </div>
            <LocationPicker value={pin} onChange={setPin} />
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[#2E7D32] px-6 py-2.5 font-semibold text-white hover:bg-[#256428] disabled:opacity-60 sm:w-auto"
            >
              {submitting ? "Creating..." : "Create Event (+50 pts)"}
            </button>
          </form>
        )}

        <SearchFilters
          label="Search events"
          query={query}
          onQuery={setQuery}
          placeholder="Search events by name, description or place…"
          categories={EVENT_CATEGORIES}
          active={activeCategory}
          onActive={setActiveCategory}
        />

        <div className="mt-4 inline-flex overflow-hidden rounded-lg border border-gray-200 bg-white text-sm" role="group" aria-label="View">
          {(["list", "map"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={`px-4 py-1.5 font-medium ${view === v ? "bg-[#2E7D32] text-white" : "text-[#1F2937] hover:bg-gray-50"}`}
            >
              {v === "list" ? "List" : "Map"}
            </button>
          ))}
        </div>

        {view === "map" && (
          <div className="mt-4">
            <LeafletMap markers={markers} height={420} />
            {unpinned > 0 && (
              <p className="mt-2 text-xs text-[#6B7280]">
                {unpinned} {unpinned === 1 ? "event has" : "events have"} no map pin — switch to List to see {unpinned === 1 ? "it" : "them"}.
              </p>
            )}
          </div>
        )}

        {view === "list" && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {loading && !result ? (
              <p className="text-[#6B7280]">Loading...</p>
            ) : events.length === 0 ? (
              <p className="text-[#6B7280]">
                {debouncedQuery || activeCategory ? "No events match your search." : "No events yet. Create the first one!"}
              </p>
            ) : (
              events.map((ev) => {
                const alreadyJoined = user ? ev.participants.includes(user.id) : false;
                return (
                  <div key={ev.id} className={`rounded-2xl border border-[#E8F5E9] bg-white p-4 sm:p-5 ${loading ? "opacity-60" : ""}`}>
                    <span className="rounded-full bg-[#E8F5E9] px-3 py-1 text-xs font-semibold text-[#2E7D32]">{ev.category}</span>
                    <h3 className="mt-3 text-lg font-bold text-[#1F2937]">🌳 {ev.title}</h3>
                    {ev.description && <p className="mt-1 text-sm text-[#6B7280]">{ev.description}</p>}
                    <p className="mt-2 text-sm text-[#6B7280]">
                      📅 {ev.date} {ev.time}
                    </p>
                    {ev.location && <p className="text-sm text-[#6B7280]">📍 {ev.location}</p>}
                    <p className="mt-1 text-sm text-[#6B7280]">
                      Organized by{" "}
                      <Link href={`/users/${ev.organizedById}`} className="font-medium text-[#2E7D32] hover:underline">
                        {ev.organizedBy}
                      </Link>
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-sm font-medium text-[#1F2937]">{ev.participantCount} people joined</span>
                      <button
                        onClick={() => onJoin(ev.id)}
                        disabled={alreadyJoined || joiningId === ev.id}
                        className="rounded-lg bg-[#2E7D32] px-4 py-2 text-sm font-semibold text-white hover:bg-[#256428] disabled:opacity-60"
                      >
                        {alreadyJoined ? "Joined ✓" : joiningId === ev.id ? "Joining..." : "Join Event"}
                      </button>
                    </div>
                    <ListingActions
                      itemType="event"
                      itemId={ev.id}
                      itemTitle={ev.title}
                      ownerId={ev.organizedById}
                      currentUserId={user?.id ?? null}
                      editData={{ title: ev.title, description: ev.description, category: ev.category, date: ev.date, time: ev.time, location: ev.location, latitude: ev.latitude, longitude: ev.longitude }}
                      onChanged={() => setReload((n) => n + 1)}
                    />
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </main>
  );
}
