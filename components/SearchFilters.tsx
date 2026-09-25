"use client";

interface Props {
  query: string;
  onQuery: (q: string) => void;
  placeholder: string;
  categories: readonly string[];
  active: string | null;
  onActive: (c: string | null) => void;
  /** Categories to mark with a 🎓 (e.g. academic ones). */
  highlight?: readonly string[];
  label: string;
}

export default function SearchFilters({ query, onQuery, placeholder, categories, active, onActive, highlight = [], label }: Props) {
  const chip = (selected: boolean) =>
    `shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
      selected ? "bg-[#2E7D32] text-white" : "bg-white border border-gray-200 text-[#1F2937] hover:border-[#2E7D32]"
    }`;

  return (
    <div className="mt-8 space-y-4">
      <div className="relative">
        <label htmlFor="listing-search" className="sr-only">
          {label}
        </label>
        <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]">
          🔍
        </span>
        <input
          id="listing-search"
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
        />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible" role="group" aria-label="Filter by category">
        <button onClick={() => onActive(null)} aria-pressed={active === null} className={chip(active === null)}>
          All
        </button>
        {categories.map((c) => (
          <button key={c} onClick={() => onActive(active === c ? null : c)} aria-pressed={active === c} className={chip(active === c)}>
            {highlight.includes(c) ? "🎓 " : ""}
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
