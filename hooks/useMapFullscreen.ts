"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type FullscreenMode = "normal" | "native" | "pseudo";

function getNativeFullscreenElement(): Element | null {
  const doc = document as FullscreenDocument;
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

function supportsNativeFullscreen(element: HTMLElement): boolean {
  const el = element as FullscreenElement;
  return Boolean(element.requestFullscreen || el.webkitRequestFullscreen);
}

async function enterNativeFullscreen(element: HTMLElement): Promise<void> {
  const el = element as FullscreenElement;

  if (element.requestFullscreen) {
    await element.requestFullscreen();
    return;
  }

  if (el.webkitRequestFullscreen) {
    await el.webkitRequestFullscreen();
  }
}

async function exitNativeFullscreen(): Promise<void> {
  const doc = document as FullscreenDocument;

  if (document.fullscreenElement && document.exitFullscreen) {
    await document.exitFullscreen();
    return;
  }

  if (doc.webkitFullscreenElement && doc.webkitExitFullscreen) {
    await doc.webkitExitFullscreen();
  }
}

export function useMapFullscreen(targetRef: RefObject<HTMLElement | null>) {
  const [mode, setMode] = useState<FullscreenMode>("normal");

  const isFullscreen = mode !== "normal";

  useEffect(() => {
    const handleFullscreenChange = () => {
      const target = targetRef.current;
      const nativeElement = getNativeFullscreenElement();

      if (target && nativeElement === target) {
        setMode("native");
        return;
      }

      setMode((current) => (current === "native" ? "normal" : current));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, [targetRef]);

  useEffect(() => {
    return () => {
      document.body.classList.remove("map-fullscreen-active");
      targetRef.current?.classList.remove("map-pseudo-fullscreen");
    };
  }, [targetRef]);

  const toggleFullscreen = useCallback(async () => {
    const element = targetRef.current;
    if (!element) return;

    if (mode !== "normal") {
      if (mode === "pseudo") {
        document.body.classList.remove("map-fullscreen-active");
        element.classList.remove("map-pseudo-fullscreen");
        setMode("normal");
      } else {
        await exitNativeFullscreen();
        setMode("normal");
      }

      window.dispatchEvent(new Event("resize"));
      return;
    }

    if (supportsNativeFullscreen(element)) {
      try {
        await enterNativeFullscreen(element);
        setMode("native");
        window.dispatchEvent(new Event("resize"));
        return;
      } catch {
        // iOS 等環境可能拒絕原生全螢幕，改用偽全螢幕
      }
    }

    document.body.classList.add("map-fullscreen-active");
    element.classList.add("map-pseudo-fullscreen");
    setMode("pseudo");
    window.dispatchEvent(new Event("resize"));
  }, [mode, targetRef]);

  return {
    isFullscreen,
    isPseudoFullscreen: mode === "pseudo",
    toggleFullscreen,
  };
}
