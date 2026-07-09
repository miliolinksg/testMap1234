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
    <div className="absolute right-2 top-2 z-[1000] w-44 overflow-hidden rounded-lg border border-white/20 bg-white/90 shadow-lg backdrop-blur-md sm:right-4 sm:top-4 sm:w-52">
      <div className="border-b border-slate-200 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:px-3 sm:py-2 sm:text-xs">
        NLSC 底圖
      </div>
      <div className="max-h-40 overflow-y-auto sm:max-h-72">
        {mapStyleOrder.map((key) => {
          const style = mapStyles[key];
          const isActive = value === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={`flex w-full items-center gap-1.5 px-2.5 py-2 text-left text-xs font-medium transition-colors sm:gap-2 sm:px-3 sm:py-2.5 sm:text-sm ${
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
