import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MemoFlow · Your team's thinking space",
  description: "Team notes, clear action items, and a little more headspace.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
