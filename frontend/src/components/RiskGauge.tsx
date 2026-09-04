import React from 'react';
import { DempsterShaferMass } from '../types';

interface Props {
  score: number;
  band: string;
  dsMasses?: DempsterShaferMass;
}

export const RiskGauge: React.FC<Props> = ({ score, band, dsMasses }) => {
  // Calculate percentage values
  const G = dsMasses?.G !== undefined ? Math.round(dsMasses.G * 100) : (band === 'LOW' ? 92 : band === 'MEDIUM' ? 45 : 5);
  const F = dsMasses?.F !== undefined ? Math.round(dsMasses.F * 100) : score;
  const U = dsMasses?.U !== undefined ? Math.round(dsMasses.U * 100) : Math.max(0, 100 - G - F);

  return (
    <div className="bg-surface rounded-xl border border-navy/10 p-4 space-y-3 font-sans">
      {/* Label above */}
      <div className="text-xs text-gray-700 font-semibold">
        Dempster-Shafer Belief Index
      </div>

      {/* Horizontal Stacked Bar (~24px tall) */}
      <div className="w-full h-6 rounded bg-gray-100 overflow-hidden flex border border-navy/5">
        {G > 0 && (
          <div
            style={{ width: `${G}%` }}
            className="bg-emerald-500 h-full flex items-center justify-center text-[10px] font-sans text-white font-medium px-1 overflow-hidden"
            title={`Genuine: ${G}%`}
          >
            {G >= 10 && `${G}%`}
          </div>
        )}
        {F > 0 && (
          <div
            style={{ width: `${F}%` }}
            className="bg-red-500 h-full flex items-center justify-center text-[10px] font-sans text-white font-medium px-1 overflow-hidden"
            title={`Fake: ${F}%`}
          >
            {F >= 10 && `${F}%`}
          </div>
        )}
        {U > 0 && (
          <div
            style={{ width: `${U}%` }}
            className="bg-amber-500 h-full flex items-center justify-center text-[10px] font-sans text-white font-medium px-1 overflow-hidden"
            title={`Unknown: ${U}%`}
          >
            {U >= 10 && `${U}%`}
          </div>
        )}
      </div>

      {/* Segment Legend directly below */}
      <div className="flex items-center gap-4 text-xs text-gray-700 font-medium font-sans">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          Genuine: {G}%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
          Fake: {F}%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
          Unknown: {U}%
        </span>
      </div>

      {/* Single line below bar, left-aligned, small sans text. Not bold. Not large. */}
      <div className="text-xs font-sans text-gray-600 font-medium pt-0.5">
        {score} / 100 {band.toUpperCase()} RISK
      </div>
    </div>
  );
};
