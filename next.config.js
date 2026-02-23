/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '/pehriod',
  trailingSlash: true,
};

module.exports = nextConfig;
