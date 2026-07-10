"use client";

import type { MouseEvent, ReactNode } from "react";
import { getNavigationWebFallbackUrl, navigateToLocation } from "./lib";

export function NavigateLink({
  lat,
  lng,
  label,
  className,
  children = "開始導航",
  onBeforeNavigate,
}: {
  lat: number;
  lng: number;
  label?: string;
  className?: string;
  children?: ReactNode;
  onBeforeNavigate?: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <a
      href={getNavigationWebFallbackUrl(lat, lng, label)}
      className={className}
      onClick={(event) => {
        event.preventDefault();
        onBeforeNavigate?.(event);
        navigateToLocation(lat, lng, label);
      }}
    >
      {children}
    </a>
  );
}
