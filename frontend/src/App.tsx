import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { ScreeningResponse } from './types';
import { IngestionPanel } from './components/IngestionPanel';
import { ForensicInspector } from './components/ForensicInspector';
import { DecisionHub } from './components/DecisionHub';

const App: React.FC = () => {
  const [data, setData] = useState<ScreeningResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleScenario = async (scenarioId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/screen/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_id: scenarioId }),
      });
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        console.error('Error fetching scenario');
      }
    } catch (error) {
      console.error('Network error', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Header */}
      <header className="h-16 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-sky-500" />
          <h1 className="text-lg font-semibold tracking-wide text-slate-100">
            MIST: Multi-layered Intelligence & Screening Technology
          </h1>
        </div>
        <div className="text-xs font-mono text-zinc-400 bg-zinc-950 px-3 py-1 rounded border border-zinc-800">
          [SSB-BOM5]
        </div>
      </header>

      {/* Main Layout */}
      <main className="grid grid-cols-[300px_1fr_340px] gap-4 p-4 h-[calc(100vh-64px)] overflow-hidden">
        {/* Left Column */}
        <div className="overflow-y-auto">
          <IngestionPanel onScenarioSelect={handleScenario} loading={loading} />
        </div>

        {/* Center Column */}
        <div className="overflow-y-auto">
          {data ? (
            <ForensicInspector data={data} />
          ) : (
            <div className="h-full flex items-center justify-center bg-zinc-900/50 border border-dashed border-zinc-800 rounded-lg">
              <span className="text-zinc-500 text-sm">Select a scenario to view technical inspection data</span>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="overflow-y-auto">
          {data ? (
            <DecisionHub data={data} />
          ) : (
            <div className="h-full flex items-center justify-center bg-zinc-900/50 border border-dashed border-zinc-800 rounded-lg p-6 text-center">
              <span className="text-zinc-500 text-sm">Awaiting screening data for decision support</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
