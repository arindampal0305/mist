import React, { useEffect, useState } from 'react';

interface Props {
  score: number;
  band: string;
}

export const RiskGauge: React.FC<Props> = ({ score, band }) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    // Reset and animate
    setAnimatedScore(0);
    const timeout = setTimeout(() => {
      setAnimatedScore(score);
    }, 100);
    return () => clearTimeout(timeout);
  }, [score]);

  const getColor = () => {
    switch (band) {
      case 'LOW': return 'stroke-emerald-500 text-emerald-500';
      case 'MEDIUM': return 'stroke-amber-500 text-amber-500';
      case 'HIGH': return 'stroke-rose-500 text-rose-500';
      case 'CRITICAL': return 'stroke-red-500 text-red-500';
      default: return 'stroke-zinc-500 text-zinc-500';
    }
  };

  const getTextColor = () => {
    switch (band) {
      case 'LOW': return 'text-emerald-500';
      case 'MEDIUM': return 'text-amber-500';
      case 'HIGH': return 'text-rose-500';
      case 'CRITICAL': return 'text-red-500';
      default: return 'text-zinc-500';
    }
  };

  const radius = 80;
  const circumference = Math.PI * radius; // Half circle
  const dashoffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center relative w-full pt-4 pb-2">
      <svg width="200" height="110" viewBox="0 0 200 110" className="overflow-visible">
        {/* Background Arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="16"
          strokeLinecap="round"
          className="text-zinc-800"
        />
        {/* Foreground Arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="16"
          strokeLinecap="round"
          className={`${getColor()} transition-all duration-1000 ease-out`}
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center bottom-2 text-center">
        <span className="text-4xl font-bold tracking-tighter text-slate-100">{score}</span>
        <span className={`text-xs font-bold uppercase tracking-widest mt-1 ${getTextColor()}`}>
          {band} RISK
        </span>
      </div>
    </div>
  );
};
