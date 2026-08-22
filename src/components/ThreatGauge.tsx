import React from 'react';
import { ThreatLevel } from '../types';

interface ThreatGaugeProps {
  score: number;
  level: ThreatLevel;
  confidence?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const ThreatGauge: React.FC<ThreatGaugeProps> = ({
  score,
  level,
  confidence = 92,
  size = 'md',
}) => {
  // Semi-circle SVG calculation
  const radius = size === 'lg' ? 70 : size === 'md' ? 55 : 38;
  const strokeWidth = size === 'lg' ? 12 : size === 'md' ? 10 : 7;
  const circumference = Math.PI * radius; // 180 deg semi circle
  const progress = Math.min(100, Math.max(0, score));
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return { stroke: '#e05353', text: 'text-[#e05353]', bg: 'bg-[#e05353]/10', border: 'border-[#e05353]/30' };
    if (s >= 60) return { stroke: '#c5a059', text: 'text-[#c5a059]', bg: 'bg-[#c5a059]/10', border: 'border-[#c5a059]/30' };
    if (s >= 40) return { stroke: '#dfba73', text: 'text-[#dfba73]', bg: 'bg-[#dfba73]/10', border: 'border-[#dfba73]/30' };
    return { stroke: '#10b981', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
  };

  const colors = getColor(score);
  const width = radius * 2 + strokeWidth * 2;
  const height = radius + strokeWidth * 2 + 10;

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div className="relative flex items-center justify-center">
        <svg width={width} height={height} className="overflow-visible">
          {/* Background Track Arc */}
          <path
            d={`M ${strokeWidth}, ${radius + strokeWidth} A ${radius} ${radius} 0 0 1 ${width - strokeWidth}, ${radius + strokeWidth}`}
            fill="none"
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Active Colored Arc */}
          <path
            d={`M ${strokeWidth}, ${radius + strokeWidth} A ${radius} ${radius} 0 0 1 ${width - strokeWidth}, ${radius + strokeWidth}`}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Inner Score Display */}
        <div className="absolute inset-x-0 bottom-1 flex flex-col items-center justify-center text-center">
          <span className={`font-light tracking-tight ${size === 'lg' ? 'text-4xl' : size === 'md' ? 'text-3xl' : 'text-2xl'} text-white font-mono`}>
            {score}
          </span>
          <span className="text-[9px] text-white/30 font-medium uppercase tracking-widest">
            / 100
          </span>
        </div>
      </div>

      {/* Threat Level Badge */}
      <div className="mt-2 flex items-center gap-2">
        <span className={`px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase border ${colors.bg} ${colors.text} ${colors.border} tracking-widest`}>
          {level} THREAT
        </span>
        {confidence !== undefined && (
          <span className="text-[10px] text-white/40 font-mono">
            {confidence}% Conf.
          </span>
        )}
      </div>
    </div>
  );
};
