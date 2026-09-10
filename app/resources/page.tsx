"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useUser } from "@/lib/useUser";

interface ResourcePost {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  price: string;
  postedBy: string;
  createdAt: string;
}

const categories = ["Clothes", "Books", "Electronics", "Furniture", "Toys", "School Supplies", "Travel Gear", "Others"];

export default function ResourcesPage() {
  const { user, refresh } = useUser();
  const [posts, setPosts] = useState<ResourcePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [condition, setCondition] = useState("Good");
  const [price, setPrice] = useState("Free");

  async function loadPosts() {
    setLoading(true);
    const res = await fetch("/api/resources", { cache: "no-store" });
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
      setError("Please log in to post an item.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, category, condition, price }),
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
            <h1 className="text-3xl font-bold text-[#1F2937]">Resource Reuse</h1>
            <p className="mt-1 text-[#6B7280]">Give, exchange, or find reusable items — including travel gear.</p>
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
              <label className="mb-1 block text-sm font-medium text-[#1F2937]">Title</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Winter Jacket"
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
                <label className="mb-1 block text-sm font-medium text-[#1F2937]">Condition</label>
                <input
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  placeholder="e.g. Good condition"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#1F2937]">Price</label>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Free or ₹100"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                />
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

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <p className="text-[#6B7280]">Loading...</p>
          ) : visiblePosts.length === 0 ? (
            <p className="text-[#6B7280]">No items posted yet. Be the first to share!</p>
          ) : (
            visiblePosts.map((p) => (
              <div key={p.id} className="rounded-2xl border border-[#E8F5E9] bg-white p-5">
                <div className="flex h-24 items-center justify-center rounded-lg bg-[#E8F5E9] text-4xl">📦</div>
                <span className="mt-3 inline-block rounded-full bg-[#E8F5E9] px-3 py-1 text-xs font-semibold text-[#2E7D32]">
                  {p.category}
                </span>
                <h3 className="mt-2 text-lg font-bold text-[#1F2937]">{p.title}</h3>
                {p.description && <p className="mt-1 text-sm text-[#6B7280]">{p.description}</p>}
                {p.condition && <p className="mt-1 text-sm text-[#6B7280]">{p.condition}</p>}
                <p className="mt-2 font-semibold text-[#2E7D32]">{p.price || "Free"}</p>
                <p className="mt-1 text-sm text-[#6B7280]">Posted by {p.postedBy}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
