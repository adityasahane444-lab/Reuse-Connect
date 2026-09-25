"use client";

import { useState } from "react";
import LeafletMap from "./Map";

interface Props {
  value: { lat: number; lng: number } | null;
  onChange: (v: { lat: number; lng: number } | null) => void;
}

/** Click the map or use the browser's location to drop a pin. Optional — listings work without one. */
export default function LocationPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  function useMyLocation() {
    setNote("");
    if (!navigator.geolocation) {
      setNote("Your browser doesn't support location.");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setOpen(true);
        setBusy(false);
      },
      () => {
        setNote("Couldn't get your location — you can click on the map instead.");
        setOpen(true);
        setBusy(false);
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded-md border border-[#2E7D32] px-3 py-1.5 text-sm text-[#2E7D32] hover:bg-[#E8F5E9]"
        >
          {open ? "Hide map" : "📍 Pin on map"}
        </button>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={busy}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-[#1F2937] hover:bg-gray-50 disabled:opacity-60"
        >
          {busy ? "Locating…" : "Use my location"}
        </button>
        {value && (
          <>
            <span className="text-xs text-[#6B7280]">
              Pinned ({value.lat.toFixed(4)}, {value.lng.toFixed(4)})
            </span>
            <button type="button" onClick={() => onChange(null)} className="text-xs text-red-600 hover:underline">
              Remove pin
            </button>
          </>
        )}
      </div>
      {note && <p className="mt-2 text-xs text-amber-700">{note}</p>}
      {open && (
        <div className="mt-3">
          <p className="mb-2 text-xs text-[#6B7280]">Click the map to drop a pin where people should pick this up.</p>
          <LeafletMap height={280} onPick={(lat, lng) => onChange({ lat, lng })} picked={value} focus={value} />
        </div>
      )}
    </div>
  );
}
