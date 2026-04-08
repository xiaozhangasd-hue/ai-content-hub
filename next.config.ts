import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // outputFileTracingRoot: path.resolve(__dirname, '../../'),  // Uncomment and add 'import path from "path"' if needed
  /* config options here */
  allowedDevOrigins: ['*.dev.coze.site'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lf-coze-web-cdn.coze.cn',
        pathname: '/**',
      },
    ],
  },
  // 标记不兼容的服务器端包为外部依赖
  serverExternalPackages: ['bull', 'bcryptjs'],
};

export default nextConfig;
