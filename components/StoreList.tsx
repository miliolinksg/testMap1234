"use client";

import { useMemo, useState } from "react";
import type { Store } from "@/types/store";
import type { Coordinates } from "@/utils/geo";
import {
  attachDistances,
  filterStores,
  sortStoresByDistance,
  type StoreWithDistance,
} from "@/utils/geo";
import StoreItem from "./StoreItem";
import StoreListScrollArea from "./StoreListScrollArea";

interface StoreListProps {
  stores: Store[];
  activeStoreId: number | null;
  userLocation?: Coordinates | null;
  locateError?: string | null;
  onClearLocateError?: () => void;
  onSelect: (store: Store) => void;
  showTitle?: boolean;
  variant?: "sidebar" | "sheet";
}

export default function StoreList({
  stores,
  activeStoreId,
  userLocation = null,
  locateError = null,
  onClearLocateError,
  onSelect,
  showTitle = true,
  variant = "sidebar",
}: StoreListProps) {
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
              distanceKm={
                "distanceKm" in store ? store.distanceKm : undefined
              }
              onSelect={onSelect}
            />
          ))
        )}
      </StoreListScrollArea>
    </div>
  );
}
