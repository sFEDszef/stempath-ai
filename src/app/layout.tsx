import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "STEMPath AI — Wind-Powered Car",
  description:
    "Think · Explore · Build · Grow. A student-centred STEM learning workspace with bilingual mock coaching.",
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
