import React, { useState } from 'react';
import { Activity, Gavel, Save } from 'lucide-react';
import { ScreeningResponse, AuditEntry } from '../types';
import { RiskGauge } from './RiskGauge';
import { ShapChart } from './ShapChart';

interface Props {
  data: ScreeningResponse;
}

export const DecisionHub: React.FC<Props> = ({ data }) => {
  const [justification, setJustification] = useState('');
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);

  const handleAction = (actionStr: string) => {
    if (data.risk_score > 25 && !justification.trim()) {
      alert("Justification required for risk score > 25");
      return;
    }

    const entry: AuditEntry = {
      session_id: data.session_id,
      officer_id: 'OFFICER-77',
      action: actionStr,
      justification: justification || 'N/A',
      timestamp: new Date().toISOString()
    };

    setAuditLog([entry, ...auditLog].slice(0, 5));
    setJustification('');
  };

  const isCritical = data.risk_band === 'CRITICAL';
  const containerClasses = `bg-zinc-900 border rounded-lg flex flex-col h-full overflow-hidden ${
    isCritical ? 'border-red-600 animate-pulse-critical bg-red-950/20' : 'border-zinc-800'
  }`;

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center gap-2 shrink-0">
        <Activity className="w-4 h-4 text-sky-400" />
        <h2 className="text-sm font-semibold tracking-wider text-slate-300 uppercase">
          Decision & Evidence Hub
        </h2>
      </div>

      <div className="p-4 space-y-5 overflow-y-auto flex-1">
        {/* Session Info */}
        <div className="flex justify-between items-center text-xs text-zinc-400 bg-zinc-950 px-3 py-2 rounded border border-zinc-800">
          <span>ID: {data.session_id}</span>
          <span>{data.document_type}</span>
        </div>

        {/* Risk Gauge */}
        <div>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-2 text-center">Composite Risk Score</h3>
          <RiskGauge score={data.risk_score} band={data.risk_band} />
        </div>

        {/* Action Required Badge */}
        <div className="flex justify-center">
          <span className={`text-xs font-bold px-3 py-1 rounded border ${
            data.action_required === 'DETAIN' ? 'bg-red-500/20 text-red-500 border-red-500/50' :
            data.action_required === 'RETAIN' ? 'bg-rose-500/20 text-rose-500 border-rose-500/50' :
            data.action_required === 'INTERVIEW' ? 'bg-amber-500/20 text-amber-500 border-amber-500/50' :
            'bg-emerald-500/20 text-emerald-500 border-emerald-500/50'
          }`}>
            RECOMMENDED: {data.action_required}
          </span>
        </div>

        {/* SHAP Attributions */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase">Risk Factor Attributions</h3>
          <ShapChart attributions={data.shap_attributions} />
        </div>

        {/* Officer Action Drawer */}
        <div className="space-y-3 pt-4 border-t border-zinc-800">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase flex items-center gap-2">
            <Gavel className="w-3.5 h-3.5" />
            Officer Determination
          </h3>
          
          <textarea
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Enter justification (required for risk > 25)..."
            className="w-full h-20 bg-zinc-950 border border-zinc-700 rounded p-2 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500 resize-none"
          />

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleAction('CLEAR PASSAGE')}
              className="text-xs font-semibold px-2 py-2 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800 hover:bg-emerald-900/60 transition-colors"
            >
              CLEAR PASSAGE
            </button>
            <button
              onClick={() => handleAction('SECONDARY INTERVIEW')}
              className="text-xs font-semibold px-2 py-2 rounded bg-amber-950/40 text-amber-400 border border-amber-800 hover:bg-amber-900/60 transition-colors"
            >
              SECONDARY INTERVIEW
            </button>
            <button
              onClick={() => handleAction('RETAIN DOCUMENT')}
              className="text-xs font-semibold px-2 py-2 rounded bg-rose-950/40 text-rose-400 border border-rose-800 hover:bg-rose-900/60 transition-colors"
            >
              RETAIN DOCUMENT
            </button>
            <button
              onClick={() => handleAction('DETAIN')}
              className="text-xs font-semibold px-2 py-2 rounded bg-red-950/40 text-red-400 border border-red-800 hover:bg-red-900/60 transition-colors"
            >
              DETAIN
            </button>
          </div>
        </div>

        {/* Mini Audit Log */}
        {auditLog.length > 0 && (
          <div className="pt-4 border-t border-zinc-800 space-y-2">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase flex items-center gap-2">
              <Save className="w-3 h-3" />
              Recent Actions
            </h3>
            <div className="space-y-2">
              {auditLog.map((log, i) => (
                <div key={i} className="text-[10px] bg-zinc-950 p-2 rounded border border-zinc-800">
                  <div className="flex justify-between text-zinc-400 mb-1">
                    <span className="font-semibold text-sky-400">{log.action}</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-zinc-500 truncate">{log.justification}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
