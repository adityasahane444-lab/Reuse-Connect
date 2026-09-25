"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useUser } from "@/lib/useUser";
import { useMyRequests } from "@/lib/useMyRequests";
import { ACADEMIC_CATEGORIES, RESOURCE_CATEGORIES, SUGGESTED_TAGS } from "@/lib/constants";
import ListingActions from "@/components/ListingActions";
import SearchFilters from "@/components/SearchFilters";
import { RatingBadge } from "@/components/StarRating";

interface ResourcePost {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  price: string;
  tags: string[];
  status: string;
  postedBy: string;
  postedById: string;
  posterRating: { average: number | null; count: number };
  createdAt: string;
}

const isAcademic = (c: string) => (ACADEMIC_CATEGORIES as readonly string[]).includes(c);

export default function ResourcesPage() {
  const { user, refresh } = useUser();
  const { active: myRequests, refresh: refreshRequests } = useMyRequests(Boolean(user));

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState<{ key: string; posts: ResourcePost[] } | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(RESOURCE_CATEGORIES[0]);
  const [condition, setCondition] = useState("Good");
  const [price, setPrice] = useState("Free");
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const key = `${debouncedQuery}|${activeCategory ?? ""}|${activeTag ?? ""}|${reload}`;
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (activeCategory) params.set("category", activeCategory);
    if (activeTag) params.set("tag", activeTag);
    fetch(`/api/resources?${params}`, { cache: "no-store", signal: controller.signal })
      .then((r) => r.json())
      .then((data) => setResult({ key, posts: data.posts ?? [] }))
      .catch(() => {});
    return () => controller.abort();
  }, [key, debouncedQuery, activeCategory, activeTag]);

  const loading = result?.key !== key;
  const posts = result?.posts ?? [];

  function addSuggestedTag(tag: string) {
    const current = tagInput.split(",").map((t) => t.trim()).filter(Boolean);
    if (!current.includes(tag)) setTagInput([...current, tag].join(", "));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!user) {
      setError("Please log in to post an item.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, category, condition, price, tags: tagInput }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Could not post. Please try again.");
      return;
    }
    setTitle("");
    setDescription("");
    setPrice("Free");
    setTagInput("");
    setShowForm(false);
    setReload((n) => n + 1);
    await refresh();
  }

  const inputClass =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]";
  const tagChip = (selected: boolean) =>
    `rounded-full px-3 py-1 text-xs font-medium ${
      selected ? "bg-[#256428] text-white" : "border border-gray-200 bg-white text-[#1F2937] hover:border-[#2E7D32]"
    }`;

  return (
    <main className="flex-1 bg-[#F7FAF7] px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1F2937]">Resource Reuse</h1>
            <p className="mt-1 text-[#6B7280]">
              Give, exchange, or find reusable items — from travel gear to SPPU question banks and lab kits.
            </p>
          </div>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="rounded-xl bg-[#2E7D32] px-5 py-3 font-semibold text-white hover:bg-[#256428]"
          >
            + Post Item
          </button>
        </div>

        {!user && (
          <p className="mt-4 rounded-lg bg-[#E8F5E9] px-4 py-3 text-sm text-[#256428]">
            Log in to post an item and earn 30 Green Points per post.
          </p>
        )}

        {showForm && (
          <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-2xl border border-[#E8F5E9] bg-white p-6">
            {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
            <div>
              <label htmlFor="res-title" className="mb-1 block text-sm font-medium text-[#1F2937]">Title</label>
              <input id="res-title" required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. SE Computer SPPU question bank (2019 pattern)" className={inputClass} />
            </div>
            <div>
              <label htmlFor="res-desc" className="mb-1 block text-sm font-medium text-[#1F2937]">Description</label>
              <textarea id="res-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={1000} className={inputClass} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="res-cat" className="mb-1 block text-sm font-medium text-[#1F2937]">Category</label>
                <select id="res-cat" value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                  {RESOURCE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{isAcademic(c) ? `🎓 ${c}` : c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="res-cond" className="mb-1 block text-sm font-medium text-[#1F2937]">Condition</label>
                <input id="res-cond" value={condition} onChange={(e) => setCondition(e.target.value)} placeholder="e.g. Good condition" className={inputClass} />
              </div>
              <div>
                <label htmlFor="res-price" className="mb-1 block text-sm font-medium text-[#1F2937]">Price</label>
                <input id="res-price" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Free or ₹100" className={inputClass} />
              </div>
            </div>
            <div>
              <label htmlFor="res-tags" className="mb-1 block text-sm font-medium text-[#1F2937]">
                Tags <span className="font-normal text-[#6B7280]">(comma separated, up to 6 — helps people find it)</span>
              </label>
              <input id="res-tags" value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="e.g. sppu, se, computer, sem-3" className={inputClass} />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {SUGGESTED_TAGS.map((t) => (
                  <button key={t} type="button" onClick={() => addSuggestedTag(t)} className={tagChip(false)}>
                    + {t}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#2E7D32] px-6 py-2.5 font-semibold text-white hover:bg-[#256428] disabled:opacity-60"
            >
              {submitting ? "Posting..." : "Post Item (+30 pts)"}
            </button>
          </form>
        )}

        <SearchFilters
          label="Search resources"
          query={query}
          onQuery={setQuery}
          placeholder="Search by title, description or tag (e.g. chemistry, sppu)…"
          categories={RESOURCE_CATEGORIES}
          active={activeCategory}
          onActive={setActiveCategory}
          highlight={ACADEMIC_CATEGORIES}
        />

        <div className="mt-3 flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by tag">
          <span className="mr-1 text-xs font-medium text-[#6B7280]">Tags:</span>
          {SUGGESTED_TAGS.map((t) => (
            <button key={t} onClick={() => setActiveTag(activeTag === t ? null : t)} aria-pressed={activeTag === t} className={tagChip(activeTag === t)}>
              #{t}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading && !result ? (
            <p className="text-[#6B7280]">Loading...</p>
          ) : posts.length === 0 ? (
            <p className="text-[#6B7280]">
              {debouncedQuery || activeCategory || activeTag ? "No items match your search." : "No items posted yet. Be the first to share!"}
            </p>
          ) : (
            posts.map((p) => (
              <div key={p.id} className={`rounded-2xl border border-[#E8F5E9] bg-white p-5 ${loading ? "opacity-60" : ""}`}>
                <div className="flex h-24 items-center justify-center rounded-lg bg-[#E8F5E9] text-4xl">
                  {isAcademic(p.category) ? "🎓" : "📦"}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#E8F5E9] px-3 py-1 text-xs font-semibold text-[#2E7D32]">{p.category}</span>
                  {p.status === "reserved" && (
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Reserved</span>
                  )}
                </div>
                <h3 className="mt-2 text-lg font-bold text-[#1F2937]">{p.title}</h3>
                {p.description && <p className="mt-1 text-sm text-[#6B7280]">{p.description}</p>}
                {p.condition && <p className="mt-1 text-sm text-[#6B7280]">{p.condition}</p>}
                {p.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {p.tags.map((t) => (
                      <button key={t} onClick={() => setActiveTag(t)} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-[#6B7280] hover:bg-[#E8F5E9]">
                        #{t}
                      </button>
                    ))}
                  </div>
                )}
                <p className="mt-2 font-semibold text-[#2E7D32]">{p.price || "Free"}</p>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-[#6B7280]">
                  <span>
                    Posted by{" "}
                    <Link href={`/users/${p.postedById}`} className="font-medium text-[#2E7D32] hover:underline">
                      {p.postedBy}
                    </Link>
                  </span>
                  <RatingBadge {...p.posterRating} />
                </p>
                <ListingActions
                  itemType="resource"
                  itemId={p.id}
                  itemTitle={p.title}
                  ownerId={p.postedById}
                  currentUserId={user?.id ?? null}
                  status={p.status}
                  myRequest={myRequests[`resource:${p.id}`] ?? null}
                  onRequested={() => {
                    refreshRequests();
                    setReload((n) => n + 1);
                  }}
                  editData={{ title: p.title, description: p.description, category: p.category, condition: p.condition, price: p.price, tags: p.tags, location: "" }}
                  onChanged={(deleted) => { if (deleted) refreshRequests(); setReload((n) => n + 1); }}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
