/**
 * geo-utils.ts
 * Local city→coordinates lookup for the Participant Map.
 * No external geocoding API is called at runtime.
 *
 * Keys are lowercase "city, country" strings for fast O(1) lookup.
 * Coordinates are [lat, lng] WGS-84 decimal degrees.
 */

export type LatLng = [number, number];

// ─── Lookup table ──────────────────────────────────────────────────────────────
// Format: "city, country name" (both lowercase) → [lat, lng]
const CITY_COORDS: Record<string, LatLng> = {

  // ── European Capitals & Major Cities ────────────────────────────────────────
  'madrid, spain':           [40.4168, -3.7038],
  'barcelona, spain':        [41.3851, 2.1734],
  'seville, spain':          [37.3891, -5.9845],
  'valencia, spain':         [39.4699, -0.3763],
  'bilbao, spain':           [43.2630, -2.9349],
  'malaga, spain':           [36.7213, -4.4214],
  'lisbon, portugal':        [38.7223, -9.1393],
  'porto, portugal':         [41.1579, -8.6291],
  'braga, portugal':         [41.5518, -8.4229],
  'paris, france':           [48.8566, 2.3522],
  'lyon, france':            [45.7640, 4.8357],
  'marseille, france':       [43.2965, 5.3698],
  'bordeaux, france':        [44.8378, -0.5792],
  'toulouse, france':        [43.6047, 1.4442],
  'london, united kingdom':  [51.5074, -0.1278],
  'london, uk':              [51.5074, -0.1278],
  'manchester, united kingdom': [53.4808, -2.2426],
  'birmingham, united kingdom': [52.4862, -1.8904],
  'berlin, germany':         [52.5200, 13.4050],
  'munich, germany':         [48.1351, 11.5820],
  'hamburg, germany':        [53.5753, 10.0153],
  'frankfurt, germany':      [50.1109, 8.6821],
  'cologne, germany':        [50.9333, 6.9500],
  'düsseldorf, germany':     [51.2217, 6.7762],
  'rome, italy':             [41.9028, 12.4964],
  'milan, italy':            [45.4642, 9.1900],
  'naples, italy':           [40.8518, 14.2681],
  'amsterdam, netherlands':  [52.3676, 4.9041],
  'rotterdam, netherlands':  [51.9244, 4.4777],
  'brussels, belgium':       [50.8503, 4.3517],
  'antwerp, belgium':        [51.2194, 4.4025],
  'zurich, switzerland':     [47.3769, 8.5417],
  'geneva, switzerland':     [46.2044, 6.1432],
  'vienna, austria':         [48.2082, 16.3738],
  'warsaw, poland':          [52.2297, 21.0122],
  'krakow, poland':          [50.0647, 19.9450],
  'prague, czech republic':  [50.0755, 14.4378],
  'budapest, hungary':       [47.4979, 19.0402],
  'bucharest, romania':      [44.4268, 26.1025],
  'cluj-napoca, romania':    [46.7712, 23.6236],
  'timisoara, romania':      [45.7537, 21.2257],
  'sofia, bulgaria':         [42.6977, 23.3219],
  'athens, greece':          [37.9838, 23.7275],
  'thessaloniki, greece':    [40.6401, 22.9444],
  'stockholm, sweden':       [59.3293, 18.0686],
  'gothenburg, sweden':      [57.7089, 11.9746],
  'oslo, norway':            [59.9139, 10.7522],
  'helsinki, finland':       [60.1699, 24.9384],
  'copenhagen, denmark':     [55.6761, 12.5683],
  'reykjavik, iceland':      [64.1265, -21.8174],
  'dublin, ireland':         [53.3498, -6.2603],
  'belfast, united kingdom': [54.5973, -5.9301],
  'edinburgh, united kingdom': [55.9533, -3.1883],
  'cardiff, united kingdom': [51.4816, -3.1791],
  'valletta, malta':         [35.8997, 14.5147],
  'nicosia, cyprus':         [35.1856, 33.3823],
  'zagreb, croatia':         [45.8150, 15.9819],
  'split, croatia':          [43.5081, 16.4402],
  'belgrade, serbia':        [44.8176, 20.4633],
  'sarajevo, bosnia and herzegovina': [43.8563, 18.4131],
  'tirana, albania':         [41.3275, 19.8187],
  'skopje, north macedonia': [41.9981, 21.4254],
  'podgorica, montenegro':   [42.4304, 19.2594],
  'pristina, kosovo':        [42.6629, 21.1655],
  'vilnius, lithuania':      [54.6872, 25.2797],
  'riga, latvia':            [56.9460, 24.1059],
  'tallinn, estonia':        [59.4370, 24.7536],
  'minsk, belarus':          [53.9045, 27.5615],
  'kyiv, ukraine':           [50.4501, 30.5234],
  'chisinau, moldova':       [47.0105, 28.8638],

  // ── Americas ──────────────────────────────────────────────────────────────────
  'new york, united states': [40.7128, -74.0060],
  'los angeles, united states': [34.0522, -118.2437],
  'miami, united states':    [25.7617, -80.1918],
  'chicago, united states':  [41.8781, -87.6298],
  'houston, united states':  [29.7604, -95.3698],
  'dallas, united states':   [32.7767, -96.7970],
  'atlanta, united states':  [33.7490, -84.3880],
  'washington, united states': [38.9072, -77.0369],
  'toronto, canada':         [43.6510, -79.3470],
  'montreal, canada':        [45.5017, -73.5673],
  'vancouver, canada':       [49.2827, -123.1207],
  'sao paulo, brazil':       [-23.5505, -46.6333],
  'rio de janeiro, brazil':  [-22.9068, -43.1729],
  'brasilia, brazil':        [-15.7801, -47.9292],
  'belo horizonte, brazil':  [-19.9167, -43.9345],
  'fortaleza, brazil':       [-3.7172, -38.5433],
  'recife, brazil':          [-8.0476, -34.8770],
  'salvador, brazil':        [-12.9714, -38.5014],
  'buenos aires, argentina': [-34.6037, -58.3816],
  'bogota, colombia':        [4.7110, -74.0721],
  'medellín, colombia':      [6.2442, -75.5812],
  'lima, peru':              [-12.0464, -77.0428],
  'santiago, chile':         [-33.4489, -70.6693],
  'caracas, venezuela':      [10.4806, -66.9036],
  'mexico city, mexico':     [19.4326, -99.1332],
  'guadalajara, mexico':     [20.6597, -103.3496],
  'montevideo, uruguay':     [-34.9011, -56.1645],
  'asuncion, paraguay':      [-25.2867, -57.6470],
  'la paz, bolivia':         [-16.5000, -68.1500],
  'quito, ecuador':          [-0.1807, -78.4678],
  'panama city, panama':     [8.9936, -79.5197],
  'san jose, costa rica':    [9.9281, -84.0907],
  'havana, cuba':            [23.1136, -82.3666],

  // ── Africa ────────────────────────────────────────────────────────────────────
  'lagos, nigeria':          [6.5244, 3.3792],
  'abuja, nigeria':          [9.0765, 7.3986],
  'port harcourt, nigeria':  [4.7699, 7.0498],
  'kano, nigeria':           [11.9964, 8.5170],
  'accra, ghana':            [5.6037, -0.1870],
  'nairobi, kenya':          [-1.2921, 36.8219],
  'mombasa, kenya':          [-4.0435, 39.6682],
  'johannesburg, south africa': [-26.2041, 28.0473],
  'cape town, south africa': [-33.9249, 18.4241],
  'durban, south africa':    [-29.8587, 31.0218],
  'pretoria, south africa':  [-25.7461, 28.1881],
  'cairo, egypt':            [30.0444, 31.2357],
  'casablanca, morocco':     [33.5731, -7.5898],
  'rabat, morocco':          [34.0209, -6.8416],
  'tunis, tunisia':          [36.8065, 10.1815],
  'algiers, algeria':        [36.7372, 3.0865],
  'tripoli, libya':          [32.8872, 13.1913],
  'addis ababa, ethiopia':   [9.0320, 38.7469],
  'kampala, uganda':         [0.3476, 32.5825],
  'dar es salaam, tanzania': [-6.7924, 39.2083],
  'kigali, rwanda':          [-1.9441, 30.0619],
  'lusaka, zambia':          [-15.4167, 28.2833],
  'harare, zimbabwe':        [-17.8252, 31.0335],
  'kinshasa, democratic republic of the congo': [-4.4419, 15.2663],
  'luanda, angola':          [-8.8368, 13.2343],
  'dakar, senegal':          [14.7167, -17.4677],
  'bamako, mali':            [12.6392, -8.0029],
  'abidjan, ivory coast':    [5.3600, -4.0083],
  'douala, cameroon':        [4.0511, 9.7679],
  'yaounde, cameroon':       [3.8480, 11.5021],
  'maputo, mozambique':      [-25.9692, 32.5732],
  'libreville, gabon':       [0.3901, 9.4544],

  // ── Middle East ───────────────────────────────────────────────────────────────
  'istanbul, turkey':        [41.0082, 28.9784],
  'ankara, turkey':          [39.9334, 32.8597],
  'tel aviv, israel':        [32.0853, 34.7818],
  'jerusalem, israel':       [31.7683, 35.2137],
  'beirut, lebanon':         [33.8938, 35.5018],
  'amman, jordan':           [31.9522, 35.9333],
  'dubai, united arab emirates': [25.2048, 55.2708],
  'abu dhabi, united arab emirates': [24.4539, 54.3773],
  'riyadh, saudi arabia':    [24.6877, 46.7219],
  'doha, qatar':             [25.2854, 51.5310],

  // ── Asia-Pacific ──────────────────────────────────────────────────────────────
  'delhi, india':            [28.6139, 77.2090],
  'mumbai, india':           [19.0760, 72.8777],
  'bangalore, india':        [12.9716, 77.5946],
  'chennai, india':          [13.0827, 80.2707],
  'hyderabad, india':        [17.3850, 78.4867],
  'kolkata, india':          [22.5726, 88.3639],
  'beijing, china':          [39.9042, 116.4074],
  'shanghai, china':         [31.2304, 121.4737],
  'guangzhou, china':        [23.1291, 113.2644],
  'tokyo, japan':            [35.6762, 139.6503],
  'osaka, japan':            [34.6937, 135.5023],
  'seoul, south korea':      [37.5665, 126.9780],
  'singapore, singapore':    [1.3521, 103.8198],
  'jakarta, indonesia':      [-6.2088, 106.8456],
  'manila, philippines':     [14.5995, 120.9842],
  'kuala lumpur, malaysia':  [3.1390, 101.6869],
  'bangkok, thailand':       [13.7563, 100.5018],
  'ho chi minh city, vietnam': [10.8231, 106.6297],
  'sydney, australia':       [-33.8688, 151.2093],
  'melbourne, australia':    [-37.8136, 144.9631],
  'perth, australia':        [-31.9505, 115.8605],
  'auckland, new zealand':   [-36.8485, 174.7633],
};

// ─── Lookup function ───────────────────────────────────────────────────────────

/**
 * Returns [lat, lng] for a given city + country pair, or null if not found.
 * Matching is case-insensitive and strips extra whitespace.
 */
export function getCoords(city: string, country: string): LatLng | null {
  if (!city && !country) return null;

  // Try "city, country" exact key first
  const key = `${city.trim().toLowerCase()}, ${country.trim().toLowerCase()}`;
  if (CITY_COORDS[key]) return CITY_COORDS[key];

  // If city alone matches (useful for unique capitals)
  const cityOnly = city.trim().toLowerCase();
  for (const [k, v] of Object.entries(CITY_COORDS)) {
    if (k.split(',')[0].trim() === cityOnly) return v;
  }

  // Country centroid fallback (rough, only if country alone given)
  if (!city && country) {
    const countryOnly = country.trim().toLowerCase();
    for (const [k, v] of Object.entries(CITY_COORDS)) {
      if (k.includes(countryOnly)) return v;
    }
  }

  return null;
}
