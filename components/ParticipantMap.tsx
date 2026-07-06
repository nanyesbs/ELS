/**
 * ParticipantMap.tsx  –  Zenly-style participant map
 *
 * Features
 * ─────────
 * • Photo pins  – rounded avatar with white ring, brand shadow
 * • City clusters  – stacked "pile of photos" + count badge, city label below
 * • Distance  – Haversine from viewer's geolocation (or profile city fallback)
 * • Bottom sheet  – slide-up drawer with participant details on pin click
 * • Sorted sidebar list  – closest first (inside bottom sheet)
 * • hide_on_map  – participants who opted out are skipped
 */

import React, {
  useEffect,
  useRef,
  useMemo,
  useState,
  useCallback,
} from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Participant } from '../types';
import { getCoords } from '../geo-utils';
import { haversineKm, formatDistance } from '../haversine';
import { X, MapPin, Navigation } from 'lucide-react';

// ─── Fix Leaflet default icon paths (broken in Vite/webpack) ──────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: '', iconUrl: '', shadowUrl: '' });

// ─── Types ────────────────────────────────────────────────────────────────────
interface ParticipantMapProps {
  participants: Participant[];
  darkMode?: boolean;
  /** Coordinates of the logged-in viewer for distance calculation */
  viewerCoords?: [number, number] | null;
}

interface PinGroup {
  lat: number;
  lng: number;
  city: string;
  country: string;
  members: Participant[]; // already enriched with distanceKm
}

// ─── Constants ────────────────────────────────────────────────────────────────
const BRAND_BLUE = '#1b52a9';
const CLUSTER_OVERLAP = 10; // px offset per stacked avatar

// ─── Photo pin helpers ────────────────────────────────────────────────────────

