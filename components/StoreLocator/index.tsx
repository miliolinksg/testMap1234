"use client";

import dynamic from "next/dynamic";
import { ChevronDown } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { StoreListScrollArea } from "./StoreListScrollArea";
import { StoreItem } from "./StoreItem";
import ShowroomLayout from "./ShowroomLayout";
import {
  type Store,
  type StoreWithDistance,
  attachDistances,
  filterStores,
  sortStoresByDistance,
} from "./lib";
import { useStoreLocatorState } from "./useStoreLocatorState";

const StoreMap = dynamic(() => import("./Map"), { ssr: false });

export type { Store, StoreFocusSource, StoreRegion } from "./lib";
export type { StoreMapProps } from "./Map";
export { STORE_REGION_OPTIONS } from "./lib";
export { default as StoreLocatorShowroom } from "./ShowroomLayout";
export type { ShowroomLayoutProps as StoreLocatorShowroomProps } from "./ShowroomLayout";
export { VariantSwitcher } from "./VariantSwitcher";

export type StoreLocatorVariant = "default" | "showroom";

export interface StoreLocatorProps {
  stores: Store[];
  className?: string;
  /** default：左側列表 + 全螢幕地圖；showroom：頂部篩選 + 左地圖右列表 */
  variant?: StoreLocatorVariant;
  /** showroom 版型標題 */
  title?: string;
}

// ─── Store list ──────────────────────────────────────────────────────────────

