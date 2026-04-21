import type { Metadata, Viewport } from "next";
import { Manrope, Oxanium } from "next/font/google";
import "./globals.css";

const oxanium = Oxanium({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "ARCTIS / SIGNAL",
  description:
    "An immersive realtime WebGL brand world for a fictional climate-forward creative technology company.",
};

export const viewport: Viewport = {
  themeColor: "#03060a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${oxanium.variable} ${manrope.variable}`}>
      <body>{children}</body>
    </html>
  );
}
