
import React from 'react';
import { BookOpenText, AlertTriangle, Building, TestTube } from 'lucide-react';
import { FdaDrugInfo } from '../types';

interface DrugInfoPanelProps {
  details: FdaDrugInfo | null;
  isLoading: boolean;
}

const InfoSection: React.FC<{icon: React.ReactNode, title: string, content: string | undefined}> = ({icon, title, content}) => (
    <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
            {icon} {title}
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed max-h-24 overflow-y-auto pr-2 scrollbar-thin">
            {content || 'Data not available.'}
        </p>
    </div>
);

export const DrugInfoPanel: React.FC<DrugInfoPanelProps> = ({ details, isLoading }) => {
  if (isLoading) {
    return (
        <div className="glass rounded-3xl p-6 shadow-sm flex items-center justify-center min-h-[200px]">
            <p className="text-sm font-semibold text-slate-500 animate-pulse">Querying FDA database...</p>
        </div>
    );
  }

  if (!details) {
    return (
        <div className="glass rounded-3xl p-6 shadow-sm flex items-center justify-center min-h-[200px]">
            <p className="text-sm font-semibold text-slate-500">No official FDA data found for this compound.</p>
        </div>
    );
  }

  return (
    <div className="glass rounded-3xl p-6 shadow-sm space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
        <h2 className="sm:col-span-2 text-lg font-bold text-slate-800">{details.brandName}</h2>
        <InfoSection icon={<TestTube size={14}/>} title="Generic Name" content={details.genericName} />
        <InfoSection icon={<Building size={14}/>} title="Manufacturer" content={details.manufacturer} />
      </div>
      <InfoSection icon={<BookOpenText size={14}/>} title="Indications & Usage" content={details.indications} />
      <InfoSection icon={<AlertTriangle size={14}/>} title="Adverse Reactions" content={details.reactions} />
    </div>
  );
};
