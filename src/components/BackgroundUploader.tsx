"use client";

import React, { useRef, useState } from "react";

interface BackgroundUploaderProps {
  onBackgroundChange: (image: HTMLImageElement | undefined) => void;
}

const BackgroundUploader: React.FC<BackgroundUploaderProps> = ({
  onBackgroundChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith("image/")) {
      alert("请选择图片文件");
      return;
    }

    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setBackgroundPreview(e.target?.result as string);
        onBackgroundChange(img);
        setIsLoading(false);
      };
      img.onerror = () => {
        alert("图片加载失败");
        setIsLoading(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const removeBackground = () => {
    setBackgroundPreview("");
    onBackgroundChange(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">背景图片</h3>

      <div className="space-y-4">
        {/* 文件上传 */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {isLoading ? "加载中..." : "选择背景图片"}
          </button>
        </div>

        {/* 背景预览 */}
        {backgroundPreview && (
          <div className="relative">
            <img
              src={backgroundPreview}
              alt="背景预览"
              className="w-full h-32 object-cover rounded-lg border"
              loading="lazy"
            />
            <button
              onClick={removeBackground}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm"
            >
              ×
            </button>
          </div>
        )}

        {/* 预设背景 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">预设背景</h4>
          <div className="grid grid-cols-3 gap-2">
            {[
              "87CEEB", // 天蓝色
              "FF6B6B", // 红色
              "4ECDC4", // 青色
            ].map((color, index) => (
              <button
                key={index}
                onClick={() => {
                  const img = new Image();
                  img.onload = () => {
                    setBackgroundPreview(
                      `https://via.placeholder.com/400x300/${color}`
                    );
                    onBackgroundChange(img);
                  };
                  img.src = `https://via.placeholder.com/400x300/${color}`;
                }}
                className="w-full h-16 rounded border-2 border-gray-200 hover:border-blue-500 transition-colors"
                style={{ backgroundColor: `#${color}` }}
              />
            ))}
          </div>
        </div>

        {/* 说明 */}
        <div className="text-xs text-gray-500">
          <p>• 支持 JPG、PNG、GIF 格式</p>
          <p>• 建议使用与视频相同分辨率的图片</p>
          <p>• 图片会自动缩放以适应视频尺寸</p>
        </div>
      </div>
    </div>
  );
};

export default BackgroundUploader;
 