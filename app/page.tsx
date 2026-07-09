"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import type { Store } from "@/types/store";
import type { StoreFocusSource } from "@/components/map/TechMap";
import { stores } from "@/data/stores";
import { useGeolocation } from "@/hooks/useGeolocation";
import StoreList from "@/components/StoreList";
import StoreListSheet from "@/components/StoreListSheet";

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
});

const storeListProps = {
  stores,
} as const;

export default function HomePage() {
  const [activeStore, setActiveStore] = useState<Store | null>(null);
  const [focusSource, setFocusSource] = useState<StoreFocusSource>("list");
  const [locateRevision, setLocateRevision] = useState(0);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const { location, error, isLocating, locate, clearError } = useGeolocation();

  const handleLocate = useCallback(async () => {
    setActiveStore(null);
    setFocusSource("locate");

    const coords = await locate();
    if (!coords) return;

    setLocateRevision((revision) => revision + 1);
  }, [locate]);

  const handleStoreSelect = useCallback((store: Store) => {
    setFocusSource("list");
    setActiveStore(store);
    setSheetExpanded(false);
  }, []);

  const listProps = {
    ...storeListProps,
    activeStoreId: activeStore?.id ?? null,
    userLocation: location,
    locateError: error,
    onClearLocateError: clearError,
    onSelect: handleStoreSelect,
  };

  return (
    <main className="relative h-[100dvh] overflow-hidden lg:flex lg:flex-row">
      {/* 桌面：左側固定列表 */}
      <aside className="hidden min-h-0 w-[min(100%,380px)] max-w-[35%] shrink-0 flex-col overflow-hidden rounded-r-[1.75rem] border border-gray-200/80 bg-white shadow-[4px_0_24px_rgba(15,23,42,0.06)] lg:flex lg:h-full">
        <StoreList {...listProps} />
      </aside>

      {/* 手機：地圖全螢幕；桌面：右側地圖 */}
      <section className="absolute inset-0 lg:relative lg:min-h-0 lg:flex-1">
        <LeafletMap
          stores={stores}
          activeStore={activeStore}
          focusSource={focusSource}
          locateRevision={locateRevision}
          userLocation={location}
          isLocating={isLocating}
          locateError={error}
          onLocate={handleLocate}
          onClearLocateError={clearError}
          onMarkerClick={(store) => {
            setFocusSource("marker");
            setActiveStore(store);
            setSheetExpanded(false);
          }}
        />
      </section>

      {/* 手機：頂部可收合面板 */}
      <StoreListSheet
        expanded={sheetExpanded}
        onExpandedChange={setSheetExpanded}
        storeCount={stores.length}
        activeStoreName={activeStore?.name}
      >
        <StoreList {...listProps} showTitle={false} variant="sheet" />
      </StoreListSheet>
    </main>
  );
}
