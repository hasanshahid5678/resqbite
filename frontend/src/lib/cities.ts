// Curated list of major Turkish cities with their approximate center coordinates.
// Used by the location picker for manual city search AND reverse-matching
// GPS coordinates to the nearest known city.

export interface City {
  name: string;
  lat: number;
  lng: number;
}

export const CITIES: City[] = [
  { name: "Istanbul", lat: 41.0082, lng: 28.9784 },
  { name: "Ankara", lat: 39.9334, lng: 32.8597 },
  { name: "Izmir", lat: 38.4192, lng: 27.1287 },
  { name: "Bursa", lat: 40.1828, lng: 29.0665 },
  { name: "Antalya", lat: 36.8969, lng: 30.7133 },
  { name: "Konya", lat: 37.8714, lng: 32.4847 },
  { name: "Adana", lat: 37.0000, lng: 35.3213 },
  { name: "Gaziantep", lat: 37.0662, lng: 37.3833 },
  { name: "Mersin", lat: 36.8000, lng: 34.6333 },
  { name: "Kayseri", lat: 38.7333, lng: 35.4833 },
  { name: "Eskisehir", lat: 39.7769, lng: 30.5206 },
  { name: "Diyarbakir", lat: 37.9144, lng: 40.2306 },
  { name: "Samsun", lat: 41.2867, lng: 36.3300 },
  { name: "Denizli", lat: 37.7765, lng: 29.0871 },
  { name: "Sanliurfa", lat: 37.1674, lng: 38.7955 },
  { name: "Malatya", lat: 38.3552, lng: 38.3095 },
  { name: "Trabzon", lat: 41.0027, lng: 39.7168 },
  { name: "Erzurum", lat: 39.9043, lng: 41.2679 },
  { name: "Van", lat: 38.4942, lng: 43.3800 },
  { name: "Manisa", lat: 38.6191, lng: 27.4289 },
  { name: "Sivas", lat: 39.7477, lng: 37.0129 },
  { name: "Kahramanmaras", lat: 37.5858, lng: 36.9371 },
  { name: "Aydin", lat: 37.8394, lng: 27.8456 },
  { name: "Balikesir", lat: 39.6484, lng: 27.8826 },
  { name: "Hatay", lat: 36.4018, lng: 36.3498 },
  { name: "Sakarya", lat: 40.7569, lng: 30.3781 },
  { name: "Tekirdag", lat: 40.9833, lng: 27.5297 },
  { name: "Mugla", lat: 37.2142, lng: 28.3636 },
  { name: "Kocaeli", lat: 40.8533, lng: 29.8815 },
  { name: "Canakkale", lat: 40.1553, lng: 26.4142 },
];

export function searchCities(query: string, limit = 8): City[] {
  const q = query.trim().toLowerCase();
  if (!q) return CITIES.slice(0, limit);
  return CITIES.filter((c) => c.name.toLowerCase().includes(q)).slice(0, limit);
}

/**
 * Given a GPS coordinate, find the nearest city in our curated list
 * using haversine distance. Always returns a city — even if far away,
 * we pick the closest so the customer still gets *something*.
 */
export function nearestCity(lat: number, lng: number): City {
  let nearest = CITIES[0];
  let nearestDist = Number.POSITIVE_INFINITY;
  const toRad = (d: number) => (d * Math.PI) / 180;
  for (const c of CITIES) {
    const dLat = toRad(c.lat - lat);
    const dLng = toRad(c.lng - lng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat)) * Math.cos(toRad(c.lat)) * Math.sin(dLng / 2) ** 2;
    const d = 2 * 6371 * Math.asin(Math.sqrt(a));
    if (d < nearestDist) {
      nearestDist = d;
      nearest = c;
    }
  }
  return nearest;
}