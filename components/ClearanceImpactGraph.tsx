
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { Drug, UserProfile, Dose } from '../types';
import { runFullSimulation } from '../lib/simulation';

interface ClearanceImpactGraphProps {
  doses: Dose[];
  user: UserProfile;
  drugs: Drug[];
  displayTime: number;
  onMouseMove: (e: any) => void;
  onMouseLeave: () => void;
}

export const ClearanceImpactGraph: React.FC<ClearanceImpactGraphProps> = ({ doses, user, drugs, displayTime, onMouseMove, onMouseLeave }) => {
  const comparisonData = useMemo(() => {
    const timeRange = Array.from({ length: 97 }, (_, i) => i * 0.25);

    const sedentaryUser = { ...user, activityLevel: 1 as const };
    const normalUser = { ...user, activityLevel: 3 as const };
    const activeUser = { ...user, activityLevel: 5 as const };

    const sedentarySim = runFullSimulation(timeRange, doses, drugs, sedentaryUser);
    const normalSim = runFullSimulation(timeRange, doses, drugs, normalUser);
    const activeSim = runFullSimulation(timeRange, doses, drugs, activeUser);

    return timeRange.map((t, i) => ({
      time: t,
      Sedentary: sedentarySim[i].concentration,
      Normal: normalSim[i].concentration,
      'Hyper-Metabolic': activeSim[i].concentration,
    }));
  }, [doses, drugs, user]);

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={comparisonData}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10 }}
            tickFormatter={(tick) => tick.toFixed(0)}
          />
          <YAxis
            label={{ value: 'Conc (mg/L)', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }}
            tick={{ fontSize: 10 }}
            domain={[0, 'dataMax * 1.1']}
          />
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            formatter={(value: number) => [`${value.toFixed(2)} mg/L`]}
            isAnimationActive={false}
          />
          <Legend wrapperStyle={{fontSize: "10px", paddingTop: "10px"}}/>
          <Line type="monotone" dataKey="Sedentary" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="Normal" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="Hyper-Metabolic" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
          <ReferenceLine x={displayTime} stroke="#0f172a" strokeWidth={1} strokeDasharray="3 3" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
