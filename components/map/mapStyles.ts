export const NLSC_ATTRIBUTION =
  '&copy; <a href="https://maps.nlsc.gov.tw/" target="_blank" rel="noopener noreferrer">內政部國土測繪中心</a>';

const NLSC_WMTS_BASE = "https://wmts.nlsc.gov.tw/wmts";

export function buildNlscWmtsUrl(layerCode: string): string {
  return `${NLSC_WMTS_BASE}/${layerCode}/default/GoogleMapsCompatible/{z}/{y}/{x}`;
}

export type MapUiVariant = "normal" | "tech";

export type MapStyleKey = "emap6" | "photo2" | "emap01";

export interface MapStyleConfig {
  label: string;
  icon: string;
  layerCode: string;
  url: string;
  attribution: string;
  maxZoom: number;
  uiVariant: MapUiVariant;
}

export const mapStyles: Record<MapStyleKey, MapStyleConfig> = {
  emap6: {
    label: "預設",
    icon: "📍",
    layerCode: "EMAP6",
    url: buildNlscWmtsUrl("EMAP6"),
    attribution: NLSC_ATTRIBUTION,
    maxZoom: 19,
    uiVariant: "normal",
  },
  photo2: {
    label: "衛星影像",
    icon: "🛰",
    layerCode: "PHOTO2",
    url: buildNlscWmtsUrl("PHOTO2"),
    attribution: NLSC_ATTRIBUTION,
    maxZoom: 19,
    uiVariant: "tech",
  },
  emap01: {
    label: "灰階電子地圖",
    icon: "⚡",
    layerCode: "EMAP01",
    url: buildNlscWmtsUrl("EMAP01"),
    attribution: NLSC_ATTRIBUTION,
    maxZoom: 19,
    uiVariant: "tech",
  },
};

export const mapStyleOrder: MapStyleKey[] = ["emap6", "photo2", "emap01"];
