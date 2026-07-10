"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Store {
  id: number;
  name: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  placeId?: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface StoreWithDistance extends Store {
  distanceKm: number;
}

export type StoreFocusSource = "list" | "marker" | "locate";

export type MapUiVariant = "normal" | "tech";
export type MapStyleKey = "emap6" | "photo2" | "emap01";

export interface MapStyleConfig {
  label: string;
  icon: string;
  layerCode: string;
  url: string;
  attribution: string;
  maxZoom: number;
  uiVariant: MapUiVariant;
}

// ─── Map styles (NLSC WMTS) ──────────────────────────────────────────────────

export const NLSC_ATTRIBUTION =
  '&copy; <a href="https://maps.nlsc.gov.tw/" target="_blank" rel="noopener noreferrer">內政部國土測繪中心</a>';

const NLSC_WMTS_BASE = "https://wmts.nlsc.gov.tw/wmts";

export function buildNlscWmtsUrl(layerCode: string): string {
  return `${NLSC_WMTS_BASE}/${layerCode}/default/GoogleMapsCompatible/{z}/{y}/{x}`;
}

export const mapStyles: Record<MapStyleKey, MapStyleConfig> = {
  emap6: {
    label: "預設",
    icon: "📍",
    layerCode: "EMAP6",
    url: buildNlscWmtsUrl("EMAP6"),
    attribution: NLSC_ATTRIBUTION,
    maxZoom: 19,
    uiVariant: "normal",
  },
  photo2: {
    label: "衛星影像",
    icon: "🛰",
    layerCode: "PHOTO2",
    url: buildNlscWmtsUrl("PHOTO2"),
    attribution: NLSC_ATTRIBUTION,
    maxZoom: 19,
    uiVariant: "tech",
  },
  emap01: {
    label: "灰階電子地圖",
    icon: "⚡",
    layerCode: "EMAP01",
    url: buildNlscWmtsUrl("EMAP01"),
    attribution: NLSC_ATTRIBUTION,
    maxZoom: 19,
    uiVariant: "tech",
  },
};

export const mapStyleOrder: MapStyleKey[] = ["emap6", "photo2", "emap01"];

// ─── Geo ─────────────────────────────────────────────────────────────────────

const EARTH_RADIUS_KM = 6371;

