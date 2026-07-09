"use client";

import { LocateFixed, Maximize2, Minimize2, Minus, Plus, X } from "lucide-react";
import { useMap } from "react-leaflet";

interface MapRightControlsProps {
  isLocating?: boolean;
  locateError?: string | null;
  isTech?: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onLocate: () => void;
  onClearLocateError?: () => void;
}

export default function MapRightControls({
  isLocating = false,
  locateError = null,
  isTech = false,
  isFullscreen = false,
  onToggleFullscreen,
  onLocate,
  onClearLocateError,
}: MapRightControlsProps) {
  const map = useMap();

  const surfaceClass = isTech
    ? "border-cyan-500/30 bg-slate-900/95 text-cyan-100"
    : "border-gray-200/80 bg-white text-gray-700";

  const zoomButtonClass = `flex h-10 w-10 items-center justify-center text-xl font-light transition-colors hover:opacity-90 ${
    isTech ? "hover:bg-slate-800" : "hover:bg-gray-50"
  }`;

  const handleToggleFullscreen = () => {
    onToggleFullscreen?.();
    window.setTimeout(() => map.invalidateSize(), 120);
  };

  return (
    <div className="map-right-controls pointer-events-none absolute inset-0 z-[1000] lg:hidden">
      <div className="pointer-events-auto absolute bottom-[var(--map-locate-bottom)] right-3 flex flex-col items-end gap-2 lg:right-4">
        {locateError && (
          <div
            role="alert"
            className={`w-full max-w-xs rounded-lg border px-3 py-2 text-sm shadow-lg ${
              isTech
                ? "border-red-400/30 bg-slate-900/95 text-red-300"
                : "border-red-200 bg-white text-red-700"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p>{locateError}</p>
              {onClearLocateError && (
                <button
                  type="button"
                  onClick={onClearLocateError}
                  className={`shrink-0 ${
                    isTech ? "text-red-400 hover:text-red-200" : "text-red-500 hover:text-red-700"
                  }`}
                  aria-label="關閉提示"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              )}
            </div>
          </div>
        )}

        {onToggleFullscreen && (
          <button
            type="button"
            onClick={handleToggleFullscreen}
            aria-label={isFullscreen ? "離開全螢幕" : "全螢幕"}
            title={isFullscreen ? "離開全螢幕" : "全螢幕"}
            className={`flex h-11 w-11 items-center justify-center rounded-full border shadow-lg transition-colors ${surfaceClass}`}
          >
            {isFullscreen ? (
              <Minimize2 className="h-5 w-5" aria-hidden />
            ) : (
              <Maximize2 className="h-5 w-5" aria-hidden />
            )}
          </button>
        )}

        <button
          type="button"
          onClick={onLocate}
          disabled={isLocating}
          aria-label={isLocating ? "定位中" : "定位目前位置"}
          title={isLocating ? "定位中..." : "定位目前位置"}
          className={`flex h-11 w-11 items-center justify-center rounded-full border shadow-lg transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${surfaceClass}`}
        >
          <LocateFixed
            className={`h-5 w-5 ${isLocating ? "animate-pulse" : ""}`}
            aria-hidden
          />
        </button>

        <div
          className={`overflow-hidden rounded-full border shadow-lg ${surfaceClass}`}
        >
          <button
            type="button"
            onClick={() => map.zoomIn()}
            aria-label="放大"
            className={zoomButtonClass}
          >
            <Plus className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
          <div
            className={`h-px ${isTech ? "bg-cyan-500/20" : "bg-gray-200"}`}
            aria-hidden
          />
          <button
            type="button"
            onClick={() => map.zoomOut()}
            aria-label="縮小"
            className={zoomButtonClass}
          >
            <Minus className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
