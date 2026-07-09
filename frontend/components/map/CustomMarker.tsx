"use client";

import { useMemo, useRef } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { Store } from "@/types/store";
import type { MapUiVariant } from "./mapStyles";
import LocationCard from "./LocationCard";
import { bounceMarker } from "./markerAnimation";

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
  onClick: (store: Store) => void;
  markerRef?: (marker: L.Marker | null) => void;
}

export default function CustomMarker({
  store,
  isActive,
  uiVariant,
  onClick,
  markerRef,
}: CustomMarkerProps) {
  const markerInstanceRef = useRef<L.Marker | null>(null);

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
