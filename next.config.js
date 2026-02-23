/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: process.env.NODE_ENV === 'production' ? '/pehriod' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/pehriod/' : '',
  trailingSlash: true,
};

module.exports = nextConfig;
