import type { Store } from "@/types/store";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface StoreWithDistance extends Store {
  distanceKm: number;
}

const EARTH_RADIUS_KM = 6371;

export function getDistanceKm(
  from: Coordinates,
  to: Coordinates,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

export function findNearestStore(
  stores: Store[],
  userLocation: Coordinates,
): Store | null {
  if (stores.length === 0) return null;

  return stores.reduce<Store>((nearest, store) => {
    const nearestDistance = getDistanceKm(userLocation, nearest);
    const storeDistance = getDistanceKm(userLocation, store);
    return storeDistance < nearestDistance ? store : nearest;
  }, stores[0]);
}

export function attachDistances(
  stores: Store[],
  userLocation: Coordinates,
): StoreWithDistance[] {
  return stores.map((store) => ({
    ...store,
    distanceKm: getDistanceKm(userLocation, store),
  }));
}

export function sortStoresByDistance(
  stores: Store[],
  userLocation: Coordinates,
): StoreWithDistance[] {
  return attachDistances(stores, userLocation).sort(
    (a, b) => a.distanceKm - b.distanceKm,
  );
}

export function filterStores(stores: Store[], query: string): Store[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return stores;

  return stores.filter((store) => {
    const haystack = `${store.name} ${store.address} ${store.phone}`.toLowerCase();
    return haystack.includes(normalized);
  });
}
