import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hand Draw Studio | Never Wet",
  description:
    "A webcam hand-tracking drawing app where pinching index finger and thumb draws on canvas.",
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
