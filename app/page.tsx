"use client";

import StoreLocator from "@/components/StoreLocator";
import { stores } from "@/data/stores";

export default function HomePage() {
  return <StoreLocator stores={stores} />;
}
