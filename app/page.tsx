"use client";

import { useState } from "react";
import StoreLocator, { type StoreLocatorVariant } from "@/components/StoreLocator";
import { VariantSwitcher } from "@/components/StoreLocator/VariantSwitcher";
import { stores } from "@/data/stores";
import { showroomStores } from "@/data/showroom-stores";

export default function HomePage() {
  const [variant, setVariant] = useState<StoreLocatorVariant>("default");

  return (
    <>
      <VariantSwitcher value={variant} onChange={setVariant} />
      <StoreLocator
        key={variant}
        stores={variant === "showroom" ? showroomStores : stores}
        variant={variant}
        title="展示中心"
      />
    </>
  );
}
