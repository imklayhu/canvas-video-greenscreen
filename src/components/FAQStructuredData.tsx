import React from 'react';
import StructuredData from './StructuredData';

const FAQStructuredData: React.FC = () => {
  const faqData = {
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "什么是绿幕抠像处理器？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "绿幕抠像处理器是一款专业的在线视频处理工具，可以自动识别并移除视频中的绿色背景，实现背景替换效果。支持实时摄像头处理和上传视频处理。"
        }
      },
      {
        "@type": "Question",
        name: "如何使用绿幕抠像处理器？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "使用步骤：1. 上传带有绿色背景的视频或开启摄像头；2. 调整绿幕检测参数；3. 选择或上传新背景图片；4. 点击处理按钮开始抠像；5. 下载处理后的视频。"
        }
      },
      {
        "@type": "Question",
        name: "支持哪些视频格式？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "支持MP4、WebM、MOV等常见视频格式，建议使用带有绿色背景的视频以获得最佳效果。"
        }
      },
      {
        "@type": "Question",
        name: "绿幕抠像处理器是免费的吗？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "是的，绿幕抠像处理器完全免费使用，无需注册账号，无需下载软件，直接在浏览器中即可使用。"
        }
      },
      {
        "@type": "Question",
        name: "如何获得最佳的绿幕抠像效果？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "为了获得最佳效果，建议：1. 使用纯绿色背景布；2. 确保光线充足均匀；3. 避免穿着绿色衣物；4. 调整HSL参数以匹配您的绿幕颜色。"
        }
      },
      {
        "@type": "Question",
        name: "可以自定义背景图片吗？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "是的，支持上传自定义背景图片，也提供多种预设背景颜色供选择。背景图片会自动缩放以适应视频尺寸。"
        }
      }
    ]
  };

  return <StructuredData type="WebSite" data={faqData} />;
};

export default FAQStructuredData;