export const NLSC_ATTRIBUTION =
  '&copy; <a href="https://maps.nlsc.gov.tw/" target="_blank" rel="noopener noreferrer">內政部國土測繪中心</a>';

const NLSC_WMTS_BASE = "https://wmts.nlsc.gov.tw/wmts";

export function buildNlscWmtsUrl(layerCode: string): string {
  return `${NLSC_WMTS_BASE}/${layerCode}/default/GoogleMapsCompatible/{z}/{y}/{x}`;
}

export type MapUiVariant = "normal" | "tech";

export type MapStyleKey =
  | "emap"
  | "emap6"
  | "emap5"
  | "emap01"
  | "photo2"
  | "photo_mix"
  | "emap8"
  | "b5000"
  | "b25000"
  | "b50000"
  | "b100000"
  | "luimap"
  | "dmaps";

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
  emap: {
    label: "通用電子地圖",
    icon: "🗺",
    layerCode: "EMAP",
    url: buildNlscWmtsUrl("EMAP"),
    attribution: NLSC_ATTRIBUTION,
    maxZoom: 19,
    uiVariant: "normal",
  },
  emap6: {
    label: "電子地圖（無等高線）",
    icon: "📍",
    layerCode: "EMAP6",
    url: buildNlscWmtsUrl("EMAP6"),
    attribution: NLSC_ATTRIBUTION,
    maxZoom: 19,
    uiVariant: "normal",
  },
  emap5: {
    label: "電子地圖（等高線）",
    icon: "⛰",
    layerCode: "EMAP5",
    url: buildNlscWmtsUrl("EMAP5"),
    attribution: NLSC_ATTRIBUTION,
    maxZoom: 19,
    uiVariant: "normal",
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
  photo2: {
    label: "正射影像（含路名）",
    icon: "🛰",
    layerCode: "PHOTO2",
    url: buildNlscWmtsUrl("PHOTO2"),
    attribution: NLSC_ATTRIBUTION,
    maxZoom: 19,
    uiVariant: "tech",
  },
  photo_mix: {
    label: "航照混合影像",
    icon: "🌐",
    layerCode: "PHOTO_MIX",
    url: buildNlscWmtsUrl("PHOTO_MIX"),
    attribution: NLSC_ATTRIBUTION,
    maxZoom: 19,
    uiVariant: "tech",
  },
  emap8: {
    label: "英文電子地圖",
    icon: "🇬🇧",
    layerCode: "EMAP8",
    url: buildNlscWmtsUrl("EMAP8"),
    attribution: NLSC_ATTRIBUTION,
    maxZoom: 19,
    uiVariant: "normal",
  },
  b5000: {
    label: "1/5000 地形圖",
    icon: "🧭",
    layerCode: "B5000",
    url: buildNlscWmtsUrl("B5000"),
    attribution: NLSC_ATTRIBUTION,
    maxZoom: 18,
    uiVariant: "normal",
  },
  b25000: {
    label: "1/25000 地形圖",
    icon: "🗾",
    layerCode: "B25000",
    url: buildNlscWmtsUrl("B25000"),
    attribution: NLSC_ATTRIBUTION,
    maxZoom: 16,
    uiVariant: "normal",
  },
  b50000: {
    label: "1/50000 地形圖",
    icon: "📐",
    layerCode: "B50000",
    url: buildNlscWmtsUrl("B50000"),
    attribution: NLSC_ATTRIBUTION,
    maxZoom: 15,
    uiVariant: "normal",
  },
  b100000: {
    label: "1/100000 地形圖",
    icon: "🗂️",
    layerCode: "B100000",
    url: buildNlscWmtsUrl("B100000"),
    attribution: NLSC_ATTRIBUTION,
    maxZoom: 14,
    uiVariant: "normal",
  },
  luimap: {
    label: "國土利用現況",
    icon: "🏞",
    layerCode: "LUIMAP",
    url: buildNlscWmtsUrl("LUIMAP"),
    attribution: NLSC_ATTRIBUTION,
    maxZoom: 18,
    uiVariant: "normal",
  },
  dmaps: {
    label: "地籍圖",
    icon: "🏠",
    layerCode: "DMAPS",
    url: buildNlscWmtsUrl("DMAPS"),
    attribution: NLSC_ATTRIBUTION,
    maxZoom: 19,
    uiVariant: "normal",
  },
};

export const mapStyleOrder: MapStyleKey[] = [
  "emap",
  "emap6",
  "emap5",
  "emap01",
  "photo2",
  "photo_mix",
  "emap8",
  "b5000",
  "b25000",
  "b50000",
  "b100000",
  "luimap",
  "dmaps",
];
