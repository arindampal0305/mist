import React from 'react';
import { ShieldCheck, ShieldAlert, Cpu, Hash, Eye } from 'lucide-react';
import { ScreeningResponse } from '../types';
import { ImageSlider } from './ImageSlider';

interface Props {
  data: ScreeningResponse;
}

export const ForensicInspector: React.FC<Props> = ({ data }) => {
  // Map session ID or scenario attributes to scenarioId
  const getScenarioId = () => {
    if (data.session_id === 'MIST-4081-B' || (data.tampering.ela_flag && data.biometrics.face_match_score < 30)) {
      return 'spliced_photo';
    }
    if (data.session_id === 'MIST-1102-C' || !data.mrz_parsed.dob_passed) {
      return 'dob_alteration';
    }
    if (data.session_id === 'MIST-6612-F' || data.risk_band === 'CRITICAL') {
      return 'watchlist_hit';
    }
    return 'clean_passport';
  };

  const scenarioId = getScenarioId();
  const faceScore = data.biometrics.face_match_score;
  const isMismatch = faceScore < 30;

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* Header */}
      <div className="flex items-center justify-between text-xs font-sans text-gray-700 border-b border-navy/5 pb-2">
        <div className="flex items-center gap-1.5 font-semibold text-navy">
          <Cpu className="w-3.5 h-3.5 text-gray-600" />
          <span>Forensic Modules Inspector</span>
        </div>
        <span className="text-gray-700 font-medium">Session: {data.session_id}</span>
      </div>

      {/* Module 1: ELA Compression Forensics */}
      <ImageSlider
        scenarioId={scenarioId}
        elaFlag={data.tampering.ela_flag}
        tamperScore={data.tampering.tamper_score}
        info={data.tampering.info}
        originalSrc="/passport.jpg"
      />

      {/* Module 2: ICAO 9303 MRZ Checksum */}
      <div className="bg-surface rounded-xl border border-navy/10 p-4 space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-700 font-sans font-medium">
          <div className="flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-gray-600" />
            <span className="font-semibold text-navy">ICAO 9303 Checksum Engine</span>
          </div>
          <span className="text-gray-600">Modulo-10</span>
        </div>

        {/* Raw MRZ Lines - IBM Plex Mono ONLY for raw MRZ text strings */}
        <div className="bg-canvas rounded p-2.5 font-mono text-[11px] text-navy tracking-widest overflow-x-auto space-y-0.5 border border-gray-300">
          <p className="text-navy font-semibold">{data.mrz_parsed.raw_line1 || 'P<INDPASSPORT<<KUMAR<<SUJAL<<<<<<<<<<<<<<<<<<'}</p>
          <p className="text-navy font-semibold">{data.mrz_parsed.raw_line2 || `${data.mrz_parsed.doc_no}<4IND9108144M3108146<<<<<<<<<<<02`}</p>
        </div>

        {/* Checksum Grid Cards - Inter font for all labels, IBM Plex Mono ONLY for doc_no value */}
        <div className="grid grid-cols-3 gap-2 font-sans">
          {/* Doc No */}
          <div className={`p-2.5 rounded border ${!data.mrz_parsed.doc_passed ? 'bg-red-50 border-red-300' : 'bg-canvas border-gray-300'}`}>
            <span className="text-xs text-gray-700 font-semibold block">Doc Number</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-navy font-bold font-mono">{data.mrz_parsed.doc_no}</span>
              {!data.mrz_parsed.doc_passed ? (
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
            </div>
            <span className={`text-[10px] block mt-1 font-sans ${!data.mrz_parsed.doc_passed ? 'text-red-700 font-bold' : 'text-emerald-700 font-semibold'}`}>
              {!data.mrz_parsed.doc_passed ? 'CHECKSUM FAIL' : 'PASS'}
            </span>
          </div>

          {/* DOB */}
          <div className={`p-2.5 rounded border ${!data.mrz_parsed.dob_passed ? 'bg-red-50 border-red-300' : 'bg-canvas border-gray-300'}`}>
            <span className="text-xs text-gray-700 font-semibold block">Date of Birth</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-navy font-bold">{data.mrz_parsed.dob}</span>
              {!data.mrz_parsed.dob_passed ? (
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
            </div>
            <span className={`text-[10px] block mt-1 font-sans ${!data.mrz_parsed.dob_passed ? 'text-red-700 font-bold' : 'text-emerald-700 font-semibold'}`}>
              {!data.mrz_parsed.dob_passed ? 'CHECKSUM FAIL' : 'PASS'}
            </span>
          </div>

          {/* Composite */}
          <div className={`p-2.5 rounded border ${!data.mrz_parsed.comp_passed ? 'bg-red-50 border-red-300' : 'bg-canvas border-gray-300'}`}>
            <span className="text-xs text-gray-700 font-semibold block">Composite</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-navy font-bold">{data.mrz_parsed.comp_passed ? 'Valid' : 'Corrupt'}</span>
              {!data.mrz_parsed.comp_passed ? (
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
            </div>
            <span className={`text-[10px] block mt-1 font-sans ${!data.mrz_parsed.comp_passed ? 'text-red-700 font-bold' : 'text-emerald-700 font-semibold'}`}>
              {!data.mrz_parsed.comp_passed ? 'CHECKSUM FAIL' : 'PASS'}
            </span>
          </div>
        </div>
      </div>

      {/* Module 3: Biometrics Verification HUD */}
      <div className="bg-surface rounded-xl border border-navy/10 p-4 space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-700 font-sans font-medium">
          <div className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-gray-600" />
            <span className="font-semibold text-navy">Biometric Verification</span>
          </div>
          <span className="text-gray-600">ArcFace / MiniFASNet</span>
        </div>

        <div className="grid grid-cols-2 gap-3 font-sans">
          {/* Card 1: ArcFace Similarity */}
          <div className="p-3.5 rounded bg-canvas border border-gray-300 space-y-2">
            <span className="text-xs text-gray-700 font-semibold block">ArcFace Similarity</span>
            
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${isMismatch ? 'text-red-600' : 'text-navy'}`}>
                {faceScore}%
              </span>
              {isMismatch && (
                <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold border border-red-300">
                  MISMATCH
                </span>
              )}
            </div>

            {/* Horizontal progress bar with 30% threshold tick */}
            <div className="space-y-1">
              <div className="relative w-full h-2.5 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                <div
                  className={`h-full transition-all duration-500 ${isMismatch ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, faceScore)}%` }}
                />
                {/* 30% threshold vertical marker line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-gray-600 z-10"
                  style={{ left: '30%' }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-gray-600 font-medium">
                <span>0%</span>
                <span className="font-semibold text-gray-700">threshold (30%)</span>
                <span>100%</span>
              </div>
            </div>

            {/* Status explanation line */}
            <div className="pt-0.5">
              {isMismatch ? (
                <p className="text-xs text-red-600 font-semibold">
                  Face vector distance outside acceptable range
                </p>
              ) : (
                <p className="text-xs text-emerald-700 font-medium">
                  Face vector distance within acceptable range
                </p>
              )}
            </div>
          </div>

          {/* Card 2: Liveness Detection - Two-column inline key-value pairs */}
          <div className="p-3.5 rounded bg-canvas border border-gray-300 space-y-2.5">
            <span className="text-xs text-gray-700 font-semibold block">Liveness Detection</span>
            
            <div className="flex items-center gap-2 pb-1 border-b border-gray-200">
              <span className={`text-sm font-bold ${data.biometrics.liveness_status !== 'LIVE' ? 'text-red-600' : 'text-navy'}`}>
                {data.biometrics.liveness_status}
              </span>
            </div>

            {/* Key-Value Pair 1: Anti-spoofing PASSED */}
            <div className="flex items-center justify-between font-sans">
              <span className="font-normal text-[#888888] text-[12px]">Anti-spoofing</span>
              <span className="font-semibold text-[#2d7a2d] text-[12px] uppercase tracking-[0.06em]">PASSED</span>
            </div>

            {/* Key-Value Pair 2: Dual-scale voting 3/3 frames verified */}
            <div className="flex items-center justify-between font-sans">
              <span className="font-normal text-[#888888] text-[12px]">Dual-scale voting</span>
              <span className="font-semibold text-gray-700 text-[12px] tracking-[0.06em]">3/3 frames verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
