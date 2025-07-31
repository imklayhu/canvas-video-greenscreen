"use client";

import React, { useRef, useState, useEffect } from "react";

interface VideoUploaderProps {
  onVideoChange: (videoElement: HTMLVideoElement, file: File) => void;
  onProcessVideo: () => void;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({
  onVideoChange,
  onProcessVideo,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoPreview, setVideoPreview] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const [videoUploaded, setVideoUploaded] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");

  // 添加调试信息
  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => `${info}\n${prev}`);
    console.log(info);
  };

  // 监听视频状态变化
  useEffect(() => {
    if (videoRef.current && videoPreview) {
      const video = videoRef.current;
      
      // 添加调试信息
      addDebugInfo(`视频状态: readyState=${video.readyState}, 
                   duration=${video.duration}, 
                   paused=${video.paused}`);
      
      // 如果视频已经加载，强制设置videoUploaded为true
      if (video.readyState > 0) {
        setVideoUploaded(true);
        addDebugInfo("视频已加载，强制设置videoUploaded=true");
      }
    }
  }, [videoPreview]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith("video/")) {
      alert("请选择视频文件");
      return;
    }

    addDebugInfo(`选择文件: ${file.name}, 大小: ${file.size} 字节`);
    setIsLoading(true);
    setFileName(file.name);

    const videoURL = URL.createObjectURL(file);
    setVideoPreview(videoURL);
    addDebugInfo(`创建视频URL: ${videoURL}`);

    // 创建一个新的视频元素，避免React状态更新问题
    const tempVideo = document.createElement("video");
    tempVideo.src = videoURL;
    tempVideo.onloadeddata = () => {
      addDebugInfo("临时视频已加载数据");
      setIsLoading(false);
      setVideoUploaded(true);
      
      // 确保videoRef.current已经设置了src
      if (videoRef.current) {
        videoRef.current.src = videoURL;
        addDebugInfo("设置视频引用的src");
      }
      
      onVideoChange(tempVideo, file);
    };
    
    tempVideo.onerror = () => {
      addDebugInfo("视频加载失败");
      alert("视频加载失败");
      setIsLoading(false);
      setVideoPreview("");
      setVideoUploaded(false);
    };
    
    // 强制设置一个超时，确保状态更新
    setTimeout(() => {
      if (isLoading) {
        addDebugInfo("超时处理：强制更新状态");
        setIsLoading(false);
        setVideoUploaded(true);
        onVideoChange(tempVideo, file);
      }
    }, 2000);
  };

  const removeVideo = () => {
    addDebugInfo("移除视频");
    setVideoPreview("");
    setFileName("");
    setVideoUploaded(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (videoRef.current) {
      videoRef.current.src = "";
      // 创建一个新的空视频元素传递给父组件，表示移除视频
      const emptyVideo = document.createElement("video");
      onVideoChange(emptyVideo, new File([], ""));
    }
  };

  const handleProcessVideo = () => {
    addDebugInfo("处理视频按钮点击");
    onProcessVideo();
  };
  
  // 强制显示处理按钮
  const forceShowProcessButton = () => {
    addDebugInfo("强制显示处理按钮");
    setVideoUploaded(true);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">上传视频</h3>

      <div className="space-y-4">
        {/* 文件上传 */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {isLoading ? "加载中..." : "选择视频文件"}
          </button>
        </div>

        {/* 视频预览 */}
        {videoPreview && (
          <div className="relative">
            <video
              ref={videoRef}
              src={videoPreview}
              className="w-full h-auto object-cover rounded-lg border"
              controls
              autoPlay={false}
              loop
              muted
              onLoadedData={() => {
                addDebugInfo("视频数据已加载");
                setIsLoading(false);
                setVideoUploaded(true);
              }}
              onCanPlay={() => {
                addDebugInfo("视频可以播放");
                setIsLoading(false);
                setVideoUploaded(true);
              }}
            />
            <div className="mt-2 text-sm text-gray-600 truncate">
              {fileName}
            </div>
            <button
              onClick={removeVideo}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm"
            >
              ×
            </button>
          </div>
        )}

        {/* 状态显示 */}
        <div className="text-xs text-gray-600">
          <p>视频已上传: {videoUploaded ? "是" : "否"}</p>
          <p>加载状态: {isLoading ? "加载中" : "已完成"}</p>
          {videoRef.current && (
            <p>视频状态: readyState={videoRef.current.readyState}</p>
          )}
        </div>

        {/* 强制显示处理按钮 */}
        {videoPreview && !videoUploaded && (
          <button
            onClick={forceShowProcessButton}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            强制显示处理按钮
          </button>
        )}

        {/* 处理按钮 - 始终显示，但只有在videoUploaded为true时才启用 */}
        {videoPreview && (
          <button
            onClick={handleProcessVideo}
            disabled={!videoUploaded}
            className={`w-full ${
              videoUploaded
                ? "bg-green-500 hover:bg-green-600"
                : "bg-gray-400"
            } text-white px-4 py-2 rounded-lg transition-colors`}
          >
            处理视频（扣除绿幕）
          </button>
        )}

        {/* 调试信息 */}
        {debugInfo && (
          <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono whitespace-pre-wrap max-h-32 overflow-auto">
            {debugInfo}
          </div>
        )}

        {/* 说明 */}
        <div className="text-xs text-gray-500">
          <p>• 支持 MP4、WebM、MOV 等常见视频格式</p>
          <p>• 建议使用带有绿色背景的视频</p>
          <p>• 视频文件大小限制为 100MB</p>
          <p>• 上传后点击&quot;处理视频&quot;按钮开始扣除绿幕</p>
          <p>• 如果处理按钮未显示，请点击&quot;强制显示处理按钮&quot;</p>
        </div>
      </div>
    </div>
  );
};

export default VideoUploader;
