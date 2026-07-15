# StoreLocator 搬運指南

展示中心門市地圖元件。可整包複製到其他 Next.js（App Router）專案使用。

## 要複製的檔案

```
components/StoreLocator/
  index.tsx      # 主元件（展示中心 UI）
  Map.tsx        # Leaflet 地圖（動態載入）
  lib.ts         # 型別、地區、距離、導航、定位 / 全螢幕 hooks
  styles.css     # 元件樣式（勿漏）
  PORT.md        # 本說明
```

範例資料可選：`data/stores.ts`（或改接 API）。

## 依賴

```bash
npm install leaflet react-leaflet lucide-react
npm install -D @types/leaflet
```

| 套件                        | 用途                                          |
| --------------------------- | --------------------------------------------- |
| `leaflet` / `react-leaflet` | 地圖                                          |
| `lucide-react`              | 圖示（可改成專案既有 icon）                   |
| `tailwindcss`               | 版面 utility class（`index.tsx` / `Map.tsx`） |

建議 Next.js 14+、React 18+。`Map.tsx` 需 client + `dynamic(..., { ssr: false })`。

## 使用方式

```tsx
"use client";

import StoreLocator from "@/components/StoreLocator";
import type { Store } from "@/components/StoreLocator";

const stores: Store[] = [
  {
    id: 1,
    name: "台北旗艦店",
    address: "台北市信義區市府路45號",
    phone: "02-1234-5678",
    lat: 25.0359,
    lng: 121.5645,
    region: "taipei", // 地區篩選用
    imageUrl: "/store.jpg", // 可選
    detailUrl: "/stores/1", // 可選（預留）
  },
];

export default function Page() {
  return <StoreLocator stores={stores} title="展示中心" />;
}
```

### Props

| Prop        | 型別      | 預設         | 說明                   |
| ----------- | --------- | ------------ | ---------------------- |
| `stores`    | `Store[]` | （必填）     | 門市資料               |
| `title`     | `string`  | `"展示中心"` | 頁首標題               |
| `className` | `string`  | —            | 外層 `main` 額外 class |

### `Store` 欄位

| 欄位                         | 必填 | 說明                                      |
| ---------------------------- | ---- | ----------------------------------------- |
| `id`                         | ✓    | 唯一 id                                   |
| `name` / `address` / `phone` | ✓    | 顯示與搜尋                                |
| `lat` / `lng`                | ✓    | 地圖座標                                  |
| `region`                     | 建議 | 地區下拉篩選（見 `STORE_REGION_OPTIONS`） |
| `imageUrl`                   |      | 列表縮圖                                  |
| `placeId` / `detailUrl`      |      | 預留                                      |

地區選項與預設視角在 `lib.ts` 的 `STORE_REGION_OPTIONS`、`STORE_REGION_VIEWPORTS`，可依專案調整。

## 宿主專案注意事項

1. **樣式**：`index.tsx` 已 `import "./styles.css"`。若 CSS Modules / 路徑別名不同，改成相對路徑即可。
2. **Tailwind**：需能掃到 `components/StoreLocator/**/*.{ts,tsx}`（`tailwind.config` 的 `content`）。
3. **全螢幕頁**：元件預設 `h-[100dvh]`。若嵌在有 header 的版面，可改高度或包一層容器。
4. **全域 overflow**：示範站在 `globals.css` 設了 `html, body { height: 100%; overflow: hidden; }`。若宿主頁要可捲動，不要照搬這段，只保留元件內部捲動即可。
5. **圖資**：底圖為[內政部國土測繪中心](https://maps.nlsc.gov.tw/) WMTS，無需 API key；商用請自行確認授權。
6. **路徑別名**：本專案用 `@/`；若目標專案沒有，改相對 import。

## 行為摘要

- 桌面：左地圖、右列表；點列表會飛到門市並開 popup。
- 手機：頂部地區 / 門市下拉；地圖全寬。
- 定位、底圖切換、全螢幕、雙指／Ctrl+滾輪操作提示皆在 `Map.tsx`。

## 結構說明

| 檔案         | 職責                                               |
| ------------ | -------------------------------------------------- |
| `index.tsx`  | 篩選 UI、列表、串接狀態與地圖                      |
| `Map.tsx`    | Leaflet 圖層、marker、控制項（體積最大，功能集中） |
| `lib.ts`     | 純邏輯與 hooks，方便單測或非 React 重用            |
| `styles.css` | 列表、showroom、marker、popup、定位點動畫          |

搬運時建議整包複製 `components/StoreLocator/`，再在頁面傳入 `stores` 即可。
