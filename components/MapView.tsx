"use client";

import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { DEFAULT_MAP_CENTER } from "@/lib/constants";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  emoji?: string;
  href?: string;
}

interface MapViewProps {
  markers?: MapMarker[];
  /** When set, clicking the map calls this (used to pick a location in a form). */
  onPick?: (lat: number, lng: number) => void;
  picked?: { lat: number; lng: number } | null;
  height?: number;
  /** Recentre the map here when it changes (e.g. after "use my location"). */
  focus?: { lat: number; lng: number } | null;
}

// Emoji pins avoid Leaflet's default marker images, which break under bundlers.
function pin(emoji: string, highlight = false) {
  return L.divIcon({
    html: `<div style="font-size:22px;line-height:30px;width:30px;height:30px;text-align:center;border-radius:9999px;background:${
      highlight ? "#FEF3C7" : "#fff"
    };border:2px solid #2E7D32;box-shadow:0 1px 4px rgba(0,0,0,.3)">${emoji}</div>`,
    className: "",
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -28],
  });
}

function FitBounds({ markers, focus }: { markers: MapMarker[]; focus?: { lat: number; lng: number } | null }) {
  const map = useMap();
  // Depend on a string key, not the array identity, so re-renders don't re-fit the map
  // while the user is panning around.
  const key = markers.map((m) => `${m.lat},${m.lng}`).join("|");
  const focusLat = focus?.lat;
  const focusLng = focus?.lng;

  useEffect(() => {
    if (focusLat !== undefined && focusLng !== undefined) {
      map.setView([focusLat, focusLng], Math.max(map.getZoom(), 14));
      return;
    }
    const pts = key ? key.split("|").map((s) => s.split(",").map(Number) as [number, number]) : [];
    if (pts.length === 1) map.setView(pts[0], 14);
    else if (pts.length > 1) map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 15 });
  }, [map, key, focusLat, focusLng]);
  return null;
}

function ClickToPick({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(Math.round(e.latlng.lat * 1e6) / 1e6, Math.round(e.latlng.lng * 1e6) / 1e6);
    },
  });
  return null;
}

export default function MapView({ markers = [], onPick, picked, height = 360, focus }: MapViewProps) {
  return (
    <div style={{ height }} className="overflow-hidden rounded-2xl border border-[#E8F5E9]">
      <MapContainer
        center={DEFAULT_MAP_CENTER}
        zoom={12}
        scrollWheelZoom
        zoomAnimation={false}
        fadeAnimation={false}
        markerZoomAnimation={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {onPick && <ClickToPick onPick={onPick} />}
        <FitBounds markers={markers} focus={focus} />
        {markers.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]} icon={pin(m.emoji ?? "📍")}>
            <Popup>
              <strong>{m.title}</strong>
              {m.subtitle && <div>{m.subtitle}</div>}
              {m.href && (
                <a href={m.href} style={{ color: "#2E7D32" }}>
                  Open
                </a>
              )}
            </Popup>
          </Marker>
        ))}
        {picked && <Marker position={[picked.lat, picked.lng]} icon={pin("📍", true)} />}
      </MapContainer>
    </div>
  );
}
