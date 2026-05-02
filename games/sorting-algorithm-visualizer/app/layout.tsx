import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sorting Algorithm Visualizer | Never Wet",
  description:
    "An educational sorting algorithm visualizer with animated bars, step controls, pseudocode highlighting, and side-by-side comparison mode.",
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
