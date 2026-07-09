"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import {
  mapStyles,
  buildNlscWmtsUrl,
  NLSC_ATTRIBUTION,
  type MapStyleKey,
} from "./mapStyles";

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

export default function MapTileLayer({ styleKey }: MapTileLayerProps) {
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
