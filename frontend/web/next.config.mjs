/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: ['firebasestorage.googleapis.com', 'images.unsplash.com', 'res.cloudinary.com'],
    },
};

export default nextConfig;
