/**
 * ParticipantMap.tsx  –  Zenly-style participant map
 *
 * Features
 * ─────────
 * • Photo pins  – rounded avatar with white ring, brand shadow
 * • City clusters  – stacked "pile of photos" + count badge, city label below
 * • Distance  – Haversine from viewer's geolocation (or profile city fallback)
 * • Bottom sheet  – slide-up drawer with swipe-to-close on mobile
 * • Full bio overlay  – all public fields, responsive layout
 * • Responsive  – mobile portrait/landscape, tablet portrait/landscape
 * • hide_on_map  – participants who opted out are skipped
 */

import React, {
  useEffect,
  useRef,
  useMemo,
  useState,
  useCallback,
  TouchEvent,
} from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Participant } from '../types';
import { getCoords } from '../geo-utils';
import { haversineKm, formatDistance } from '../haversine';
import {
  X,
  MapPin,
  Navigation,
  Building2,
  Globe,
  Phone,
  Mail,
  Link,
  Languages,
  ChevronDown,
} from 'lucide-react';

// ─── Fix Leaflet default icon paths ───────────────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: '', iconUrl: '', shadowUrl: '' });

// ─── Types ────────────────────────────────────────────────────────────────────
interface ParticipantMapProps {
  participants: Participant[];
  darkMode?: boolean;
  viewerCoords?: [number, number] | null;
}

