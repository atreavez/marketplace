/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produces a minimal .next/standalone bundle (only the files actually
  // needed at runtime) — what Dockerfile's production stage copies out.
  // Without this, `next build` output isn't self-contained and the
  // production Docker image would need the full node_modules tree instead.
  output: 'standalone',
  reactStrictMode: true,
};

module.exports = nextConfig;
