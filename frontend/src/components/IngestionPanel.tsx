import React, { useState } from 'react';
import { Upload, Camera, Zap, FileWarning, AlertTriangle, Skull, ShieldCheck } from 'lucide-react';

interface Props {
  onScenarioSelect: (id: string) => void;
  loading: boolean;
}

export const IngestionPanel: React.FC<Props> = ({ onScenarioSelect, loading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFileName(e.dataTransfer.files[0].name);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-6 h-full flex flex-col">
      {/* Document Scanner Dropzone */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Document Scanner</h3>
        <div
          className={`flex flex-col items-center justify-center p-6 border border-dashed rounded-lg bg-zinc-900/80 transition-colors ${
            dragActive ? 'border-sky-500 bg-zinc-800' : 'border-zinc-700'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="w-8 h-8 text-zinc-500 mb-2" />
          <span className="text-sm text-zinc-300 font-medium">
            {fileName ? fileName : 'Drop Document Scan'}
          </span>
          <span className="text-xs text-zinc-600 mt-1">JPEG, PNG, PDF supported</span>
        </div>
      </div>

      {/* Camera Stream Mock */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Face Verification</h3>
        <div className="relative w-full aspect-video bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800 flex items-center justify-center">
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30">
            <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-rose-500 tracking-wider">LIVE FEED</span>
          </div>
          <Camera className="w-10 h-10 text-zinc-800" />
          <div className="absolute inset-4 border-2 border-zinc-800/50 rounded-lg pointer-events-none" />
          {/* Scanning Reticle */}
          <div className="absolute inset-x-1/4 inset-y-1/4 border border-sky-500/30 pointer-events-none rounded">
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-sky-500" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-sky-500" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-sky-500" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-sky-500" />
          </div>
        </div>
      </div>

      {/* Scenario Injector */}
      <div className="space-y-3 flex-1">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <Zap className="w-3.5 h-3.5" />
          Scenario Injector
        </h3>
        <div className="space-y-2">
          <button
            disabled={loading}
            onClick={() => onScenarioSelect('clean_passport')}
            className="w-full text-left px-3 py-2.5 rounded border border-emerald-800 bg-emerald-950/20 hover:bg-emerald-900/30 transition-colors flex items-center gap-2 group"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-emerald-300">S1: Clean Passport</span>
          </button>
          
          <button
            disabled={loading}
            onClick={() => onScenarioSelect('spliced_photo')}
            className="w-full text-left px-3 py-2.5 rounded border border-rose-800 bg-rose-950/20 hover:bg-rose-900/30 transition-colors flex items-center gap-2 group"
          >
            <FileWarning className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-rose-300">S2: Spliced Photo</span>
          </button>
          
          <button
            disabled={loading}
            onClick={() => onScenarioSelect('dob_alteration')}
            className="w-full text-left px-3 py-2.5 rounded border border-amber-800 bg-amber-950/20 hover:bg-amber-900/30 transition-colors flex items-center gap-2 group"
          >
            <AlertTriangle className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-amber-300">S3: DOB Alteration</span>
          </button>
          
          <button
            disabled={loading}
            onClick={() => onScenarioSelect('watchlist_hit')}
            className="w-full text-left px-3 py-2.5 rounded border border-red-800 bg-red-950/20 hover:bg-red-900/30 transition-colors flex items-center gap-2 group animate-pulse"
          >
            <Skull className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-red-300">S4: Watchlist Hit</span>
          </button>
        </div>
      </div>
      {loading && (
        <div className="text-xs text-sky-400 text-center animate-pulse mt-2">
          Processing Scenario...
        </div>
      )}
    </div>
  );
};
