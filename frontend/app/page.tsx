"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import type { Store } from "@/types/store";
import { stores } from "@/data/stores";
import { findNearestStore } from "@/utils/geo";
import { useGeolocation } from "@/hooks/useGeolocation";
import StoreList from "@/components/StoreList";
import GoogleMap from "@/components/GoogleMap";

export default function HomePage() {
  const [activeStore, setActiveStore] = useState<Store | null>(null);
  const { location, error, isLocating, locate, clearError } = useGeolocation();

  const handleLocate = useCallback(async () => {
    const coords = await locate();
    if (!coords) return;

    const nearest = findNearestStore(stores, coords);
    if (nearest) {
      setActiveStore(nearest);
    }
  }, [locate]);

  return (
    <main className="flex h-screen flex-col md:flex-row">
      <aside className="h-1/3 border-b border-gray-200 md:h-full md:w-[30%] md:border-b-0 md:border-r">
        <StoreList
          stores={stores}
          activeStoreId={activeStore?.id ?? null}
          userLocation={location}
          locateError={error}
          onClearLocateError={clearError}
          onSelect={setActiveStore}
        />
      </aside>
      <section className="relative h-2/3 md:h-full md:w-[70%]">
        <Link
          href="/leaflet"
          className="absolute left-4 top-4 z-10 rounded bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow hover:bg-gray-50"
        >
          切換到 Leaflet
        </Link>
        <GoogleMap
          stores={stores}
          activeStore={activeStore}
          userLocation={location}
          isLocating={isLocating}
          locateError={error}
          onLocate={handleLocate}
          onClearLocateError={clearError}
          onMarkerClick={setActiveStore}
          onInfoWindowClose={() => setActiveStore(null)}
        />
      </section>
    </main>
  );
}
