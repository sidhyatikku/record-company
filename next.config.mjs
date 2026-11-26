/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  outputFileTracingIncludes: {
    '/**': ['./data/library.json'],
  },
  outputFileTracingExcludes: {
    '/**': ['./data/albums/**', './public/covers/**'],
  },
}

export default nextConfig
