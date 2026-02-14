/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
        serverComponentsExternalPackages: ['undici'],
    },
    images: {
        domains: ['firebasestorage.googleapis.com', 'images.unsplash.com', 'res.cloudinary.com'],
    },
};

export default nextConfig;