interface PinGroup {
  lat: number;
  lng: number;
  city: string;
  country: string;
  members: Participant[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const BRAND_BLUE = '#1b52a9';
const CLUSTER_OVERLAP = 10;

// ─── Avatar helpers ───────────────────────────────────────────────────────────
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

function buildCityLabel(city: string, darkMode: boolean): string {
  const bg = darkMode ? 'rgba(18,24,41,0.82)' : 'rgba(255,255,255,0.88)';
  const color = darkMode ? '#f8fafc' : BRAND_BLUE;
  return `
    <div style="
      position:absolute;
      bottom:-22px;left:50%;
      transform:translateX(-50%);
      white-space:nowrap;
      background:${bg};
      backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
      color:${color};
      font-size:9px;font-weight:700;
      font-family:system-ui,sans-serif;
      letter-spacing:0.08em;text-transform:uppercase;
      padding:2px 7px;border-radius:20px;
      border:1px solid rgba(27,82,169,0.15);
      box-shadow:0 2px 8px rgba(27,82,169,0.12);
      pointer-events:none;
    ">${city}</div>`;
}

function buildCountBadge(count: number): string {
  return `
    <div style="
      position:absolute;top:-5px;right:-5px;
      width:18px;height:18px;border-radius:50%;
      background:#ff3b30;border:2px solid white;color:white;
      font-size:8px;font-weight:800;font-family:system-ui,sans-serif;
      display:flex;align-items:center;justify-content:center;
      z-index:99;box-shadow:0 1px 4px rgba(0,0,0,0.3);
    ">${count > 9 ? '9+' : count}</div>`;
}

function buildGroupIcon(group: PinGroup, darkMode: boolean): L.DivIcon {
  const members = group.members;
  const AVATAR = 44;
  const maxShow = Math.min(members.length, 3);
  const totalW = AVATAR + (maxShow - 1) * CLUSTER_OVERLAP;
  const totalH = AVATAR + 24;

  let avatarsHtml = '';
  for (let i = 0; i < maxShow; i++) {
    avatarsHtml += buildAvatarHtml(members[i], AVATAR, maxShow - i, i * CLUSTER_OVERLAP);
  }
  const countBadge = members.length > 1 ? buildCountBadge(members.length) : '';
  const cityLabel = buildCityLabel(group.city, darkMode);

  const html = `<div style="position:relative;width:${totalW}px;height:${totalH}px;">${avatarsHtml}${countBadge}${cityLabel}</div>`;

  return L.divIcon({
    html,
    className: '',
    iconSize: [totalW, totalH],
    iconAnchor: [totalW / 2, AVATAR / 2],
    popupAnchor: [0, -(AVATAR / 2 + 26)],
  });
}

// ─── Bottom Sheet (with swipe-to-close) ──────────────────────────────────────
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
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number>(0);
  const dragCurrentY = useRef<number>(0);

  // Swipe-to-close
  const onTouchStart = (e: TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    dragCurrentY.current = e.touches[0].clientY;
  };
  const onTouchMove = (e: TouchEvent) => {
    dragCurrentY.current = e.touches[0].clientY;
    const delta = dragCurrentY.current - dragStartY.current;
    if (delta > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${delta}px)`;
    }
  };
  const onTouchEnd = () => {
    const delta = dragCurrentY.current - dragStartY.current;
    if (sheetRef.current) {
      sheetRef.current.style.transform = '';
    }
    if (delta > 80) onClose();
  };

  if (!group) return null;

  const bg = darkMode
    ? 'bg-[#121829]/97 border-white/10'
    : 'bg-white/97 border-[#1552ab]/10';
  const textPrimary = darkMode ? 'text-white' : 'text-[#1552ab]';
  const textSub = darkMode ? 'text-white/50' : 'text-[#1552ab]/50';
  const cardBg = darkMode
    ? 'bg-white/5 hover:bg-white/10 active:bg-white/15'
    : 'bg-[#1552ab]/4 hover:bg-[#1552ab]/8 active:bg-[#1552ab]/12';

  const sorted = [...group.members].sort(
    (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity)
  );

  return (
    <div
      ref={sheetRef}
      className={`
        absolute bottom-0 left-0 right-0 z-[1001]
        ${bg} border-t backdrop-blur-2xl
        rounded-t-[28px] shadow-2xl
        els-slide-up
        flex flex-col
        transition-transform duration-200
        max-h-[55%] landscape:max-h-[70%] sm:max-h-[45%] md:max-h-[40%]
      `}
    >
      {/* Drag handle area */}
      <div
        className="flex-shrink-0 flex flex-col items-center pt-3 pb-1 cursor-grab active:cursor-grabbing select-none touch-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="w-10 h-1 rounded-full bg-current opacity-20" />
      </div>

      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-1 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`font-bold text-base leading-tight ${textPrimary}`}>
              {group.city}{group.country ? `, ${group.country}` : ''}
            </h3>
            <p className={`text-xs mt-0.5 ${textSub}`}>
              {group.members.length} participant{group.members.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${
              darkMode ? 'bg-white/10 text-white' : 'bg-[#1552ab]/8 text-[#1552ab]'
            }`}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Participant list */}
      <div className="overflow-y-auto px-5 pb-6 space-y-2.5 flex-1">
        {sorted.map((p) => {
          const name = p.name || p.registered_name || '—';
          const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
          const roles = p.role_tags?.length ? p.role_tags : p.role ? [p.role] : [];

          return (
            <button
              key={p.id}
              onClick={() => onSelectParticipant(p)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${cardBg}`}
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
                {p.photo_url ? (
                  <img src={p.photo_url} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-sm">{initials}</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm truncate ${textPrimary}`}>{name}</p>
                {roles.length > 0 && (
                  <p className={`text-xs truncate mt-0.5 ${textSub}`}>
                    {roles.slice(0, 2).join(' · ')}
                  </p>
                )}
                {p.organization && (
                  <p className={`text-[10px] truncate mt-0.5 ${textSub} opacity-70`}>
                    {p.organization}
                  </p>
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

// ─── Bio Overlay (full profile) ───────────────────────────────────────────────
interface BioOverlayProps {
  participant: Participant | null;
  onClose: () => void;
  darkMode: boolean;
}

const BioOverlay: React.FC<BioOverlayProps> = ({ participant: p, onClose, darkMode }) => {
  if (!p) return null;

  const name = p.name || p.registered_name || '—';
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const roles = p.role_tags?.length ? p.role_tags : p.role ? [p.role] : [];

  const locationParts = [p.city, p.state, p.country].filter(Boolean);
  const hasContact = p.public_phone || p.public_email || p.public_website || p.public_other;
  const hasSocial = p.social_media && p.social_media.length > 0;

  const textPrimary = darkMode ? 'text-white' : 'text-[#1552ab]';
  const textSub = darkMode ? 'text-white/60' : 'text-[#1552ab]/60';
  const textMuted = darkMode ? 'text-white/40' : 'text-[#1552ab]/40';
  const divider = darkMode ? 'border-white/8' : 'border-[#1552ab]/8';
  const chipBg = darkMode ? 'bg-white/10 text-white/90' : 'bg-[#1552ab]/8 text-[#1552ab]';
  const chipBgAccent = darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-[#1552ab]/12 text-[#1552ab]';

  // Label helper
  const SectionLabel = ({ label }: { label: string }) => (
    <p className={`text-[10px] font-bold uppercase tracking-widest ${textMuted} mb-1.5`}>
      {label}
    </p>
  );

  return (
    <div
      className={`
        absolute inset-0 z-[1002] flex flex-col
        ${darkMode ? 'bg-[#0d1220]/98' : 'bg-[#f7f8fc]/98'}
        backdrop-blur-2xl overflow-hidden
        els-fade-in
      `}
    >
      {/* Sticky header */}
      <div
        className={`flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b ${divider} backdrop-blur-xl
          ${darkMode ? 'bg-[#0d1220]/90' : 'bg-[#f7f8fc]/90'}
          sm:px-6
        `}
      >
        <button
          onClick={onClose}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 flex-shrink-0 ${
            darkMode ? 'bg-white/10 text-white' : 'bg-[#1552ab]/8 text-[#1552ab]'
          }`}
          aria-label="Close profile"
        >
          <X size={16} />
        </button>
        <span className={`text-xs font-bold uppercase tracking-widest ${textMuted}`}>
          Participant Profile
        </span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Promo / cover image */}
        {p.promotional_picture_url && (
          <div className="w-full h-36 sm:h-48 overflow-hidden flex-shrink-0">
            <img
              src={p.promotional_picture_url}
              alt="Organization banner"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Hero section */}
        <div className="px-5 pt-5 pb-4 sm:px-8 sm:pt-6">
          {/* Portrait layout on mobile, row on tablet */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:gap-6">
            {/* Photo */}
            <div
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center mx-auto sm:mx-0 mb-4 sm:mb-0"
              style={{
                background: BRAND_BLUE,
                border: `3px solid ${darkMode ? 'rgba(255,255,255,0.25)' : 'rgba(27,82,169,0.2)'}`,
                boxShadow: '0 6px 24px rgba(27,82,169,0.25)',
              }}
            >
              {p.photo_url ? (
                <img src={p.photo_url} alt={name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-3xl sm:text-4xl">{initials}</span>
              )}
            </div>

            {/* Name + meta */}
            <div className="text-center sm:text-left flex-1">
              <h2 className={`font-bold text-2xl sm:text-3xl leading-tight ${textPrimary}`}>
                {name}
              </h2>

              {/* Role tags */}
              {roles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 justify-center sm:justify-start">
                  {roles.map((r, i) => (
                    <span key={i} className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${chipBgAccent}`}>
                      {r}
                    </span>
                  ))}
                </div>
              )}

              {/* Location */}
              {locationParts.length > 0 && (
                <div className={`flex items-center gap-1.5 mt-2 text-sm ${textSub} justify-center sm:justify-start`}>
                  <MapPin size={13} className="flex-shrink-0" />
                  <span>{locationParts.join(', ')}</span>
                </div>
              )}

              {/* Nationality */}
              {p.nationality && (
                <p className={`text-xs mt-1 ${textMuted}`}>
                  🌍 {p.nationality}
                </p>
              )}

              {/* Distance */}
              {p.distanceKm !== undefined && (
                <div className={`inline-flex items-center gap-1 mt-2 text-[10px] font-bold uppercase tracking-wide ${
                  darkMode ? 'text-blue-300/80' : 'text-[#1552ab]/50'
                }`}>
                  <Navigation size={9} />
                  {formatDistance(p.distanceKm)} de você
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="px-5 sm:px-8 pb-10 space-y-5">

          {/* Short bio */}
          {p.short_bio && (
            <div className={`border-t ${divider} pt-4`}>
              <SectionLabel label="Bio" />
              <p className={`text-sm leading-relaxed ${textSub}`}>{p.short_bio}</p>
            </div>
          )}

          {/* Organization */}
          {(p.organization || p.org_description) && (
            <div className={`border-t ${divider} pt-4`}>
              <SectionLabel label="Organization" />
              {p.organization && (
                <div className={`flex items-center gap-2 font-semibold text-sm ${textPrimary} mb-1`}>
                  <Building2 size={14} className="flex-shrink-0 opacity-60" />
                  {p.organization}
                </div>
              )}
              {p.org_description && (
                <p className={`text-sm leading-relaxed ${textSub} mt-1`}>{p.org_description}</p>
              )}
            </div>
          )}

          {/* Areas of interest */}
          {p.areas_of_interest?.length ? (
            <div className={`border-t ${divider} pt-4`}>
              <SectionLabel label="Areas of Interest" />
              <div className="flex flex-wrap gap-2">
                {p.areas_of_interest.map((area) => (
                  <span key={area} className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${chipBg}`}>
                    {area}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Languages */}
          {p.languages_spoken?.length ? (
            <div className={`border-t ${divider} pt-4`}>
              <SectionLabel label="Languages" />
              <div className={`flex items-center gap-2 ${textSub}`}>
                <Languages size={13} className="flex-shrink-0 opacity-60" />
                <span className="text-sm">{p.languages_spoken.join(', ')}</span>
              </div>
            </div>
          ) : null}

          {/* Contact */}
          {hasContact && (
            <div className={`border-t ${divider} pt-4`}>
              <SectionLabel label="Contact" />
              <div className="space-y-2.5">
                {p.public_phone && (
                  <a
                    href={`tel:${p.public_phone}`}
                    className={`flex items-center gap-3 text-sm ${textSub} hover:opacity-80 active:opacity-60 transition-opacity`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${chipBg}`}>
                      <Phone size={13} />
                    </div>
                    <span>{p.public_phone}</span>
                  </a>
                )}
                {p.public_email && (
                  <a
                    href={`mailto:${p.public_email}`}
                    className={`flex items-center gap-3 text-sm ${darkMode ? 'text-blue-300' : 'text-[#1552ab]'} hover:opacity-80 active:opacity-60 transition-opacity`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${chipBg}`}>
                      <Mail size={13} />
                    </div>
                    <span className="truncate">{p.public_email}</span>
                  </a>
                )}
                {p.public_website && (
                  <a
                    href={p.public_website.startsWith('http') ? p.public_website : `https://${p.public_website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 text-sm ${darkMode ? 'text-blue-300' : 'text-[#1552ab]'} hover:opacity-80 active:opacity-60 transition-opacity`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${chipBg}`}>
                      <Globe size={13} />
                    </div>
                    <span className="truncate">{p.public_website.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}
                {p.public_other && (
                  <div className={`flex items-center gap-3 text-sm ${textSub}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${chipBg}`}>
                      <Link size={13} />
                    </div>
                    <span className="truncate">{p.public_other}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Social media */}
          {hasSocial && (
            <div className={`border-t ${divider} pt-4`}>
              <SectionLabel label="Social Media" />
              <div className="space-y-2">
                {p.social_media!.map((s, i) => (
                  <div key={i} className={`flex items-center gap-2 text-sm ${textSub}`}>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${chipBg}`}>
                      {s.platform}
                    </span>
                    <span className="truncate">{s.handle}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
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

  // ── Groups + distances ───────────────────────────────────────────────────────
  const groups = useMemo<PinGroup[]>(() => {
    const completed = participants.filter(
      (p) => p.status === 'completed' && !p.hide_on_map
    );
    const enriched: Participant[] = completed.map((p) => {
      if (!viewerCoords) return p;
      const coords = getCoords((p.city || '').trim(), (p.country || '').trim());
      if (!coords) return p;
      return {
        ...p,
        distanceKm: haversineKm(viewerCoords[0], viewerCoords[1], coords[0], coords[1]),
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
        byKey.set(key, { lat: coords[0], lng: coords[1], city, country, members: [p] });
      }
    }

    for (const g of byKey.values()) {
      g.members.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    }

    return Array.from(byKey.values());
  }, [participants, viewerCoords]);

  // Stats
  const stats = useMemo(() => {
    const completed = participants.filter((p) => p.status === 'completed' && !p.hide_on_map);
    const countries = new Set(completed.map((p) => p.country).filter(Boolean));
    return { leaders: completed.length, countries: countries.size };
  }, [participants]);

  // ── Tile layer ───────────────────────────────────────────────────────────────
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
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (tileLayerRef.current) map.removeLayer(tileLayerRef.current);
    const tileUrl = darkMode
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    const layer = L.tileLayer(tileUrl, {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    });
    layer.addTo(map);
    tileLayerRef.current = layer;
  }, [darkMode]);

  // ── Markers ──────────────────────────────────────────────────────────────────
  const handleGroupClick = useCallback((group: PinGroup) => {
    setActiveGroup(group);
    setSelectedProfile(null);
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];
    for (const group of groups) {
      const icon = buildGroupIcon(group, darkMode);
      const marker = L.marker([group.lat, group.lng], { icon });
      marker.on('click', () => {
        map.panTo([group.lat, group.lng], { animate: true, duration: 0.4 });
        handleGroupClick(group);
      });
      marker.addTo(map);
      markersRef.current.push(marker);
    }
  }, [groups, darkMode, handleGroupClick]);

  const closeAll = () => {
    setActiveGroup(null);
    setSelectedProfile(null);
  };

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border border-[#1552ab]/15 dark:border-white/10 shadow-card"
      style={{ fontFamily: 'system-ui, sans-serif' }}
    >
      {/* Stats badge */}
      <div
        className="absolute top-3 left-3 z-[1000] flex items-center gap-2
          bg-white/90 dark:bg-[#121829]/95 backdrop-blur border border-[#1552ab]/15 dark:border-white/15
          rounded-full px-3 py-1.5 shadow-sm"
      >
        <MapPin size={11} className="text-[#1b52a9] dark:text-white opacity-70" />
        <span className="text-[10px] font-bold text-[#1b52a9] dark:text-white uppercase tracking-wider">
          {stats.leaders} leader{stats.leaders !== 1 ? 's' : ''}
        </span>
        <span className="text-[#1552ab]/30 dark:text-white/30">·</span>
        <span className="text-[10px] font-bold text-[#1b52a9] dark:text-white uppercase tracking-wider">
          {stats.countries} countr{stats.countries !== 1 ? 'ies' : 'y'}
        </span>
      </div>

      {/* Map container — responsive height */}
      <div
        ref={containerRef}
        className="w-full"
        style={{
          height: 'clamp(300px, 50vw, 520px)',
        }}
      />

      {/* Empty state */}
      {groups.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#efefef]/80 dark:bg-[#0a0f1d]/85 backdrop-blur-sm z-[999] pointer-events-none">
          <MapPin size={28} className="text-[#1552ab]/30 dark:text-white/30 mb-3" />
          <p className="text-sm text-[#1552ab]/60 dark:text-white/60 font-bold uppercase tracking-widest text-center px-8">
            No mapped participants yet.
          </p>
          <p className="text-[11px] text-[#1552ab]/40 dark:text-white/40 mt-1 text-center px-8">
            Participants appear here once they complete their bio with a city.
          </p>
        </div>
      )}

      {/* Bottom Sheet */}
      {!selectedProfile && (
        <BottomSheet
          group={activeGroup}
          onClose={closeAll}
          onSelectParticipant={(p) => setSelectedProfile(p)}
          darkMode={darkMode}
        />
      )}

      {/* Full Bio Overlay */}
      <BioOverlay
        participant={selectedProfile}
        onClose={() => setSelectedProfile(null)}
        darkMode={darkMode}
      />

      {/* Animations */}
      <style>{`
        @keyframes elsSlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }
        .els-slide-up { animation: elsSlideUp 0.32s cubic-bezier(0.32, 0.72, 0, 1) both; }

        @keyframes elsFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .els-fade-in { animation: elsFadeIn 0.2s ease both; }

        @media (orientation: landscape) and (max-width: 900px) {
          .els-map-container { height: clamp(220px, 38vh, 380px) !important; }
        }
      `}</style>
    </div>
  );
};

export default ParticipantMap;
