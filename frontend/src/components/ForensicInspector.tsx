import React from 'react';
import { ShieldCheck, ShieldAlert, Cpu, ImageIcon, Scan, Eye } from 'lucide-react';
import { ScreeningResponse } from '../types';

interface Props {
  data: ScreeningResponse;
}

export const ForensicInspector: React.FC<Props> = ({ data }) => {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <h2 className="text-sm font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-2">
          <Cpu className="w-4 h-4 text-sky-500" />
          Technical Module Inspector
        </h2>
        <span className="text-xs text-zinc-500">Node: SSB-BOM5</span>
      </div>

      {/* Module 1: ELA Tampering Detection */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase flex items-center gap-2">
          <Scan className="w-3.5 h-3.5" />
          Module 1: Tampering Detection Engine
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-950 p-3 rounded border border-zinc-800">
            <div className="text-xs text-zinc-500">ELA Compression Analysis</div>
            <div className={`font-mono text-sm mt-1 flex items-center gap-2 ${data.tampering.ela_flag ? 'text-rose-400' : 'text-emerald-400'}`}>
              {data.tampering.ela_flag ? 'ANOMALY DETECTED' : 'CLEAN'}
              {data.tampering.ela_flag ? (
                <ShieldAlert className="w-4 h-4 text-rose-500" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              )}
            </div>
          </div>
          <div className="bg-zinc-950 p-3 rounded border border-zinc-800">
            <div className="text-xs text-zinc-500">Copy-Move / MVSS-Net</div>
            <div className={`font-mono text-sm mt-1 flex items-center gap-2 ${data.tampering.copy_move_flag ? 'text-rose-400' : 'text-emerald-400'}`}>
              {data.tampering.copy_move_flag ? 'DETECTED' : 'CLEAN'}
              {data.tampering.copy_move_flag ? (
                <ShieldAlert className="w-4 h-4 text-rose-500" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              )}
            </div>
          </div>
        </div>
        {data.tampering.info && (
          <div className="text-xs text-amber-400/70 bg-amber-950/20 border border-amber-900/30 rounded px-3 py-2">
            ⓘ {data.tampering.info}
          </div>
        )}
      </div>

      {/* Module 2: MRZ Checksum */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase flex items-center gap-2">
          <ImageIcon className="w-3.5 h-3.5" />
          Module 2: Cryptographic Checksum Engine
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-zinc-950 p-3 rounded border border-zinc-800">
            <div className="text-xs text-zinc-500">Document No Checksum</div>
            <div className="font-mono text-sm mt-1 flex items-center gap-2">
              {data.mrz_parsed.doc_no}
              {data.mrz_parsed.doc_passed ? (
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-500" />
              )}
            </div>
          </div>
          <div className="bg-zinc-950 p-3 rounded border border-zinc-800">
            <div className="text-xs text-zinc-500">Date of Birth Checksum</div>
            <div className="font-mono text-sm mt-1 flex items-center gap-2">
              {data.mrz_parsed.dob}
              {data.mrz_parsed.dob_passed ? (
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-500" />
              )}
            </div>
          </div>
          <div className="bg-zinc-950 p-3 rounded border border-zinc-800">
            <div className="text-xs text-zinc-500">Composite Validation</div>
            <div className="font-mono text-sm mt-1 flex items-center gap-2">
              {data.mrz_parsed.comp_passed ? 'VALID' : 'CORRUPT'}
              {data.mrz_parsed.comp_passed ? (
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-500" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Module 3: Document Type */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase">Document Classification</h3>
        <div className="bg-zinc-950 p-3 rounded border border-zinc-800">
          <div className="text-xs text-zinc-500">Classified Type</div>
          <div className="font-mono text-sm mt-1 text-sky-400">{data.document_type}</div>
        </div>
      </div>

      {/* Module 4: Biometric Verification HUD */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase flex items-center gap-2">
          <Eye className="w-3.5 h-3.5" />
          Module 4: Face Verification & Liveness
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-950 p-4 rounded border border-zinc-800 text-center space-y-1">
            <div className="text-xs text-zinc-500">ArcFace Similarity</div>
            <div className={`text-2xl font-bold ${data.biometrics.face_match_score < 30 ? 'text-rose-500' : 'text-emerald-500'}`}>
              {data.biometrics.face_match_score}%
            </div>
            <div className="text-[10px] text-zinc-600">Threshold: 30% Similarity</div>
          </div>
          <div className="bg-zinc-950 p-4 rounded border border-zinc-800 text-center space-y-1">
            <div className="text-xs text-zinc-500">MiniFASNet Liveness</div>
            <div className={`text-2xl font-bold ${data.biometrics.liveness_status === 'LIVE' ? 'text-emerald-500' : 'text-rose-500'}`}>
              {data.biometrics.liveness_status}
            </div>
            <div className="text-[10px] text-zinc-600">Dual-Scale Voting Active</div>
          </div>
        </div>
      </div>
    </div>
  );
};
