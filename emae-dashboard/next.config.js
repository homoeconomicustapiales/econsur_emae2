/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Recharts uses some browser-only APIs — suppress the SSR warning
  transpilePackages: ["recharts"],
};

module.exports = nextConfig;
