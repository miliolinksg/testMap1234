import type { Store } from "@/types/store";

export function createGoogleNavigationUrl(
  store: Pick<Store, "lat" | "lng">,
): string {
  const destination = `${store.lat},${store.lng}`;
  const params = new URLSearchParams({
    api: "1",
    destination,
    travelmode: "driving",
    dir_action: "navigate",
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function createPhoneUrl(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
