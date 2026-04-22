import type { Metadata, Viewport } from "next";
import { Manrope, Rajdhani } from "next/font/google";
import "./globals.css";

const rajdhani = Rajdhani({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "NOEMA / VAULT",
  description:
    "An immersive realtime WebGL brand world where memory becomes architecture for a fictional premium intelligence platform.",
};

export const viewport: Viewport = {
  themeColor: "#040609",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${rajdhani.variable} ${manrope.variable}`}>
      <body>{children}</body>
    </html>
  );
}
