"use client";

import { mapStyles, mapStyleOrder, type MapStyleKey } from "./mapStyles";

interface MapStyleSwitcherProps {
  value: MapStyleKey;
  onChange: (style: MapStyleKey) => void;
}

export default function MapStyleSwitcher({
  value,
  onChange,
}: MapStyleSwitcherProps) {
  return (
    <div className="absolute right-4 top-4 z-[1000] w-52 overflow-hidden rounded-lg border border-white/20 bg-white/90 shadow-lg backdrop-blur-md">
      <div className="border-b border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        NLSC 底圖
      </div>
      <div className="max-h-72 overflow-y-auto">
        {mapStyleOrder.map((key) => {
          const style = mapStyles[key];
          const isActive = value === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                isActive
                  ? "bg-slate-900 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span aria-hidden>{style.icon}</span>
              <span className="leading-tight">{style.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
