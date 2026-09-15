import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "STEMPath AI — Learning Workspace",
  description:
    "Think · Explore · Build · Grow. A student-centred STEM learning workspace with bilingual STEM coaching.",
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
