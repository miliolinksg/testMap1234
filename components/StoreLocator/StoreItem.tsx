"use client";

import { MapPin, Phone } from "lucide-react";
import { NavigateLink } from "./NavigateLink";
import {
  type Store,
  createPhoneUrl,
  formatDistance,
} from "./lib";

export type StoreItemVariant = "card" | "list";

export function StoreItem({
  store,
  isActive,
  distanceKm,
  onSelect,
  variant = "card",
}: {
  store: Store;
  isActive: boolean;
  distanceKm?: number;
  onSelect: (store: Store) => void;
  variant?: StoreItemVariant;
}) {
  const hasImage = Boolean(store.imageUrl);

  return (
    <article
      className={`store-item store-item--${variant} ${
        hasImage ? "store-item--with-image" : ""
      } ${isActive ? "store-item--active" : ""}`}
    >
      <button
        type="button"
        onClick={() => onSelect(store)}
        className="store-item__main"
      >
        {hasImage && (
          <div className="store-item__media">
            <img
              src={store.imageUrl}
              alt=""
              className="store-item__image"
              loading="lazy"
            />
          </div>
        )}

        <div className="store-item__content">
          <div className="store-item__header">
            <h3 className="store-item__title">{store.name}</h3>
            {distanceKm !== undefined && (
              <span className="store-item__distance">
                {formatDistance(distanceKm)}
              </span>
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
        <NavigateLink
          lat={store.lat}
          lng={store.lng}
          label={store.name}
          onBeforeNavigate={(event) => event.stopPropagation()}
          className="store-item__btn store-item__btn--primary"
        />
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
