
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Drug, UserProfile, Dose, SimulationResult, OrganTarget, FdaDrugInfo } from './types';
import { INITIAL_DRUGS } from './constants';
import { runFullSimulation } from './lib/simulation';
import { searchNewDrug, getFdaDetails, getClinicalSuggestion } from './services/gemini';
import { PKGraph } from './components/PKGraph';
import { SystemicImpactGraph } from './components/SystemicImpactGraph';
import { DrugInfoPanel } from './components/DrugInfoPanel';
import { SuggestionPanel } from './components/SuggestionPanel';
import { ClearanceImpactGraph } from './components/ClearanceImpactGraph';
import { Activity, Clock, Search, User, ShieldAlert, Zap, Plus, Trash2, X } from 'lucide-react';

type GraphTab = 'pk' | 'activity';

const App: React.FC = () => {
  // State
  const [user, setUser] = useState<UserProfile>({
    age: 30,
    gender: 'male',
    weight: 75,
    height: 180,
    activityLevel: 3
  });
  
  const [drugs, setDrugs] = useState<Drug[]>(INITIAL_DRUGS);
  const [selectedDrugId, setSelectedDrugId] = useState<string>(INITIAL_DRUGS[0].id);
  const [doses, setDoses] = useState<Dose[]>([{
    id: 'initial',
    drugId: INITIAL_DRUGS[0].id,
    timestamp: 0,
    amountMg: INITIAL_DRUGS[0].defaultDoseMg
  }]);
  
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [drugDetails, setDrugDetails] = useState<FdaDrugInfo | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string>("");
  const [isSuggestionLoading, setIsSuggestionLoading] = useState(false);
  const [activeGraphTab, setActiveGraphTab] = useState<GraphTab>('pk');
  const [newlyAddedDrugId, setNewlyAddedDrugId] = useState<string | null>(null);

  // Derived Data
  const selectedDrug = useMemo(() => 
    drugs.find(d => d.id === selectedDrugId) || drugs[0]
  , [drugs, selectedDrugId]);

  const simulationData = useMemo(() => {
    const timeRange = Array.from({ length: 97 }, (_, i) => i * 0.25); // 0 to 24 hours at 15m intervals
    return runFullSimulation(timeRange, doses, drugs, user);
  }, [doses, drugs, user]);

  const displayTime = hoveredTime ?? currentTime;

  const currentState = useMemo(() => {
    const closestIdx = Math.round(displayTime * 4);
    return simulationData[closestIdx] || simulationData[0];
  }, [simulationData, displayTime]);

  const isInitialDrug = (drugId: string) => INITIAL_DRUGS.some(d => d.id === drugId);

  // Handlers & Callbacks
  const fetchSuggestion = useCallback(async () => {
      if (!selectedDrug) return;
      setIsSuggestionLoading(true);
      const newSuggestion = await getClinicalSuggestion(
          selectedDrug.name,
          currentState.concentration,
          selectedDrug.toxicityThresholdMgL,
          selectedDrug.timeToPeakHours,
          displayTime
      );
      setSuggestion(newSuggestion);
      setIsSuggestionLoading(false);
  }, [selectedDrug, currentState.concentration, selectedDrug.toxicityThresholdMgL, selectedDrug.timeToPeakHours, displayTime]);

  // Effects
  useEffect(() => {
    const fetchDetails = async () => {
        if (!selectedDrug) return;
        setIsDetailsLoading(true);
        const details = await getFdaDetails(selectedDrug.name);
        setDrugDetails(details);
        setIsDetailsLoading(false);
    };
    fetchDetails();
    fetchSuggestion();
  }, [selectedDrugId, fetchSuggestion]);
  
    useEffect(() => {
      const handler = setTimeout(() => {
        fetchSuggestion();
      }, 1000); // Debounce suggestion fetching
      return () => clearTimeout(handler);
    }, [displayTime, currentState.concentration, fetchSuggestion]);

  useEffect(() => {
    if (newlyAddedDrugId) {
      const timer = setTimeout(() => setNewlyAddedDrugId(null), 1500); // Animation duration
      return () => clearTimeout(timer);
    }
  }, [newlyAddedDrugId]);

  const handleAddDose = () => {
    const newDose: Dose = {
      id: Math.random().toString(36).substr(2, 9),
      drugId: selectedDrugId,
      timestamp: currentTime,
      amountMg: selectedDrug.defaultDoseMg
    };
    setDoses([...doses, newDose].sort((a,b) => a.timestamp - b.timestamp));
  };
  
  const handleUpdateDose = (doseId: string, newAmount: number) => {
    setDoses(doses.map(d => d.id === doseId ? {...d, amountMg: newAmount } : d));
  };

  const handleDeleteDrug = (drugId: string) => {
    if (selectedDrugId === drugId) {
      setSelectedDrugId(INITIAL_DRUGS[0].id);
    }
    setDoses(doses.filter(d => d.drugId !== drugId));
    setDrugs(drugs.filter(d => d.id !== drugId));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery || isSearching) return;
    
    setIsSearching(true);
    const result = await searchNewDrug(searchQuery);
    if (result) {
      if (!drugs.some(d => d.name.toLowerCase() === result.name.toLowerCase())) {
         setDrugs(prev => [...prev, result]);
         setSelectedDrugId(result.id);
         setNewlyAddedDrugId(result.id);
      } else {
         setSelectedDrugId(drugs.find(d => d.name.toLowerCase() === result.name.toLowerCase())!.id);
      }
      setSearchQuery("");
    }
    setIsSearching(false);
  };
  
  const getConcentrationColor = (concentration: number, threshold: number) => {
      if (threshold === 0) return 'bg-blue-400';
      const ratio = concentration / threshold;
      if (ratio > 0.8) return 'bg-red-500';
      if (ratio > 0.5) return 'bg-yellow-400';
      return 'bg-blue-400';
  };

  const handleGraphMouseMove = (e: any) => {
    if (e && e.activePayload && e.activePayload.length) {
      const time = e.activePayload[0].payload.time;
      setHoveredTime(time);
    }
  };

  const handleGraphMouseLeave = () => {
    setHoveredTime(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Activity size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">PhysioTrace <span className="text-blue-600">v2</span></h1>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Digital Twin Simulation</p>
          </div>
        </div>
        
        <div className="relative hidden md:block w-96">
            <form onSubmit={handleSearch}>
                <input 
                    type="text" 
                    placeholder={isSearching ? "AI is searching for compounds..." : "Search med or supplement (AI Powered)..."} 
                    className="w-full pl-10 pr-4 py-2 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 disabled:bg-slate-100"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={isSearching}
                />
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                {isSearching && <div className="absolute right-3 top-2.5 animate-spin text-blue-500">⌛</div>}
            </form>
            <p className="text-[10px] text-slate-400 text-center mt-1 px-4">AI can find pharmacokinetic data for most common drugs and supplements.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold">{user.weight}kg • {user.age}yr</p>
            <p className="text-[10px] text-slate-500 uppercase font-bold">Patient Bio-Metrics</p>
          </div>
          <button className="p-2 rounded-full hover:bg-slate-100 transition-colors">
            <User size={20} className="text-slate-600" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row bg-slate-50 overflow-hidden">
        {/* Left Control Panel */}
        <aside className="w-full md:w-80 bg-white border-r p-6 space-y-6 overflow-y-auto">
          <section>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Select Compound</h2>
            <div className="grid grid-cols-1 gap-2">
              {drugs.map(drug => (
                <div key={drug.id} className="relative group">
                    <button
                      onClick={() => setSelectedDrugId(drug.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        selectedDrugId === drug.id 
                          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                          : 'border-slate-100 hover:border-slate-300'
                      } ${newlyAddedDrugId === drug.id ? 'animate-pulse bg-emerald-50 border-emerald-500' : ''}`}
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: drug.color }} />
                      <div className="text-left">
                        <p className="text-sm font-bold text-slate-800">{drug.name}</p>
                        <p className="text-[10px] text-slate-500 capitalize">{drug.metabolism} Pathway</p>
                      </div>
                    </button>
                    {!isInitialDrug(drug.id) && (
                        <button 
                            onClick={() => handleDeleteDrug(drug.id)}
                            className="absolute top-1/2 -translate-y-1/2 right-3 z-10 p-1 rounded-full bg-slate-200 text-slate-500 opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 transition-all"
                        >
                            <X size={12}/>
                        </button>
                    )}
                 </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Protocol Stack</h2>
            <div className="space-y-3">
              {doses.map((dose) => {
                const drugInfo = drugs.find(d => d.id === dose.drugId);
                return (
                  <div key={dose.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                      <p className="text-xs font-bold text-slate-700">{drugInfo?.name || 'Unknown'}</p>
                      <p className="text-[10px] text-slate-500">T+{dose.timestamp.toFixed(1)}h</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number"
                        value={dose.amountMg}
                        onChange={(e) => handleUpdateDose(dose.id, Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-20 text-right font-bold bg-white border border-slate-200 rounded-md p-1 text-xs"
                      />
                      <span className="text-xs text-slate-400">mg</span>
                      <button 
                        onClick={() => setDoses(doses.filter(d => d.id !== dose.id))}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
              <button 
                onClick={handleAddDose}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all font-bold text-xs"
                disabled={!selectedDrug}
              >
                <Plus size={16} /> Add Dose (T+{currentTime.toFixed(1)}h)
              </button>
            </div>
          </section>

          <section className="bg-blue-900 rounded-2xl p-4 text-white shadow-xl">
             <div className="flex items-center gap-2 mb-3">
                <Zap size={18} className="text-yellow-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Metabolic Snapshot</h3>
             </div>
             <div className="space-y-4">
                <div>
                   <div className="flex justify-between text-[10px] mb-1 opacity-70">
                      <span>Plasma Level</span>
                      <span>{currentState.concentration.toFixed(1)} mg/L</span>
                   </div>
                   <div className="h-1.5 w-full bg-blue-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${getConcentrationColor(currentState.concentration, selectedDrug.toxicityThresholdMgL)}`} 
                        style={{ width: `${Math.min((currentState.concentration / (selectedDrug.toxicityThresholdMgL || 1)) * 100, 100)}%` }}
                      />
                   </div>
                </div>
             </div>
          </section>

          <SuggestionPanel 
             suggestion={suggestion} 
             isLoading={isSuggestionLoading} 
             onRefresh={fetchSuggestion} 
           />

        </aside>

        {/* Center Dashboard */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Top Info Bar */}
          <div className="flex justify-between items-start">
            <div className="w-full md:w-auto glass rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
               <div className="text-4xl font-black text-slate-800 tabular-nums">T+{displayTime.toFixed(1)}<span className="text-base font-medium opacity-50 ml-1">hrs</span></div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Elapsed Sim Time</p>
            </div>
            
            <div className="glass rounded-3xl p-6 shadow-sm">
                <div className="flex justify-between text-xs font-bold mb-3">
                    <span className="flex items-center gap-2 text-slate-600"><Clock size={14} /> Time Scrubber</span>
                </div>
                <input 
                    type="range" 
                    min="0" 
                    max="24" 
                    step="0.1" 
                    value={displayTime}
                    onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 glass rounded-3xl p-8 relative shadow-lg flex flex-col">
               <div className="absolute top-6 left-6 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase text-slate-400">Systemic Impact</span>
               </div>
               <SystemicImpactGraph loads={currentState.organLoads} color={selectedDrug.color} />
            </div>

            <div className="lg:col-span-3 flex flex-col gap-6">
               <DrugInfoPanel details={drugDetails} isLoading={isDetailsLoading} />

              <div className="glass rounded-3xl p-6 flex-1 shadow-lg overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-full">
                       <button 
                         onClick={() => setActiveGraphTab('pk')}
                         className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors ${activeGraphTab === 'pk' ? 'bg-white text-blue-600 shadow' : 'text-slate-500 hover:text-slate-800'}`}
                       >
                         Pharmacokinetics
                       </button>
                       <button 
                         onClick={() => setActiveGraphTab('activity')}
                         className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors ${activeGraphTab === 'activity' ? 'bg-white text-blue-600 shadow' : 'text-slate-500 hover:text-slate-800'}`}
                       >
                         Activity Impact
                       </button>
                    </div>
                </div>

                {activeGraphTab === 'pk' ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                       <div>
                          <h3 className="text-lg font-bold text-slate-800">Pharmacokinetic Curve</h3>
                          <p className="text-xs text-slate-500">Plasma concentration over 24-hour cycle</p>
                       </div>
                       <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
                          <span className="flex items-center gap-1 text-red-500"><ShieldAlert size={12} /> Toxic Limit</span>
                       </div>
                    </div>
                    <PKGraph 
                      data={simulationData} 
                      displayTime={displayTime} 
                      toxicityThreshold={selectedDrug.toxicityThresholdMgL}
                      color={selectedDrug.color}
                      onMouseMove={handleGraphMouseMove}
                      onMouseLeave={handleGraphMouseLeave}
                    />
                  </>
                ) : (
                   <>
                    <div className="flex items-center justify-between mb-4">
                       <div>
                          <h3 className="text-lg font-bold text-slate-800">Metabolic Clearance Comparison</h3>
                          <p className="text-xs text-slate-500">How activity level impacts drug processing time.</p>
                       </div>
                    </div>
                    <ClearanceImpactGraph
                      doses={doses}
                      drugs={drugs}
                      user={user}
                      displayTime={displayTime}
                      onMouseMove={handleGraphMouseMove}
                      onMouseLeave={handleGraphMouseLeave}
                    />
                   </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
