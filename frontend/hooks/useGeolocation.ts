"use client";

import { useCallback, useState } from "react";
import type { Coordinates } from "@/utils/geo";

export type GeolocationErrorCode =
  | "unsupported"
  | "permission_denied"
  | "timeout"
  | "unavailable"
  | "unknown";

const ERROR_MESSAGES: Record<GeolocationErrorCode, string> = {
  unsupported: "此瀏覽器不支援定位功能",
  permission_denied: "定位權限被拒，請在瀏覽器設定中允許定位後重試",
  timeout: "定位逾時，請確認 GPS 或網路狀態後重試",
  unavailable: "目前無法取得位置，請稍後再試",
  unknown: "定位失敗，請稍後再試",
};

function mapGeolocationError(error: GeolocationPositionError): GeolocationErrorCode {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "permission_denied";
    case error.POSITION_UNAVAILABLE:
      return "unavailable";
    case error.TIMEOUT:
      return "timeout";
    default:
      return "unknown";
  }
}

export function useGeolocation() {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const locate = useCallback((): Promise<Coordinates | null> => {
    if (!navigator.geolocation) {
      setError(ERROR_MESSAGES.unsupported);
      return Promise.resolve(null);
    }

    setIsLocating(true);
    setError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(coords);
          setIsLocating(false);
          resolve(coords);
        },
        (positionError) => {
          const code = mapGeolocationError(positionError);
          setError(ERROR_MESSAGES[code]);
          setIsLocating(false);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      );
    });
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    location,
    error,
    isLocating,
    locate,
    clearError,
  };
}
