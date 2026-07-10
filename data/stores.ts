import type { Store } from "@/components/StoreLocator/lib";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=240&q=80";

export const stores: Store[] = [
  {
    id: 1,
    name: "台北旗艦店",
    address: "台北市信義區市府路45號",
    phone: "02-1234-5678",
    lat: 25.0359,
    lng: 121.5645,
    imageUrl: PLACEHOLDER_IMAGE,
  },
  {
    id: 2,
    name: "台中門市",
    address: "台中市西屯區台灣大道三段99號",
    phone: "04-2345-6789",
    lat: 24.1657,
    lng: 120.6478,
    imageUrl: PLACEHOLDER_IMAGE,
  },
  {
    id: 3,
    name: "高雄門市",
    address: "高雄市前鎮區中山二路2號",
    phone: "07-3456-7890",
    lat: 22.6086,
    lng: 120.3006,
    imageUrl: PLACEHOLDER_IMAGE,
  },
];
