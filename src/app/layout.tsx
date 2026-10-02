import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL("https://stempathai.com"),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "https://stempathai.com",
    siteName: "STEMPath AI",
    title: "STEMPath AI",
    description: "A bilingual platform for STEM inquiry and human–AI collaboration.",
  },
  twitter: { card: "summary", title: "STEMPath AI", description: "A bilingual platform for STEM inquiry and human–AI collaboration." },
  title: "STEMPath AI",
  creator: "Tequila Sunset",
  authors: [{ name: "Tequila Sunset" }],
  // Content-versioned URLs refresh cached browser and home-screen icons.
  // The header artwork is intentionally independent of these website icons.
  icons: {
    icon: [
      { url: "/favicon.ico?v=256e7993ff86", type: "image/x-icon", sizes: "16x16 32x32 48x48" },
      ...[16, 32, 48, 192, 512].map(size => ({
        url: `/brand/stempath-256e7993ff86-${size}.png`,
        type: "image/png",
        sizes: `${size}x${size}`,
      })),
    ],
    shortcut: "/favicon.ico?v=256e7993ff86",
    apple: { url: "/brand/stempath-256e7993ff86-180.png", type: "image/png", sizes: "180x180" },
  },
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
