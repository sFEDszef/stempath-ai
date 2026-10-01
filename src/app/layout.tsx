import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "STEMPath AI",
  creator: "Tequila Sunset",
  authors: [{ name: "Tequila Sunset" }],
  icons: { icon: { url: "/brand/tequila-sunset-logo-original.jpg", type: "image/jpeg" }, apple: "/brand/tequila-sunset-logo-original.jpg" },
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
