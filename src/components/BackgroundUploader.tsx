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
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  // 预设背景配置
  const presetBackgrounds = [
    { name: "天蓝色", color: "#87CEEB" },
    { name: "红色", color: "#FF6B6B" },
    { name: "青色", color: "#4ECDC4" },
    { name: "绿色", color: "#4CAF50" },
    { name: "紫色", color: "#9C27B0" },
    { name: "橙色", color: "#FF9800" },
  ];

  // 创建纯色背景图片
  const createColorBackground = (color: string): HTMLImageElement => {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    const img = new Image();
    img.src = canvas.toDataURL();
    return img;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith("image/")) {
      alert("请选择图片文件");
      return;
    }

    setIsLoading(true);
    setSelectedPreset(null); // 清除预设选择

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
    setSelectedPreset(null);
    onBackgroundChange(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const selectPresetBackground = (index: number, color: string) => {
    setIsLoading(true);
    setSelectedPreset(index);
    
    // 创建纯色背景图片
    const img = createColorBackground(color);
    
    img.onload = () => {
      setBackgroundPreview(img.src);
      onBackgroundChange(img);
      setIsLoading(false);
    };
    
    img.onerror = () => {
      alert("背景图片创建失败");
      setIsLoading(false);
    };
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
            {presetBackgrounds.map((preset, index) => (
              <button
                key={index}
                onClick={() => selectPresetBackground(index, preset.color)}
                disabled={isLoading}
                className={`w-full h-16 rounded border-2 transition-all duration-200 ${
                  selectedPreset === index
                    ? 'border-blue-500 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-blue-300 hover:scale-102'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                style={{ backgroundColor: preset.color }}
                title={preset.name}
              >
                {selectedPreset === index && (
                  <div className="flex items-center justify-center h-full">
                    <div className="bg-white bg-opacity-80 rounded-full p-1">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 说明 */}
        <div className="text-xs text-gray-500">
          <p>• 支持 JPG、PNG、GIF 格式</p>
          <p>• 建议使用与视频相同分辨率的图片</p>
          <p>• 图片会自动缩放以适应视频尺寸</p>
          <p>• 更换背景后会自动重新处理视频</p>
        </div>
      </div>
    </div>
  );
};

export default BackgroundUploader;
 