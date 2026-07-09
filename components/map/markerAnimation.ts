import L from "leaflet";

function playElementAnimation(element: HTMLElement, className: string) {
  const onEnd = () => {
    element.classList.remove(className);
    element.removeEventListener("animationend", onEnd);
  };

  element.addEventListener("animationend", onEnd);
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
}

function playPinAnimation(marker: L.Marker, className: string) {
  const pin = marker
    .getElement()
    ?.querySelector(".custom-marker-pin") as HTMLElement | null;

  if (!pin) return;

  playElementAnimation(pin, className);
}

/** 點擊 Marker：輕微上下彈跳 */
export function bounceMarker(marker: L.Marker) {
  playPinAnimation(marker, "marker-bounce");
}

/** 初次渲染：依序彈跳進場 */
export function enterMarker(marker: L.Marker, delayMs = 0, attempt = 0) {
  const pin = marker
    .getElement()
    ?.querySelector(".custom-marker-pin") as HTMLElement | null;

  if (!pin) {
    if (attempt < 10) {
      requestAnimationFrame(() => enterMarker(marker, delayMs, attempt + 1));
    }
    return;
  }

  if (pin.classList.contains("marker-enter")) return;

  pin.style.setProperty("--enter-delay", `${delayMs}ms`);

  const onEnd = () => {
    pin.classList.remove("marker-enter");
    pin.removeEventListener("animationend", onEnd);
  };

  pin.addEventListener("animationend", onEnd);
  pin.classList.add("marker-enter");
}

/** 點擊列表：原地脈衝放大，不上下位移，較不易暈 */
export function pulseMarker(marker: L.Marker) {
  playPinAnimation(marker, "marker-pulse");
}

/** 定位成功：科幻風格輻射 ping */
export function burstUserLocation(marker: L.Marker, attempt = 0) {
  const root = marker
    .getElement()
    ?.querySelector(".user-location-marker") as HTMLElement | null;

  if (!root) {
    if (attempt < 10) {
      requestAnimationFrame(() => burstUserLocation(marker, attempt + 1));
    }
    return;
  }

  playElementAnimation(root, "user-location-burst");
}

export function openPopupWithFade(marker: L.Marker) {
  marker.openPopup();

  const popupEl = marker.getPopup()?.getElement();
  if (!popupEl) return;

  popupEl.classList.remove("popup-fade-in");
  void popupEl.offsetWidth;
  popupEl.classList.add("popup-fade-in");
}
