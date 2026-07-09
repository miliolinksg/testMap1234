"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { Store } from "@/types/store";
import type { StoreFocusSource } from "@/components/map/TechMap";
import { stores } from "@/data/stores";
import { findNearestStore } from "@/utils/geo";
import { useGeolocation } from "@/hooks/useGeolocation";
import StoreList from "@/components/StoreList";

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
});

export default function LeafletPage() {
  const [activeStore, setActiveStore] = useState<Store | null>(null);
  const [focusSource, setFocusSource] = useState<StoreFocusSource>("list");
  const { location, error, isLocating, locate, clearError } = useGeolocation();

  const handleLocate = useCallback(async () => {
    const coords = await locate();
    if (!coords) return;

    const nearest = findNearestStore(stores, coords);
    if (nearest) {
      setFocusSource("list");
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
          onSelect={(store) => {
            setFocusSource("list");
            setActiveStore(store);
          }}
        />
      </aside>
      <section className="relative h-2/3 md:h-full md:w-[70%]">
        <Link
          href="/"
          className="absolute left-4 top-4 z-[1000] rounded bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow hover:bg-gray-50"
        >
          切換到 Google Map
        </Link>
        <LeafletMap
          stores={stores}
          activeStore={activeStore}
          focusSource={focusSource}
          userLocation={location}
          isLocating={isLocating}
          locateError={error}
          onLocate={handleLocate}
          onClearLocateError={clearError}
          onMarkerClick={(store) => {
            setFocusSource("marker");
            setActiveStore(store);
          }}
        />
      </section>
    </main>
  );
}
