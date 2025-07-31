"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";

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
  uploadedVideo?: HTMLVideoElement;
  uploadedVideoFile?: File;
}

// RGB转HSL颜色转换函数
const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
  // 将RGB值归一化到[0,1]范围
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }

    h /= 6;
  }

  // 转换到常用范围
  h = Math.round(h * 360);
  s = Math.round(s * 255);
  l = Math.round(l * 255);

  return { h, s, l };
};

const GreenscreenProcessor: React.FC<GreenscreenProcessorProps> = ({
  config,
  useBackground,
  backgroundImage,
  uploadedVideo,
  uploadedVideoFile,
}) => {
  // 处理视频的方法，将被从外部调用
  const processVideo = () => {
    if (videoSource === "file" && !isProcessing) {
      startProcessingUploadedVideo();
    }
  };

  // 将processVideo方法暴露给父组件
  useEffect(() => {
    if (uploadedVideo) {
      // 将处理方法附加到uploadedVideo对象上，这样父组件可以调用它
      // 使用类型断言，避免使用any
      const videoElement = uploadedVideo as HTMLVideoElement & {
        processVideo?: () => void;
      };
      videoElement.processVideo = processVideo;
    }
  }, [uploadedVideo, processVideo]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const animationFrameRef = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [fps, setFps] = useState(0);
  const [error, setError] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoSource, setVideoSource] = useState<"camera" | "file" | null>(
    null
  );
  const [processedVideoUrl, setProcessedVideoUrl] = useState<string | null>(
    null
  );

  const stopProcessingRef = useRef<(() => void) | null>(null);
  const useBackgroundRef = useRef(useBackground);
  const recordingTimerRef = useRef<number | null>(null);

  // 主线程绿幕处理函数 - 使用config参数进行绿幕检测
  const processGreenscreenDirect = useCallback(
    (imageData: ImageData): ImageData => {
      const { data, width, height } = imageData;
      const outputData = new Uint8ClampedArray(data.length);

      let greenPixels = 0;
      let transparentPixels = 0;

      // 检查是否有背景图片并且启用了背景合成
      const hasBackground =
        useBackgroundRef.current && backgroundImage && backgroundImage.complete;

      console.log("背景合成状态:", {
        useBackground: useBackgroundRef.current,
        hasBackgroundImage: !!backgroundImage,
        isBackgroundComplete: backgroundImage?.complete,
        hasBackground,
        backgroundWidth: backgroundImage?.width,
        backgroundHeight: backgroundImage?.height,
        canvasWidth: width,
        canvasHeight: height,
      });

      // 创建临时canvas用于绘制背景（如果需要）
      let bgCanvas: HTMLCanvasElement | null = null;
      let bgCtx: CanvasRenderingContext2D | null = null;
      let bgData: ImageData | null = null;

      if (hasBackground) {
        try {
          bgCanvas = document.createElement("canvas");
          bgCanvas.width = width;
          bgCanvas.height = height;
          bgCtx = bgCanvas.getContext("2d");

          if (bgCtx) {
            // 确保背景图片已加载
            if (!backgroundImage.complete) {
              console.log("背景图片尚未完全加载，等待加载完成");
              backgroundImage.onload = () => {
                console.log("背景图片加载完成");
              };
            }

            // 绘制背景图片，缩放以适应canvas尺寸
            bgCtx.drawImage(backgroundImage, 0, 0, width, height);
            // 获取背景图片数据
            bgData = bgCtx.getImageData(0, 0, width, height);

            console.log(
              "背景图片已绘制到临时canvas，尺寸:",
              width,
              "x",
              height
            );
          } else {
            console.error("无法获取背景canvas的上下文");
          }
        } catch (error) {
          console.error("创建背景canvas时出错:", error);
        }
      }

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // 使用config参数进行绿色检测
        // 将RGB转换为HSL以便使用config中的色相、饱和度和亮度范围
        const { h, s, l } = rgbToHsl(r, g, b);
        
        // 检查像素是否在绿幕范围内
        const isInGreenRange = 
          h >= config.hueMin && h <= config.hueMax &&
          s >= config.saturationMin && s <= config.saturationMax &&
          l >= config.lightnessMin && l <= config.lightnessMax;
        
        let greenSimilarity = 0;
        
        if (isInGreenRange) {
          // 计算绿色相似度 - 基于与绿色中心的距离
          const hueDist = Math.min(
            Math.abs(h - (config.hueMin + config.hueMax) / 2),
            Math.abs(h + 360 - (config.hueMin + config.hueMax) / 2)
          ) / 180;
          
          const satDist = Math.abs(s - (config.saturationMin + config.saturationMax) / 2) / 255;
          const lightDist = Math.abs(l - (config.lightnessMin + config.lightnessMax) / 2) / 255;
          
          // 综合距离 - 越小表示越接近绿幕中心
          const distance = Math.sqrt(hueDist * hueDist + satDist * satDist + lightDist * lightDist);
          
          // 转换为相似度 - 越大表示越像绿色
          greenSimilarity = Math.max(0, 1 - distance * (1 + config.tolerance / 100));
          
          if (greenSimilarity > 0.4) {
            greenPixels++;
          }
        }

        // 计算透明度
        const alpha = 255; // 默认不透明
        if (greenSimilarity > 0.4) {
          // 适中的阈值
          if (hasBackground && bgData) {
            // 如果有背景图片，使用背景图片的像素
            const bgIndex = i;
            outputData[i] = bgData.data[bgIndex]; // R
            outputData[i + 1] = bgData.data[bgIndex + 1]; // G
            outputData[i + 2] = bgData.data[bgIndex + 2]; // B
            outputData[i + 3] = 255; // 完全不透明
          } else {
            // 如果没有背景图片，设置为透明
            outputData[i] = r;
            outputData[i + 1] = g;
            outputData[i + 2] = b;
            outputData[i + 3] = 0; // 完全透明
          }
          transparentPixels++;
        } else {
          // 非绿色区域保持原样
          outputData[i] = r;
          outputData[i + 1] = g;
          outputData[i + 2] = b;
          outputData[i + 3] = 255; // 完全不透明
        }
      }

      // 清理临时canvas
      if (bgCanvas) {
        bgCanvas = null;
      }

      console.log(
        "Direct processing:",
        greenPixels,
        "green pixels,",
        transparentPixels,
        "transparent pixels",
        "useBackground:",
        useBackgroundRef.current,
        "hasBackground:",
        hasBackground
      );
      return new ImageData(outputData, width, height);
    },
    [backgroundImage, config] // 添加backgroundImage和config作为依赖
  );

  // 更新 useBackground 引用
  useEffect(() => {
    useBackgroundRef.current = useBackground;
    console.log("useBackground状态更新:", useBackground);

    // 如果正在处理视频，并且背景设置发生变化，强制重新渲染一帧
    if (isProcessing && canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext("2d", { alpha: true });

      if (ctx) {
        console.log("背景设置变化，强制重新渲染一帧");
        // 绘制视频帧到canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // 获取图像数据进行绿幕处理
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // 直接在主线程进行绿幕处理
        const processedData = processGreenscreenDirect(imageData);

        // 将处理后的图像数据绘制到canvas
        ctx.putImageData(processedData, 0, 0);
      }
    }
  }, [useBackground, isProcessing, processGreenscreenDirect]);

  // 开始处理循环
  const startProcessing = useCallback(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let isRunning = true; // 使用局部变量控制循环
    let lastLogTime = 0; // 用于限制日志输出频率
    const lastFrameTimeRef = { current: 0 }; // 用于跟踪最后一帧的时间
    const lastProcessedImageDataRef = { current: null as ImageData | null }; // 保存最后处理的帧

    const processFrame = () => {
      const now = performance.now();
      // 限制日志输出频率，每秒只输出一次
      if (now - lastLogTime > 1000) {
        console.log("processFrame called, checking conditions:", {
          video: !!videoRef.current,
          canvas: !!canvasRef.current,
          isRunning,
          videoWidth: videoRef.current?.videoWidth,
          videoHeight: videoRef.current?.videoHeight,
        });
        lastLogTime = now;
      }

      if (!videoRef.current || !canvasRef.current || !isRunning) {
        console.log("Processing stopped:", {
          video: !!videoRef.current,
          canvas: !!canvasRef.current,
          isRunning,
        });
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { alpha: true });

      if (!ctx) {
        console.log("Canvas context not available");
        return;
      }

      // 确保视频已经加载完成
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.log(
          "Video not ready yet, waiting...",
          video.videoWidth,
          "x",
          video.videoHeight
        );
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      // 确保canvas尺寸正确
      if (
        canvas.width !== video.videoWidth ||
        canvas.height !== video.videoHeight
      ) {
        console.log(
          "Resizing canvas to match video:",
          video.videoWidth,
          "x",
          video.videoHeight
        );
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      try {
        // 检查视频是否暂停或结束
        if (video.paused || video.ended) {
          // 如果有保存的最后一帧，则显示它
          if (lastProcessedImageDataRef.current) {
            // 限制日志输出频率
            if (now - lastLogTime > 1000) {
              console.log("Video paused or ended, showing last frame");
            }
            ctx.putImageData(lastProcessedImageDataRef.current, 0, 0);
          } else {
            // 如果没有保存的最后一帧，尝试继续播放视频
            video.currentTime = 0;
            video.play().catch((e) => console.error("无法重新播放视频:", e));
          }
        } else {
          // 视频正在播放，处理当前帧
          // 绘制视频帧到canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // 获取图像数据进行绿幕处理
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          // 直接在主线程进行绿幕处理（避免Worker异步问题）
          const processedData = processGreenscreenDirect(imageData);

          // 将处理后的图像数据绘制到canvas
          ctx.putImageData(processedData, 0, 0);

          // 保存最后处理的帧和时间
          lastProcessedImageDataRef.current = processedData;
          lastFrameTimeRef.current = now;

          // 限制日志输出频率
          if (now - lastLogTime > 1000) {
            console.log("Frame processed successfully");
          }
        }
      } catch (error) {
        console.error("Error processing frame:", error);
      }

      // 计算FPS
      frameCount++;
      const currentTime = performance.now();
      if (currentTime - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (currentTime - lastTime)));
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

    console.log("Starting processFrame loop...");
    processFrame();

    // 返回停止函数
    return stopProcessing;
  }, [processGreenscreenDirect]); // 添加processGreenscreenDirect作为依赖

  // 启动摄像头
  const startCamera = useCallback(async () => {
    try {
      console.log("Starting camera...");
      setError("");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      });

      console.log("Camera stream obtained:", stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log("Stream assigned to video element");

        // 等待视频元数据加载完成
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              console.log(
                "Video metadata loaded:",
                videoRef.current?.videoWidth,
                "x",
                videoRef.current?.videoHeight
              );
              resolve(true);
            };
          }
        });

        console.log("Starting video playback...");
        await videoRef.current.play();
        console.log("Video playback started");

        // 设置canvas尺寸
        if (canvasRef.current && videoRef.current) {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
          console.log(
            "Canvas size set to:",
            canvasRef.current.width,
            "x",
            canvasRef.current.height
          );
        }

        console.log("Starting processing loop...");
        setIsProcessing(true);
        stopProcessingRef.current = startProcessing();
      } else {
        console.error("Video ref not available");
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("无法访问摄像头: " + (err as Error).message);
    }
  }, [startProcessing]);

  // 停止摄像头
  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
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

    // 只有在视频源不是文件时才设置isProcessing为false
    // 这样可以确保上传的视频处理完成后，isProcessing状态不会被错误地设置为false
    if (videoSource !== "file") {
      setIsProcessing(false);
    }
  }, [videoSource]);

  // 处理上传的视频
  useEffect(() => {
    if (uploadedVideo && uploadedVideo.src && videoRef.current) {
      // 停止当前正在处理的视频或摄像头
      if (isProcessing) {
        stopCamera();
      }

      // 设置视频源为上传的视频
      videoRef.current.src = uploadedVideo.src;
      videoRef.current.muted = true;
      videoRef.current.loop = true;
      videoRef.current.controls = true; // 允许用户控制视频播放

      // 等待视频元数据加载
      videoRef.current.onloadedmetadata = async () => {
        if (canvasRef.current && videoRef.current) {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;

          // 设置视频源，但不自动开始处理
          setVideoSource("file");
          // 注意：这里不自动开始处理，等待用户点击"处理视频"按钮
        }
      };
    }
  }, [uploadedVideo, isProcessing]);

  // 开始处理上传的视频
  const startProcessingUploadedVideo = useCallback(async () => {
    if (videoRef.current && videoRef.current.src && videoSource === "file") {
      try {
        // 确保视频已加载
        if (videoRef.current.readyState < 2) {
          await new Promise<void>((resolve) => {
            videoRef.current!.onloadeddata = () => resolve();
          });
        }

        // 设置视频循环播放
        videoRef.current.loop = true;
        // 设置视频播放速度（可选，如果视频太短，可以降低播放速度）
        // videoRef.current.playbackRate = 0.5; // 半速播放

        // 开始播放视频
        await videoRef.current.play();

        // 开始处理
        setIsProcessing(true);
        stopProcessingRef.current = startProcessing();

        console.log("开始处理上传的视频");

        // 添加视频结束事件监听器，确保视频结束后重新开始播放
        const handleVideoEnd = () => {
          console.log("视频播放结束，重新开始播放");
          if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current
              .play()
              .catch((e) => console.error("重新播放视频失败:", e));
          }
        };

        // 添加视频暂停事件监听器，确保视频不会意外暂停
        const handleVideoPause = () => {
          console.log("视频暂停，尝试继续播放");
          if (videoRef.current && isProcessing) {
            videoRef.current
              .play()
              .catch((e) => console.error("继续播放视频失败:", e));
          }
        };

        // 添加视频错误事件监听器
        const handleVideoError = (e: Event) => {
          console.error("视频播放错误:", e);
          // 尝试重新加载视频
          if (videoRef.current && videoRef.current.src) {
            const currentSrc = videoRef.current.src;
            videoRef.current.src = "";
            setTimeout(() => {
              if (videoRef.current) {
                videoRef.current.src = currentSrc;
                videoRef.current
                  .play()
                  .catch((e) => console.error("重新加载视频失败:", e));
              }
            }, 100);
          }
        };

        videoRef.current.addEventListener("ended", handleVideoEnd);
        videoRef.current.addEventListener("pause", handleVideoPause);
        videoRef.current.addEventListener("error", handleVideoError);

        // 确保处理状态持续，即使视频很短
        const keepProcessingInterval = setInterval(() => {
          if (videoRef.current && !videoRef.current.paused && !isProcessing) {
            console.log("检测到处理状态丢失，重新启动处理");
            setIsProcessing(true);
            if (!stopProcessingRef.current) {
              stopProcessingRef.current = startProcessing();
            }
          }
        }, 1000); // 每秒检查一次

        // 返回清理函数
        return () => {
          if (videoRef.current) {
            videoRef.current.removeEventListener("ended", handleVideoEnd);
            videoRef.current.removeEventListener("pause", handleVideoPause);
            videoRef.current.removeEventListener("error", handleVideoError);
          }
          clearInterval(keepProcessingInterval);
        };
      } catch (err) {
        console.error("Error processing uploaded video:", err);
        setError("无法处理上传的视频: " + (err as Error).message);
      }
    }
  }, [videoSource, startProcessing, isProcessing, processGreenscreenDirect]);

  // 监听处理视频的请求
  useEffect(() => {
    if (uploadedVideo && videoSource === "file" && !isProcessing) {
      // 当用户点击"处理视频"按钮时，会触发uploadedVideo.play()
      // 这里监听play事件来开始处理
      const handlePlay = () => {
        if (!isProcessing) {
          startProcessingUploadedVideo();
        }
      };

      uploadedVideo.addEventListener("play", handlePlay);

      return () => {
        uploadedVideo.removeEventListener("play", handlePlay);
      };
    }
  }, [uploadedVideo, videoSource, isProcessing, startProcessingUploadedVideo]);

  // 开始录制
  const startRecording = useCallback(() => {
    if (!canvasRef.current || !isProcessing) {
      console.error(
        "Cannot start recording: Canvas not available or processing not active"
      );
      return;
    }

    try {
      // 重置录制状态
      recordedChunksRef.current = [];
      setRecordingTime(0);

      // 创建媒体流
      const stream = canvasRef.current.captureStream(30); // 30fps

      // 创建MediaRecorder
      const options = { mimeType: "video/webm;codecs=vp9" };
      const mediaRecorder = new MediaRecorder(stream, options);

      // 设置数据处理
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      // 录制完成处理
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });
        const url = URL.createObjectURL(blob);
        setProcessedVideoUrl(url);
      };

      // 开始录制
      mediaRecorder.start(1000); // 每秒获取一次数据
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      // 开始计时
      const startTime = Date.now();
      recordingTimerRef.current = window.setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        setRecordingTime(elapsedSeconds);
      }, 1000);
    } catch (err) {
      console.error("Recording error:", err);
      setError("无法开始录制: " + (err as Error).message);
    }
  }, [isProcessing]);

  // 停止录制
  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    setIsRecording(false);
  }, []);

  // 导出处理后的视频
  const exportProcessedVideo = useCallback(() => {
    if (!processedVideoUrl) {
      console.error("No processed video available to export");
      return;
    }

    // 创建下载链接
    const a = document.createElement("a");
    a.href = processedVideoUrl;

    // 设置文件名
    let filename = "processed-video.webm";
    if (videoSource === "file" && uploadedVideoFile) {
      // 从原始文件名派生新文件名
      const originalName = uploadedVideoFile.name;
      const nameWithoutExt =
        originalName.substring(0, originalName.lastIndexOf(".")) ||
        originalName;
      filename = `${nameWithoutExt}-processed.webm`;
    }

    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [processedVideoUrl, videoSource, uploadedVideoFile]);

  // 导出当前帧为图片
  const exportCurrentFrame = useCallback(() => {
    if (!canvasRef.current || !isProcessing) {
      console.error(
        "Cannot export frame: Canvas not available or processing not active"
      );
      return;
    }

    try {
      // 将当前Canvas内容转换为图片URL
      const dataUrl = canvasRef.current.toDataURL("image/png");

      // 创建下载链接
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "greenscreen-frame.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("Frame export error:", err);
      setError("无法导出当前帧: " + (err as Error).message);
    }
  }, [isProcessing]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      stopCamera();
      if (isRecording) {
        stopRecording();
      }
      if (processedVideoUrl) {
        URL.revokeObjectURL(processedVideoUrl);
      }
    };
  }, [stopCamera, isRecording, stopRecording, processedVideoUrl]);

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        {/* 原始视频（调试用，暂时显示） */}
        <video
          ref={videoRef}
          className="border-2 border-blue-300 rounded-lg shadow-lg mb-4"
          style={{ maxWidth: "100%", height: "auto" }}
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
              backgroundSize: "20px 20px",
              backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
            }}
          />
          <canvas
            ref={canvasRef}
            className="relative z-10 border-2 border-gray-300 rounded-lg shadow-lg"
            style={{
              maxWidth: "100%",
              height: "auto",
              backgroundColor: "transparent", // 确保背景透明
            }}
            width="1280"
            height="720"
          />
        </div>

        {/* 状态指示器 */}
        <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
          {isProcessing ? `FPS: ${fps}` : "未启动"}
        </div>

        {/* 调试信息 */}
        <div className="mt-2 text-sm text-gray-600">
          <p>
            视频尺寸: {videoRef.current?.videoWidth || 0} x{" "}
            {videoRef.current?.videoHeight || 0}
          </p>
          <p>
            Canvas尺寸: {canvasRef.current?.width || 0} x{" "}
            {canvasRef.current?.height || 0}
          </p>
          <p>
            Canvas显示尺寸: {canvasRef.current?.offsetWidth || 0} x{" "}
            {canvasRef.current?.offsetHeight || 0}
          </p>
          <p>处理状态: {isProcessing ? "运行中" : "未启动"}</p>
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="flex flex-wrap gap-4 justify-center">
        {/* 摄像头控制 */}
        {videoSource !== "file" &&
          (!isProcessing ? (
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
          ))}

        {/* 录制控制 */}
        {isProcessing && !isRecording && (
          <button
            onClick={startRecording}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
          >
            <span className="mr-2">●</span> 开始录制
          </button>
        )}

        {isRecording && (
          <button
            onClick={stopRecording}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
          >
            <span className="mr-2">■</span> 停止录制 ({recordingTime}秒)
          </button>
        )}

        {/* 导出按钮 */}
        {processedVideoUrl && (
          <button
            onClick={exportProcessedVideo}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            导出视频
          </button>
        )}

        {/* 导出当前帧 */}
        {isProcessing && (
          <button
            onClick={exportCurrentFrame}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            导出当前帧
          </button>
        )}
      </div>

      {/* 处理后的视频预览 */}
      {processedVideoUrl && (
        <div className="mt-4 w-full">
          <h3 className="text-lg font-semibold mb-2">处理后的视频</h3>
          <video
            src={processedVideoUrl}
            controls
            className="w-full border rounded-lg shadow-sm"
          />
        </div>
      )}

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
