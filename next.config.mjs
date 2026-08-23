/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Docker: emits a self-contained server bundle in .next/standalone
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
