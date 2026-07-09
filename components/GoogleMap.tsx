"use client";

import { useEffect } from "react";
import {
  APIProvider,
  Map,
  Marker,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps";
import type { Store } from "@/types/store";
import type { Coordinates } from "@/utils/geo";
import { createGoogleNavigationUrl } from "@/utils/map";

const TAIWAN_CENTER = { lat: 23.7, lng: 121 };
const DEFAULT_ZOOM = 7;
const FOCUS_ZOOM = 16;

interface GoogleMapProps {
  stores: Store[];
  activeStore: Store | null;
  userLocation: Coordinates | null;
  isLocating?: boolean;
  locateError?: string | null;
  onLocate: () => void;
  onClearLocateError?: () => void;
  onMarkerClick: (store: Store) => void;
  onInfoWindowClose: () => void;
}

interface MapContentProps {
  stores: Store[];
  activeStore: Store | null;
  userLocation: Coordinates | null;
  onMarkerClick: (store: Store) => void;
  onInfoWindowClose: () => void;
}

function MapContent({
  stores,
  activeStore,
  userLocation,
  onMarkerClick,
  onInfoWindowClose,
}: MapContentProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || !activeStore) return;
    map.setOptions({
      center: { lat: activeStore.lat, lng: activeStore.lng },
      zoom: FOCUS_ZOOM,
    });
  }, [map, activeStore]);

  return (
    <>
      {stores.map((store) => (
        <Marker
          key={store.id}
          position={{ lat: store.lat, lng: store.lng }}
          onClick={() => onMarkerClick(store)}
        />
      ))}

      {activeStore && (
        <InfoWindow
          position={{ lat: activeStore.lat, lng: activeStore.lng }}
          onCloseClick={onInfoWindowClose}
        >
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">{activeStore.name}</h3>
            <p className="text-sm text-gray-600">{activeStore.address}</p>
            <p className="text-sm text-gray-600">{activeStore.phone}</p>
            <a
              href={createGoogleNavigationUrl(activeStore)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              開始導航
            </a>
          </div>
        </InfoWindow>
      )}

      {userLocation && (
        <Marker
          position={userLocation}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#2563eb",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          }}
        />
      )}
    </>
  );
}

export default function GoogleMap({
  stores,
  activeStore,
  userLocation,
  isLocating = false,
  locateError = null,
  onLocate,
  onClearLocateError,
  onMarkerClick,
  onInfoWindowClose,
}: GoogleMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-100 p-6 text-center text-gray-600">
        請在 frontend/.env.local 設定 NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={TAIWAN_CENTER}
          defaultZoom={DEFAULT_ZOOM}
          gestureHandling="greedy"
          disableDefaultUI={false}
          className="h-full w-full"
        >
          <MapContent
            stores={stores}
            activeStore={activeStore}
            userLocation={userLocation}
            onMarkerClick={onMarkerClick}
            onInfoWindowClose={onInfoWindowClose}
          />
        </Map>
      </APIProvider>

      <div className="absolute bottom-6 right-6 z-10 flex max-w-xs flex-col items-end gap-2">
        {locateError && (
          <div
            role="alert"
            className="w-full rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 shadow"
          >
            <div className="flex items-start justify-between gap-2">
              <p>{locateError}</p>
              {onClearLocateError && (
                <button
                  type="button"
                  onClick={onClearLocateError}
                  className="shrink-0 text-red-500 hover:text-red-700"
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
          className="rounded bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLocating ? "定位中..." : "定位目前位置"}
        </button>
      </div>
    </div>
  );
}
