import React from 'react';
import { ImageIcon } from 'lucide-react';

interface Props {
  elaFlag: boolean;
  info?: string;
}

export const ImageSlider: React.FC<Props> = ({ elaFlag, info }) => {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 flex flex-col items-center justify-center space-y-4 h-48">
      <ImageIcon className="w-8 h-8 text-zinc-600" />
      <div className="text-center">
        <h3 className="text-sm font-semibold text-zinc-300">ELA Heatmap Analysis</h3>
        <p className="text-xs text-zinc-500 mt-1">Drag and drop original image to analyze visual heatmaps.</p>
      </div>
      <div className={`px-3 py-1 rounded text-xs font-bold ${
        elaFlag ? 'bg-rose-500/20 text-rose-500 border border-rose-500/50' : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/50'
      }`}>
        {elaFlag ? 'ANOMALY DETECTED' : 'CLEAN'}
      </div>
      {info && <p className="text-[10px] text-zinc-500">{info}</p>}
    </div>
  );
};
