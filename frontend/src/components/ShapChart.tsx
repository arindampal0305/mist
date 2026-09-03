import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { ShapAttribution } from '../types';

interface Props {
  attributions: ShapAttribution[];
}

export const ShapChart: React.FC<Props> = ({ attributions }) => {
  return (
    <div className="w-full h-48 bg-zinc-950 p-2 rounded border border-zinc-800">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={attributions}
          margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#3f3f46" />
          <XAxis type="number" stroke="#a1a1aa" fontSize={10} tickFormatter={(val) => val.toFixed(1)} />
          <YAxis dataKey="name" type="category" stroke="#a1a1aa" fontSize={10} width={80} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', fontSize: '12px', color: '#e2e8f0' }}
            itemStyle={{ color: '#e2e8f0' }}
            formatter={(value: number) => value.toFixed(3)}
          />
          <ReferenceLine x={0} stroke="#52525b" />
          <Bar dataKey="value" barSize={12}>
            {attributions.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#f43f5e' : '#10b981'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
