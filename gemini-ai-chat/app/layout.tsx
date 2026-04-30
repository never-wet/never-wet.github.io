import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Never Wet Chat | Gemini AI Assistant",
  description:
    "A secure Gemini-powered chat assistant with a server-side Next.js API route."
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
