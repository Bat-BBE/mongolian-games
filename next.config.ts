import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  /** Production: суурь аюулгүйн header-ууд (reverse proxy-аас илүү сул тохиргоо нэмнэ). */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
