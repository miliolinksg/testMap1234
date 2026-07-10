"use client";

import StoreLocator from "@/components/StoreLocator";
import { showroomStores } from "@/data/showroom-stores";

export default function ShowroomPage() {
  return <StoreLocator stores={showroomStores} variant="showroom" title="展示中心" />;
}
