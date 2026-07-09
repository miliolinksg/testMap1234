import L from "leaflet";

function playPinAnimation(marker: L.Marker, className: string) {
  const pin = marker
    .getElement()
    ?.querySelector(".custom-marker-pin") as HTMLElement | null;

  if (!pin) return;

  const onEnd = () => {
    pin.classList.remove(className);
    pin.removeEventListener("animationend", onEnd);
  };

  pin.addEventListener("animationend", onEnd);
  pin.classList.remove(className);
  void pin.offsetWidth;
  pin.classList.add(className);
}

/** 點擊 Marker：輕微上下彈跳 */
export function bounceMarker(marker: L.Marker) {
  playPinAnimation(marker, "marker-bounce");
}

/** 點擊列表：原地脈衝放大，不上下位移，較不易暈 */
export function pulseMarker(marker: L.Marker) {
  playPinAnimation(marker, "marker-pulse");
}

export function openPopupWithFade(marker: L.Marker) {
  marker.openPopup();

  const popupEl = marker.getPopup()?.getElement();
  if (!popupEl) return;

  popupEl.classList.remove("popup-fade-in");
  void popupEl.offsetWidth;
  popupEl.classList.add("popup-fade-in");
}
