"use client";

import { useState } from "react";

/** Read-only stars, e.g. <Stars value={4.5} />. */
export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const rounded = Math.round(value);
  return (
    <span aria-label={`${value} out of 5 stars`} style={{ fontSize: size }} className="whitespace-nowrap leading-none">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rounded ? "text-amber-500" : "text-gray-300"} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  );
}

/** "★ 4.5 (12)" or "No ratings yet" */
export function RatingBadge({ average, count }: { average: number | null; count: number }) {
  if (average === null || count === 0) return <span className="text-xs text-[#6B7280]">No ratings yet</span>;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-[#6B7280]">
      <Stars value={average} size={13} />
      <span>
        {average.toFixed(1)} ({count})
      </span>
    </span>
  );
}

/** Clickable star input. */
export function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div role="radiogroup" aria-label="Rating" className="inline-flex gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
          className={`text-2xl leading-none ${n <= shown ? "text-amber-500" : "text-gray-300"} hover:scale-110`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
