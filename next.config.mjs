/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Cho phép load thumbnail game từ nguồn ngoài (Playgama CDN...) nếu cần.
    remotePatterns: [
      { protocol: "https", hostname: "**.playgama.com" },
      { protocol: "https", hostname: "playgama.com" },
    ],
  },
};

export default nextConfig;
