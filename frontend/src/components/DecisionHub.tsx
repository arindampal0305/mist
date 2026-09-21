import React, { useState } from 'react';
import { Gavel, Save } from 'lucide-react';
import { ScreeningResponse, AuditEntry } from '../types';
import { RiskGauge } from './RiskGauge';
import { ShapChart } from './ShapChart';

interface Props {
  data: ScreeningResponse;
}

const actionButtons = [
  { label: 'Clear Passage', value: 'CLEAR PASSAGE', borderAccent: 'border-l-[3px] border-l-emerald-600' },
  { label: 'Secondary Interview', value: 'SECONDARY INTERVIEW', borderAccent: 'border-l-[3px] border-l-amber-500' },
  { label: 'Retain Document', value: 'RETAIN DOCUMENT', borderAccent: 'border-l-[3px] border-l-amber-500' },
  { label: 'Immediate Detain', value: 'IMMEDIATE DETAIN', borderAccent: 'border-l-[3px] border-l-red-600' },
];

export const DecisionHub: React.FC<Props> = ({ data }) => {
  const [justification, setJustification] = useState('');
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);

  const handleAction = async (actionStr: string) => {
    if (data.risk_score > 25 && !justification.trim()) {
      alert('Justification required for risk score > 25.');
      return;
    }

    const entry: AuditEntry = {
      session_id: data.session_id,
      officer_id: 'SSB-77',
      action: actionStr,
      justification: justification.trim() || 'Standard clearance',
      timestamp: new Date().toISOString(),
    };

    try {
      const BASE = import.meta.env.VITE_API_URL ?? 'https://mist-w25v.onrender.com';
      await fetch(`${BASE}/api/audit/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
    } catch (_) {}

    setAuditLog((prev) => [entry, ...prev].slice(0, 5));
    setJustification('');
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Session Metadata Header */}
      <div className="bg-surface rounded-xl border border-navy/10 p-3 flex items-center justify-between text-xs font-sans text-gray-700 font-medium">
        <span>Session: <strong className="text-navy font-bold">{data.session_id}</strong></span>
        <span className="text-gray-700">{data.document_type}</span>
      </div>

      {/* Dempster-Shafer Belief Bar (Fix 1) */}
      <RiskGauge score={data.risk_score} band={data.risk_band} dsMasses={data.ds_masses} />

      {/* SHAP Chart */}
      <ShapChart attributions={data.shap_attributions} />

      {/* Officer Disposition & Action Drawer (Fix 4 & Fix 2) */}
      <div className="bg-surface rounded-xl border border-navy/10 p-4 space-y-3">
        <div className="flex items-center justify-between text-xs font-sans text-gray-700 font-medium">
          <div className="flex items-center gap-1.5">
            <Gavel className="w-3.5 h-3.5 text-gray-600" />
            <span className="font-semibold text-navy">Officer Disposition</span>
          </div>
          <span className="text-gray-700">SSB-77</span>
        </div>

        {/* Textarea with Inter font */}
        <textarea
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
          placeholder={
            data.risk_score > 25
              ? 'Enter mandatory justification for risk score > 25...'
              : 'Enter optional rationale...'
          }
          className="w-full h-14 bg-canvas border border-gray-300 rounded-lg p-2.5 text-xs font-sans text-navy placeholder:text-gray-500 focus:border-gray-500 resize-none"
        />

        {/* Action Buttons with 3px Left-Border Accents */}
        <div className="grid grid-cols-2 gap-2">
          {actionButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => handleAction(btn.value)}
              className={`w-full p-2.5 rounded-lg border border-gray-300 ${btn.borderAccent} bg-surface hover:bg-gray-100 text-navy text-xs font-sans font-medium text-left transition-colors`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Disposition Audit Trail inside Disposition Box */}
        {auditLog.length > 0 && (
          <div className="pt-2 border-t border-gray-200 space-y-1.5 font-sans">
            <div className="flex items-center justify-between text-xs text-gray-700 font-medium">
              <span className="flex items-center gap-1">
                <Save className="w-3 h-3 text-gray-600" />
                Disposition Audit Trail
              </span>
              <span>{auditLog.length} LOGGED</span>
            </div>
            <div className="space-y-1 max-h-28 overflow-y-auto pr-0.5">
              {auditLog.map((log, i) => (
                <div key={i} className="text-xs font-sans bg-canvas/60 p-1.5 rounded border border-gray-200 flex justify-between items-center text-gray-800 font-medium">
                  <span className="font-bold text-navy">{log.action}</span>
                  <span className="text-gray-600 text-[11px]">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
