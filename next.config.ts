import type { NextConfig } from 'next';
// Vercel serves both the UI and /api/chat. Static export cannot host API routes.
const nextConfig: NextConfig = { images: { unoptimized: true } };
export default nextConfig;