export function getDistanceKm(from: Coordinates, to: Coordinates): number {
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
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
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

export function createPhoneUrl(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

// ─── Navigation ──────────────────────────────────────────────────────────────

type NavigationPlatform = "ios" | "android" | "desktop";
const APP_FALLBACK_DELAY_MS = 1500;

function detectNavigationPlatform(): NavigationPlatform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  const isIOS =
    /iPad|iPhone|iPod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (isIOS) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

function formatCoordinates(lat: number, lng: number): string {
  return `${lat},${lng}`;
}

function buildAppleMapsAppUrl(lat: number, lng: number, label?: string): string {
  const params = new URLSearchParams({ daddr: formatCoordinates(lat, lng), dirflg: "d" });
  if (label) params.set("q", label);
  return `maps://?${params.toString()}`;
}

function buildGoogleMapsWebUrl(lat: number, lng: number): string {
  const params = new URLSearchParams({
    api: "1",
    destination: formatCoordinates(lat, lng),
    travelmode: "driving",
    dir_action: "navigate",
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function buildGoogleMapsIosAppUrl(lat: number, lng: number): string {
  const params = new URLSearchParams({
    daddr: formatCoordinates(lat, lng),
    directionsmode: "driving",
  });
  return `comgooglemaps://?${params.toString()}`;
}

function buildGoogleMapsAndroidIntentUrl(lat: number, lng: number, label?: string): string {
  const destination = encodeURIComponent(formatCoordinates(lat, lng));
  const webFallback = encodeURIComponent(buildGoogleMapsWebUrl(lat, lng));
  return (
    `intent://www.google.com/maps/dir/?api=1&destination=${destination}` +
    `&travelmode=driving#Intent;scheme=https;` +
    `package=com.google.android.apps.maps;` +
    `S.browser_fallback_url=${webFallback};end`
  );
}

export function getNavigationWebFallbackUrl(
  lat: number,
  lng: number,
  _label?: string,
): string {
  return buildGoogleMapsWebUrl(lat, lng);
}

function openWebUrl(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}

function openWithAppFallback(appUrl: string, webUrl: string): void {
  openWithAppChain([appUrl], webUrl);
}

function openWithAppChain(appUrls: string[], finalWebUrl: string): void {
  let index = 0;

  const tryNext = () => {
    if (index >= appUrls.length) {
      openWebUrl(finalWebUrl);
      return;
    }

    const appUrl = appUrls[index++];
    let fallbackTimer: number | undefined;
    let cancelled = false;

    const cancelFallback = () => {
      if (cancelled) return;
      cancelled = true;
      if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer);
    };

    const onVisibilityChange = () => {
      if (document.hidden) cancelFallback();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", cancelFallback, { once: true });
    window.addEventListener("blur", cancelFallback, { once: true });

    fallbackTimer = window.setTimeout(() => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (!cancelled) {
        cancelled = true;
        tryNext();
      }
    }, APP_FALLBACK_DELAY_MS);

    window.location.assign(appUrl);
  };

  tryNext();
}

export function navigateToLocation(lat: number, lng: number, label?: string): void {
  const platform = detectNavigationPlatform();
  if (platform === "desktop") {
    openWebUrl(buildGoogleMapsWebUrl(lat, lng));
    return;
  }
  if (platform === "ios") {
    openWithAppChain(
      [
        buildGoogleMapsIosAppUrl(lat, lng),
        buildAppleMapsAppUrl(lat, lng, label),
      ],
      buildGoogleMapsWebUrl(lat, lng),
    );
    return;
  }
  openWithAppFallback(
    buildGoogleMapsAndroidIntentUrl(lat, lng, label),
    buildGoogleMapsWebUrl(lat, lng),
  );
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

const GEO_ERROR_MESSAGES = {
  unsupported: "此瀏覽器不支援定位功能",
  permission_denied: "定位權限被拒，請在瀏覽器設定中允許定位後重試",
  timeout: "定位逾時，請確認 GPS 或網路狀態後重試",
  unavailable: "目前無法取得位置，請稍後再試",
  unknown: "定位失敗，請稍後再試",
} as const;

export function useGeolocation() {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const locate = useCallback((): Promise<Coordinates | null> => {
    if (!navigator.geolocation) {
      setError(GEO_ERROR_MESSAGES.unsupported);
      return Promise.resolve(null);
    }

    setIsLocating(true);
    setError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(coords);
          setIsLocating(false);
          resolve(coords);
        },
        (positionError) => {
          const code =
            positionError.code === positionError.PERMISSION_DENIED
              ? "permission_denied"
              : positionError.code === positionError.POSITION_UNAVAILABLE
                ? "unavailable"
                : positionError.code === positionError.TIMEOUT
                  ? "timeout"
                  : "unknown";
          setError(GEO_ERROR_MESSAGES[code]);
          setIsLocating(false);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    });
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { location, error, isLocating, locate, clearError };
}

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type FullscreenMode = "normal" | "native" | "pseudo";

function getNativeFullscreenElement(): Element | null {
  const doc = document as FullscreenDocument;
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

export function useMapFullscreen(targetRef: RefObject<HTMLElement | null>) {
  const [mode, setMode] = useState<FullscreenMode>("normal");
  const isFullscreen = mode !== "normal";

  useEffect(() => {
    const handleFullscreenChange = () => {
      const target = targetRef.current;
      const nativeElement = getNativeFullscreenElement();
      if (target && nativeElement === target) {
        setMode("native");
        return;
      }
      setMode((current) => (current === "native" ? "normal" : current));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, [targetRef]);

  useEffect(() => {
    return () => {
      document.body.classList.remove("map-fullscreen-active");
      targetRef.current?.classList.remove("map-pseudo-fullscreen");
    };
  }, [targetRef]);

  const toggleFullscreen = useCallback(async () => {
    const element = targetRef.current;
    if (!element) return;

    const el = element as FullscreenElement;
    const doc = document as FullscreenDocument;

    if (mode !== "normal") {
      if (mode === "pseudo") {
        document.body.classList.remove("map-fullscreen-active");
        element.classList.remove("map-pseudo-fullscreen");
        setMode("normal");
      } else {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (doc.webkitFullscreenElement && doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        }
        setMode("normal");
      }
      window.dispatchEvent(new Event("resize"));
      return;
    }

    if (element.requestFullscreen || el.webkitRequestFullscreen) {
      try {
        if (element.requestFullscreen) await element.requestFullscreen();
        else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
        setMode("native");
        window.dispatchEvent(new Event("resize"));
        return;
      } catch {
        // fallback below
      }
    }

    document.body.classList.add("map-fullscreen-active");
    element.classList.add("map-pseudo-fullscreen");
    setMode("pseudo");
    window.dispatchEvent(new Event("resize"));
  }, [mode, targetRef]);

  return { isFullscreen, toggleFullscreen };
}
