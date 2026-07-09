"use client";

import { Check, Layers } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { mapStyles, mapStyleOrder, type MapStyleKey } from "./mapStyles";

interface MapStyleSwitcherProps {
  value: MapStyleKey;
  onChange: (style: MapStyleKey) => void;
  isTech?: boolean;
}

function StyleOptionButton({
  styleKey,
  isActive,
  isTech,
  onSelect,
}: {
  styleKey: MapStyleKey;
  isActive: boolean;
  isTech?: boolean;
  onSelect: (key: MapStyleKey) => void;
}) {
  const style = mapStyles[styleKey];

  return (
    <button
      type="button"
      onClick={() => onSelect(styleKey)}
      className={`flex w-full items-center gap-1.5 px-2.5 py-2 text-left text-xs font-medium transition-colors sm:gap-2 sm:px-3 sm:py-2.5 sm:text-sm ${
        isActive
          ? isTech
            ? "bg-cyan-500/20 text-cyan-100"
            : "bg-slate-900 text-white"
          : isTech
            ? "text-cyan-50 hover:bg-slate-800"
            : "text-slate-700 hover:bg-slate-100"
      }`}
    >
      <span aria-hidden>{style.icon}</span>
      <span className="leading-tight">{style.label}</span>
    </button>
  );
}

function MobileMapStyleSwitcher({
  value,
  onChange,
  isTech = false,
}: MapStyleSwitcherProps) {
  const [expanded, setExpanded] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!expanded) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (rootRef.current?.contains(target)) return;
      setExpanded(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [expanded]);

  const surfaceClass = isTech
    ? "border-cyan-500/30 bg-slate-900/95 text-cyan-100"
    : "border-gray-200/80 bg-white text-gray-700";

  const menuSurfaceClass = isTech
    ? "border-cyan-500/30 bg-slate-900/95 text-cyan-100"
    : "border-gray-200/80 bg-white text-gray-800";

  const handleSelect = (key: MapStyleKey) => {
    onChange(key);
    setExpanded(false);
  };

  return (
    <div
      ref={rootRef}
      className="pointer-events-none absolute inset-0 z-[1000] lg:hidden"
    >
      <div className="pointer-events-auto absolute bottom-[var(--map-style-bottom)] left-3 flex flex-col-reverse items-start gap-2">
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
          aria-haspopup="listbox"
          aria-label="切換底圖樣式"
          title="底圖樣式"
          className={`flex h-11 w-11 items-center justify-center rounded-full border shadow-lg transition-colors ${
            expanded
              ? isTech
                ? "border-cyan-400/50 bg-slate-800 text-cyan-200"
                : "border-gray-300 bg-gray-50 text-gray-900"
              : surfaceClass
          }`}
        >
          <Layers className="h-5 w-5" aria-hidden />
        </button>

        {expanded && (
          <div
            role="listbox"
            aria-label="底圖樣式"
            className={`w-52 overflow-hidden rounded-2xl border shadow-lg backdrop-blur-md sm:w-56 ${menuSurfaceClass}`}
          >
            {mapStyleOrder.map((key) => {
              const isActive = value === key;

              return (
                <button
                  key={key}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => handleSelect(key)}
                  className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors ${
                    isActive
                      ? isTech
                        ? "bg-cyan-500/20 text-cyan-100"
                        : "bg-slate-900 text-white"
                      : isTech
                        ? "text-cyan-50 hover:bg-slate-800"
                        : "text-slate-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="w-5 shrink-0 text-center" aria-hidden>
                    {mapStyles[key].icon}
                  </span>
                  <span className="min-w-0 flex-1 leading-tight">
                    {mapStyles[key].label}
                  </span>
                  {isActive && (
                    <Check className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function DesktopMapStyleSwitcher({
  value,
  onChange,
  isTech = false,
}: MapStyleSwitcherProps) {
  const panelClass = isTech
    ? "border-cyan-500/30 bg-slate-900/95 text-cyan-100"
    : "border-white/20 bg-white/90 text-slate-700";

  const headerClass = isTech
    ? "border-cyan-500/20 text-cyan-300/80"
    : "border-slate-200 text-slate-500";

  return (
    <div className="absolute right-4 top-4 z-[1000] hidden w-52 overflow-hidden rounded-lg border shadow-lg backdrop-blur-md lg:block">
      <div
        className={`overflow-hidden rounded-lg ${panelClass}`}
      >
        <div
          className={`border-b px-3 py-2 text-xs font-semibold uppercase tracking-wide ${headerClass}`}
        >
          底圖
        </div>
        <div className="max-h-72 overflow-y-auto">
          {mapStyleOrder.map((key) => (
            <StyleOptionButton
              key={key}
              styleKey={key}
              isActive={value === key}
              isTech={isTech}
              onSelect={onChange}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MapStyleSwitcher(props: MapStyleSwitcherProps) {
  return (
    <>
      <MobileMapStyleSwitcher {...props} />
      <DesktopMapStyleSwitcher {...props} />
    </>
  );
}
