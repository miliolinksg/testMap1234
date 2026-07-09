"use client";

import type { Store } from "@/types/store";
import NavigateButton from "@/components/NavigateButton";

interface LocationCardProps {
  store: Store;
  variant?: "normal" | "tech";
}

export default function LocationCard({
  store,
  variant = "normal",
}: LocationCardProps) {
  const isTech = variant === "tech";

  return (
    <div className="store-popup-card min-w-[200px] space-y-2">
      <h3 className="text-base font-semibold leading-tight">{store.name}</h3>
      <p className={`text-sm leading-snug ${isTech ? "text-slate-300" : "text-gray-600"}`}>
        {store.address}
      </p>
      <p className={`text-sm leading-snug ${isTech ? "text-slate-300" : "text-gray-600"}`}>{store.phone}</p>
      <NavigateButton
        lat={store.lat}
        lng={store.lng}
        label={store.name}
        className={`store-popup-nav-btn ${
          isTech ? "store-popup-nav-btn--tech" : "store-popup-nav-btn--normal"
        }`}
      />
    </div>
  );
}
