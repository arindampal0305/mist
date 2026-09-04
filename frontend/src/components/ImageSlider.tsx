import React, { useState } from 'react';
import { Sliders } from 'lucide-react';

interface Props {
  scenarioId?: string;
  elaFlag: boolean;
  tamperScore?: number;
  info?: string;
  originalSrc?: string;
}

export const ImageSlider: React.FC<Props> = ({
  scenarioId = 'clean_passport',
  elaFlag,
  tamperScore,
  originalSrc = '/passport.jpg',
}) => {
  const [pos, setPos] = useState<number>(50);

  // Anomaly index values & status chips per scenario
  const getScenarioForensics = () => {
    switch (scenarioId) {
      case 'spliced_photo':
        return {
          anomalyIndex: '34.2',
          chipLabel: 'ANOMALY DETECTED',
          chipStyle: 'bg-red-600 text-white font-bold',
          heatmapStyle: 'bg-red-600/30 mix-blend-color-burn',
          boxes: [
            {
              top: '12%',
              left: '8%',
              width: '34%',
              height: '58%',
              borderColor: 'border-red-600',
              bgColor: 'bg-red-500/20',
              label: 'HIGH ANOMALY - Photo Region',
              labelStyle: 'bg-red-600 text-white',
            },
            {
              top: '68%',
              left: '8%',
              width: '38%',
              height: '24%',
              borderColor: 'border-amber-500',
              bgColor: 'bg-amber-500/15',
              label: 'Boundary Discontinuity Detected',
              labelStyle: 'bg-amber-500 text-black',
            },
          ],
          isWatchlist: false,
        };
      case 'dob_alteration':
        return {
          anomalyIndex: '18.7',
          chipLabel: 'ANOMALY DETECTED',
          chipStyle: 'bg-amber-400 text-black font-bold',
          heatmapStyle: 'bg-amber-500/25 mix-blend-color-burn',
          boxes: [
            {
              top: '42%',
              left: '42%',
              width: '36%',
              height: '20%',
              borderColor: 'border-amber-500',
              bgColor: 'bg-amber-500/20',
              label: 'Compression Mismatch - DOB Field',
              labelStyle: 'bg-amber-500 text-black',
            },
            {
              top: '78%',
              left: '32%',
              width: '45%',
              height: '18%',
              borderColor: 'border-amber-500',
              bgColor: 'bg-amber-500/20',
              label: 'MRZ Field Anomaly',
              labelStyle: 'bg-amber-500 text-black',
            },
          ],
          isWatchlist: false,
        };
      case 'watchlist_hit':
        return {
          anomalyIndex: '4.1',
          chipLabel: 'WATCHLIST MATCH',
          chipStyle: 'bg-red-600 text-white font-bold',
          heatmapStyle: 'bg-emerald-950/10 mix-blend-multiply',
          boxes: [
            {
              top: '12%',
              left: '8%',
              width: '34%',
              height: '58%',
              borderColor: 'border-emerald-600',
              bgColor: 'bg-emerald-500/10',
              label: 'Document Authentic',
              labelStyle: 'bg-emerald-700 text-white',
            },
          ],
          isWatchlist: true,
        };
      case 'clean_passport':
      default:
        return {
          anomalyIndex: tamperScore !== undefined ? (tamperScore * 100).toFixed(1) : '2.1',
          chipLabel: elaFlag ? 'ANOMALY DETECTED' : 'CLEAN',
          chipStyle: elaFlag
            ? 'bg-red-600 text-white font-bold'
            : 'bg-gray-100 text-emerald-800 border border-gray-300',
          heatmapStyle: 'bg-emerald-950/10 mix-blend-multiply',
          boxes: [
            {
              top: '12%',
              left: '8%',
              width: '34%',
              height: '58%',
              borderColor: 'border-emerald-600',
              bgColor: 'bg-emerald-500/10',
              label: 'Uniform - PASS',
              labelStyle: 'bg-emerald-700 text-white',
            },
          ],
          isWatchlist: false,
        };
    }
  };

  const forensics = getScenarioForensics();

  return (
    <div className="bg-surface rounded-xl border border-navy/10 p-3.5 space-y-2.5 font-sans">
      <div className="flex items-center justify-between text-xs text-gray-700 font-semibold">
        <span>Image Compression Forensics (ELA)</span>
      </div>

      {/* Watchlist Alert Banner overlay if S4 Watchlist Hit */}
      {forensics.isWatchlist && (
        <div className="bg-red-600 text-white text-xs font-sans font-bold px-3 py-1.5 rounded flex items-center gap-1.5 shadow-sm">
          <span>⚠ BIOMETRIC MATCH | RESTRICTED INDIVIDUAL</span>
        </div>
      )}

      {/* Draggable Split View Container */}
      <div className="relative w-full h-44 bg-canvas rounded-lg overflow-hidden border border-gray-300 select-none">
        {/* Right Side: Dynamic ELA Heatmap Overlay */}
        <div className="absolute inset-0 w-full h-full transition-opacity duration-400 ease-in-out">
          <img
            src={originalSrc}
            alt="ELA Scan"
            className="w-full h-full object-cover filter contrast-125 brightness-95"
          />
          {/* Heatmap blend color layer */}
          <div className={`absolute inset-0 pointer-events-none transition-colors duration-400 ${forensics.heatmapStyle}`} />

          {/* Dynamic Scenario Bounding Boxes */}
          {forensics.boxes.map((box, idx) => (
            <div
              key={idx}
              className={`absolute border-2 ${box.borderColor} ${box.bgColor} rounded-sm flex items-start justify-start p-0.5 transition-all duration-400`}
              style={{
                top: box.top,
                left: box.left,
                width: box.width,
                height: box.height,
              }}
            >
              <span className={`text-[9px] font-sans font-bold px-1 py-0.5 rounded shadow ${box.labelStyle}`}>
                {box.label}
              </span>
            </div>
          ))}

          {/* ELA Label */}
          <span className="absolute top-2 right-2 bg-surface/90 text-gray-700 px-2 py-0.5 rounded text-xs font-sans font-medium border border-gray-300 pointer-events-none">
            ELA Heatmap
          </span>
        </div>

        {/* Left Side: Original Scan (Clipped) */}
        <div
          className="absolute inset-0 overflow-hidden transition-all duration-75"
          style={{ width: `${pos}%` }}
        >
          <img
            src={originalSrc}
            alt="Original Scan"
            className="absolute inset-0 w-full h-full object-cover max-w-none"
            style={{ width: '100%', height: '100%' }}
          />
          <span className="absolute top-2 left-2 bg-surface/90 text-gray-700 px-2 py-0.5 rounded text-xs font-sans font-medium border border-gray-300 pointer-events-none">
            Original Scan
          </span>
        </div>

        {/* Draggable Divider Handle */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-gray-400 cursor-ew-resize z-10 flex items-center justify-center"
          style={{ left: `${pos}%` }}
        >
          <div className="w-5 h-5 rounded-full bg-surface border border-gray-300 flex items-center justify-center shadow text-gray-600">
            <Sliders className="w-3 h-3" />
          </div>
        </div>

        {/* Range Input for dragging */}
        <input
          type="range"
          min="0"
          max="100"
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-20"
        />
      </div>

      {/* Anomaly Index left-aligned with small status chip */}
      <div className="flex items-center justify-between text-xs pt-0.5">
        <div className="flex items-center gap-2.5 font-sans text-gray-700">
          <span className="font-medium text-gray-800">Anomaly Index: {forensics.anomalyIndex}%</span>
          <span className={`text-xs px-2 py-0.5 rounded font-sans ${forensics.chipStyle}`}>
            {forensics.chipLabel}
          </span>
        </div>
      </div>
    </div>
  );
};
