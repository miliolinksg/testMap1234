# StoreLocator 搬運說明

門市據點地圖元件。複製本資料夾到其他專案後，依本文件接上依賴與樣式即可使用。

## 資料夾內容

```
components/StoreLocator/
  index.tsx   # 入口 UI（列表、手機抽屜、導航按鈕）
  Map.tsx     # Leaflet 地圖（標記、定位、全螢幕、觸控／滾輪限制）
  lib.ts      # Store 型別、距離、導航、定位／全螢幕 hooks
  PORTING.md  # 本說明
```

相關樣式目前在專案的 `app/globals.css`（搬運時一併複製對應區段）。

## 1. 複製檔案

1. 複製整個 `components/StoreLocator/` 到目標專案。
2. 從來源專案 `app/globals.css` 複製下列樣式到目標全域 CSS（或獨立 `store-locator.css` 再 import）：
   - `body.map-fullscreen-active`、`.map-pseudo-fullscreen`
   - `:root` 內 `--store-drawer-*`、`--map-*` 變數（含 `@media (min-width: 1024px)`）
   - `.store-list-scroll*`、`.store-list-scrollbar*`
   - `.store-item*`
   - `.store-drawer-*` 與相關 `@keyframes`
   - `.custom-marker-*`、`.user-location-*`
   - `.leaflet-*` 覆寫、`.store-popup-*`、`.map-touch-hint*`、`.map-fullscreen-btn*`
3. （建議）一併帶上示範資料結構，參考本專案 `data/stores.ts`。

## 2. 安裝依賴

```bash
npm install leaflet react-leaflet lucide-react
npm install -D @types/leaflet
```

版本參考（本專案）：

| 套件 | 版本 |
|------|------|
| leaflet | ^1.9.4 |
| react-leaflet | ^4.2.1（搭配 React 18） |
| lucide-react | ^1.23.0 |
| @types/leaflet | ^1.9.21 |

另需：

- **React 18+**
- **Next.js**：`Map.tsx` 以 `next/dynamic` + `ssr: false` 載入（避免 Leaflet 在 SSR 報錯）
- **Tailwind CSS**：列表／抽屜 layout 使用 Tailwind utility class

若目標不是 Next.js，請自行把 `index.tsx` 裡的 `dynamic(() => import("./Map"), { ssr: false })` 改成一般 client-only 載入方式。

## 3. 路徑別名

本元件使用 `@/components/StoreLocator` 這類 import。請確認目標專案 `tsconfig` 有類似設定：

```json
{
  "compilerOptions": {
    "paths": { "@/*": ["./*"] }
  }
}
```

若沒有 `@/`，請改成相對路徑。

## 4. 頁面／Layout 建議

### Viewport（瀏海／safe-area）

```ts
export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};
```

### Body（可選）

全螢幕地圖頁建議：

```css
html, body { height: 100%; overflow: hidden; }
body {
  padding: env(safe-area-inset-top) env(safe-area-inset-right) 0
    env(safe-area-inset-left);
}
```

## 5. 使用方式

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
    imageUrl: "https://example.com/store.jpg", // 可選
  },
];

export default function Page() {
  return <StoreLocator stores={stores} />;
}
```

### `Store` 欄位

| 欄位 | 必填 | 說明 |
|------|------|------|
| `id` | ✅ | 唯一識別 |
| `name` | ✅ | 店名 |
| `address` | ✅ | 地址 |
| `phone` | ✅ | 電話（撥打／搜尋用） |
| `lat` / `lng` | ✅ | 座標 |
| `placeId` | | 預留 |
| `imageUrl` | | 有則列表顯示縮圖 |

### Props

```ts
interface StoreLocatorProps {
  stores: Store[];
  className?: string; // 加在外層 <main>
}
```

## 6. 功能摘要（搬運後應可運作）

- 桌面：左側列表 + 地圖；手機：頂部抽屜列表 + 全螢幕地圖
- 搜尋、依距離排序、定位、標記同步、導航（iOS／Android／桌面）
- 底圖切換（內政部 NLSC WMTS）
- 全螢幕（含 iOS 偽全螢幕 fallback）
- 觸控：單指提示／雙指操作；桌面：Ctrl+滾輪縮放（全螢幕可直接滾輪）

## 7. 搬運檢查清單

- [ ] 已複製 `index.tsx`、`Map.tsx`、`lib.ts`
- [ ] 已複製 globals 中 StoreLocator 相關 CSS
- [ ] 已安裝 `leaflet`、`react-leaflet`、`lucide-react`、`@types/leaflet`
- [ ] Tailwind 已啟用且 content 掃到此資料夾
- [ ] 地圖以 client-only 方式載入（無 SSR 錯誤）
- [ ] `viewportFit: "cover"`（若需瀏海 safe-area）
- [ ] 傳入至少一筆含 `lat`/`lng` 的 `stores` 可正常顯示

## 8. 常見問題

**地圖空白／`window is not defined`**  
確認 `Map` 沒有在 server 端直接 import，需 `dynamic(..., { ssr: false })` 或等效做法。

**樣式跑掉**  
多數外觀在 CSS class（`.store-item`、`.leaflet-*`），不只 Tailwind；漏貼 globals 區段會缺捲軸、標記動畫、警語遮罩等。

**圖資／網路**  
預設使用 `wmts.nlsc.gov.tw`；目標環境需能連外，或自行改 `lib.ts` 的 `mapStyles`。

**導航在 App WebView 行為不同**  
`lib.ts` 的 URL scheme／intent 依瀏覽器與系統而異，嵌入 App 時可能需再調整。
