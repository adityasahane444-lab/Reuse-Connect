"use client";

import dynamic from "next/dynamic";

// Leaflet touches `window`, so it must only load in the browser.
const LeafletMap = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[360px] items-center justify-center rounded-2xl border border-[#E8F5E9] bg-white text-sm text-[#6B7280]">
      Loading map…
    </div>
  ),
});

export default LeafletMap;
export type { MapMarker } from "./MapView";
