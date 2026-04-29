import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Loop DAW | Music Composition Platform",
  description:
    "A modern, beginner-friendly browser DAW for fast melody, rhythm, loop, and Web Audio composition.",
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
