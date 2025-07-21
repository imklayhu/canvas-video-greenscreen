 'use client';

import React from 'react';

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

interface ConfigPanelProps {
  config: GreenscreenConfig;
  onConfigChange: (config: GreenscreenConfig) => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, onConfigChange }) => {
  const updateConfig = (key: keyof GreenscreenConfig, value: number) => {
    onConfigChange({
      ...config,
      [key]: value
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">绿幕抠像参数</h3>
      
      <div className="space-y-4">
        {/* 色相范围 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            绿色色相范围: {config.hueMin} - {config.hueMax}
          </label>
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">最小值</label>
              <input
                type="range"
                min="0"
                max="360"
                value={config.hueMin}
                onChange={(e) => updateConfig('hueMin', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">最大值</label>
              <input
                type="range"
                min="0"
                max="360"
                value={config.hueMax}
                onChange={(e) => updateConfig('hueMax', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* 饱和度范围 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            饱和度范围: {config.saturationMin} - {config.saturationMax}
          </label>
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">最小值</label>
              <input
                type="range"
                min="0"
                max="255"
                value={config.saturationMin}
                onChange={(e) => updateConfig('saturationMin', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">最大值</label>
              <input
                type="range"
                min="0"
                max="255"
                value={config.saturationMax}
                onChange={(e) => updateConfig('saturationMax', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* 亮度范围 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            亮度范围: {config.lightnessMin} - {config.lightnessMax}
          </label>
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">最小值</label>
              <input
                type="range"
                min="0"
                max="255"
                value={config.lightnessMin}
                onChange={(e) => updateConfig('lightnessMin', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">最大值</label>
              <input
                type="range"
                min="0"
                max="255"
                value={config.lightnessMax}
                onChange={(e) => updateConfig('lightnessMax', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* 容差 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            容差: {config.tolerance}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={config.tolerance}
            onChange={(e) => updateConfig('tolerance', parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* 羽化 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            羽化: {config.feather}
          </label>
          <input
            type="range"
            min="0"
            max="20"
            value={config.feather}
            onChange={(e) => updateConfig('feather', parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* 预设按钮 */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium text-gray-700 mb-2">预设</h4>
          <div className="flex space-x-2">
            <button
              onClick={() => onConfigChange({
                hueMin: 100,
                hueMax: 140,
                saturationMin: 50,
                saturationMax: 255,
                lightnessMin: 30,
                lightnessMax: 200,
                tolerance: 30,
                feather: 2
              })}
              className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              标准绿幕
            </button>
            <button
              onClick={() => onConfigChange({
                hueMin: 80,
                hueMax: 160,
                saturationMin: 30,
                saturationMax: 255,
                lightnessMin: 20,
                lightnessMax: 220,
                tolerance: 50,
                feather: 5
              })}
              className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              宽松设置
            </button>
            <button
              onClick={() => onConfigChange({
                hueMin: 110,
                hueMax: 130,
                saturationMin: 80,
                saturationMax: 255,
                lightnessMin: 50,
                lightnessMax: 180,
                tolerance: 15,
                feather: 1
              })}
              className="px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
            >
              精确设置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;