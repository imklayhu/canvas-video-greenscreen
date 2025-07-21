 'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

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

interface GreenscreenProcessorProps {
  config: GreenscreenConfig;
  useBackground: boolean;
  backgroundImage?: HTMLImageElement;
}

const GreenscreenProcessor: React.FC<GreenscreenProcessorProps> = ({
  config,
  useBackground,
  backgroundImage
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const animationFrameRef = useRef<number>(0);
  // const offscreenCanvasRef = useRef<OffscreenCanvas | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [fps, setFps] = useState(0);
  const [error, setError] = useState<string>('');
  const stopProcessingRef = useRef<(() => void) | null>(null);
  const useBackgroundRef = useRef(useBackground);

  // 主线程绿幕处理函数
  const processGreenscreenDirect = (imageData: ImageData): ImageData => {
    const { data, width, height } = imageData;
    const outputData = new Uint8ClampedArray(data.length);
    
    let greenPixels = 0;
    let transparentPixels = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      // 平衡的绿色检测
      const isGreen = g > r && g > b && g > 25; // 适中的绿色亮度要求
      let greenSimilarity = 0;
      
      if (isGreen) {
        // 计算绿色纯度
        const total = r + g + b;
        const greenRatio = g / total;
        const redRatio = r / total;
        const blueRatio = b / total;
        
        // 平衡的条件 - 既不过于严格也不过于宽松
        if (greenRatio > 0.35 && redRatio < 0.35 && blueRatio < 0.35) {
          greenSimilarity = greenRatio;
          greenPixels++;
        }
      }
      
      // 简化的透明度计算 - 避免白色边缘
      let alpha = 255;
      if (greenSimilarity > 0.4) { // 适中的阈值
        alpha = 0; // 完全透明
        transparentPixels++;
      }
      
      outputData[i] = r;
      outputData[i + 1] = g;
      outputData[i + 2] = b;
      outputData[i + 3] = Math.round(alpha);
    }
    
    console.log('Direct processing:', greenPixels, 'green pixels,', transparentPixels, 'transparent pixels');
    return new ImageData(outputData, width, height);
  };

  // 更新 useBackground 引用
  useEffect(() => {
    useBackgroundRef.current = useBackground;
  }, [useBackground]);

  // 开始处理循环
  const startProcessing = useCallback(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let isRunning = true; // 使用局部变量控制循环
    
    const processFrame = () => {
      console.log('processFrame called, checking conditions:', {
        video: !!videoRef.current,
        canvas: !!canvasRef.current,
        isRunning,
        videoWidth: videoRef.current?.videoWidth,
        videoHeight: videoRef.current?.videoHeight
      });
      
      if (!videoRef.current || !canvasRef.current || !isRunning) {
        console.log('Processing stopped:', { 
          video: !!videoRef.current, 
          canvas: !!canvasRef.current, 
          isRunning 
        });
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { alpha: true });
      
      if (!ctx) {
        console.log('Canvas context not available');
        return;
      }

      // 确保视频已经加载完成
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.log('Video not ready yet, waiting...', video.videoWidth, 'x', video.videoHeight);
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      // 确保canvas尺寸正确
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        console.log('Resizing canvas to match video:', video.videoWidth, 'x', video.videoHeight);
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      try {
        // 绘制视频帧到canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // 获取图像数据进行绿幕处理
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // 直接在主线程进行绿幕处理（避免Worker异步问题）
        const processedData = processGreenscreenDirect(imageData);
        
        // 将处理后的图像数据绘制到canvas
        ctx.putImageData(processedData, 0, 0);
        
        console.log('Frame processed successfully');
      } catch (error) {
        console.error('Error processing frame:', error);
      }

      // 计算FPS
      frameCount++;
      const currentTime = performance.now();
      if (currentTime - lastTime >= 1000) {
        setFps(Math.round(frameCount * 1000 / (currentTime - lastTime)));
        frameCount = 0;
        lastTime = currentTime;
      }

      // 继续下一帧
      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    // 提供一个停止函数
    const stopProcessing = () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };

    console.log('Starting processFrame loop...');
    processFrame();
    
    // 返回停止函数
    return stopProcessing;
  }, []); // 移除 useBackground 依赖，避免函数重新创建

  // 启动摄像头
  const startCamera = useCallback(async () => {
    try {
      console.log('Starting camera...');
      setError('');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });

      console.log('Camera stream obtained:', stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log('Stream assigned to video element');
        
        // 等待视频元数据加载完成
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              console.log('Video metadata loaded:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
              resolve(true);
            };
          }
        });
        
        console.log('Starting video playback...');
        await videoRef.current.play();
        console.log('Video playback started');
        
        // 设置canvas尺寸
        if (canvasRef.current && videoRef.current) {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
          console.log('Canvas size set to:', canvasRef.current.width, 'x', canvasRef.current.height);
        }
        
        console.log('Starting processing loop...');
        setIsProcessing(true);
        stopProcessingRef.current = startProcessing();
      } else {
        console.error('Video ref not available');
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('无法访问摄像头: ' + (err as Error).message);
    }
  }, [startProcessing]);

  // 停止摄像头
  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    // 停止处理循环
    if (stopProcessingRef.current) {
      stopProcessingRef.current();
      stopProcessingRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    setIsProcessing(false);
  }, []);



  // 组件卸载时清理
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        {/* 原始视频（调试用，暂时显示） */}
        <video
          ref={videoRef}
          className="border-2 border-blue-300 rounded-lg shadow-lg mb-4"
          style={{ maxWidth: '100%', height: 'auto' }}
          autoPlay
          playsInline
          muted
        />
        
        {/* 处理后的Canvas */}
        <div className="relative">
          {/* 透明背景图案 */}
          <div 
            className="absolute inset-0 border-2 border-gray-300 rounded-lg shadow-lg"
            style={{
              backgroundImage: `
                linear-gradient(45deg, #ccc 25%, transparent 25%), 
                linear-gradient(-45deg, #ccc 25%, transparent 25%), 
                linear-gradient(45deg, transparent 75%, #ccc 75%), 
                linear-gradient(-45deg, transparent 75%, #ccc 75%)
              `,
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
            }}
          />
          <canvas
            ref={canvasRef}
            className="relative z-10 border-2 border-gray-300 rounded-lg shadow-lg"
            style={{ 
              maxWidth: '100%', 
              height: 'auto',
              backgroundColor: 'transparent' // 确保背景透明
            }}
            width="1280"
            height="720"
          />
        </div>
        
        {/* 状态指示器 */}
        <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
          {isProcessing ? `FPS: ${fps}` : '未启动'}
        </div>
        
        {/* 调试信息 */}
        <div className="mt-2 text-sm text-gray-600">
          <p>视频尺寸: {videoRef.current?.videoWidth || 0} x {videoRef.current?.videoHeight || 0}</p>
          <p>Canvas尺寸: {canvasRef.current?.width || 0} x {canvasRef.current?.height || 0}</p>
          <p>Canvas显示尺寸: {canvasRef.current?.offsetWidth || 0} x {canvasRef.current?.offsetHeight || 0}</p>
          <p>处理状态: {isProcessing ? '运行中' : '未启动'}</p>
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="flex space-x-4">
        {!isProcessing ? (
          <button
            onClick={startCamera}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            启动摄像头
          </button>
        ) : (
          <button
            onClick={stopCamera}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            停止摄像头
          </button>
        )}
      </div>

      {/* 错误信息 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

export default GreenscreenProcessor;