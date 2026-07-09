/**
 * Cross-platform store navigation (client-side only).
 *
 * Strategy: native map app first, web URL fallback.
 * Destinations always use latitude/longitude — never address geocoding.
 */

export type NavigationPlatform = "ios" | "android" | "desktop";

/** Delay before assuming the native app did not open. */
const APP_FALLBACK_DELAY_MS = 1500;

function assertClient(): void {
  if (typeof window === "undefined") {
    throw new Error("navigateToLocation must be called on the client");
  }
}

/**
 * Platform detection via user agent.
 * iPad on iOS 13+ may report "MacIntel"; touch points check covers that case.
 */
export function detectNavigationPlatform(): NavigationPlatform {
  if (typeof navigator === "undefined") {
    return "desktop";
  }

  const ua = navigator.userAgent || "";

  const isIOS =
    /iPad|iPhone|iPod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  if (isIOS) {
    return "ios";
  }

  if (/Android/i.test(ua)) {
    return "android";
  }

  return "desktop";
}

function formatCoordinates(lat: number, lng: number): string {
  return `${lat},${lng}`;
}

/** Apple Maps app deep link (maps:// URL scheme). */
export function buildAppleMapsAppUrl(
  lat: number,
  lng: number,
  label?: string,
): string {
  const params = new URLSearchParams({
    daddr: formatCoordinates(lat, lng),
    dirflg: "d",
  });

  if (label) {
    params.set("q", label);
  }

  return `maps://?${params.toString()}`;
}

/** Apple Maps web fallback. */
export function buildAppleMapsWebUrl(
  lat: number,
  lng: number,
  label?: string,
): string {
  const params = new URLSearchParams({
    daddr: formatCoordinates(lat, lng),
    dirflg: "d",
  });

  if (label) {
    params.set("q", label);
  }

  return `https://maps.apple.com/?${params.toString()}`;
}

/** Google Maps web directions URL (desktop + universal fallback). */
export function buildGoogleMapsWebUrl(
  lat: number,
  lng: number,
  _label?: string,
): string {
  const params = new URLSearchParams({
    api: "1",
    destination: formatCoordinates(lat, lng),
    travelmode: "driving",
    dir_action: "navigate",
  });

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/**
 * Android intent URL — opens Google Maps app when installed.
 * `S.browser_fallback_url` opens the web URL when the app is unavailable.
 */
export function buildGoogleMapsAndroidIntentUrl(
  lat: number,
  lng: number,
  label?: string,
): string {
  const destination = encodeURIComponent(formatCoordinates(lat, lng));
  const webFallback = encodeURIComponent(
    buildGoogleMapsWebUrl(lat, lng, label),
  );

  return (
    `intent://www.google.com/maps/dir/?api=1&destination=${destination}` +
    `&travelmode=driving#Intent;scheme=https;` +
    `package=com.google.android.apps.maps;` +
    `S.browser_fallback_url=${webFallback};end`
  );
}

/** Web URL used for href progressive enhancement (no-JS fallback). */
export function getNavigationWebFallbackUrl(
  lat: number,
  lng: number,
  label?: string,
): string {
  if (detectNavigationPlatform() === "ios") {
    return buildAppleMapsWebUrl(lat, lng, label);
  }

  return buildGoogleMapsWebUrl(lat, lng, label);
}

function openWebUrl(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Tries a native app deep link first. If the page stays visible (app did not open),
 * opens the web fallback in a new tab after a short delay.
 */
function openWithAppFallback(appUrl: string, webUrl: string): void {
  let fallbackTimer: number | undefined;
  let cancelled = false;

  const cancelFallback = () => {
    if (cancelled) {
      return;
    }
    cancelled = true;
    if (fallbackTimer !== undefined) {
      window.clearTimeout(fallbackTimer);
    }
  };

  const onVisibilityChange = () => {
    if (document.hidden) {
      cancelFallback();
    }
  };

  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("pagehide", cancelFallback, { once: true });
  window.addEventListener("blur", cancelFallback, { once: true });

  fallbackTimer = window.setTimeout(() => {
    document.removeEventListener("visibilitychange", onVisibilityChange);
    if (!cancelled) {
      cancelled = true;
      openWebUrl(webUrl);
    }
  }, APP_FALLBACK_DELAY_MS);

  window.location.assign(appUrl);
}

/**
 * Opens navigation to the given coordinates.
 *
 * - iOS: Apple Maps app → Apple Maps web
 * - Android: Google Maps intent/app → Google Maps web
 * - Desktop: Google Maps web (new tab)
 */
export function navigateToLocation(
  lat: number,
  lng: number,
  label?: string,
): void {
  assertClient();

  const platform = detectNavigationPlatform();

  if (platform === "desktop") {
    openWebUrl(buildGoogleMapsWebUrl(lat, lng, label));
    return;
  }

  if (platform === "ios") {
    openWithAppFallback(
      buildAppleMapsAppUrl(lat, lng, label),
      buildAppleMapsWebUrl(lat, lng, label),
    );
    return;
  }

  // Android: intent URL opens Google Maps; browser_fallback_url handles missing app.
  openWithAppFallback(
    buildGoogleMapsAndroidIntentUrl(lat, lng, label),
    buildGoogleMapsWebUrl(lat, lng, label),
  );
}
