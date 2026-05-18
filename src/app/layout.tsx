import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CM Piggybank",
  description: "A custodial ledger for the cash on the kitchen counter.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
