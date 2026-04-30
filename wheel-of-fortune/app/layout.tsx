import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wheel of Fortune | Never Wet",
  description: "A polished spinning wheel app with fair random selection, editable options, presets, and smooth physics-style motion.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
