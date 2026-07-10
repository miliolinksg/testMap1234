"use client";

import dynamic from "next/dynamic";
import { MapPin, Phone } from "lucide-react";
import { useMemo, useState } from "react";
import {
  type Store,
  type StoreRegion,
  type StoreWithDistance,
  STORE_REGION_OPTIONS,
  attachDistances,
  createPhoneUrl,
  filterStoresByRegion,
  formatDistance,
  getNavigationWebFallbackUrl,
  navigateToLocation,
  sortStoresByDistance,
  useStoreLocatorState,
} from "./lib";
import "./styles.css";

const StoreMap = dynamic(() => import("./Map"), { ssr: false });

export type { Store, StoreFocusSource, StoreRegion } from "./lib";
export type { StoreMapProps } from "./Map";
export { STORE_REGION_OPTIONS } from "./lib";

export interface StoreLocatorProps {
  stores: Store[];
  className?: string;
  title?: string;
}

function StoreItem({
  store,
  isActive,
  distanceKm,
  onSelect,
}: {
  store: Store;
  isActive: boolean;
  distanceKm?: number;
  onSelect: (store: Store) => void;
}) {
  return (
    <article
      className={`store-item store-item--list ${store.imageUrl ? "store-item--with-image" : ""} ${
        isActive ? "store-item--active" : ""
      }`}
    >
      <button type="button" onClick={() => onSelect(store)} className="store-item__main">
        {store.imageUrl && (
          <div className="store-item__media">
            <img src={store.imageUrl} alt="" className="store-item__image" loading="lazy" />
          </div>
        )}
        <div className="store-item__content">
          <div className="store-item__header">
            <h3 className="store-item__title">{store.name}</h3>
            {distanceKm !== undefined && (
              <span className="store-item__distance">{formatDistance(distanceKm)}</span>
            )}
          </div>
          <p className="store-item__meta">
            <MapPin className="store-item__meta-icon" aria-hidden />
            <span>{store.address}</span>
          </p>
          <p className="store-item__meta">
            <Phone className="store-item__meta-icon" aria-hidden />
            <span>{store.phone}</span>
          </p>
        </div>
      </button>
      <div className="store-item__actions">
        <a
          href={getNavigationWebFallbackUrl(store.lat, store.lng)}
          className="store-item__btn store-item__btn--primary"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            navigateToLocation(store.lat, store.lng, store.name);
          }}
        >
          開始導航
        </a>
        <a
          href={createPhoneUrl(store.phone)}
          onClick={(event) => event.stopPropagation()}
          className="store-item__btn store-item__btn--secondary"
        >
          撥打電話
        </a>
      </div>
    </article>
  );
}

function StoreList({
  stores,
  activeStoreId,
  userLocation,
  onSelect,
}: {
  stores: Store[];
  activeStoreId: number | null;
  userLocation: { lat: number; lng: number } | null;
  onSelect: (store: Store) => void;
}) {
  const displayStores = useMemo((): (Store | StoreWithDistance)[] => {
    if (!userLocation) return stores;
    return sortStoresByDistance(stores, userLocation);
  }, [stores, userLocation]);

  return (
    <div className="store-list-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
      {displayStores.length === 0 ? (
        <p className="p-6 text-center text-sm text-gray-500">此地區暫無門市</p>
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
    </div>
  );
}

export default function StoreLocator({
  stores,
  className,
  title = "展示中心",
}: StoreLocatorProps) {
  const [region, setRegion] = useState<StoreRegion | "all">("all");
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
    resetSelection,
  } = useStoreLocatorState();

  const filteredStores = useMemo(
    () => filterStoresByRegion(stores, region),
    [stores, region],
  );

  const mapStores = useMemo(() => {
    if (!location) return filteredStores;
    return attachDistances(filteredStores, location);
  }, [filteredStores, location]);

  const handleRegionChange = (nextRegion: StoreRegion | "all") => {
    setRegion(nextRegion);
    resetSelection();
  };

  const handleStoreChange = (storeId: number) => {
    const store = filteredStores.find((item) => item.id === storeId);
    if (store) handleStoreSelect(store);
  };

  return (
    <main
      ref={containerRef}
      className={`showroom-layout flex h-[100dvh] flex-col overflow-hidden bg-white${
        className ? ` ${className}` : ""
      }`}
    >
      <header className="showroom-header shrink-0 border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
        {title && <h1 className="showroom-header__title">{title}</h1>}

        <div className="showroom-header__controls">
          <div className="showroom-header__filters">
            <label className="showroom-filter-select">
              <span className="sr-only">選擇地區</span>
              <select
                value={region}
                onChange={(event) =>
                  handleRegionChange(event.target.value as StoreRegion | "all")
                }
                className="showroom-filter-select__input"
              >
                {STORE_REGION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="showroom-filter-select showroom-filter-select--store lg:hidden">
              <span className="sr-only">選擇門市</span>
              <select
                value={activeStore?.id ?? ""}
                onChange={(event) => handleStoreChange(Number(event.target.value))}
                disabled={filteredStores.length === 0}
                className="showroom-filter-select__input"
              >
                <option value="" disabled>
                  請選擇門市
                </option>
                {filteredStores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="showroom-header__count">
            為您搜尋到 <strong>{filteredStores.length}</strong> 間
          </p>
        </div>
      </header>

      <div className="showroom-body flex min-h-0 flex-1 flex-col lg:flex-row">
        <section className="showroom-map relative min-h-0 flex-1 lg:flex-[3]">
          <StoreMap
            stores={mapStores}
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
            onMarkerClick={handleMarkerClick}
            regionViewportKey={region}
          />
        </section>

        <aside className="hidden min-h-0 w-[min(100%,420px)] max-w-[38%] shrink-0 flex-col overflow-hidden border-l border-gray-200 bg-white lg:flex">
          <StoreList
            stores={filteredStores}
            activeStoreId={activeStore?.id ?? null}
            userLocation={location}
            onSelect={handleStoreSelect}
          />
        </aside>
      </div>
    </main>
  );
}
