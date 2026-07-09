"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import type { Store } from "@/types/store";
import type { StoreFocusSource } from "@/components/map/TechMap";
import { stores } from "@/data/stores";
import { findNearestStore } from "@/utils/geo";
import { useGeolocation } from "@/hooks/useGeolocation";
import StoreList from "@/components/StoreList";

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
});

export default function HomePage() {
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
    <main className="flex h-[100dvh] flex-col overflow-hidden lg:flex-row">
      <aside className="flex min-h-0 w-full max-h-[42dvh] shrink-0 flex-col border-b border-gray-200 sm:max-h-[45dvh] lg:max-h-none lg:h-full lg:w-[min(100%,380px)] lg:max-w-[35%] lg:border-b-0 lg:border-r">
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
      <section className="relative min-h-0 flex-1">
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
