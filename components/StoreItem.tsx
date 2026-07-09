"use client";

import type { Store } from "@/types/store";
import { formatDistance } from "@/utils/geo";
import { createPhoneUrl } from "@/utils/map";
import NavigateButton from "@/components/NavigateButton";

interface StoreItemProps {
  store: Store;
  isActive: boolean;
  distanceKm?: number;
  onSelect: (store: Store) => void;
}

export default function StoreItem({
  store,
  isActive,
  distanceKm,
  onSelect,
}: StoreItemProps) {
  return (
    <div
      className={`border-b border-gray-200 p-3 sm:p-4 ${
        isActive ? "bg-blue-50" : "bg-white"
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(store)}
        className="w-full text-left hover:opacity-90"
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900">{store.name}</h3>
          {distanceKm !== undefined && (
            <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {formatDistance(distanceKm)}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-gray-600">{store.address}</p>
        <p className="mt-1 text-sm text-gray-600">{store.phone}</p>
      </button>

      <div className="mt-2 flex flex-col gap-2 sm:mt-3 sm:flex-row sm:flex-wrap">
        <NavigateButton
          lat={store.lat}
          lng={store.lng}
          label={store.name}
          onBeforeNavigate={(event) => event.stopPropagation()}
          className="inline-flex items-center justify-center rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 sm:justify-start sm:py-1.5"
        />
        <a
          href={createPhoneUrl(store.phone)}
          onClick={(event) => event.stopPropagation()}
          className="inline-flex items-center justify-center rounded border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:justify-start sm:py-1.5"
        >
          撥打電話
        </a>
      </div>
    </div>
  );
}
