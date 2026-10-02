import type { NextConfig } from 'next';
// Vercel uses its deployment adapter; Docker/ECS uses the standalone Node server.
// Both outputs preserve server routes. Static export cannot host /api/chat.
const nextConfig: NextConfig = { output: process.env.VERCEL === '1' ? undefined : 'standalone', images: { unoptimized: true } };
export default nextConfig;
