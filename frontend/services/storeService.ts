import type { Store } from "@/types/store";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export async function getStores(): Promise<Store[]> {
  const res = await fetch(`${API_BASE_URL}/stores`);

  if (!res.ok) {
    throw new Error(`Failed to fetch stores: ${res.status}`);
  }

  return (await res.json()) as Store[];
}
