"use client";

import { useEffect, useState } from "react";
import { FOOD_CATEGORIES, RESOURCE_CATEGORIES, EVENT_CATEGORIES, SUGGESTED_TAGS, type ReportItemType } from "@/lib/constants";
import LocationPicker from "./LocationPicker";
import ListingImagePicker from "./ListingImagePicker";

export interface ListingEditData {
  title: string;
  description: string;
  category: string;
  quantity?: string;
  location: string;
  expiresAt?: string | null;
  condition?: string;
  price?: string;
  tags?: string[];
  date?: string;
  time?: string;
  latitude?: number | null;
  longitude?: number | null;
  imageUrl?: string | null;
}

interface Props {
  itemType: ReportItemType;
  itemId: string;
  initial: ListingEditData;
  onDone: (deleted?: boolean) => void;
  onCancel: () => void;
}

export default function EditListing({ itemType, itemId, initial, onDone, onCancel }: Props) {
  const [form, setForm] = useState<ListingEditData>(initial);
  const [tags, setTags] = useState((initial.tags ?? []).join(", "));
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(
    initial.latitude != null && initial.longitude != null ? { lat: initial.latitude, lng: initial.longitude } : null
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);

  useEffect(() => { setForm(initial); setImageFile(null); setRemoveExistingImage(false); }, [initial]);
  const input = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]";
  const set = (key: keyof ListingEditData, value: string) => setForm((f) => ({ ...f, [key]: value }));

  async function save() {
    setError(""); setBusy(true);
    const body = new FormData();
    body.append("title", form.title);
    body.append("description", form.description);
    body.append("category", form.category);
    if (itemType === "food") { body.append("quantity", form.quantity ?? ""); body.append("location", form.location ?? ""); body.append("expiresAt", form.expiresAt ?? ""); }
    if (itemType === "resource") { body.append("condition", form.condition ?? ""); body.append("price", form.price ?? "Free"); body.append("tags", tags); }
    if (itemType === "event") { body.append("date", form.date ?? ""); body.append("time", form.time ?? ""); body.append("location", form.location ?? ""); }
    body.append("latitude", String(pin?.lat ?? "")); body.append("longitude", String(pin?.lng ?? ""));
    if (imageFile) body.append("image", imageFile);
    if (removeExistingImage) body.append("removeImage", "true");
    const res = await fetch(`/api/${itemType === "event" ? "events" : itemType === "food" ? "food" : "resources"}/${itemId}`, { method: "PATCH", body });
    const data = await res.json().catch(() => ({})); setBusy(false);
    if (!res.ok) { setError(data.error ?? "Could not update this post."); return; }
    onDone(false);
  }

  async function remove() {
    setError(""); setBusy(true);
    const res = await fetch(`/api/${itemType === "event" ? "events" : itemType === "food" ? "food" : "resources"}/${itemId}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({})); setBusy(false);
    if (!res.ok) { setError(data.error ?? "Could not delete this post."); return; }
    onDone(true);
  }

  const categories = itemType === "food" ? FOOD_CATEGORIES : itemType === "resource" ? RESOURCE_CATEGORIES : EVENT_CATEGORIES;

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 sm:p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="text-xl font-bold text-[#1F2937]">Edit {itemType === "event" ? "event" : "post"}</h2><p className="text-sm text-[#6B7280]">Only you can edit or delete this listing.</p></div><button onClick={onCancel} className="text-2xl text-gray-400 hover:text-gray-700">×</button></div>
      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      <div className="mt-5 space-y-4">
        <div><label className="mb-1 block text-sm font-medium">Title</label><input maxLength={120} value={form.title} onChange={e=>set("title",e.target.value)} className={input}/></div>
        <div><label className="mb-1 block text-sm font-medium">Description</label><textarea maxLength={1000} rows={3} value={form.description} onChange={e=>set("description",e.target.value)} className={input}/></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="mb-1 block text-sm font-medium">Category</label><select value={form.category} onChange={e=>set("category",e.target.value)} className={input}>{categories.map(c=><option key={c}>{c}</option>)}</select></div>
          {itemType === "food" && <div><label className="mb-1 block text-sm font-medium">Available</label><input value={form.quantity ?? ""} onChange={e=>set("quantity",e.target.value)} className={input}/></div>}
          {itemType === "resource" && <><div><label className="mb-1 block text-sm font-medium">Condition</label><input value={form.condition ?? ""} onChange={e=>set("condition",e.target.value)} className={input}/></div><div><label className="mb-1 block text-sm font-medium">Price</label><input value={form.price ?? "Free"} onChange={e=>set("price",e.target.value)} className={input}/></div></>}
          {itemType === "event" && <><div><label className="mb-1 block text-sm font-medium">Date</label><input type="date" value={form.date ?? ""} onChange={e=>set("date",e.target.value)} className={input}/></div><div><label className="mb-1 block text-sm font-medium">Time</label><input type="time" value={form.time ?? ""} onChange={e=>set("time",e.target.value)} className={input}/></div></>}
        </div>
        {itemType === "resource" && <div><label className="mb-1 block text-sm font-medium">Tags</label><input value={tags} onChange={e=>setTags(e.target.value)} placeholder="sppu, textbook, sem-3" className={input}/><div className="mt-2 flex flex-wrap gap-1">{SUGGESTED_TAGS.slice(0,8).map(t=><button key={t} type="button" onClick={()=>{const a=tags.split(",").map(x=>x.trim()).filter(Boolean);if(!a.includes(t))setTags([...a,t].join(", "))}} className="rounded-full border px-2 py-1 text-xs hover:bg-[#E8F5E9]">+ {t}</button>)}</div></div>}
        <ListingImagePicker id="edit-listing-image" file={imageFile} onChange={(file) => { setImageFile(file); if (file) setRemoveExistingImage(false); }} existingUrl={!removeExistingImage ? (form.imageUrl ?? null) : null} onRemoveExisting={() => setRemoveExistingImage(true)} />
        <div><label className="mb-1 block text-sm font-medium">Location</label><input value={form.location} onChange={e=>set("location",e.target.value)} className={input}/></div>
        {itemType === "food" && <div><label className="mb-1 block text-sm font-medium">Best before</label><input type="datetime-local" value={form.expiresAt ? new Date(form.expiresAt).toISOString().slice(0,16) : ""} onChange={e=>set("expiresAt", e.target.value ? new Date(e.target.value).toISOString() : "")} className={input}/></div>}
        {(itemType === "food" || itemType === "event") && <LocationPicker value={pin} onChange={setPin}/>} 
      </div>
      <div className="mt-6 flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"><button onClick={()=>setShowDelete(true)} disabled={busy} className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60">Delete</button><div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"><button onClick={onCancel} disabled={busy} className="rounded-lg border px-4 py-2 text-sm">Cancel</button><button onClick={save} disabled={busy} className="rounded-lg bg-[#2E7D32] px-5 py-2 text-sm font-semibold text-white hover:bg-[#256428] disabled:opacity-60">{busy ? "Saving…" : "Save changes"}</button></div></div>
      {showDelete && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4"><p className="text-sm font-semibold text-red-800">Delete this {itemType === "event" ? "event" : "post"} permanently?</p><p className="mt-1 text-xs text-red-700">Pending/accepted requests for this listing will be cancelled. This cannot be undone.</p><div className="mt-3 flex gap-2"><button onClick={()=>setShowDelete(false)} className="rounded-lg border px-3 py-1.5 text-sm">Keep it</button><button onClick={remove} disabled={busy} className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60">{busy ? "Deleting…" : "Yes, delete"}</button></div></div>}
    </div>
  </div>;
}
