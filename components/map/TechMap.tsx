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
import MapRightControls from "./MapRightControls";
import MapLocateControl from "./MapLocateControl";
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
  isMapFullscreen?: boolean;
  onToggleMapFullscreen?: () => void;
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
  isMapFullscreen = false,
  onToggleMapFullscreen,
  onMarkerClick,
}: TechMapProps) {
  const [mapStyle, setMapStyle] = useState<MapStyleKey>("emap6");
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

        <MapRightControls
          isLocating={isLocating}
          locateError={locateError}
          isTech={isTech}
          isFullscreen={isMapFullscreen}
          onToggleFullscreen={onToggleMapFullscreen}
          onLocate={onLocate}
          onClearLocateError={onClearLocateError}
        />

        <MapLocateControl
          isLocating={isLocating}
          locateError={locateError}
          isTech={isTech}
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
