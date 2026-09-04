import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import { ShapAttribution } from '../types';

interface Props {
  attributions: ShapAttribution[];
}

export const ShapChart: React.FC<Props> = ({ attributions }) => {
  return (
    <div className="bg-surface rounded-xl border border-navy/10 p-4 space-y-2 font-sans">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold text-navy">Risk Factor Attribution</h3>
        <span className="text-xs font-sans text-gray-700 font-medium">SHAP Values</span>
      </div>
      <div className="w-full h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={attributions}
            margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="2 2" horizontal={false} stroke="#E5E7EB" />
            <XAxis
              type="number"
              stroke="#555555"
              fontSize={10}
              tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}`}
            />
            <YAxis
              dataKey="name"
              type="category"
              stroke="#444444"
              fontSize={10}
              width={100}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                borderColor: '#E5E7EB',
                borderRadius: '8px',
                fontSize: '11px',
                color: '#111827',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              }}
              formatter={(val: number) => [`${val > 0 ? '+' : ''}${val}`, 'Impact']}
            />
            <ReferenceLine x={0} stroke="#9CA3AF" strokeWidth={1} />
            <Bar dataKey="value" barSize={10} radius={[4, 4, 4, 4]}>
              {attributions.map((entry, i) => (
                <Cell key={i} fill={entry.value > 0 ? '#ef4444' : '#10b981'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
