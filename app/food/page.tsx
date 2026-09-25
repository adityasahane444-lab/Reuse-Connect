"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useUser } from "@/lib/useUser";
import { useMyRequests } from "@/lib/useMyRequests";
import { FOOD_CATEGORIES } from "@/lib/constants";
import { formatDateTime, formatKm, haversineKm, localInputToIso } from "@/lib/format";
import ListingActions from "@/components/ListingActions";
import SearchFilters from "@/components/SearchFilters";
import LocationPicker from "@/components/LocationPicker";
import LeafletMap, { type MapMarker } from "@/components/Map";
import { RatingBadge } from "@/components/StarRating";

interface FoodPost {
  id: string;
  title: string;
  description: string;
  category: string;
  quantity: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  expiresAt: string | null;
  status: string;
  postedBy: string;
  postedById: string;
  posterRating: { average: number | null; count: number };
  createdAt: string;
}

export default function FoodPage() {
  const { user, refresh } = useUser();
  const { active: myRequests, refresh: refreshRequests } = useMyRequests(Boolean(user));

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "map">("list");
  const [myPos, setMyPos] = useState<{ lat: number; lng: number } | null>(null);
  const [locNote, setLocNote] = useState("");

  const [reload, setReload] = useState(0);
  const [result, setResult] = useState<{ key: string; posts: FoodPost[] } | null>(null);
  const [now] = useState(() => Date.now());

  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(FOOD_CATEGORIES[0]);
  const [quantity, setQuantity] = useState("");
  const [location, setLocation] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
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
    fetch(`/api/food?${params}`, { cache: "no-store", signal: controller.signal })
      .then((r) => r.json())
      .then((data) => setResult({ key, posts: data.posts ?? [] }))
      .catch(() => {});
    return () => controller.abort();
  }, [key, debouncedQuery, activeCategory]);

  const loading = result?.key !== key;
  const posts = useMemo(() => {
    const list = result?.posts ?? [];
    if (!myPos) return list;
    const dist = (p: FoodPost) =>
      p.latitude !== null && p.longitude !== null ? haversineKm(myPos.lat, myPos.lng, p.latitude, p.longitude) : Infinity;
    return [...list].sort((a, b) => dist(a) - dist(b));
  }, [result, myPos]);

  const markers: MapMarker[] = posts
    .filter((p) => p.latitude !== null && p.longitude !== null)
    .map((p) => ({
      id: p.id,
      lat: p.latitude as number,
      lng: p.longitude as number,
      title: p.title,
      subtitle: [p.quantity, p.location].filter(Boolean).join(" · "),
      emoji: "🍛",
    }));
  const unpinned = posts.length - markers.length;

  function sortNearest() {
    setLocNote("");
    if (myPos) {
      setMyPos(null);
      return;
    }
    if (!navigator.geolocation) {
      setLocNote("Your browser doesn't support location.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setMyPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocNote("Couldn't get your location. Check your browser's location permission."),
      { timeout: 8000 }
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!user) {
      setError("Please log in to post food.");
      return;
    }
    const expiresIso = localInputToIso(expiresAt);
    setSubmitting(true);
    const res = await fetch("/api/food", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        category,
        quantity,
        location,
        expiresAt: expiresIso,
        latitude: pin?.lat,
        longitude: pin?.lng,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Could not post. Please try again.");
      return;
    }
    setTitle("");
    setDescription("");
    setQuantity("");
    setLocation("");
    setExpiresAt("");
    setPin(null);
    setShowForm(false);
    setReload((n) => n + 1);
    await refresh();
  }

  const inputClass =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]";

  return (
    <main className="flex-1 bg-[#F7FAF7] px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1F2937]">Food Reuse</h1>
            <p className="mt-1 text-[#6B7280]">Share surplus food with people who need it.</p>
          </div>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="rounded-xl bg-[#2E7D32] px-5 py-3 font-semibold text-white hover:bg-[#256428]"
          >
            + Post Food
          </button>
        </div>

        {!user && (
          <p className="mt-4 rounded-lg bg-[#E8F5E9] px-4 py-3 text-sm text-[#256428]">
            Log in to post food and earn 50 Green Points per post.
          </p>
        )}

        {showForm && (
          <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-2xl border border-[#E8F5E9] bg-white p-6">
            {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
            <div>
              <label htmlFor="food-title" className="mb-1 block text-sm font-medium text-[#1F2937]">Title</label>
              <input id="food-title" required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Veg Biryani" className={inputClass} />
            </div>
            <div>
              <label htmlFor="food-desc" className="mb-1 block text-sm font-medium text-[#1F2937]">Description</label>
              <textarea id="food-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={1000} className={inputClass} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="food-cat" className="mb-1 block text-sm font-medium text-[#1F2937]">Category</label>
                <select id="food-cat" value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                  {FOOD_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="food-qty" className="mb-1 block text-sm font-medium text-[#1F2937]">Available</label>
                <input id="food-qty" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="e.g. 10 portions" className={inputClass} />
              </div>
              <div>
                <label htmlFor="food-loc" className="mb-1 block text-sm font-medium text-[#1F2937]">Location</label>
                <input id="food-loc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Kothrud, Pune" className={inputClass} />
              </div>
              <div>
                <label htmlFor="food-exp" className="mb-1 block text-sm font-medium text-[#1F2937]">Best before (optional)</label>
                <input id="food-exp" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className={inputClass} />
              </div>
            </div>
            <LocationPicker value={pin} onChange={setPin} />
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#2E7D32] px-6 py-2.5 font-semibold text-white hover:bg-[#256428] disabled:opacity-60"
            >
              {submitting ? "Posting..." : "Post Food (+50 pts)"}
            </button>
          </form>
        )}

        <SearchFilters
          label="Search food"
          query={query}
          onQuery={setQuery}
          placeholder="Search by dish, description or area…"
          categories={FOOD_CATEGORIES}
          active={activeCategory}
          onActive={setActiveCategory}
        />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-lg border border-gray-200 bg-white text-sm" role="group" aria-label="View">
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
          <button
            onClick={sortNearest}
            aria-pressed={Boolean(myPos)}
            className={`rounded-lg border px-4 py-1.5 text-sm font-medium ${
              myPos ? "border-[#2E7D32] bg-[#E8F5E9] text-[#256428]" : "border-gray-200 bg-white text-[#1F2937] hover:border-[#2E7D32]"
            }`}
          >
            📍 {myPos ? "Nearest first ✓" : "Nearest first"}
          </button>
          {locNote && <span className="text-xs text-amber-700">{locNote}</span>}
        </div>

        {view === "map" && (
          <div className="mt-4">
            <LeafletMap markers={markers} focus={myPos} height={420} />
            {unpinned > 0 && (
              <p className="mt-2 text-xs text-[#6B7280]">
                {unpinned} {unpinned === 1 ? "post has" : "posts have"} no map pin — switch to List to see {unpinned === 1 ? "it" : "them"}.
              </p>
            )}
          </div>
        )}

        {view === "list" && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {loading && !result ? (
              <p className="text-[#6B7280]">Loading...</p>
            ) : posts.length === 0 ? (
              <p className="text-[#6B7280]">
                {debouncedQuery || activeCategory ? "No food matches your search." : "No food posts yet. Be the first to share!"}
              </p>
            ) : (
              posts.map((p) => {
                const expiresSoon = p.expiresAt !== null && new Date(p.expiresAt).getTime() - now < 2 * 60 * 60 * 1000;
                const km =
                  myPos && p.latitude !== null && p.longitude !== null
                    ? haversineKm(myPos.lat, myPos.lng, p.latitude, p.longitude)
                    : null;
                return (
                  <div key={p.id} className={`rounded-2xl border border-[#E8F5E9] bg-white p-5 ${loading ? "opacity-60" : ""}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#E8F5E9] px-3 py-1 text-xs font-semibold text-[#2E7D32]">{p.category}</span>
                      {p.status === "reserved" && (
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Reserved</span>
                      )}
                      {expiresSoon && p.status !== "completed" && (
                        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">Expiring soon</span>
                      )}
                    </div>
                    <h3 className="mt-3 text-lg font-bold text-[#1F2937]">🍛 {p.title}</h3>
                    {p.description && <p className="mt-1 text-sm text-[#6B7280]">{p.description}</p>}
                    {p.quantity && <p className="mt-2 text-sm text-[#1F2937]">Available: {p.quantity}</p>}
                    {p.expiresAt && <p className="text-sm text-[#6B7280]">⏰ Best before {formatDateTime(p.expiresAt)}</p>}
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-[#6B7280]">
                      <span>
                        Posted by{" "}
                        <Link href={`/users/${p.postedById}`} className="font-medium text-[#2E7D32] hover:underline">
                          {p.postedBy}
                        </Link>
                      </span>
                      <RatingBadge {...p.posterRating} />
                    </p>
                    {p.location && (
                      <p className="text-sm text-[#6B7280]">
                        📍 {p.location}
                        {km !== null && <span className="ml-1 font-medium text-[#256428]">· {formatKm(km)} away</span>}
                      </p>
                    )}
                    <ListingActions
                      itemType="food"
                      itemId={p.id}
                      itemTitle={p.title}
                      ownerId={p.postedById}
                      currentUserId={user?.id ?? null}
                      status={p.status}
                      myRequest={myRequests[`food:${p.id}`] ?? null}
                      onRequested={() => {
                        refreshRequests();
                        setReload((n) => n + 1);
                      }}
                      editData={{ title: p.title, description: p.description, category: p.category, quantity: p.quantity, location: p.location, expiresAt: p.expiresAt, latitude: p.latitude, longitude: p.longitude }}
                      onChanged={(deleted) => { if (deleted) refreshRequests(); setReload((n) => n + 1); }}
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
