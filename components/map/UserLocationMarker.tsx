"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { Marker, useMap } from "react-leaflet";
import L from "leaflet";
import type { Coordinates } from "@/utils/geo";
import type { MapUiVariant } from "./mapStyles";
import { burstUserLocation } from "./markerAnimation";

const REF_ZOOM = 16;
const MIN_SCALE = 0.22;
const MAX_SCALE = 1;

export function getUserLocationScale(zoom: number): number {
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

export default function UserLocationMarker({
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
