"use client";

import { useEffect, useState } from "react";

interface Props {
  id: string;
  file: File | null;
  onChange: (file: File | null) => void;
  existingUrl?: string | null;
  onRemoveExisting?: () => void;
}

export default function ListingImagePicker({ id, file, onChange, existingUrl, onRemoveExisting }: Props) {
  const [preview, setPreview] = useState<string | null>(existingUrl ?? null);

  useEffect(() => {
    if (!file) {
      setPreview(existingUrl ?? null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file, existingUrl]);

  function choose(next: File | null) {
    if (!next) { onChange(null); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(next.type)) {
      alert('Please choose a JPG, PNG or WebP image.');
      return;
    }
    if (next.size > 5 * 1024 * 1024) {
      alert('Image must be 5 MB or smaller.');
      return;
    }
    onChange(next);
  }

  return (
    <div className="rounded-2xl border border-dashed border-[#B7DDB9] bg-[#F7FBF7] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <label htmlFor={id} className="block text-sm font-semibold text-[#1F2937]">Item photo <span className="font-normal text-[#6B7280]">(optional)</span></label>
          <p className="mt-1 text-xs text-[#6B7280]">Add a clear photo so others can inspect the item before requesting it. JPG, PNG or WebP · max 5 MB.</p>
        </div>
        {file || existingUrl ? (
          <button type="button" onClick={() => { onChange(null); onRemoveExisting?.(); }} className="shrink-0 text-xs font-semibold text-red-600 hover:underline">Remove</button>
        ) : null}
      </div>
      {preview ? <img src={preview} alt="Listing preview" className="mt-3 h-52 w-full rounded-xl object-cover" /> : <div className="mt-3 flex h-32 items-center justify-center rounded-xl border border-[#DDEBDD] bg-white text-sm text-[#6B7280]">No photo added</div>}
      <input id={id} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => choose(e.target.files?.[0] ?? null)} className="mt-3 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#2E7D32] file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-[#256428]" />
    </div>
  );
}
