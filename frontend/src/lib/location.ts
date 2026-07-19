import { nearestCity, type City } from "./cities";

export interface CustomerLocation {
  city: string;
  /** Only set when the customer chose "Use my location" via GPS. */
  coords?: { lat: number; lng: number };
  /** ISO timestamp of when the location was saved. */
  savedAt: string;
}

const KEY = "resqbite.customer-location";

export function loadStoredLocation(): CustomerLocation | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.city === "string") {
      return parsed as CustomerLocation;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveStoredLocation(loc: CustomerLocation): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(loc));
  } catch {
    // ignore quota errors
  }
}

export function clearStoredLocation(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

/**
 * Builds the location object to persist based on whether the customer used
 * GPS (we keep coords to show distance) or picked a city manually (no coords).
 */
export function buildLocationFromCity(city: City, coords?: { lat: number; lng: number }): CustomerLocation {
  return {
    city: city.name,
    coords,
    savedAt: new Date().toISOString(),
  };
}

/**
 * Given GPS coordinates, snap to the nearest known city in our curated list.
 * Returns both the matched City and the original coords for distance display.
 */
export function locationFromCoords(lat: number, lng: number): CustomerLocation {
  const city = nearestCity(lat, lng);
  return buildLocationFromCity(city, { lat, lng });
}

/** Tracks whether we've opened the auto-picker this session to avoid re-prompting. */
const SESSION_KEY = "resqbite.location-picker-shown";

export function hasAutoOpenedPicker(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function markAutoOpenedPicker(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // ignore
  }
}