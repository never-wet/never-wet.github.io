import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Visual Search Lens",
  description:
    "Search-focused image analysis for detailed descriptions, keywords, Google queries, styles, colors, and similar-image discovery."
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
