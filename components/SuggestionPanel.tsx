
import React from 'react';
import { Activity, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { ClinicalStatus } from '../types';

interface StatusPanelProps {
  status: ClinicalStatus;
}

export const StatusPanel: React.FC<StatusPanelProps> = ({ status }) => {
  const getStyles = () => {
    switch(status.type) {
        case 'danger': return 'bg-red-50 border-red-200 text-red-800';
        case 'warning': return 'bg-orange-50 border-orange-200 text-orange-800';
        case 'success': return 'bg-emerald-50 border-emerald-200 text-emerald-800';
        default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getIcon = () => {
      switch(status.type) {
        case 'danger': return <AlertTriangle size={18} className="text-red-600" />;
        case 'warning': return <AlertTriangle size={18} className="text-orange-500" />;
        case 'success': return <CheckCircle size={18} className="text-emerald-500" />;
        default: return <Info size={18} className="text-blue-500" />;
      }
  };

  return (
    <section className={`border rounded-2xl p-4 shadow-sm transition-colors duration-300 ${getStyles()}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getIcon()}
          <h3 className="text-xs font-bold uppercase tracking-wider">Clinical Status</h3>
        </div>
        <div className="px-2 py-0.5 bg-white/50 rounded-full text-[10px] font-bold uppercase tracking-widest border border-black/5">
            {status.phase}
        </div>
      </div>
      <div className="text-sm min-h-[40px] flex items-center">
         <p className="font-medium leading-snug">{status.message}</p>
      </div>
    </section>
  );
};
