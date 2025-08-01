import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "绿幕抠像处理器 - 在线视频背景替换工具",
    template: "%s | 绿幕抠像处理器"
  },
  description: "专业的在线绿幕抠像处理器，支持实时摄像头绿幕抠像、视频背景替换、自定义背景合成。无需下载软件，免费在线使用，支持多种视频格式。",
  keywords: [
    "绿幕抠像",
    "视频背景替换",
    "绿幕处理",
    "在线视频编辑",
    "背景合成",
    "视频抠像",
    "绿幕去除",
    "视频特效",
    "在线工具",
    "视频处理"
  ],
  authors: [{ name: "绿幕抠像处理器" }],
  creator: "绿幕抠像处理器",
  publisher: "绿幕抠像处理器",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://greenscreen-processor.com'), // 请替换为你的实际域名
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "绿幕抠像处理器 - 在线视频背景替换工具",
    description: "专业的在线绿幕抠像处理器，支持实时摄像头绿幕抠像、视频背景替换、自定义背景合成。无需下载软件，免费在线使用。",
    url: 'https://greenscreen-processor.com', // 请替换为你的实际域名
    siteName: '绿幕抠像处理器',
    images: [
      {
        url: '/og-image.png', // 需要添加这个图片
        width: 1200,
        height: 630,
        alt: '绿幕抠像处理器 - 在线视频背景替换工具',
      },
    ],
    locale: 'zh_CN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "绿幕抠像处理器 - 在线视频背景替换工具",
    description: "专业的在线绿幕抠像处理器，支持实时摄像头绿幕抠像、视频背景替换、自定义背景合成。",
    images: ['/og-image.png'], // 需要添加这个图片
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code', // 请替换为你的Google验证码
    // yandex: 'your-yandex-verification-code',
    // yahoo: 'your-yahoo-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3B82F6" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
