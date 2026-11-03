import React from 'react';
import { DieCutStickerImage } from '../common/CornerStickerBadge';

export const GreetingCharacterIllustration: React.FC = () => {
  return (
    <div className="relative flex items-center justify-center shrink-0 pointer-events-none select-none">
      {/* Soft ambient radial light behind sticker */}
      <div
        aria-hidden="true"
        className="absolute -inset-6 rounded-full blur-2xl"
        style={{
          background:
            'radial-gradient(circle, rgba(255, 255, 255, 0.72) 0%, rgba(33, 25, 85, 0.22) 60%, transparent 100%)',
        }}
      />
      <DieCutStickerImage
        type="cbt-hero"
        alt="Emblem CBT & Kitab Pesantren"
        className="relative z-10 w-32 h-32 sm:w-40 sm:h-40 rotate-[-5deg]"
      />
    </div>
  );
};

export const ProctorTokenIllustration: React.FC = () => {
  return (
    <div className="relative flex items-center justify-center shrink-0 pointer-events-none select-none">
      {/* Soft emerald-indigo ambient radial glow behind token sticker */}
      <div
        aria-hidden="true"
        className="absolute -inset-6 rounded-full blur-2xl"
        style={{
          background:
            'radial-gradient(circle, rgba(20, 184, 148, 0.32) 0%, rgba(59, 40, 204, 0.22) 60%, transparent 100%)',
        }}
      />
      <DieCutStickerImage
        type="token-live"
        alt="Emblem Keamanan Token & Live Proctoring"
        className="relative z-10 w-28 h-28 sm:w-36 sm:h-36 rotate-[6deg]"
      />
    </div>
  );
};

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface MultiSegmentDonutChartProps {
  segments: DonutSegment[];
  centerPrimary: string;
  centerSecondary: string;
}

export const MultiSegmentDonutChart: React.FC<MultiSegmentDonutChartProps> = ({
  segments,
  centerPrimary,
  centerSecondary,
}) => {
  const total = segments.reduce((acc, s) => acc + s.value, 0) || 1;
  const outerRadius = 62;
  const outerCircumference = 2 * Math.PI * outerRadius;
  const mainRadius = 51;
  const mainCircumference = 2 * Math.PI * mainRadius;
  let cumulativePercent = 0;

  return (
    <div className="relative flex items-center justify-center w-36 h-36 shrink-0">
      <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
        {/* Outer subtle track */}
        <circle
          cx="70"
          cy="70"
          r={outerRadius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="3"
        />

        {/* Outer colored segmented arcs */}
        {segments.map((seg, idx) => {
          const pct = seg.value / total;
          const arcLength = Math.max(8, pct * outerCircumference - 10);
          const strokeDasharray = `${arcLength} ${outerCircumference}`;
          const strokeDashoffset = -cumulativePercent * outerCircumference;
          cumulativePercent += pct;
          return (
            <circle
              key={`outer-${idx}`}
              cx="70"
              cy="70"
              r={outerRadius}
              fill="none"
              stroke={seg.color}
              strokeWidth="3.5"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          );
        })}

        {/* Main thick white donut ring */}
        <circle
          cx="70"
          cy="70"
          r={mainRadius}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="8.5"
          strokeDasharray={`${mainCircumference * 0.92} ${mainCircumference}`}
          strokeDashoffset={-mainCircumference * 0.04}
          strokeLinecap="round"
        />

        {/* Solid White Center Disc */}
        <circle cx="70" cy="70" r="38" fill="#FFFFFF" />
      </svg>

      {/* Center text on top of solid white disc */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2 pointer-events-none">
        <span className="text-sm sm:text-[15px] font-extrabold text-[#211955] tracking-tight leading-none whitespace-nowrap">
          {centerPrimary}
        </span>
        <span className="text-[9px] font-bold text-[#6B728E] mt-1 leading-none whitespace-nowrap">
          {centerSecondary}
        </span>
      </div>
    </div>
  );
};
