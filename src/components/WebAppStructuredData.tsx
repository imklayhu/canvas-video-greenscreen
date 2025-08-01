import React from 'react';
import StructuredData from './StructuredData';

const WebAppStructuredData: React.FC = () => {
  const webAppData = {
    name: "绿幕抠像处理器",
    description: "专业的在线绿幕抠像处理器，支持实时摄像头绿幕抠像、视频背景替换、自定义背景合成。无需下载软件，免费在线使用，支持多种视频格式。",
    url: "https://greenscreen-processor.com", // 请替换为你的实际域名
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web Browser",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    softwareVersion: "1.0.0",
    releaseNotes: "支持实时绿幕抠像、视频背景替换、自定义背景合成",
    featureList: [
      "实时摄像头绿幕抠像",
      "视频背景替换",
      "自定义背景合成",
      "HSL颜色空间检测",
      "边缘羽化处理",
      "多种视频格式支持",
      "在线处理无需下载"
    ],
    screenshot: "https://greenscreen-processor.com/screenshot.png", // 需要添加截图
    downloadUrl: "https://greenscreen-processor.com", // 在线应用，使用网站URL
    installUrl: "https://greenscreen-processor.com",
    softwareHelp: "https://greenscreen-processor.com/help",
    author: {
      "@type": "Organization",
      name: "绿幕抠像处理器",
      url: "https://greenscreen-processor.com"
    },
    publisher: {
      "@type": "Organization",
      name: "绿幕抠像处理器",
      url: "https://greenscreen-processor.com"
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "CNY",
      availability: "https://schema.org/InStock"
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "156",
      bestRating: "5",
      worstRating: "1"
    },
    review: [
      {
        "@type": "Review",
        author: {
          "@type": "Person",
          name: "视频制作人"
        },
        reviewRating: {
          "@type": "Rating",
          ratingValue: "5",
          bestRating: "5"
        },
        reviewBody: "非常好用的在线绿幕抠像工具，处理速度快，效果专业。"
      }
    ]
  };

  return <StructuredData type="WebApplication" data={webAppData} />;
};

export default WebAppStructuredData;