"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

/** 收合高度，與 globals.css 的 --store-drawer-collapsed-height 同步 */
export const STORE_DRAWER_COLLAPSED_HEIGHT = "3.25rem";

interface StoreListSheetProps {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  storeCount: number;
  activeStoreName?: string | null;
  children: ReactNode;
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <ChevronDown
      className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-300 ${
        expanded ? "rotate-180" : ""
      }`}
      aria-hidden
    />
  );
}

export default function StoreListSheet({
  expanded,
  onExpandedChange,
  storeCount,
  activeStoreName,
  children,
}: StoreListSheetProps) {
  const [isEntering, setIsEntering] = useState(false);
  const wasExpandedRef = useRef(false);

  useEffect(() => {
    if (expanded && !wasExpandedRef.current) {
      setIsEntering(true);
      const timer = window.setTimeout(() => setIsEntering(false), 480);
      wasExpandedRef.current = true;
      return () => window.clearTimeout(timer);
    }

    if (!expanded) {
      wasExpandedRef.current = false;
      setIsEntering(false);
    }
  }, [expanded]);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[2000] lg:hidden"
      style={{
        ["--store-drawer-collapsed-height" as string]: STORE_DRAWER_COLLAPSED_HEIGHT,
      }}
      aria-label="門市列表面板"
    >
      <div
        className={`store-drawer-panel pointer-events-auto mx-auto flex w-full max-w-none flex-col overflow-hidden border border-t-0 border-gray-200/80 bg-white shadow-[0_4px_32px_rgba(15,23,42,0.14)] backdrop-blur-md transition-[height] duration-300 ease-out ${
          expanded
            ? "store-drawer-panel--expanded h-[min(58dvh,420px)] rounded-b-[1.75rem]"
            : "h-[var(--store-drawer-collapsed-height)] rounded-b-2xl"
        } ${isEntering ? "store-drawer-panel--enter" : ""}`}
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
      >
        <button
          type="button"
          onClick={() => onExpandedChange(!expanded)}
          className="flex min-h-[3.25rem] shrink-0 items-center justify-between gap-3 border-b border-gray-200/80 px-4 py-3 transition-colors hover:bg-gray-50"
          aria-expanded={expanded}
          aria-controls="store-list-sheet-content"
        >
          <span className="truncate text-left text-sm font-semibold text-gray-900">
            {expanded ? (activeStoreName ?? "門市據點") : "門市據點"}
          </span>
          <span className="flex shrink-0 items-center gap-1.5 text-xs text-gray-500">
            <span className="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-600">
              {storeCount} 間
            </span>
            <ChevronIcon expanded={expanded} />
          </span>
        </button>

        <div
          id="store-list-sheet-content"
          className={`flex min-h-0 flex-1 flex-col overflow-hidden touch-pan-y ${
            expanded
              ? "store-drawer-content--visible opacity-100"
              : "pointer-events-none max-h-0 opacity-0"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
