"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { MapContainer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Check,
  Layers,
  LocateFixed,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  X,
} from "lucide-react";
import {
  type Store,
  type Coordinates,
  type StoreFocusSource,
  type StoreRegion,
  type MapStyleKey,
  type MapUiVariant,
  mapStyles,
  mapStyleOrder,
  buildNlscWmtsUrl,
  getNavigationWebFallbackUrl,
  navigateToLocation,
  getStoresBounds,
  STORE_REGION_VIEWPORTS,
} from "./lib";

// ─── Marker animation ────────────────────────────────────────────────────────

function playElementAnimation(element: HTMLElement, className: string) {
  const onEnd = () => {
    element.classList.remove(className);
    element.removeEventListener("animationend", onEnd);
  };

  element.addEventListener("animationend", onEnd);
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
}

function playPinAnimation(marker: L.Marker, className: string) {
  const pin = marker
    .getElement()
    ?.querySelector(".custom-marker-pin") as HTMLElement | null;

  if (!pin) return;

  playElementAnimation(pin, className);
}

/** 點擊 Marker：輕微上下彈跳 */
function bounceMarker(marker: L.Marker) {
  playPinAnimation(marker, "marker-bounce");
}

/** 初次渲染：依序彈跳進場 */
function enterMarker(marker: L.Marker, delayMs = 0, attempt = 0) {
  const pin = marker
    .getElement()
    ?.querySelector(".custom-marker-pin") as HTMLElement | null;

  if (!pin) {
    if (attempt < 10) {
      requestAnimationFrame(() => enterMarker(marker, delayMs, attempt + 1));
    }
    return;
  }

  if (pin.classList.contains("marker-enter")) return;

  pin.style.setProperty("--enter-delay", `${delayMs}ms`);

  const onEnd = () => {
    pin.classList.remove("marker-enter");
    pin.removeEventListener("animationend", onEnd);
  };

  pin.addEventListener("animationend", onEnd);
  pin.classList.add("marker-enter");
}

/** 點擊列表：原地脈衝放大，不上下位移，較不易暈 */
function pulseMarker(marker: L.Marker) {
  playPinAnimation(marker, "marker-pulse");
}

/** 定位成功：科幻風格輻射 ping */
function burstUserLocation(marker: L.Marker, attempt = 0) {
  const root = marker
    .getElement()
    ?.querySelector(".user-location-marker") as HTMLElement | null;

  if (!root) {
    if (attempt < 10) {
      requestAnimationFrame(() => burstUserLocation(marker, attempt + 1));
    }
    return;
  }

  playElementAnimation(root, "user-location-burst");
}

function openPopupWithFade(marker: L.Marker) {
  marker.openPopup();

  const popupEl = marker.getPopup()?.getElement();
  if (!popupEl) return;

  popupEl.classList.remove("popup-fade-in");
  void popupEl.offsetWidth;
  popupEl.classList.add("popup-fade-in");
}

// ─── Map tile layer ──────────────────────────────────────────────────────────

const FADE_DURATION_MS = 400;
const PHOTO_WITH_LABEL_STYLES: MapStyleKey[] = ["photo2"];
const LABEL_OVERLAY_URL = buildNlscWmtsUrl("EMAP2");
const LABEL_OVERLAY_OPACITY = 0.85;

interface MapTileLayerProps {
  styleKey: MapStyleKey;
}

function fadeLayer(
  map: L.Map,
  fromLayer: L.TileLayer | null,
  toLayer: L.TileLayer,
) {
  if (!fromLayer) {
    toLayer.setOpacity(1);
    toLayer.addTo(map);
    return;
  }

  toLayer.setOpacity(0);
  toLayer.addTo(map);

  const start = performance.now();

  const animate = (now: number) => {
    const progress = Math.min((now - start) / FADE_DURATION_MS, 1);
    toLayer.setOpacity(progress);
    fromLayer.setOpacity(1 - progress);

    if (progress < 1) {
      requestAnimationFrame(animate);
      return;
    }

    map.removeLayer(fromLayer);
  };

  requestAnimationFrame(animate);
}

