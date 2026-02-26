/** @type {import('next').NextConfig} */
const nextConfig = {
    // Turbopack is default in Next.js 16, no explicit opt-in needed
    serverExternalPackages: ['bcryptjs'],
};

export default nextConfig;
