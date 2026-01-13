
import React from 'react';
import { Lightbulb, RefreshCw } from 'lucide-react';

interface SuggestionPanelProps {
  suggestion: string;
  isLoading: boolean;
  onRefresh: () => void;
}

export const SuggestionPanel: React.FC<SuggestionPanelProps> = ({ suggestion, isLoading, onRefresh }) => {
  return (
    <section className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Lightbulb size={18} className="text-amber-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800">AI Clinical Snapshot</h3>
        </div>
        <button onClick={onRefresh} disabled={isLoading} className="text-amber-500 hover:text-amber-700 disabled:opacity-50 disabled:cursor-wait">
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>
      <div className="text-sm text-amber-900 min-h-[40px] flex items-center">
        {isLoading ? (
          <p className="opacity-70 animate-pulse">AI is analyzing...</p>
        ) : (
          <p>{suggestion}</p>
        )}
      </div>
    </section>
  );
};