function StoreList({
  stores,
  activeStoreId,
  userLocation = null,
  locateError = null,
  onClearLocateError,
  onSelect,
  showTitle = true,
  variant = "sidebar",
}: {
  stores: Store[];
  activeStoreId: number | null;
  userLocation?: { lat: number; lng: number } | null;
  locateError?: string | null;
  onClearLocateError?: () => void;
  onSelect: (store: Store) => void;
  showTitle?: boolean;
  variant?: "sidebar" | "sheet";
}) {
  const [query, setQuery] = useState("");
  const [sortByDistance, setSortByDistance] = useState(true);

  const displayStores = useMemo((): (Store | StoreWithDistance)[] => {
    const filtered = filterStores(stores, query);
    if (userLocation && sortByDistance) {
      return sortStoresByDistance(filtered, userLocation);
    }
    if (userLocation) {
      return attachDistances(filtered, userLocation);
    }
    return filtered;
  }, [stores, query, userLocation, sortByDistance]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 space-y-2 border-b border-gray-200/80 p-3 sm:space-y-3 sm:p-4">
        {showTitle && (
          <h2 className="text-base font-bold text-gray-900 sm:text-lg">門市據點</h2>
        )}

        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜尋店名、地址、電話..."
          className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />

        {userLocation && (
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={sortByDistance}
              onChange={(event) => setSortByDistance(event.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            依距離排序
          </label>
        )}

        {locateError && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
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
      </div>

      <StoreListScrollArea variant={variant}>
        {displayStores.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">找不到符合條件的門市</p>
        ) : (
          displayStores.map((store) => (
            <StoreItem
              key={store.id}
              store={store}
              isActive={store.id === activeStoreId}
              distanceKm={"distanceKm" in store ? store.distanceKm : undefined}
              onSelect={onSelect}
            />
          ))
        )}
      </StoreListScrollArea>
    </div>
  );
}

// ─── Mobile sheet ────────────────────────────────────────────────────────────

const STORE_DRAWER_COLLAPSED_HEIGHT = "3.25rem";

function StoreListSheet({
  expanded,
  onExpandedChange,
  storeCount,
  activeStoreName,
  children,
}: {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  storeCount: number;
  activeStoreName?: string | null;
  children: ReactNode;
}) {
  const [isEntering, setIsEntering] = useState(false);
  const wasExpandedRef = useRef(false);

  useEffect(() => {
    if (expanded && !wasExpandedRef.current) {
      setIsEntering(true);
      const timer = window.setTimeout(() => setIsEntering(false), 480);
      wasExpandedRef.current = true;
      return () => window.clearTimeout(timer);
    }
    if (!expanded) {
      wasExpandedRef.current = false;
      setIsEntering(false);
    }
  }, [expanded]);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[2000] lg:hidden"
      style={{
        ["--store-drawer-collapsed-height" as string]: STORE_DRAWER_COLLAPSED_HEIGHT,
      }}
      aria-label="門市列表面板"
    >
      <div
        className={`store-drawer-panel pointer-events-auto mx-auto flex w-full max-w-none flex-col overflow-hidden border border-t-0 border-gray-200/80 bg-white shadow-[0_4px_32px_rgba(15,23,42,0.14)] backdrop-blur-md transition-[height] duration-300 ease-out ${
          expanded
            ? "store-drawer-panel--expanded h-[min(58dvh,420px)] rounded-b-[1.75rem]"
            : "h-[var(--store-drawer-collapsed-height)] rounded-b-2xl"
        } ${isEntering ? "store-drawer-panel--enter" : ""}`}
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <button
          type="button"
          onClick={() => onExpandedChange(!expanded)}
          className="flex min-h-[3.25rem] shrink-0 items-center justify-between gap-3 border-b border-gray-200/80 px-4 py-3 transition-colors hover:bg-gray-50"
          aria-expanded={expanded}
          aria-controls="store-list-sheet-content"
        >
          <span className="truncate text-left text-sm font-semibold text-gray-900">
            {expanded ? (activeStoreName ?? "門市據點") : "門市據點"}
          </span>
          <span className="flex shrink-0 items-center gap-1.5 text-xs text-gray-500">
            <span className="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-600">
              {storeCount} 間
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-300 ${
                expanded ? "rotate-180" : ""
              }`}
              aria-hidden
            />
          </span>
        </button>

        <div
          id="store-list-sheet-content"
          className={`flex min-h-0 flex-1 flex-col overflow-hidden touch-pan-y ${
            expanded
              ? "store-drawer-content--visible opacity-100"
              : "pointer-events-none max-h-0 opacity-0"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Default layout ──────────────────────────────────────────────────────────

function DefaultStoreLocator({ stores, className }: StoreLocatorProps) {
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const {
    activeStore,
    focusSource,
    locateRevision,
    containerRef,
    isFullscreen,
    toggleFullscreen,
    location,
    error,
    isLocating,
    clearError,
    handleLocate,
    handleStoreSelect,
    handleMarkerClick,
  } = useStoreLocatorState();

  const handleSelect = useCallback(
    (store: Store) => {
      handleStoreSelect(store);
      setSheetExpanded(false);
    },
    [handleStoreSelect],
  );

  const handleMarker = useCallback(
    (store: Store) => {
      handleMarkerClick(store);
      setSheetExpanded(false);
    },
    [handleMarkerClick],
  );

  const listProps = {
    stores,
    activeStoreId: activeStore?.id ?? null,
    userLocation: location,
    locateError: error,
    onClearLocateError: clearError,
    onSelect: handleSelect,
  };

  return (
    <main
      ref={containerRef}
      className={`relative h-[100dvh] overflow-hidden lg:flex lg:flex-row${
        className ? ` ${className}` : ""
      }`}
    >
      <aside className="hidden min-h-0 w-[min(100%,380px)] max-w-[35%] shrink-0 flex-col overflow-hidden border border-gray-200/80 bg-white shadow-[4px_0_24px_rgba(15,23,42,0.06)] lg:flex lg:h-full">
        <StoreList {...listProps} />
      </aside>

      <section className="absolute inset-0 lg:relative lg:min-h-0 lg:flex-1">
        <StoreMap
          stores={stores}
          activeStore={activeStore}
          focusSource={focusSource}
          locateRevision={locateRevision}
          userLocation={location}
          isLocating={isLocating}
          locateError={error}
          onLocate={handleLocate}
          onClearLocateError={clearError}
          isMapFullscreen={isFullscreen}
          onToggleMapFullscreen={toggleFullscreen}
          onMarkerClick={handleMarker}
        />
      </section>

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

// ─── Main export ─────────────────────────────────────────────────────────────

export default function StoreLocator({
  stores,
  className,
  variant = "default",
  title,
}: StoreLocatorProps) {
  if (variant === "showroom") {
    return <ShowroomLayout stores={stores} className={className} title={title} />;
  }

  return <DefaultStoreLocator stores={stores} className={className} />;
}
