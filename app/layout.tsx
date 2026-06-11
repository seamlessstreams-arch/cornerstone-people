import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Keni — children's-home recruitment, matched on trust",
  description:
    "A regional, supply-first matching app for children's-home recruitment. Candidates and homes connect only when interest is mutual.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
