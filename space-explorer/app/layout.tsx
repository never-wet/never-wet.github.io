import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Space Explorer | Never Wet",
  description:
    "A cinematic 3D solar system explorer with realistic planetary textures, famous stars, measurements, orbits, and NASA/JPL integration hooks.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
