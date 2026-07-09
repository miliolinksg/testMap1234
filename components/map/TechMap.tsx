"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Store } from "@/types/store";
import type { Coordinates } from "@/utils/geo";
import type { MapStyleKey } from "./mapStyles";
import { mapStyles } from "./mapStyles";
import MapTileLayer from "./MapTileLayer";
import MapStyleSwitcher from "./MapStyleSwitcher";
import CustomMarker from "./CustomMarker";
import UserLocationMarker from "./UserLocationMarker";
import { openPopupWithFade, pulseMarker } from "./markerAnimation";

const TAIWAN_CENTER: [number, number] = [23.7, 121];
const DEFAULT_ZOOM = 7;
const FOCUS_ZOOM = 16;
const FLY_TO_DURATION = 1.4;

export type StoreFocusSource = "list" | "marker" | "locate";

export interface TechMapProps {
  stores: Store[];
  activeStore: Store | null;
  focusSource?: StoreFocusSource;
  locateRevision?: number;
  userLocation: Coordinates | null;
  isLocating?: boolean;
  locateError?: string | null;
  onLocate: () => void;
  onClearLocateError?: () => void;
  onMarkerClick: (store: Store) => void;
}

interface MapControllerProps {
  activeStore: Store | null;
  focusSource: StoreFocusSource;
  markerRefs: React.MutableRefObject<Record<number, L.Marker>>;
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
  markerRefs: React.MutableRefObject<Record<number, L.Marker>>;
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

export default function TechMap({
  stores,
  activeStore,
  focusSource = "list",
  locateRevision = 0,
  userLocation,
  isLocating = false,
  locateError = null,
  onLocate,
  onClearLocateError,
  onMarkerClick,
}: TechMapProps) {
  const [mapStyle, setMapStyle] = useState<MapStyleKey>("emap");
  const markerRefs = useRef<Record<number, L.Marker>>({});
  const currentStyle = mapStyles[mapStyle];
  const isTech = currentStyle.uiVariant === "tech";

  return (
    <div
      className={`relative h-full w-full transition-colors duration-500 ${
        isTech ? "bg-slate-950" : "bg-gray-100"
      }`}
    >
      <MapContainer
        center={TAIWAN_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
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
      </MapContainer>

      {isTech && (
        <div
          className="pointer-events-none absolute inset-0 z-[500] bg-gradient-to-b from-cyan-500/5 via-transparent to-slate-900/20"
          aria-hidden
        />
      )}

      <MapStyleSwitcher value={mapStyle} onChange={setMapStyle} />

      <div className="absolute bottom-3 right-3 z-[1000] flex max-w-[calc(100%-5.5rem)] flex-col items-end gap-2 sm:bottom-6 sm:right-6 sm:max-w-xs">
        {locateError && (
          <div
            role="alert"
            className={`w-full rounded-md border px-3 py-2 text-sm shadow ${
              isTech
                ? "border-red-400/30 bg-slate-900/95 text-red-300"
                : "border-red-200 bg-red-50 text-red-700"
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
                  ×
                </button>
              )}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onLocate}
          disabled={isLocating}
          className={`rounded px-3 py-2 text-xs font-medium shadow transition-colors disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:text-sm ${
            isTech
              ? "border border-cyan-500/30 bg-slate-900/90 text-cyan-100 backdrop-blur hover:bg-slate-800"
              : "bg-white text-gray-800 hover:bg-gray-50"
          }`}
        >
          {isLocating ? "定位中..." : "定位目前位置"}
        </button>
      </div>
    </div>
  );
}
