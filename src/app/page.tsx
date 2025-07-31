"use client";

import React, { useState } from "react";
import GreenscreenProcessor from "../components/GreenscreenProcessor";
import ConfigPanel from "../components/ConfigPanel";
import BackgroundUploader from "../components/BackgroundUploader";
import VideoUploader from "../components/VideoUploader";

interface GreenscreenConfig {
  hueMin: number;
  hueMax: number;
  saturationMin: number;
  saturationMax: number;
  lightnessMin: number;
  lightnessMax: number;
  tolerance: number;
  feather: number;
}

export default function Home() {
  const [config, setConfig] = useState<GreenscreenConfig>({
    hueMin: 100,
    hueMax: 140,
    saturationMin: 50,
    saturationMax: 255,
    lightnessMin: 30,
    lightnessMax: 200,
    tolerance: 30,
    feather: 2,
  });

  const [useBackground, setUseBackground] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<
    HTMLImageElement | undefined
  >(undefined);
  const [uploadedVideo, setUploadedVideo] = useState<
    HTMLVideoElement | undefined
  >(undefined);
  const [uploadedVideoFile, setUploadedVideoFile] = useState<File | undefined>(
    undefined
  );

  // 处理视频上传
  const handleVideoChange = (videoElement: HTMLVideoElement, file: File) => {
    setUploadedVideo(videoElement);
    setUploadedVideoFile(file);
  };

  // 处理视频绿幕
  const handleProcessVideo = () => {
    if (uploadedVideo && uploadedVideo.src) {
      // 调用GreenscreenProcessor组件暴露的processVideo方法
      const videoElement = uploadedVideo as HTMLVideoElement & {
        processVideo?: () => void;
      };
      if (videoElement.processVideo) {
        videoElement.processVideo();
      } else {
        console.error("处理方法未找到");
        // 尝试播放视频作为备选方案
        if (uploadedVideo.paused) {
          uploadedVideo.play().catch((err) => {
            console.error("无法播放视频:", err);
          });
        }
      }
    }
  };

  // 重新处理视频（当背景变化时调用）
  const handleReprocessVideo = () => {
    if (uploadedVideo && uploadedVideo.src) {
      // 调用GreenscreenProcessor组件暴露的reprocessVideo方法
      const videoElement = uploadedVideo as HTMLVideoElement & {
        reprocessVideo?: () => void;
      };
      if (videoElement.reprocessVideo) {
        videoElement.reprocessVideo();
      } else {
        // 如果没有重新处理方法，则调用普通处理方法
        handleProcessVideo();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 头部 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                绿幕抠像处理器
              </h1>
              <p className="text-gray-600 mt-1">
                实时摄像头绿幕抠像处理，支持自定义背景
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="https://github.com/imklayhu/canvas-video-greenscreen"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：视频处理区域 */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4">实时处理</h2>
              <GreenscreenProcessor
                config={config}
                useBackground={useBackground}
                backgroundImage={backgroundImage}
                uploadedVideo={uploadedVideo}
                uploadedVideoFile={uploadedVideoFile}
              />
            </div>
          </div>

          {/* 右侧：控制面板 */}
          <div className="space-y-6">
            {/* 背景开关 */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-4">背景设置</h3>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="useBackground"
                  checked={useBackground}
                  onChange={(e) => setUseBackground(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="useBackground"
                  className="text-sm font-medium text-gray-700"
                >
                  启用背景合成
                </label>
              </div>
            </div>

            {/* 视频上传 */}
            <VideoUploader
              onVideoChange={handleVideoChange}
              onProcessVideo={handleProcessVideo}
              onReprocessVideo={handleReprocessVideo}
            />

            {/* 背景上传 */}
            <BackgroundUploader
              onBackgroundChange={(image) => {
                setBackgroundImage(image);
                // 当背景变化时，如果视频正在处理，则重新处理
                if (uploadedVideo && uploadedVideo.src) {
                  setTimeout(() => {
                    handleReprocessVideo();
                  }, 100); // 延迟一点确保背景图片已加载
                }
              }}
            />

            {/* 参数配置 */}
            <ConfigPanel config={config} onConfigChange={setConfig} />
          </div>
        </div>

        {/* 使用说明 */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">使用说明</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">准备工作</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 确保有绿色背景布或绿色墙面</li>
                <li>• 光线充足，避免阴影</li>
                <li>• 摄像头与背景保持适当距离</li>
                <li>• 避免穿着绿色衣物</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">参数调整</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 色相范围：调整绿色检测范围</li>
                <li>• 饱和度：控制颜色纯度要求</li>
                <li>• 亮度：调整明暗度要求</li>
                <li>• 容差：控制边缘过渡效果</li>
                <li>• 羽化：平滑边缘处理</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 技术特性 */}
        <div className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">技术特性</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h3 className="font-medium mb-2">高性能处理</h3>
              <p>使用 Web Workers 和 OffscreenCanvas 实现高性能实时处理</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">实时渲染</h3>
              <p>基于 requestAnimationFrame 的流畅 60fps 实时渲染</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">智能算法</h3>
              <p>HSL 颜色空间绿幕检测算法，支持边缘羽化和背景合成</p>
            </div>
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-500 text-sm">
            © 2024 绿幕抠像处理器. 基于 Next.js 和 Web APIs 构建.
          </p>
        </div>
      </footer>
    </div>
  );
}
