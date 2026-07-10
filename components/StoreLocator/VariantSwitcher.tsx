"use client";

import { LayoutGrid, Map } from "lucide-react";
import type { StoreLocatorVariant } from "./index";

const OPTIONS: {
  value: StoreLocatorVariant;
  label: string;
  shortLabel: string;
  icon: typeof Map;
}[] = [
  { value: "default", label: "預設版型", shortLabel: "預設", icon: Map },
  { value: "showroom", label: "展示中心版型", shortLabel: "展示", icon: LayoutGrid },
];

export function VariantSwitcher({
  value,
  onChange,
}: {
  value: StoreLocatorVariant;
  onChange: (variant: StoreLocatorVariant) => void;
}) {
  return (
    <div
      className="variant-switcher pointer-events-none fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom,0px)+5.25rem)] z-[2100] flex justify-center sm:inset-x-auto sm:right-4 sm:bottom-auto sm:top-4 sm:justify-end"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      role="group"
      aria-label="切換地圖版型"
    >
      <div className="variant-switcher__track pointer-events-auto inline-flex overflow-hidden rounded-full border border-gray-200/90 bg-white/95 shadow-lg backdrop-blur-md">
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const isActive = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={isActive}
              className={`variant-switcher__btn inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors sm:px-3.5 sm:text-sm ${
                isActive
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
              <span className="hidden sm:inline">{option.label}</span>
              <span className="sm:hidden">{option.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
