"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useUser } from "@/lib/useUser";

interface FoodPost {
  id: string;
  title: string;
  description: string;
  category: string;
  quantity: string;
  location: string;
  postedBy: string;
  createdAt: string;
}

const categories = ["Cooked Food", "Groceries", "Restaurant", "Events"];

export default function FoodPage() {
  const { user, refresh } = useUser();
  const [posts, setPosts] = useState<FoodPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [quantity, setQuantity] = useState("");
  const [location, setLocation] = useState("");

  async function loadPosts() {
    setLoading(true);
    const res = await fetch("/api/food", { cache: "no-store" });
    const data = await res.json();
    setPosts(data.posts ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    loadPosts();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!user) {
      setError("Please log in to post food.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/food", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, category, quantity, location }),
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
    setShowForm(false);
    await loadPosts();
    await refresh();
  }

  const visiblePosts = activeCategory ? posts.filter((p) => p.category === activeCategory) : posts;

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
              <label className="mb-1 block text-sm font-medium text-[#1F2937]">Title</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Veg Biryani"
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
            <div className="grid gap-4 sm:grid-cols-3">
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
                <label className="mb-1 block text-sm font-medium text-[#1F2937]">Available</label>
                <input
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 10 portions"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#1F2937]">Location</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Kothrud, Pune"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#2E7D32] px-6 py-2.5 font-semibold text-white hover:bg-[#256428] disabled:opacity-60"
            >
              {submitting ? "Posting..." : "Post Food (+50 pts)"}
            </button>
          </form>
        )}

        <div className="mt-8 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              activeCategory === null ? "bg-[#2E7D32] text-white" : "bg-white border border-gray-200 text-[#1F2937]"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                activeCategory === c ? "bg-[#2E7D32] text-white" : "bg-white border border-gray-200 text-[#1F2937]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {loading ? (
            <p className="text-[#6B7280]">Loading...</p>
          ) : visiblePosts.length === 0 ? (
            <p className="text-[#6B7280]">No food posts yet. Be the first to share!</p>
          ) : (
            visiblePosts.map((p) => (
              <div key={p.id} className="rounded-2xl border border-[#E8F5E9] bg-white p-5">
                <span className="rounded-full bg-[#E8F5E9] px-3 py-1 text-xs font-semibold text-[#2E7D32]">
                  {p.category}
                </span>
                <h3 className="mt-3 text-lg font-bold text-[#1F2937]">🍛 {p.title}</h3>
                {p.description && <p className="mt-1 text-sm text-[#6B7280]">{p.description}</p>}
                {p.quantity && <p className="mt-2 text-sm text-[#1F2937]">Available: {p.quantity}</p>}
                <p className="mt-1 text-sm text-[#6B7280]">Posted by {p.postedBy}</p>
                {p.location && <p className="text-sm text-[#6B7280]">📍 {p.location}</p>}
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
