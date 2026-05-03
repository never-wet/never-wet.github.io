import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sitebound RPG",
  description: "A full-screen browser RPG with playable building interiors, NPCs, quests, weather, sound, and mini-games."
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
