import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Object + Room Scanner | Never Wet",
  description:
    "A realtime camera-based object and room scanner that reconstructs sampled camera frames into colored 3D point-cloud previews.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="./favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  );
}
