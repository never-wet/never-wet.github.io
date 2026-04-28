import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Terrain Generator",
  description:
    "Realtime procedural terrain generation, erosion, material preview, brush editing, and export."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#07100f"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
