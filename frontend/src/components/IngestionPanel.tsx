import React, { useState, useRef } from 'react';
import {
  Upload, Camera, ShieldCheck, FileWarning, AlertTriangle, Skull, Settings, Loader2
} from 'lucide-react';

interface Props {
  onScenarioSelect: (id: string) => void;
  onFileUpload?: (file: File) => void;
  loading: boolean;
}

const scenarios = [
  {
    id: 'clean_passport',
    label: 'S1 - Clean Passport',
    icon: ShieldCheck,
  },
  {
    id: 'spliced_photo',
    label: 'S2 - Spliced Photo',
    icon: FileWarning,
  },
  {
    id: 'dob_alteration',
    label: 'S3 - DOB Alteration',
    icon: AlertTriangle,
  },
  {
    id: 'watchlist_hit',
    label: 'S4 - Watchlist Hit',
    icon: Skull,
  },
];

export const IngestionPanel: React.FC<Props> = ({ onScenarioSelect, onFileUpload, loading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [showDevTools, setShowDevTools] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const processFile = (file: File) => {
    setFileName(file.name);
    if (onFileUpload) {
      onFileUpload(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
    e.target.value = '';
  };

  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-4 space-y-4 font-sans">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="image/*,.pdf"
        className="hidden"
      />

      {/* Document Drop Zone */}
      <div className="space-y-1">
        <p className="text-xs text-gray-700 font-medium">
          Document Scanner
        </p>
        <div
          onClick={handleDropZoneClick}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center p-4 border border-dashed rounded-lg cursor-pointer transition-all ${
            dragActive
              ? 'border-navy bg-canvas'
              : 'border-gray-300 hover:border-gray-400 bg-canvas/40'
          }`}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 mb-1 text-navy animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mb-1 text-gray-600" />
          )}
          <span className="text-xs text-gray-800 font-medium text-center truncate max-w-full px-2">
            {loading ? 'Processing scan...' : (fileName || 'Drop passport scan or click to upload')}
          </span>
          <span className="text-[11px] text-gray-500 font-normal mt-0.5">JPG, PNG, PDF</span>
        </div>
      </div>

      {/* Camera Live Stream */}
      <div className="space-y-1">
        <p className="text-xs text-gray-700 font-medium">
          Face Capture
        </p>
        <div className="relative aspect-[4/3] bg-canvas rounded-lg border border-gray-300 flex items-center justify-center overflow-hidden">
          <Camera className="w-5 h-5 text-gray-400" />
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-surface px-2 py-0.5 rounded border border-gray-300 text-[10px] text-gray-700 font-medium">
            <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
            <span>LIVE STREAM</span>
          </div>
          {/* Camera reticle SVG */}
          <svg className="absolute inset-3 w-[calc(100%-24px)] h-[calc(100%-24px)] pointer-events-none stroke-gray-400" strokeWidth="1" fill="none">
            <path d="M 0 8 V 0 H 8" />
            <path d="M calc(100% - 8px) 0 H 100% V 8" />
            <path d="M 0 calc(100% - 8px) V 100% H 8" />
            <path d="M calc(100% - 8px) 100% H 100% V calc(100% - 8px)" />
          </svg>
        </div>
      </div>

      {/* Dev Tools Toggle at the bottom */}
      <div className="pt-2 border-t border-gray-200">
        <button
          onClick={() => setShowDevTools(!showDevTools)}
          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 transition-colors font-medium"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Dev Tools {showDevTools ? '[-]' : '[+]'}</span>
        </button>

        {/* Collapsible Test Scenarios - hidden in default view */}
        {showDevTools && (
          <div className="mt-2 space-y-2 p-2.5 bg-gray-50 rounded-lg border border-gray-300">
            <p className="text-[10px] font-sans text-red-600 font-medium uppercase tracking-wider">
              DEMO INJECTION - NOT VISIBLE IN PRODUCTION
            </p>
            <p className="text-[11px] font-sans text-gray-700 font-semibold tracking-wider uppercase">
              SCENARIO INJECTION
            </p>
            <div className="space-y-1.5">
              {scenarios.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    disabled={loading}
                    onClick={() => onScenarioSelect(s.id)}
                    className="w-full flex items-center gap-2 p-2 rounded border border-gray-300 bg-white hover:bg-gray-100 text-left text-xs font-sans font-medium text-navy transition-colors group"
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0 text-gray-600" />
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