function MapTileLayer({ styleKey }: MapTileLayerProps) {
  const map = useMap();
  const layerRef = useRef<L.TileLayer | null>(null);
  const overlayRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    map.attributionControl.setPrefix(false);
  }, [map]);

  useEffect(() => {
    const style = mapStyles[styleKey];
    const nextLayer = L.tileLayer(style.url, {
      attribution: style.attribution,
      maxZoom: style.maxZoom,
    });

    fadeLayer(map, layerRef.current, nextLayer);
    layerRef.current = nextLayer;

    const needsLabelOverlay = PHOTO_WITH_LABEL_STYLES.includes(styleKey);

    if (needsLabelOverlay) {
      if (!overlayRef.current) {
        const overlay = L.tileLayer(LABEL_OVERLAY_URL, {
          attribution: "",
          maxZoom: 19,
          opacity: LABEL_OVERLAY_OPACITY,
        });
        overlay.addTo(map);
        overlayRef.current = overlay;
      }
    } else if (overlayRef.current) {
      map.removeLayer(overlayRef.current);
      overlayRef.current = null;
    }
  }, [map, styleKey]);

  useEffect(() => {
    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
      if (overlayRef.current) {
        map.removeLayer(overlayRef.current);
        overlayRef.current = null;
      }
    };
  }, [map]);

  return null;
}

// ─── Map style switcher ──────────────────────────────────────────────────────

interface MapStyleSwitcherProps {
  value: MapStyleKey;
  onChange: (style: MapStyleKey) => void;
  isTech?: boolean;
}

function StyleOptionButton({
  styleKey,
  isActive,
  isTech,
  onSelect,
}: {
  styleKey: MapStyleKey;
  isActive: boolean;
  isTech?: boolean;
  onSelect: (key: MapStyleKey) => void;
}) {
  const style = mapStyles[styleKey];

  return (
    <button
      type="button"
      onClick={() => onSelect(styleKey)}
      className={`flex w-full items-center gap-1.5 px-2.5 py-2 text-left text-xs font-medium transition-colors sm:gap-2 sm:px-3 sm:py-2.5 sm:text-sm ${
        isActive
          ? isTech
            ? "bg-cyan-500/20 text-cyan-100"
            : "bg-slate-900 text-white"
          : isTech
            ? "text-cyan-50 hover:bg-slate-800"
            : "text-slate-700 hover:bg-slate-100"
      }`}
    >
      <span aria-hidden>{style.icon}</span>
      <span className="leading-tight">{style.label}</span>
    </button>
  );
}

