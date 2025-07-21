# 绿幕抠像处理器

一个基于 Next.js 的实时绿幕抠像处理应用，使用 Web Workers 和 Canvas API 实现高性能的实时图像处理。

## 功能特性

- 🎥 **实时摄像头处理** - 支持访问笔记本电脑摄像头进行实时绿幕抠像
- 🎨 **智能绿幕检测** - 基于 HSL 颜色空间的精确绿幕检测算法
- ⚡ **高性能处理** - 使用 Web Workers 和 requestAnimationFrame 实现流畅的 60fps 处理
- 🖼️ **背景合成** - 支持自定义背景图片合成
- 🎛️ **参数调节** - 实时调整色相、饱和度、亮度等参数
- 📱 **响应式设计** - 适配不同屏幕尺寸的现代化 UI

## 技术栈

- **前端框架**: Next.js 15 + TypeScript
- **样式**: Tailwind CSS
- **图像处理**: Canvas API + Web Workers
- **性能优化**: OffscreenCanvas + requestAnimationFrame
- **算法**: HSL 颜色空间绿幕检测

## 快速开始

### 环境要求

- Node.js 18+ 
- 支持 WebRTC 的现代浏览器
- 摄像头权限

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本

```bash
npm run build
npm start
```

## 使用说明

### 1. 准备工作

- 确保有绿色背景布或绿色墙面
- 光线充足，避免阴影
- 摄像头与背景保持适当距离
- 避免穿着绿色衣物

### 2. 启动摄像头

点击"启动摄像头"按钮，允许浏览器访问摄像头权限。

### 3. 调整参数

使用右侧控制面板调整绿幕检测参数：

- **色相范围**: 调整绿色检测范围（100-140 为推荐值）
- **饱和度**: 控制颜色纯度要求
- **亮度**: 调整明暗度要求
- **容差**: 控制边缘过渡效果
- **羽化**: 平滑边缘处理

### 4. 背景设置

- 启用"背景合成"开关
- 上传自定义背景图片或选择预设背景
- 支持 JPG、PNG、GIF 格式

### 5. 预设配置

提供三种预设配置：

- **标准绿幕**: 适用于标准绿色背景布
- **宽松设置**: 适用于光线较暗或颜色不纯的绿幕
- **精确设置**: 适用于高质量绿幕和专业设备

## 技术实现

### 绿幕检测算法

使用 HSL 颜色空间进行绿幕检测：

```javascript
// 转换为HSL颜色空间
const hsl = rgbToHsl(r, g, b);
const [h, s, l] = hsl;

// 检查是否为绿色背景
const isGreen = (
  h >= config.hueMin && h <= config.hueMax &&
  s >= config.saturationMin && s <= config.saturationMax &&
  l >= config.lightnessMin && l <= config.lightnessMax
);
```

### 性能优化

1. **Web Workers**: 将图像处理逻辑移到后台线程
2. **requestAnimationFrame**: 实现流畅的 60fps 渲染
3. **OffscreenCanvas**: 支持高性能的离屏渲染（当前版本暂时禁用）
4. **Transferable Objects**: 使用 ArrayBuffer 传输减少内存拷贝

### 文件结构

```
src/
├── app/
│   ├── page.tsx              # 主页面
│   ├── layout.tsx            # 布局组件
│   └── globals.css           # 全局样式
├── components/
│   ├── GreenscreenProcessor.tsx  # 核心处理组件
│   ├── ConfigPanel.tsx           # 参数配置面板
│   └── BackgroundUploader.tsx    # 背景上传组件
└── public/
    └── greenscreen-worker.js     # Web Worker 脚本
```

## 浏览器兼容性

- Chrome 67+
- Firefox 60+
- Safari 11.1+
- Edge 79+

## 性能指标

- **处理延迟**: < 16ms (60fps)
- **内存使用**: 优化的图像数据传输
- **CPU 使用**: 后台线程处理，主线程无阻塞

## 故障排除

### 常见问题

1. **无法访问摄像头**
   - 检查浏览器权限设置
   - 确保没有其他应用占用摄像头

2. **绿幕检测效果不佳**
   - 调整色相范围参数
   - 改善光线条件
   - 确保背景颜色均匀

3. **性能问题**
   - 降低摄像头分辨率
   - 关闭不必要的浏览器标签页
   - 检查设备性能

### 调试模式

在浏览器控制台中可以看到：
- FPS 显示
- 错误信息
- 性能指标

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 更新日志

### v1.0.0
- 初始版本发布
- 基础绿幕抠像功能
- 实时参数调节
- 背景合成支持
