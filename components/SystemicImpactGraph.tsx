
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { OrganTarget } from '../types';

interface SystemicImpactGraphProps {
  loads: Record<OrganTarget, number>;
  color: string;
}

const formatTitle = (title: string) => title.charAt(0).toUpperCase() + title.slice(1);

export const SystemicImpactGraph: React.FC<SystemicImpactGraphProps> = ({ loads, color }) => {
  const data = Object.entries(loads).map(([system, load]) => ({
    system: formatTitle(system as OrganTarget),
    // Use a baseline of 5 for visual representation of the "normal state" inner polygon
    baseline: 5,
    'Current Load': Math.max(5, load), // Ensure load is at least baseline to draw shape
    fullMark: 100,
  }));

  return (
    <div className="w-full h-full min-h-[300px] flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="system" tick={{ fontSize: 10, fill: '#64748b' }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            formatter={(value: number, name: string) => [`${(value).toFixed(0)}%`, name]}
          />
          <Radar
            name="Baseline"
            dataKey="baseline"
            stroke="#cbd5e1"
            fill="#f1f5f9"
            fillOpacity={0.8}
            isAnimationActive={false}
          />
          <Radar
            name="Current Load"
            dataKey="Current Load"
            stroke={color}
            fill={color}
            fillOpacity={0.6}
            isAnimationActive={false}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
