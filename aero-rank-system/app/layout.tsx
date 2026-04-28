import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AeroRank Vehicle Analysis System",
  description:
    "A futuristic vehicle ranking and aerodynamic analysis interface for premium performance cars."
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
