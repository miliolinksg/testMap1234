import type { Store } from "@/types/store";
import { createGoogleNavigationUrl } from "@/utils/map";

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
      <a
        href={createGoogleNavigationUrl(store)}
        target="_blank"
        rel="noopener noreferrer"
        className={`store-popup-nav-btn ${
          isTech ? "store-popup-nav-btn--tech" : "store-popup-nav-btn--normal"
        }`}
      >
        開始導航
      </a>
    </div>
  );
}
