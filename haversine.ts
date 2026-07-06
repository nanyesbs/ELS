/**
 * haversine.ts
 * Compute great-circle distance between two WGS-84 coordinates.
 */

const R = 6371; // Earth radius in km

/**
 * Returns the distance in km between two lat/lng points.
 * Rounds to 1 decimal place.
 */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Format distance for display.
 * < 1 km  → "< 1 km"
 * < 100   → "X.X km"
 * ≥ 100   → "XXX km"
 */
export function formatDistance(km: number): string {
  if (km < 1) return '< 1 km';
  if (km < 100) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}
