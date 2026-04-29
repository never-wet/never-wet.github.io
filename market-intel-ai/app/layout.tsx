import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Market Intel AI | Real-Time Stock Analysis",
  description:
    "A real-time AI-powered stock analysis terminal with live OHLC data, prediction signals, news, and account tracking."
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
