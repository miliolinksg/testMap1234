"use client";

import type { MouseEvent, ReactNode } from "react";
import {
  getNavigationWebFallbackUrl,
  navigateToLocation,
} from "@/utils/navigation";

interface NavigateButtonProps {
  lat: number;
  lng: number;
  label?: string;
  className?: string;
  children?: ReactNode;
  onBeforeNavigate?: (event: MouseEvent<HTMLAnchorElement>) => void;
}

export default function NavigateButton({
  lat,
  lng,
  label,
  className,
  children = "開始導航",
  onBeforeNavigate,
}: NavigateButtonProps) {
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
