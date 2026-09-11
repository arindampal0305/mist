import React, { useState, useEffect } from 'react';
import { Shield, Clock } from 'lucide-react';
import { ScreeningResponse } from './types';
import { IngestionPanel } from './components/IngestionPanel';
import { ForensicInspector } from './components/ForensicInspector';
import { DecisionHub } from './components/DecisionHub';

const App: React.FC = () => {
  const [data, setData] = useState<ScreeningResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // Auto-load default screening dataset on mount so dashboard displays instantly
  useEffect(() => {
    handleScenario('clean_passport');
  }, []);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) +
        ' IST'
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleScenario = async (scenarioId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/screen/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_id: scenarioId }),
      });
      if (res.ok) setData(await res.json());
    } catch (e) {
      console.error('Network error', e);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/screen/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const result = await res.json();
        setData(result);
      } else {
        console.error('Upload failed with HTTP status', res.status);
      }
    } catch (e) {
      console.error('Network error during document upload', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-canvas text-navy font-sans overflow-hidden">
      {/* ─── Institutional Header Bar ─── */}
      <header className="h-14 bg-surface border-b border-gray-300 flex items-center justify-between px-6 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-[22px] font-bold text-navy tracking-[0.05em] leading-none">
            MIST
          </h1>
          <span className="text-[13px] font-normal text-gray-600">
            Multi-layered Intelligence & Screening Technology
          </span>
          <div className="h-4 border-l border-gray-300 mx-1" />
          <span className="text-[13px] font-normal text-gray-600">
            Ministry of Home Affairs | Sashastra Seema Bal
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-sans text-gray-600">
          <span>INDO-NEPAL CHECKPOINT 05</span>
        </div>
      </header>

      {/* ─── Main Content Container (Sidebar + Workspace) ─── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[280px] bg-surface shadow-sidebar flex flex-col shrink-0 border-r border-gray-300">
          {/* Operator Status Bar */}
          <div className="p-3.5 border-b border-gray-200 bg-gray-50/50">
            <div className="flex items-center gap-1.5 text-xs font-sans font-medium text-gray-700">
              <Shield className="w-4 h-4 text-navy shrink-0" strokeWidth={2} />
              <span>SSB-77</span>
              <span className="text-gray-400">|</span>
              <span>NODE: SSB-BOM5</span>
              <span className="text-gray-400">|</span>
              <span>SHIFT: 0700-1500</span>
            </div>
          </div>

          {/* Ingestion Panel (Scanner & Camera) */}
          <div className="flex-1 overflow-y-auto">
            <IngestionPanel
              onScenarioSelect={handleScenario}
              onFileUpload={handleFileUpload}
              loading={loading}
            />
          </div>

          {/* Sidebar Clock Footer */}
          <div className="p-3 border-t border-gray-200 bg-gray-50/30">
            <div className="flex items-center justify-between text-xs text-gray-600 font-sans">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-500" />
                <span>{currentTime}</span>
              </div>
              <span>v1.0.0</span>
            </div>
          </div>
        </aside>

        {/* Content Workspace Grid */}
        <main className="flex-1 grid grid-cols-[1fr_360px] gap-4 p-4 overflow-y-auto min-h-0">
          {/* Center Column: Technical Forensic Inspector */}
          <div className="overflow-y-auto pr-1">
            {data ? (
              <ForensicInspector data={data} />
            ) : (
              <div className="h-full flex items-center justify-center text-xs font-sans text-gray-600 font-medium">
                Loading screening data...
              </div>
            )}
          </div>

          {/* Right Column: Decision Hub */}
          <div className="overflow-y-auto pl-1">
            {data ? (
              <DecisionHub data={data} />
            ) : (
              <div className="h-full flex items-center justify-center text-xs font-sans text-gray-600 font-medium">
                Loading decision engine...
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ─── Full Footer Bar ─── */}
      <footer className="bg-surface border-t border-gray-300 p-4 px-6 shrink-0 font-sans text-navy">
        <div className="flex items-start justify-between gap-6">
          {/* ROW 1 - Left Aligned */}
          <div className="space-y-0.5 text-xs text-gray-600 font-normal">
            <p className="text-navy font-medium">
              MIST | Multi-layered Intelligence & Screening Technology
            </p>
            <p>Prototype made for ICCI 2026 Exhibition</p>
            <p className="text-[11px] text-gray-500">
              Team mates: Arindam Pal, Sneha Tiwari, Aman Ansari, Sujal Kumar
            </p>
          </div>

          {/* ROW 1 - Right Aligned Data Notice */}
          <div className="max-w-[480px] text-right text-[11px] text-gray-500 leading-tight">
            Data Notice: Document images are processed locally and discarded immediately after verification. No biometric or personal data is transmitted to external servers or APIs.
          </div>
        </div>

        {/* ROW 2 - Centered Disclaimer */}
        <div className="mt-2.5 pt-2 border-t border-gray-200/70 text-center text-[10px] text-gray-400 font-normal">
          This is a prototype with few working features that we made to display at ICCI 2026, BIT Mesra.
        </div>
      </footer>
    </div>
  );
};

export default App;
