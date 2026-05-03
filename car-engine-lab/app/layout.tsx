import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Car Engine Lab | Interactive Engine Visualizer",
  description:
    "Interactive learning lab for internal combustion, hybrid, electric, turbocharged, and supercharged car engines using animated 2D diagrams and procedural 3D models."
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
