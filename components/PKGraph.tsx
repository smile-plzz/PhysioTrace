
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Brush } from 'recharts';
import { SimulationResult } from '../types';

interface PKGraphProps {
  data: SimulationResult[];
  displayTime: number;
  toxicityThreshold: number;
  color: string;
  onMouseMove: (e: any) => void;
  onMouseLeave: () => void;
}

export const PKGraph: React.FC<PKGraphProps> = ({ data, displayTime, toxicityThreshold, color, onMouseMove, onMouseLeave }) => {
  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart 
          data={data}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
        >
          <defs>
            <linearGradient id="colorConc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 10 }}
            tickFormatter={(tick) => tick.toFixed(0)}
          />
          <YAxis 
            label={{ value: 'Conc (mg/L)', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }}
            tick={{ fontSize: 10 }}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            formatter={(value: number) => [`${value.toFixed(2)} mg/L`, 'Concentration']}
            isAnimationActive={false}
          />
          <Area 
            type="monotone" 
            dataKey="concentration" 
            stroke={color} 
            fillOpacity={1} 
            fill="url(#colorConc)" 
            isAnimationActive={false}
          />
          <ReferenceLine x={displayTime} stroke="#0f172a" strokeWidth={1} strokeDasharray="3 3" />
          <ReferenceLine 
            y={toxicityThreshold} 
            label={{ value: 'Toxic', position: 'right', fill: '#ef4444', fontSize: 10 }} 
            stroke="#ef4444" 
            strokeDasharray="5 5" 
          />
           <Brush 
             dataKey="time" 
             height={20} 
             stroke={color}
             fill="#f1f5f9"
             tickFormatter={(tick) => tick.toFixed(0)}
           />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
