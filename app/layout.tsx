import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "門市據點",
  description: "Google Maps 門市據點 Demo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body className="h-full">{children}</body>
    </html>
  );
}
