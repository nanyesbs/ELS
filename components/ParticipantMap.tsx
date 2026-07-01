/**
 * ParticipantMap.tsx
 *
 * Interactive Leaflet map showing all completed-bio participants.
 * - CartoDB light tiles (no API key)
 * - Local geocoding via geo-utils.ts (no runtime API calls)
 * - Custom circular pins — brand blue with white border
 * - Cluster pins when multiple participants share the same city
 * - Popup: name, role, city, country
 * - Counter badge: "X leaders · Y countries"
 */

import React, { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Participant } from '../types';
import { getCoords } from '../geo-utils';

// ─── Fix Leaflet default icon paths (broken in Vite/webpack setups) ────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '',
  iconUrl: '',
  shadowUrl: '',
});

// ─── Types ────────────────────────────────────────────────────────────────────
interface ParticipantMapProps {
  participants: Participant[];
}

interface PinGroup {
  lat: number;
  lng: number;
  city: string;
  country: string;
  members: Participant[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BRAND_BLUE = '#1b52a9';
const BORDER_WHITE = '#ffffff';

/** Build the SVG HTML for a marker pin */
function buildPinHtml(count: number): string {
  const size = count > 1 ? 36 : 26;
  const inner =
    count > 1
      ? `<span style="color:#fff;font-size:11px;font-weight:700;font-family:system-ui,sans-serif;line-height:1">${count}</span>`
      : `<span style="display:block;width:8px;height:8px;background:#fff;border-radius:50%"></span>`;

  return `
    <div style="
      width:${size}px;height:${size}px;
      background:${BRAND_BLUE};
      border:2.5px solid ${BORDER_WHITE};
      border-radius:50%;
      box-shadow:0 2px 10px rgba(27,82,169,0.45);
      display:flex;align-items:center;justify-content:center;
      cursor:pointer;
    ">${inner}</div>`;
}

/** Build Leaflet DivIcon for a pin group */
function buildIcon(count: number): L.DivIcon {
  const size = count > 1 ? 36 : 26;
  return L.divIcon({
    html: buildPinHtml(count),
    className: '', // Remove Leaflet's default white background square
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  });
}

/** Build the HTML string for a popup */
function buildPopupHtml(group: PinGroup): string {
  const rows = group.members
    .map(
      (p) => `
      <div style="padding:6px 0;border-bottom:1px solid #f0f0f0;">
        <div style="font-size:13px;font-weight:600;color:#1b52a9;line-height:1.3">
          ${p.name || p.registered_name || '—'}
        </div>
        ${
          p.role
            ? `<div style="font-size:11px;color:#555;margin-top:2px">${p.role}</div>`
            : ''
        }
        <div style="font-size:11px;color:#888;margin-top:2px">
          📍 ${[group.city, group.country].filter(Boolean).join(', ')}
        </div>
      </div>`
    )
    .join('');

  return `
    <div style="
      min-width:200px;max-width:260px;
      max-height:220px;overflow-y:auto;
      font-family:system-ui,sans-serif;
      padding:4px 2px;
    ">
      ${rows}
    </div>`;
}

// ─── Popup CSS override (injected once) ──────────────────────────────────────
const POPUP_CSS = `
  .els-popup .leaflet-popup-content-wrapper {
    border-radius: 10px !important;
    border: 1px solid rgba(27,82,169,0.15) !important;
    box-shadow: 0 4px 20px rgba(0,0,0,0.12) !important;
    padding: 0 !important;
  }
  .els-popup .leaflet-popup-content {
    margin: 10px 12px !important;
  }
  .els-popup .leaflet-popup-tip-container {
    display: none !important;
  }
  .els-popup .leaflet-popup-close-button {
    color: #1b52a9 !important;
    font-size: 16px !important;
    top: 6px !important;
    right: 8px !important;
  }
`;

let popupStyleInjected = false;
function injectPopupStyle() {
  if (popupStyleInjected) return;
  const el = document.createElement('style');
  el.textContent = POPUP_CSS;
  document.head.appendChild(el);
  popupStyleInjected = true;
}

// ─── Component ────────────────────────────────────────────────────────────────
const ParticipantMap: React.FC<ParticipantMapProps> = ({ participants }) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Only show completed profiles with geocodable locations
  const groups = useMemo<PinGroup[]>(() => {
    injectPopupStyle();

    // Filter to completed participants
    const completed = participants.filter((p) => p.status === 'completed');

    // Group by "city, country" key
    const byKey = new Map<string, PinGroup>();

    for (const p of completed) {
      const city = (p.city || '').trim();
      const country = (p.country || '').trim();
      const coords = getCoords(city, country);
      if (!coords) continue; // Skip silently if not in lookup

      const key = `${coords[0]},${coords[1]}`;
      if (byKey.has(key)) {
        byKey.get(key)!.members.push(p);
      } else {
        byKey.set(key, {
          lat: coords[0],
          lng: coords[1],
          city,
          country,
          members: [p],
        });
      }
    }

    return Array.from(byKey.values());
  }, [participants]);

  // Stats for the counter badge
  const stats = useMemo(() => {
    const completed = participants.filter((p) => p.status === 'completed');
    const countries = new Set(completed.map((p) => p.country).filter(Boolean));
    return { leaders: completed.length, countries: countries.size };
  }, [participants]);

  // ── Map initialization ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return; // Already initialized

    const map = L.map(containerRef.current, {
      center: [48, 15],
      zoom: 4,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }
    ).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Markers update ────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove all existing layers (markers/popups) except tile layer
    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) map.removeLayer(layer);
    });

    // Add fresh markers
    for (const group of groups) {
      const marker = L.marker([group.lat, group.lng], {
        icon: buildIcon(group.members.length),
      });

      marker.bindPopup(buildPopupHtml(group), {
        className: 'els-popup',
        maxWidth: 280,
      });

      marker.addTo(map);
    }
  }, [groups]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-[#1552ab]/15 shadow-card">
      {/* Counter badge */}
      <div
        className="absolute top-3 right-3 z-[1000] flex items-center gap-2
          bg-white/90 backdrop-blur border border-[#1552ab]/15
          rounded-full px-4 py-2 shadow-sm"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        <span className="text-[11px] font-bold text-[#1b52a9] uppercase tracking-wider">
          {stats.leaders} leader{stats.leaders !== 1 ? 's' : ''}
        </span>
        <span className="text-[#1552ab]/30">·</span>
        <span className="text-[11px] font-bold text-[#1b52a9] uppercase tracking-wider">
          {stats.countries} countr{stats.countries !== 1 ? 'ies' : 'y'}
        </span>
      </div>

      {/* Map container — responsive height */}
      <div
        ref={containerRef}
        style={{ height: 'clamp(300px, 40vw, 480px)', width: '100%' }}
      />

      {/* Empty state overlay when no geocoded participants */}
      {groups.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#efefef]/80 backdrop-blur-sm z-[999] pointer-events-none">
          <p className="text-sm text-[#1552ab]/60 font-bold uppercase tracking-widest text-center px-8">
            No mapped participants yet.
            <br />
            <span className="font-normal text-[11px] normal-case tracking-normal mt-1 block">
              Participants appear here once they complete their bio with a city.
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

export default ParticipantMap;
