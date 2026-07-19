import { useEffect, useRef } from "react";
import L from "leaflet";

interface Marker {
  lat: number;
  lng: number;
  label?: string;
}

interface Props {
  markers: Marker[];
  center?: [number, number];
  zoom?: number;
  height?: string;
}

export default function MapView({ markers, center, zoom = 13, height = "300px" }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;
    const fallback: [number, number] = markers[0] ? [markers[0].lat, markers[0].lng] : [40.9627, 29.0604];
    mapRef.current = L.map(containerRef.current).setView(center ?? fallback, zoom);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(mapRef.current);
  }, [center, zoom, markers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });
    for (const m of markers) {
      L.marker([m.lat, m.lng])
        .addTo(map)
        .bindPopup(m.label ?? "");
    }
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number]));
      map.fitBounds(bounds.pad(0.2));
    }
  }, [markers]);

  useEffect(() => () => {
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
  }, []);

  return <div ref={containerRef} style={{ height, width: "100%" }} className="rounded-2xl overflow-hidden ring-1 ring-gray-100" />;
}