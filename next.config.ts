import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // 如果您的仓库名不是域名根目录，需要设置basePath
  // 例如：如果您的GitHub Pages URL是 username.github.io/canvas-video-greenscreen
  basePath: process.env.NODE_ENV === 'production' ? '/canvas-video-greenscreen' : '',
  // 对于静态导出，需要禁用图像优化
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
