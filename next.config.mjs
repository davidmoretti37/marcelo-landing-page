/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/showroom",
        destination: "/#showroom",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
