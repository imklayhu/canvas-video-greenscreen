// 绿幕抠像Web Worker
// 使用OffscreenCanvas进行高性能图像处理

// 绿幕抠像参数
let config = {
  hueMin: 100,      // 绿色色相最小值
  hueMax: 140,      // 绿色色相最大值
  saturationMin: 50, // 饱和度最小值
  saturationMax: 255, // 饱和度最大值
  lightnessMin: 30,  // 亮度最小值
  lightnessMax: 200, // 亮度最大值
  tolerance: 30,     // 容差
  feather: 2,        // 羽化程度
  backgroundImage: null
};

// 处理绿幕抠像
function processGreenscreen(imageData) {
  const { data, width, height } = imageData;
  const outputData = new Uint8ClampedArray(data.length);
  
  let greenPixels = 0;
  let transparentPixels = 0;
  let samplePixels = 0; // 用于采样调试
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    
    // 采样一些像素值用于调试
    if (samplePixels < 10) {
      console.log('Sample pixel', samplePixels, ':', { r, g, b, a });
      samplePixels++;
    }
    
    // 转换为HSL颜色空间
    const hsl = rgbToHsl(r, g, b);
    const [h, s, l] = hsl;
    
    // 更精确的绿色检测
    const isGreen = g > r && g > b && g > 100; // 绿色分量最大且足够亮
    let greenSimilarity = 0;

    if (isGreen) {
      // 计算绿色纯度
      const total = r + g + b;
      const greenRatio = g / total;
      const redRatio = r / total;
      const blueRatio = b / total;

      // 绿色占比超过40%，且红色和蓝色都相对较小
      if (greenRatio > 0.35 && redRatio < 0.35 && blueRatio < 0.35) {
        greenSimilarity = greenRatio;
        greenPixels++;
      }
    }

    // 更平滑的透明度计算
    let alpha = 255;
    if (greenSimilarity > 0.35) { // 如果绿色相似度大于35%
      alpha = 0; // 完全透明
      transparentPixels++;
    }

    outputData[i] = r;
    outputData[i + 1] = g;
    outputData[i + 2] = b;
    outputData[i + 3] = Math.round(alpha);
  }
  
  console.log('Worker: Processed', greenPixels, 'green pixels,', transparentPixels, 'transparent pixels');
  return new ImageData(outputData, width, height);
}

// RGB转HSL
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  return [h * 360, s * 255, l * 255];
}

// 合成背景
function compositeBackground(foregroundData, backgroundImage) {
  if (!backgroundImage) return foregroundData;
  
  const { data, width, height } = foregroundData;
  const outputData = new Uint8ClampedArray(data.length);
  
  // 创建临时canvas来缩放背景图片
  let tempCanvas;
  if (typeof OffscreenCanvas !== 'undefined') {
    tempCanvas = new OffscreenCanvas(width, height);
  } else {
    // 回退到普通canvas（在主线程中）
    tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
  }
  
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.drawImage(backgroundImage, 0, 0, width, height);
  const bgImageData = tempCtx.getImageData(0, 0, width, height);
  
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3] / 255;
    const invAlpha = 1 - alpha;
    
    outputData[i] = data[i] * alpha + bgImageData.data[i] * invAlpha;
    outputData[i + 1] = data[i + 1] * alpha + bgImageData.data[i + 1] * invAlpha;
    outputData[i + 2] = data[i + 2] * alpha + bgImageData.data[i + 2] * invAlpha;
    outputData[i + 3] = 255;
  }
  
  return new ImageData(outputData, width, height);
}

// 监听主线程消息
self.onmessage = function(e) {
  const { type, data } = e.data;
  
  switch (type) {
    case 'config':
      config = { ...config, ...data };
      console.log('Worker: Config updated', config);
      break;
      
    case 'background':
      config.backgroundImage = data;
      console.log('Worker: Background image set');
      break;
      
    case 'process':
      const { imageData, useBackground } = data;
      console.log('Worker: Processing frame', imageData.width, 'x', imageData.height);
      
      // 处理绿幕抠像
      let processedData = processGreenscreen(imageData);
      console.log('Worker: Greenscreen processing completed');
      
      // 如果需要合成背景
      if (useBackground && config.backgroundImage) {
        processedData = compositeBackground(processedData, config.backgroundImage);
        console.log('Worker: Background composition completed');
      }
      
      // 返回处理结果
      self.postMessage({
        type: 'result',
        data: processedData
      }, [processedData.data.buffer]);
      console.log('Worker: Result sent back to main thread');
      break;
  }
};