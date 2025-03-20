const orgPackages = ["@mikematos84/sass-react-library"];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizeCss: true,
    optimizePackageImports: orgPackages,
  },
};

export default nextConfig;
