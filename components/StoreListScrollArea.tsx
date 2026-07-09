"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface StoreListScrollAreaProps {
  children: ReactNode;
  variant?: "sidebar" | "sheet";
}

interface ScrollMetrics {
  scrollable: boolean;
  thumbTop: number;
  thumbHeight: number;
}

const MIN_THUMB_HEIGHT = 28;

export default function StoreListScrollArea({
  children,
  variant = "sidebar",
}: StoreListScrollAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState<ScrollMetrics>({
    scrollable: false,
    thumbTop: 0,
    thumbHeight: 0,
  });

  const updateMetrics = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;

    const scrollable = element.scrollHeight > element.clientHeight + 2;
    const viewport = element.clientHeight;
    const content = element.scrollHeight;
    const thumbHeight = scrollable
      ? Math.max((viewport / content) * viewport, MIN_THUMB_HEIGHT)
      : 0;
    const maxThumbTop = viewport - thumbHeight;
    const scrollRatio =
      content <= viewport
        ? 0
        : element.scrollTop / (content - viewport);
    const thumbTop = scrollable ? scrollRatio * maxThumbTop : 0;

    setMetrics({ scrollable, thumbTop, thumbHeight });
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    updateMetrics();

    const observer = new ResizeObserver(updateMetrics);
    observer.observe(element);

    if (element.firstElementChild) {
      observer.observe(element.firstElementChild);
    }

    return () => observer.disconnect();
  }, [children, updateMetrics]);

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollRef}
        onScroll={updateMetrics}
        className={`store-list-scroll h-full overscroll-contain ${
          metrics.scrollable ? "store-list-scroll--active is-scrollable" : ""
        } ${variant === "sheet" ? "store-list-scroll--sheet" : ""}`}
      >
        {children}
      </div>

      {metrics.scrollable && (
        <div
          className="store-list-scrollbar"
          aria-hidden
        >
          <div className="store-list-scrollbar-track">
            <div
              className="store-list-scrollbar-thumb"
              style={{
                height: `${metrics.thumbHeight}px`,
                transform: `translateY(${metrics.thumbTop}px)`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
