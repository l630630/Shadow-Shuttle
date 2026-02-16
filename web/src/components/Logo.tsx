import React from 'react';
import { type Theme } from '../theme';

interface LogoProps {
  theme: Theme;
  size?: number;
  showGlow?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  theme,
  size = 32,
  showGlow = true,
  className = '',
}) => {
  const iconSize = size * 0.6;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      {/* Glow effect - 发光特效 */}
      {showGlow && (
        <div
          className={`absolute inset-0 rounded-xl transition-all duration-300 ${
            theme === 'dark'
              ? 'bg-primary/20 shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-pulse'
              : 'bg-primary/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
          }`}
          style={{
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />
      )}

      {/* Icon container - 图标容器 */}
      <div
        className={`relative flex items-center justify-center rounded-xl border transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-slate-800 border-white/10 shadow-lg shadow-primary/20'
            : 'bg-white border-slate-200 shadow-lg shadow-slate-200/50'
        }`}
        style={{ width: size, height: size }}
      >
        {/* Webhook icon - 使用 Material Symbols */}
        <span
          className={`material-symbols-outlined transition-colors duration-300 ${
            theme === 'dark' ? 'text-primary' : 'text-emerald-600'
          }`}
          style={{ fontSize: iconSize }}
        >
          webhook
        </span>

        {/* Inner glow - 内部光晕 */}
        {showGlow && (
          <div
            className={`absolute inset-0 rounded-xl transition-opacity duration-300 ${
              theme === 'dark'
                ? 'bg-gradient-to-br from-primary/10 to-transparent opacity-50'
                : 'bg-gradient-to-br from-emerald-500/5 to-transparent opacity-30'
            }`}
          />
        )}
      </div>

      {/* Rotating ring effect - 旋转环特效 */}
      {showGlow && (
        <div
          className={`absolute inset-0 rounded-xl border-2 transition-all duration-300 ${
            theme === 'dark'
              ? 'border-primary/20 animate-spin-slow'
              : 'border-emerald-500/10 animate-spin-slow'
          }`}
          style={{
            animation: 'spin 8s linear infinite',
            borderStyle: 'dashed',
          }}
        />
      )}
    </div>
  );
};
