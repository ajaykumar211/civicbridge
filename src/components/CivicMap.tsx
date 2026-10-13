import React, { useEffect, useRef } from "react";
import L from "leaflet";

export interface MapMarkerItem {
  id: string;
  title: string;
  category: string;
  severity: string;
  status: string;
  area_name: string;
  latitude: number;
  longitude: number;
  support_count?: number;
}

interface CivicMapProps {
  items: MapMarkerItem[];
  center?: [number, number];
  zoom?: number;
  onSelectLocation?: (lat: number, lng: number) => void;
  selectedCoord?: [number, number] | null;
  height?: string;
  className?: string;
}

export const CivicMap: React.FC<CivicMapProps> = ({
  items,
  center = [12.9716, 77.5946],
  zoom = 11,
  onSelectLocation,
  selectedCoord,
  height = "420px",
  className = "",
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;

      if (onSelectLocation) {
        map.on("click", (e: L.LeafletMouseEvent) => {
          onSelectLocation(e.latlng.lat, e.latlng.lng);
        });
      }

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    // Custom circle markers for clean, domain-appropriate civic design
    items.forEach((item) => {
      if (!item.latitude || !item.longitude) return;

      const isCritical = item.severity === "critical";
      const isSolved = item.status === "solved";

      const fillColor = isSolved
        ? "#059669" // Emerald green
        : isCritical
        ? "#DC2626" // Crimson
        : "#0284C7"; // Sky blue

      const marker = L.circleMarker([item.latitude, item.longitude], {
        radius: isCritical ? 9 : 7,
        fillColor,
        color: "#ffffff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.85,
      });

      const popupHtml = `
        <div style="font-family: sans-serif; min-width: 180px; padding: 4px;">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 2px;">
            ${item.category} &middot; ${item.area_name}
          </div>
          <div style="font-weight: 600; font-size: 13px; color: #0f172a; margin-bottom: 6px;">
            ${item.title}
          </div>
          <div style="font-size: 11px; color: #475569; display: flex; justify-content: space-between; align-items: center;">
            <span>Status: <b>${item.status}</b></span>
            <span>${item.support_count || 0} supporters</span>
          </div>
          <div style="margin-top: 8px;">
            <a href="/problems/${item.id}" style="display: block; text-align: center; background: #0f172a; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; text-decoration: none;">
              View Details
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      markersLayerRef.current?.addLayer(marker);
    });

    // If a coordinate is manually selected via picker
    if (selectedCoord && selectedCoord[0] && selectedCoord[1]) {
      const pin = L.circleMarker(selectedCoord, {
        radius: 10,
        fillColor: "#f59e0b",
        color: "#ffffff",
        weight: 3,
        fillOpacity: 0.9,
      }).bindPopup("<b>Selected Problem Location</b>");
      markersLayerRef.current?.addLayer(pin);
    }
  }, [items, selectedCoord]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height }}
      className={`w-full rounded-xl border border-slate-200 overflow-hidden shadow-xs relative z-0 ${className}`}
    />
  );
};