/** Build a data-URL avatar circle HTML for a single participant */
function buildAvatarHtml(
  p: Participant,
  size: number,
  zIndex = 0,
  offsetX = 0,
  ring = 'white'
): string {
  const url = p.photo_url || '';
  const initials = (p.name || p.registered_name || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const inner = url
    ? `<img src="${url}" alt="${initials}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;" />`
    : `<span style="color:#fff;font-size:${Math.round(size * 0.35)}px;font-weight:700;font-family:system-ui,sans-serif;line-height:1;">${initials}</span>`;

  return `
    <div style="
      position:absolute;
      left:${offsetX}px;top:0;
      width:${size}px;height:${size}px;
      border-radius:50%;
      background:${BRAND_BLUE};
      border:2.5px solid ${ring};
      box-shadow:0 4px 14px rgba(27,82,169,0.45);
      display:flex;align-items:center;justify-content:center;
      overflow:hidden;
      z-index:${zIndex};
      cursor:pointer;
    ">${inner}</div>`;
}

/** Build a city label below the cluster */
function buildCityLabel(city: string, darkMode: boolean): string {
  const bg = darkMode ? 'rgba(18,24,41,0.82)' : 'rgba(255,255,255,0.88)';
  const color = darkMode ? '#f8fafc' : BRAND_BLUE;
  return `
    <div style="
      position:absolute;
      bottom:-22px;
      left:50%;
      transform:translateX(-50%);
      white-space:nowrap;
      background:${bg};
      backdrop-filter:blur(10px);
      -webkit-backdrop-filter:blur(10px);
      color:${color};
      font-size:9px;font-weight:700;
      font-family:system-ui,sans-serif;
      letter-spacing:0.08em;
      text-transform:uppercase;
      padding:2px 7px;
      border-radius:20px;
      border:1px solid rgba(27,82,169,0.15);
      box-shadow:0 2px 8px rgba(27,82,169,0.12);
      pointer-events:none;
    ">${city}</div>`;
}

/** Build a count badge for clusters > 3 */
function buildCountBadge(count: number): string {
  return `
    <div style="
      position:absolute;
      top:-5px;right:-5px;
      width:18px;height:18px;
      border-radius:50%;
      background:#ff3b30;
      border:2px solid white;
      color:white;
      font-size:8px;font-weight:800;
      font-family:system-ui,sans-serif;
      display:flex;align-items:center;justify-content:center;
      z-index:99;
      box-shadow:0 1px 4px rgba(0,0,0,0.3);
    ">${count > 9 ? '9+' : count}</div>`;
}

/** Full DivIcon for a group — stacks up to 3 avatars */
function buildGroupIcon(group: PinGroup, darkMode: boolean): L.DivIcon {
  const members = group.members;
  const AVATAR = 44; // px diameter
  const maxShow = Math.min(members.length, 3);
  const totalW = AVATAR + (maxShow - 1) * CLUSTER_OVERLAP;
  const totalH = AVATAR + 24; // + label height

  let avatarsHtml = '';
  for (let i = 0; i < maxShow; i++) {
    const zIndex = maxShow - i;
    const offsetX = i * CLUSTER_OVERLAP;
    avatarsHtml += buildAvatarHtml(members[i], AVATAR, zIndex, offsetX);
  }
  const countBadge = members.length > 1 ? buildCountBadge(members.length) : '';
  const cityLabel = buildCityLabel(group.city, darkMode);

  const html = `
    <div style="position:relative;width:${totalW}px;height:${totalH}px;">
      ${avatarsHtml}
      ${countBadge}
      ${cityLabel}
    </div>`;

  return L.divIcon({
    html,
    className: '',
    iconSize: [totalW, totalH],
    iconAnchor: [totalW / 2, AVATAR / 2],
    popupAnchor: [0, -(AVATAR / 2 + 26)],
  });
}

// ─── Global popup style injection ────────────────────────────────────────────
function injectPopupStyle(darkMode: boolean) {
  const styleId = 'els-popup-dynamic-styles';
  let el = document.getElementById(styleId);
  if (!el) {
    el = document.createElement('style');
    el.id = styleId;
    document.head.appendChild(el);
  }
  el.textContent = darkMode
    ? `.els-popup .leaflet-popup-content-wrapper{background:rgba(18,24,41,0.9)!important;backdrop-filter:blur(16px)!important;-webkit-backdrop-filter:blur(16px)!important;color:#f8fafc!important;border-radius:20px!important;border:1px solid rgba(255,255,255,0.1)!important;box-shadow:0 10px 40px rgba(0,0,0,0.4)!important;padding:0!important}.els-popup .leaflet-popup-content{margin:12px!important}.els-popup .leaflet-popup-tip-container{display:none!important}.els-popup .leaflet-popup-close-button{color:#94a3b8!important;top:8px!important;right:10px!important;font-size:18px!important}`
    : `.els-popup .leaflet-popup-content-wrapper{background:rgba(255,255,255,0.92)!important;backdrop-filter:blur(16px)!important;-webkit-backdrop-filter:blur(16px)!important;color:${BRAND_BLUE}!important;border-radius:20px!important;border:1px solid rgba(27,82,169,0.1)!important;box-shadow:0 10px 30px rgba(27,82,169,0.1)!important;padding:0!important}.els-popup .leaflet-popup-content{margin:12px!important}.els-popup .leaflet-popup-tip-container{display:none!important}.els-popup .leaflet-popup-close-button{color:#1b52a9!important;top:8px!important;right:10px!important;font-size:18px!important}`;
}

// ─── Bottom Sheet ─────────────────────────────────────────────────────────────
interface BottomSheetProps {
  group: PinGroup | null;
  onClose: () => void;
  onSelectParticipant: (p: Participant) => void;
  darkMode: boolean;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  group,
  onClose,
  onSelectParticipant,
  darkMode,
}) => {
  if (!group) return null;

  const bg = darkMode
    ? 'bg-[#121829]/95 border-white/10'
    : 'bg-white/95 border-[#1552ab]/10';
  const textPrimary = darkMode ? 'text-white' : 'text-[#1552ab]';
  const textSub = darkMode ? 'text-white/50' : 'text-[#1552ab]/50';

  // Sort by distance
  const sorted = [...group.members].sort(
    (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity)
  );

  return (
    <div
      className={`
        absolute bottom-0 left-0 right-0 z-[1001]
        ${bg} border-t backdrop-blur-xl
        rounded-t-3xl shadow-2xl
        animate-slide-up
        max-h-[60%] flex flex-col
      `}
      style={{ fontFamily: 'system-ui, sans-serif' }}
    >
      {/* Handle + header */}
      <div className="flex-shrink-0 px-5 pt-3 pb-4">
        <div className="mx-auto w-10 h-1 rounded-full bg-current opacity-20 mb-4" />
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`font-bold text-base ${textPrimary}`}>
              {group.city}
              {group.country ? `, ${group.country}` : ''}
            </h3>
            <p className={`text-xs mt-0.5 ${textSub}`}>
              {group.members.length} participant{group.members.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 ${
              darkMode ? 'bg-white/10 text-white' : 'bg-[#1552ab]/8 text-[#1552ab]'
            }`}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Participant list */}
      <div className="overflow-y-auto px-5 pb-6 space-y-3 flex-1">
        {sorted.map((p) => {
          const name = p.name || p.registered_name || '—';
          const hasPhoto = Boolean(p.photo_url);
          const initials = name
            .split(' ')
            .map((w) => w[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();

          return (
            <button
              key={p.id}
              onClick={() => onSelectParticipant(p)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left active:scale-[0.97] ${
                darkMode
                  ? 'bg-white/5 hover:bg-white/10'
                  : 'bg-[#1552ab]/4 hover:bg-[#1552ab]/8'
              }`}
            >
              {/* Avatar */}
              <div
                className="w-12 h-12 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center"
                style={{
                  background: BRAND_BLUE,
                  border: '2px solid rgba(255,255,255,0.4)',
                  boxShadow: '0 2px 10px rgba(27,82,169,0.3)',
                }}
              >
                {hasPhoto ? (
                  <img
                    src={p.photo_url!}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-sm">{initials}</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm truncate ${textPrimary}`}>{name}</p>
                {p.role && (
                  <p className={`text-xs truncate ${textSub}`}>{p.role}</p>
                )}
              </div>

              {/* Distance chip */}
              {p.distanceKm !== undefined && (
                <div
                  className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                    darkMode
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-[#1552ab]/10 text-[#1552ab]'
                  }`}
                >
                  <Navigation size={9} />
                  {formatDistance(p.distanceKm)}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ParticipantMap: React.FC<ParticipantMapProps> = ({
  participants,
  darkMode = false,
  viewerCoords,
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const [activeGroup, setActiveGroup] = useState<PinGroup | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<Participant | null>(null);

  // ── Compute groups + distances ───────────────────────────────────────────────
  const groups = useMemo<PinGroup[]>(() => {
    injectPopupStyle(darkMode);

    const completed = participants.filter(
      (p) => p.status === 'completed' && !p.hide_on_map
    );

    // Enrich with distanceKm
    const enriched: Participant[] = completed.map((p) => {
      if (!viewerCoords) return p;
      const coords = getCoords((p.city || '').trim(), (p.country || '').trim());
      if (!coords) return p;
      return {
        ...p,
        distanceKm: haversineKm(
          viewerCoords[0],
          viewerCoords[1],
          coords[0],
          coords[1]
        ),
      };
    });

    const byKey = new Map<string, PinGroup>();
    for (const p of enriched) {
      const city = (p.city || '').trim();
      const country = (p.country || '').trim();
      const coords = getCoords(city, country);
      if (!coords) continue;

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

    // Sort members in each group by distance
    for (const g of byKey.values()) {
      g.members.sort(
        (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity)
      );
    }

    return Array.from(byKey.values());
  }, [participants, darkMode, viewerCoords]);

  // Stats
  const stats = useMemo(() => {
    const completed = participants.filter(
      (p) => p.status === 'completed' && !p.hide_on_map
    );
    const countries = new Set(completed.map((p) => p.country).filter(Boolean));
    return { leaders: completed.length, countries: countries.size };
  }, [participants]);

  // ── Map initialization ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [48, 15],
      zoom: 4,
      zoomControl: false,
      attributionControl: true,
    });
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Tile layer sync ──────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (tileLayerRef.current) map.removeLayer(tileLayerRef.current);
    const tileUrl = darkMode
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    const tileLayer = L.tileLayer(tileUrl, {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    });
    tileLayer.addTo(map);
    tileLayerRef.current = tileLayer;
  }, [darkMode]);

  // ── Markers ──────────────────────────────────────────────────────────────────
  const handleGroupClick = useCallback((group: PinGroup) => {
    setActiveGroup(group);
    setSelectedProfile(null);
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    for (const group of groups) {
      const icon = buildGroupIcon(group, darkMode);
      const marker = L.marker([group.lat, group.lng], { icon });

      marker.on('click', () => {
        // Pan map toward pin
        map.panTo([group.lat, group.lng], { animate: true, duration: 0.4 });
        handleGroupClick(group);
      });

      marker.addTo(map);
      markersRef.current.push(marker);
    }
  }, [groups, darkMode, handleGroupClick]);

  // ── Handle profile open (delegated to parent via callback) ───────────────────
  // We surface it via a local overlay — simple modal-over-map
  const closeBottomSheet = () => {
    setActiveGroup(null);
    setSelectedProfile(null);
  };

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border border-[#1552ab]/15 dark:border-white/10 shadow-card"
      style={{ fontFamily: 'system-ui, sans-serif' }}
    >
      {/* Counter badge */}
      <div
        className="absolute top-3 left-3 z-[1000] flex items-center gap-2
          bg-white/90 dark:bg-[#121829]/95 backdrop-blur border border-[#1552ab]/15 dark:border-white/15
          rounded-full px-4 py-2 shadow-sm"
      >
        <MapPin size={11} className="text-[#1b52a9] dark:text-white opacity-70" />
        <span className="text-[11px] font-bold text-[#1b52a9] dark:text-white uppercase tracking-wider">
          {stats.leaders} leader{stats.leaders !== 1 ? 's' : ''}
        </span>
        <span className="text-[#1552ab]/30 dark:text-white/30">·</span>
        <span className="text-[11px] font-bold text-[#1b52a9] dark:text-white uppercase tracking-wider">
          {stats.countries} countr{stats.countries !== 1 ? 'ies' : 'y'}
        </span>
      </div>

      {/* Map container */}
      <div
        ref={containerRef}
        style={{ height: 'clamp(340px, 44vw, 520px)', width: '100%' }}
      />

      {/* Empty state */}
      {groups.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#efefef]/80 dark:bg-[#0a0f1d]/85 backdrop-blur-sm z-[999] pointer-events-none">
          <p className="text-sm text-[#1552ab]/60 dark:text-white/60 font-bold uppercase tracking-widest text-center px-8">
            No mapped participants yet.
            <br />
            <span className="font-normal text-[11px] normal-case tracking-normal mt-1 block">
              Participants appear here once they complete their bio with a city.
            </span>
          </p>
        </div>
      )}

      {/* Bottom Sheet */}
      <BottomSheet
        group={activeGroup}
        onClose={closeBottomSheet}
        onSelectParticipant={(p) => setSelectedProfile(p)}
        darkMode={darkMode}
      />

      {/* Participant Bio overlay (when user taps an avatar in the bottom sheet) */}
      {selectedProfile && (
        <div
          className="absolute inset-0 z-[1002] flex flex-col bg-white/95 dark:bg-[#121829]/98 backdrop-blur-xl overflow-y-auto"
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >
          {/* Header bar */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1552ab]/8 dark:border-white/8 flex-shrink-0">
            <button
              onClick={() => setSelectedProfile(null)}
              className="w-9 h-9 rounded-full bg-[#1552ab]/8 dark:bg-white/10 flex items-center justify-center text-[#1552ab] dark:text-white hover:scale-110 transition-transform"
            >
              <X size={16} />
            </button>
            <span className="text-xs font-bold uppercase tracking-widest text-[#1552ab]/50 dark:text-white/50">
              Participant Profile
            </span>
          </div>

          {/* Profile content */}
          <div className="flex-1 p-6 space-y-5">
            {/* Photo + name */}
            <div className="flex items-center gap-4">
              <div
                className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
                style={{
                  background: BRAND_BLUE,
                  border: '3px solid rgba(255,255,255,0.6)',
                  boxShadow: '0 4px 20px rgba(27,82,169,0.3)',
                }}
              >
                {selectedProfile.photo_url ? (
                  <img
                    src={selectedProfile.photo_url}
                    alt={selectedProfile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-2xl">
                    {(selectedProfile.name || selectedProfile.registered_name || '?')
                      .split(' ')
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h2 className="font-bold text-xl text-[#1552ab] dark:text-white leading-tight">
                  {selectedProfile.name || selectedProfile.registered_name || '—'}
                </h2>
                {selectedProfile.role && (
                  <p className="text-sm text-[#1552ab]/60 dark:text-white/60 mt-1">
                    {selectedProfile.role}
                  </p>
                )}
                {selectedProfile.distanceKm !== undefined && (
                  <div className="flex items-center gap-1 mt-2 text-[10px] font-bold uppercase tracking-wide text-[#1552ab]/50 dark:text-blue-300/70">
                    <Navigation size={9} />
                    {formatDistance(selectedProfile.distanceKm)} de você
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            {(selectedProfile.city || selectedProfile.country) && (
              <div className="flex items-center gap-2 text-sm text-[#1552ab]/70 dark:text-white/70">
                <MapPin size={14} />
                {[selectedProfile.city, selectedProfile.country]
                  .filter(Boolean)
                  .join(', ')}
              </div>
            )}

            {/* Organization */}
            {selectedProfile.organization && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#1552ab]/40 dark:text-white/40 mb-1">
                  Organization
                </p>
                <p className="text-sm font-medium text-[#1552ab] dark:text-white">
                  {selectedProfile.organization}
                </p>
              </div>
            )}

            {/* Short bio */}
            {selectedProfile.short_bio && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#1552ab]/40 dark:text-white/40 mb-1">
                  Bio
                </p>
                <p className="text-sm text-[#1552ab]/80 dark:text-white/80 leading-relaxed">
                  {selectedProfile.short_bio}
                </p>
              </div>
            )}

            {/* Areas of interest */}
            {selectedProfile.areas_of_interest?.length ? (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#1552ab]/40 dark:text-white/40 mb-2">
                  Areas of Interest
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedProfile.areas_of_interest.map((area) => (
                    <span
                      key={area}
                      className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-[#1552ab]/8 text-[#1552ab] dark:bg-white/10 dark:text-white"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Contact */}
            {(selectedProfile.public_email || selectedProfile.public_website) && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#1552ab]/40 dark:text-white/40 mb-1">
                  Contact
                </p>
                {selectedProfile.public_email && (
                  <a
                    href={`mailto:${selectedProfile.public_email}`}
                    className="block text-sm text-[#1552ab] dark:text-blue-300 underline underline-offset-2"
                  >
                    {selectedProfile.public_email}
                  </a>
                )}
                {selectedProfile.public_website && (
                  <a
                    href={selectedProfile.public_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-[#1552ab] dark:text-blue-300 underline underline-offset-2 truncate"
                  >
                    {selectedProfile.public_website}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CSS for slide-up animation */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }
        .animate-slide-up {
          animation: slideUp 0.32s cubic-bezier(0.32, 0.72, 0, 1) both;
        }
      `}</style>
    </div>
  );
};

export default ParticipantMap;
