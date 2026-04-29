import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Entity Diagnostic System",
  description:
    "A system-driven identity analysis interface with scroll-controlled states, live entity switching, and a reactive 3D core."
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
