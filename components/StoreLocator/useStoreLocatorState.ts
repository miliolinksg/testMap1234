"use client";

import { useCallback, useRef, useState } from "react";
import {
  type Store,
  type StoreFocusSource,
  useGeolocation,
  useMapFullscreen,
} from "./lib";

export function useStoreLocatorState() {
  const [activeStore, setActiveStore] = useState<Store | null>(null);
  const [focusSource, setFocusSource] = useState<StoreFocusSource>("list");
  const [locateRevision, setLocateRevision] = useState(0);
  const containerRef = useRef<HTMLElement>(null);
  const { isFullscreen, toggleFullscreen } = useMapFullscreen(containerRef);
  const { location, error, isLocating, locate, clearError } = useGeolocation();

  const handleLocate = useCallback(async () => {
    setActiveStore(null);
    setFocusSource("locate");
    const coords = await locate();
    if (!coords) return;
    setLocateRevision((revision) => revision + 1);
  }, [locate]);

  const handleStoreSelect = useCallback((store: Store) => {
    setFocusSource("list");
    setActiveStore(store);
  }, []);

  const handleMarkerClick = useCallback((store: Store) => {
    setFocusSource("marker");
    setActiveStore(store);
  }, []);

  const resetSelection = useCallback(() => {
    setActiveStore(null);
    setFocusSource("list");
  }, []);

  return {
    activeStore,
    focusSource,
    locateRevision,
    containerRef,
    isFullscreen,
    toggleFullscreen,
    location,
    error,
    isLocating,
    clearError,
    handleLocate,
    handleStoreSelect,
    handleMarkerClick,
    resetSelection,
  };
}