function MobileMapStyleSwitcher({
  value,
  onChange,
  isTech = false,
}: MapStyleSwitcherProps) {
  const [expanded, setExpanded] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!expanded) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (rootRef.current?.contains(target)) return;
      setExpanded(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [expanded]);

  const surfaceClass = isTech
    ? "border-cyan-500/30 bg-slate-900/95 text-cyan-100"
    : "border-gray-200/80 bg-white text-gray-700";

  const menuSurfaceClass = isTech
    ? "border-cyan-500/30 bg-slate-900/95 text-cyan-100"
    : "border-gray-200/80 bg-white text-gray-800";

  const handleSelect = (key: MapStyleKey) => {
    onChange(key);
    setExpanded(false);
  };

  return (
    <div
      ref={rootRef}
      className="pointer-events-none absolute inset-0 z-[1000] lg:hidden"
    >
      <div className="pointer-events-auto absolute bottom-[var(--map-style-bottom)] left-3 flex flex-col-reverse items-start gap-2">
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
          aria-haspopup="listbox"
          aria-label="切換底圖樣式"
          title="底圖樣式"
          className={`flex h-11 w-11 items-center justify-center rounded-full border shadow-lg transition-colors ${
            expanded
              ? isTech
                ? "border-cyan-400/50 bg-slate-800 text-cyan-200"
                : "border-gray-300 bg-gray-50 text-gray-900"
              : surfaceClass
          }`}
        >
          <Layers className="h-5 w-5" aria-hidden />
        </button>

        {expanded && (
          <div
            role="listbox"
            aria-label="底圖樣式"
            className={`w-52 overflow-hidden rounded-2xl border shadow-lg backdrop-blur-md sm:w-56 ${menuSurfaceClass}`}
          >
            {mapStyleOrder.map((key) => {
              const isActive = value === key;

              return (
                <button
                  key={key}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => handleSelect(key)}
                  className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors ${
                    isActive
                      ? isTech
                        ? "bg-cyan-500/20 text-cyan-100"
                        : "bg-slate-900 text-white"
                      : isTech
                        ? "text-cyan-50 hover:bg-slate-800"
                        : "text-slate-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="w-5 shrink-0 text-center" aria-hidden>
                    {mapStyles[key].icon}
                  </span>
                  <span className="min-w-0 flex-1 leading-tight">
                    {mapStyles[key].label}
                  </span>
                  {isActive && (
                    <Check className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function DesktopMapStyleSwitcher({
  value,
  onChange,
  isTech = false,
}: MapStyleSwitcherProps) {
  const panelClass = isTech
    ? "border-cyan-500/30 bg-slate-900/95 text-cyan-100"
    : "border-white/20 bg-white/90 text-slate-700";

  const headerClass = isTech
    ? "border-cyan-500/20 text-cyan-300/80"
    : "border-slate-200 text-slate-500";

  return (
    <div className="absolute right-4 top-4 z-[1000] hidden w-52 overflow-hidden rounded-lg border shadow-lg backdrop-blur-md lg:block">
      <div
        className={`overflow-hidden rounded-lg ${panelClass}`}
      >
        <div
          className={`border-b px-3 py-2 text-xs font-semibold uppercase tracking-wide ${headerClass}`}
        >
          底圖
        </div>
        <div className="max-h-72 overflow-y-auto">
          {mapStyleOrder.map((key) => (
            <StyleOptionButton
              key={key}
              styleKey={key}
              isActive={value === key}
              isTech={isTech}
              onSelect={onChange}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MapStyleSwitcher(props: MapStyleSwitcherProps) {
  return (
    <>
      <MobileMapStyleSwitcher {...props} />
      <DesktopMapStyleSwitcher {...props} />
    </>
  );
}

// ─── Map control stack ───────────────────────────────────────────────────────

interface MapControlStackProps {
  layout: "mobile" | "desktop";
  isLocating?: boolean;
  locateError?: string | null;
  isTech?: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onLocate: () => void;
  onClearLocateError?: () => void;
}

function MapControlStack({
  layout,
  isLocating = false,
  locateError = null,
  isTech = false,
  isFullscreen = false,
  onToggleFullscreen,
  onLocate,
  onClearLocateError,
}: MapControlStackProps) {
  const map = useMap();

  const surfaceClass = isTech
    ? "border-cyan-500/30 bg-slate-900/95 text-cyan-100"
    : "border-gray-200/80 bg-white text-gray-700";

  const zoomButtonClass =
    layout === "mobile"
      ? `flex h-10 w-10 items-center justify-center text-xl font-light transition-colors hover:opacity-90 ${
          isTech ? "hover:bg-slate-800" : "hover:bg-gray-50"
        }`
      : `flex h-10 w-10 items-center justify-center transition-colors hover:opacity-90 ${
          isTech ? "hover:bg-slate-800" : "hover:bg-gray-50"
        }`;

  const handleToggleFullscreen = () => {
    onToggleFullscreen?.();
    window.setTimeout(() => map.invalidateSize(), 120);
  };

  const fullscreenButton = onToggleFullscreen ? (
    <button
      type="button"
      onClick={handleToggleFullscreen}
      aria-label={isFullscreen ? "離開全螢幕" : "全螢幕"}
      title={isFullscreen ? "離開全螢幕" : "全螢幕"}
      className={`flex h-11 w-11 items-center justify-center rounded-full border shadow-lg transition-colors ${surfaceClass}`}
    >
      {isFullscreen ? (
        <Minimize2 className="h-5 w-5" aria-hidden />
      ) : (
        <Maximize2 className="h-5 w-5" aria-hidden />
      )}
    </button>
  ) : null;

  const rootClass =
    layout === "mobile"
      ? "map-right-controls pointer-events-none absolute inset-0 z-[1000] lg:hidden"
      : "map-locate-control pointer-events-none absolute inset-0 z-[1000] hidden lg:block";

  const innerClass =
    layout === "mobile"
      ? "pointer-events-auto absolute bottom-[var(--map-locate-bottom)] right-3 flex flex-col items-end gap-2 lg:right-4"
      : "pointer-events-auto absolute bottom-[var(--map-locate-bottom)] right-4 flex flex-col items-end gap-2";

  return (
    <div className={rootClass}>
      <div className={innerClass}>
        {locateError && (
          <div
            role="alert"
            className={`w-full max-w-xs rounded-lg border px-3 py-2 text-sm shadow-lg ${
              isTech
                ? "border-red-400/30 bg-slate-900/95 text-red-300"
                : "border-red-200 bg-white text-red-700"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p>{locateError}</p>
              {onClearLocateError && (
                <button
                  type="button"
                  onClick={onClearLocateError}
                  className={`shrink-0 ${
                    isTech ? "text-red-400 hover:text-red-200" : "text-red-500 hover:text-red-700"
                  }`}
                  aria-label="關閉提示"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              )}
            </div>
          </div>
        )}

        {fullscreenButton}

        <button
          type="button"
          onClick={onLocate}
          disabled={isLocating}
          aria-label={isLocating ? "定位中" : "定位目前位置"}
          title={isLocating ? "定位中..." : "定位目前位置"}
          className={`flex h-11 w-11 items-center justify-center rounded-full border shadow-lg transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${surfaceClass}`}
        >
          <LocateFixed
            className={`h-5 w-5 ${isLocating ? "animate-pulse" : ""}`}
            aria-hidden
          />
        </button>

        <div
          className={`overflow-hidden rounded-full border shadow-lg ${surfaceClass}`}
        >
          <button
            type="button"
            onClick={() => map.zoomIn()}
            aria-label="放大"
            className={zoomButtonClass}
          >
            <Plus className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
          <div
            className={`h-px ${isTech ? "bg-cyan-500/20" : "bg-gray-200"}`}
            aria-hidden
          />
          <button
            type="button"
            onClick={() => map.zoomOut()}
            aria-label="縮小"
            className={zoomButtonClass}
          >
            <Minus className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Custom marker + location card ───────────────────────────────────────────

function LocationCard({
  store,
  variant = "normal",
}: {
  store: Store;
  variant?: "normal" | "tech";
}) {
  const isTech = variant === "tech";

  return (
    <div className="store-popup-card min-w-[200px] space-y-2">
      <h3 className="text-base font-semibold leading-tight">{store.name}</h3>
      <p className={`text-sm leading-snug ${isTech ? "text-slate-300" : "text-gray-600"}`}>
        {store.address}
      </p>
      <p className={`text-sm leading-snug ${isTech ? "text-slate-300" : "text-gray-600"}`}>{store.phone}</p>
      <a
        href={getNavigationWebFallbackUrl(store.lat, store.lng, store.name)}
        className={`store-popup-nav-btn ${
          isTech ? "store-popup-nav-btn--tech" : "store-popup-nav-btn--normal"
        }`}
        onClick={(event) => {
          event.preventDefault();
          navigateToLocation(store.lat, store.lng, store.name);
        }}
      >
        開始導航
      </a>
    </div>
  );
}

function createGlowIcon(isActive: boolean, uiVariant: MapUiVariant) {
  const isTech = uiVariant === "tech";
  const fill = isTech ? "#22d3ee" : "#2563eb";
  const stroke = isTech ? "#67e8f9" : "#ffffff";
  const glow = isActive
    ? isTech
      ? "0 0 20px rgba(34, 211, 238, 0.95), 0 0 40px rgba(34, 211, 238, 0.4)"
      : "0 0 16px rgba(37, 99, 235, 0.8)"
    : isTech
      ? "0 0 10px rgba(34, 211, 238, 0.6)"
      : "0 0 6px rgba(37, 99, 235, 0.4)";

  return L.divIcon({
    className: "custom-marker-wrapper",
    html: `
      <div class="custom-marker-pin ${isActive ? "is-active" : ""} ${isTech ? "is-tech" : ""}" style="filter: drop-shadow(${glow})">
        <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.268 21.732 0 14 0z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
          <circle cx="14" cy="14" r="5" fill="${stroke}" opacity="0.9"/>
        </svg>
      </div>
    `,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
  });
}

interface CustomMarkerProps {
  store: Store;
  isActive: boolean;
  uiVariant: MapUiVariant;
  enterIndex?: number;
  onClick: (store: Store) => void;
  markerRef?: (marker: L.Marker | null) => void;
}

const ENTER_STAGGER_MS = 110;

function CustomMarker({
  store,
  isActive,
  uiVariant,
  enterIndex = 0,
  onClick,
  markerRef,
}: CustomMarkerProps) {
  const markerInstanceRef = useRef<L.Marker | null>(null);
  const hasEnteredRef = useRef(false);

  const icon = useMemo(
    () => createGlowIcon(isActive, uiVariant),
    [isActive, uiVariant],
  );

  const handleClick = () => {
    if (markerInstanceRef.current) {
      bounceMarker(markerInstanceRef.current);
    }
    onClick(store);
  };

  return (
    <Marker
      position={[store.lat, store.lng]}
      icon={icon}
      ref={(marker) => {
        markerInstanceRef.current = marker;
        markerRef?.(marker);

        if (marker && !hasEnteredRef.current) {
          hasEnteredRef.current = true;
          enterMarker(marker, enterIndex * ENTER_STAGGER_MS);
        }
      }}
      eventHandlers={{ click: handleClick }}
    >
      <Popup
        className={
          uiVariant === "tech"
            ? "store-popup store-popup--tech"
            : "store-popup"
        }
      >
        <LocationCard store={store} variant={uiVariant} />
      </Popup>
    </Marker>
  );
}

// ─── User location marker ────────────────────────────────────────────────────

const REF_ZOOM = 16;
const MIN_SCALE = 0.22;
const MAX_SCALE = 1;

function getUserLocationScale(zoom: number): number {
  const scale = 2 ** ((zoom - REF_ZOOM) / 2.5);
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

function applyUserLocationScale(marker: L.Marker | null, zoom: number) {
  if (!marker) return;

  const root = marker
    .getElement()
    ?.querySelector(".user-location-marker") as HTMLElement | null;

  if (!root) return;

  root.style.setProperty("--ul-scale", String(getUserLocationScale(zoom)));
}

function createUserLocationIcon(variant: MapUiVariant, isLocating: boolean) {
  const isTech = variant === "tech";
  const primary = isTech ? "#22d3ee" : "#3b82f6";
  const secondary = isTech ? "#a78bfa" : "#60a5fa";
  const glow = isTech ? "rgba(34, 211, 238, 0.65)" : "rgba(59, 130, 246, 0.55)";
  const ringColor = isTech ? "rgba(34, 211, 238, 0.7)" : "rgba(59, 130, 246, 0.55)";

  return L.divIcon({
    className: "user-location-wrapper",
    html: `
      <div
        class="user-location-marker ${isTech ? "is-tech" : "is-normal"} ${isLocating ? "is-locating" : ""}"
        style="--ul-primary:${primary};--ul-secondary:${secondary};--ul-glow:${glow};--ring-color:${ringColor}"
      >
        <div class="user-location-aura" aria-hidden="true"></div>
        <span class="user-location-ring" aria-hidden="true"></span>
        <span class="user-location-ring user-location-ring--delay" aria-hidden="true"></span>
        <span class="user-location-ring user-location-ring--slow" aria-hidden="true"></span>
        <div class="user-location-core">
          <span class="user-location-dot" aria-hidden="true"></span>
        </div>
      </div>
    `,
    iconSize: [72, 72],
    iconAnchor: [36, 36],
  });
}

interface UserLocationMarkerProps {
  position: Coordinates;
  uiVariant: MapUiVariant;
  isLocating?: boolean;
  locateRevision?: number;
  markerRef?: (marker: L.Marker | null) => void;
}

function UserLocationMarker({
  position,
  uiVariant,
  isLocating = false,
  locateRevision = 0,
  markerRef,
}: UserLocationMarkerProps) {
  const map = useMap();
  const markerInstanceRef = useRef<L.Marker | null>(null);
  const lastBurstRevisionRef = useRef(0);

  const icon = useMemo(
    () => createUserLocationIcon(uiVariant, isLocating),
    [uiVariant, isLocating],
  );

  const updateScale = useCallback(() => {
    applyUserLocationScale(markerInstanceRef.current, map.getZoom());
  }, [map]);

  useEffect(() => {
    updateScale();
    map.on("zoom", updateScale);
    map.on("zoomend", updateScale);

    return () => {
      map.off("zoom", updateScale);
      map.off("zoomend", updateScale);
    };
  }, [map, updateScale]);

  useEffect(() => {
    const frameId = requestAnimationFrame(updateScale);
    return () => cancelAnimationFrame(frameId);
  }, [icon, updateScale]);

  useEffect(() => {
    if (locateRevision <= 0 || locateRevision === lastBurstRevisionRef.current) {
      return;
    }

    lastBurstRevisionRef.current = locateRevision;

    const timer = window.setTimeout(() => {
      if (markerInstanceRef.current) {
        burstUserLocation(markerInstanceRef.current);
      }
    }, 80);

    return () => window.clearTimeout(timer);
  }, [locateRevision]);

  return (
    <Marker
      position={[position.lat, position.lng]}
      icon={icon}
      zIndexOffset={1200}
      ref={(marker) => {
        markerInstanceRef.current = marker;
        markerRef?.(marker);
        if (marker) {
          requestAnimationFrame(updateScale);
        }
      }}
    />
  );
}

// ─── Store map ───────────────────────────────────────────────────────────────

const TAIWAN_CENTER: [number, number] = [23.7, 121];
const DEFAULT_ZOOM = 7;
const FOCUS_ZOOM = 16;
const FLY_TO_DURATION = 1.4;

export interface StoreMapProps {
  stores: Store[];
  activeStore: Store | null;
  focusSource?: StoreFocusSource;
  locateRevision?: number;
  userLocation: Coordinates | null;
  isLocating?: boolean;
  locateError?: string | null;
  onLocate: () => void;
  onClearLocateError?: () => void;
  isMapFullscreen?: boolean;
  onToggleMapFullscreen?: () => void;
  onMarkerClick: (store: Store) => void;
  /** showroom 版型：地區切換時自動調整地圖視角 */
  regionViewportKey?: StoreRegion | "all";
}

interface MapControllerProps {
  activeStore: Store | null;
  focusSource: StoreFocusSource;
  markerRefs: MutableRefObject<Record<number, L.Marker>>;
}

function UserLocationController({
  userLocation,
  focusSource,
  locateRevision,
  markerRefs,
}: {
  userLocation: Coordinates | null;
  focusSource: StoreFocusSource;
  locateRevision: number;
  markerRefs: MutableRefObject<Record<number, L.Marker>>;
}) {
  const map = useMap();

  useEffect(() => {
    if (focusSource !== "locate") return;

    Object.values(markerRefs.current).forEach((marker) => {
      marker.closePopup();
    });
  }, [focusSource, locateRevision, markerRefs]);

  useEffect(() => {
    if (!userLocation || focusSource !== "locate") return;

    map.flyTo([userLocation.lat, userLocation.lng], FOCUS_ZOOM, {
      duration: FLY_TO_DURATION,
      easeLinearity: 0.22,
    });
  }, [map, userLocation, focusSource, locateRevision]);

  return null;
}

function MapController({
  activeStore,
  focusSource,
  markerRefs,
}: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (!activeStore || focusSource === "locate") return;

    const marker = markerRefs.current[activeStore.id];
    if (!marker) return;

    map.setView([activeStore.lat, activeStore.lng], FOCUS_ZOOM, {
      animate: false,
    });

    if (focusSource === "list") {
      pulseMarker(marker);
      openPopupWithFade(marker);
      return;
    }

    marker.openPopup();
  }, [map, activeStore, focusSource, markerRefs]);

  return null;
}

function RegionViewportController({
  stores,
  regionKey,
}: {
  stores: Store[];
  regionKey: StoreRegion | "all";
}) {
  const map = useMap();

  useEffect(() => {
    if (stores.length === 1) {
      map.setView([stores[0].lat, stores[0].lng], FOCUS_ZOOM, {
        animate: false,
      });
      return;
    }

    const bounds = getStoresBounds(stores);
    if (bounds) {
      map.fitBounds(bounds, {
        padding: [48, 48],
        maxZoom: 12,
        animate: false,
      });
      return;
    }

    const viewport = STORE_REGION_VIEWPORTS[regionKey];
    map.setView([viewport.lat, viewport.lng], viewport.zoom, {
      animate: false,
    });
    // 僅在地區切換時調整視角；stores 取自同次 render 的篩選結果
    // eslint-disable-next-line react-hooks/exhaustive-deps -- regionKey
  }, [regionKey, map]);

  return null;
}

function shouldRestrictMapTouch(isFullscreen: boolean): boolean {
  if (isFullscreen) return false;
  if (typeof window === "undefined") return false;
  return !window.matchMedia("(min-width: 1024px) and (hover: hover)").matches;
}

function MapTouchInteractionGuard({
  isFullscreen,
  onHintChange,
}: {
  isFullscreen: boolean;
  onHintChange: (visible: boolean) => void;
}) {
  const map = useMap();
  const hintTimerRef = useRef<number>();
  const restrictRef = useRef(false);

  const showHint = useCallback(() => {
    onHintChange(true);
    window.clearTimeout(hintTimerRef.current);
    hintTimerRef.current = window.setTimeout(() => onHintChange(false), 2500);
  }, [onHintChange]);

  const setMapInteraction = useCallback(
    (enabled: boolean) => {
      if (enabled) {
        map.dragging.enable();
        map.touchZoom.enable();
        map.doubleClickZoom.enable();
        map.boxZoom.enable();
        map.scrollWheelZoom.enable();
        return;
      }

      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.boxZoom.disable();
      map.scrollWheelZoom.disable();
    },
    [map],
  );

  useEffect(() => {
    const applyMode = () => {
      const restricted = shouldRestrictMapTouch(isFullscreen);
      restrictRef.current = restricted;

      if (!restricted) {
        setMapInteraction(true);
        onHintChange(false);
        return;
      }

      setMapInteraction(false);
    };

    applyMode();

    const desktopMq = window.matchMedia("(min-width: 1024px) and (hover: hover)");
    desktopMq.addEventListener("change", applyMode);
    return () => {
      desktopMq.removeEventListener("change", applyMode);
      window.clearTimeout(hintTimerRef.current);
    };
  }, [isFullscreen, onHintChange, setMapInteraction]);

  useEffect(() => {
    const container = map.getContainer();

    const onTouchStart = (event: TouchEvent) => {
      if (!restrictRef.current) return;

      if (event.touches.length === 1) {
        showHint();
        return;
      }

      if (event.touches.length >= 2) {
        onHintChange(false);
        setMapInteraction(true);
      }
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!restrictRef.current) return;
      if (event.touches.length === 1) showHint();
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (!restrictRef.current) return;
      if (event.touches.length < 2) setMapInteraction(false);
    };

    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: true });
    container.addEventListener("touchend", onTouchEnd, { passive: true });
    container.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
      container.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [map, onHintChange, setMapInteraction, showHint]);

  return null;
}

export default function StoreMap({
  stores,
  activeStore,
  focusSource = "list",
  locateRevision = 0,
  userLocation,
  isLocating = false,
  locateError = null,
  onLocate,
  onClearLocateError,
  isMapFullscreen = false,
  onToggleMapFullscreen,
  onMarkerClick,
  regionViewportKey,
}: StoreMapProps) {
  const [mapStyle, setMapStyle] = useState<MapStyleKey>("emap6");
  const [touchHintVisible, setTouchHintVisible] = useState(false);
  const markerRefs = useRef<Record<number, L.Marker>>({});
  const currentStyle = mapStyles[mapStyle];
  const isTech = currentStyle.uiVariant === "tech";

  return (
    <div
      className={`relative h-full w-full transition-colors duration-500 ${
        isTech ? "bg-slate-950" : "bg-gray-100"
      }`}
    >
      {touchHintVisible && (
        <div className="map-touch-hint" role="status" aria-live="polite">
          <p className="map-touch-hint__title">同時以兩指移動地圖</p>
          <p className="map-touch-hint__sub">或點擊右下角全螢幕按鈕操作地圖</p>
        </div>
      )}

      <MapContainer
        center={TAIWAN_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={false}
        zoomControl={false}
        className="h-full w-full z-0"
      >
        <MapTileLayer styleKey={mapStyle} />

        {stores.map((store, index) => (
          <CustomMarker
            key={store.id}
            store={store}
            isActive={activeStore?.id === store.id}
            uiVariant={currentStyle.uiVariant}
            enterIndex={index}
            onClick={onMarkerClick}
            markerRef={(marker) => {
              if (marker) markerRefs.current[store.id] = marker;
            }}
          />
        ))}

        {userLocation && (
          <UserLocationMarker
            position={userLocation}
            uiVariant={currentStyle.uiVariant}
            isLocating={isLocating}
            locateRevision={locateRevision}
          />
        )}

        <UserLocationController
          userLocation={userLocation}
          focusSource={focusSource}
          locateRevision={locateRevision}
          markerRefs={markerRefs}
        />

        <MapController
          activeStore={activeStore}
          focusSource={focusSource}
          markerRefs={markerRefs}
        />

        {regionViewportKey !== undefined && (
          <RegionViewportController
            stores={stores}
            regionKey={regionViewportKey}
          />
        )}

        <MapTouchInteractionGuard
          isFullscreen={isMapFullscreen}
          onHintChange={setTouchHintVisible}
        />

        <MapControlStack
          layout="mobile"
          isLocating={isLocating}
          locateError={locateError}
          isTech={isTech}
          isFullscreen={isMapFullscreen}
          onToggleFullscreen={onToggleMapFullscreen}
          onLocate={onLocate}
          onClearLocateError={onClearLocateError}
        />

        <MapControlStack
          layout="desktop"
          isLocating={isLocating}
          locateError={locateError}
          isTech={isTech}
          isFullscreen={isMapFullscreen}
          onToggleFullscreen={onToggleMapFullscreen}
          onLocate={onLocate}
          onClearLocateError={onClearLocateError}
        />
      </MapContainer>

      {isTech && (
        <div
          className="pointer-events-none absolute inset-0 z-[500] bg-gradient-to-b from-cyan-500/5 via-transparent to-slate-900/20"
          aria-hidden
        />
      )}

      <MapStyleSwitcher value={mapStyle} onChange={setMapStyle} isTech={isTech} />
    </div>
  );
}
