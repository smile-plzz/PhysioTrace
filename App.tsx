
import React, { useState, useEffect, useMemo } from 'react';
import { Drug, UserProfile, Dose, OrganTarget, FdaDrugInfo, ClinicalStatus } from './types';
import { DRUG_LIBRARY } from './constants';
import { runFullSimulation } from './lib/simulation';
import { getFdaDetails, analyzeClinicalStatus } from './services/drugService';
import { PKGraph } from './components/PKGraph';
import { SystemicImpactGraph } from './components/SystemicImpactGraph';
import { DrugInfoPanel } from './components/DrugInfoPanel';
import { StatusPanel } from './components/SuggestionPanel'; // Renamed internally
import { ClearanceImpactGraph } from './components/ClearanceImpactGraph';
import { Activity, Clock, Search, User, ShieldAlert, Zap, Plus, Trash2, X, AlertOctagon, Filter } from 'lucide-react';

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
  
  // Start with a default subset or just the first one
  const [activeDrugs, setActiveDrugs] = useState<Drug[]>([DRUG_LIBRARY[0]]);
  const [selectedDrugId, setSelectedDrugId] = useState<string>(DRUG_LIBRARY[0].id);
  const [doses, setDoses] = useState<Dose[]>([{
    id: 'initial',
    drugId: DRUG_LIBRARY[0].id,
    timestamp: 0,
    amountMg: DRUG_LIBRARY[0].defaultDoseMg
  }]);
  
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);
  
  // Search / Library State
  const [librarySearch, setLibrarySearch] = useState("");
  const [drugDetails, setDrugDetails] = useState<FdaDrugInfo | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [activeGraphTab, setActiveGraphTab] = useState<GraphTab>('pk');

  // Derived Data
  const selectedDrug = useMemo(() => 
    activeDrugs.find(d => d.id === selectedDrugId) || activeDrugs[0]
  , [activeDrugs, selectedDrugId]);

  const simulationData = useMemo(() => {
    const timeRange = Array.from({ length: 97 }, (_, i) => i * 0.25); 
    return runFullSimulation(timeRange, doses, activeDrugs, user);
  }, [doses, activeDrugs, user]);

  const displayTime = hoveredTime ?? currentTime;

  const currentState = useMemo(() => {
    const idx = Math.round(displayTime * 4);
    return simulationData[idx] || simulationData[0];
  }, [simulationData, displayTime]);

  // Previous state for slope calculation
  const prevState = useMemo(() => {
    const idx = Math.max(0, Math.round(displayTime * 4) - 1);
    return simulationData[idx] || simulationData[0];
  }, [simulationData, displayTime]);

  const clinicalStatus: ClinicalStatus = useMemo(() => {
    return analyzeClinicalStatus(
        currentState.concentration,
        prevState.concentration,
        selectedDrug.toxicityThresholdMgL,
        displayTime
    );
  }, [currentState, prevState, selectedDrug, displayTime]);

  // Drug Interaction Check
  const metabolicWarning = useMemo(() => {
      const pathways = activeDrugs.map(d => d.metabolism);
      const duplicates = pathways.filter((item, index) => pathways.indexOf(item) !== index);
      if (duplicates.length > 0) {
          return `Metabolic crowding detected: Multiple drugs competing for ${duplicates[0]} clearance pathway.`;
      }
      return null;
  }, [activeDrugs]);

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
  }, [selectedDrugId]);

  // Handlers
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

  const handleAddDrugFromLibrary = (drug: Drug) => {
      if (!activeDrugs.some(d => d.id === drug.id)) {
          setActiveDrugs([...activeDrugs, drug]);
      }
      setSelectedDrugId(drug.id);
      setLibrarySearch(""); // clear search to close or reset view
  };

  const handleRemoveDrug = (drugId: string) => {
    if (activeDrugs.length === 1) return; // Prevent removing last drug
    const newActive = activeDrugs.filter(d => d.id !== drugId);
    setActiveDrugs(newActive);
    setDoses(doses.filter(d => d.drugId !== drugId));
    if (selectedDrugId === drugId) {
        setSelectedDrugId(newActive[0].id);
    }
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
      setHoveredTime(e.activePayload[0].payload.time);
    }
  };

  const filteredLibrary = DRUG_LIBRARY.filter(d => 
    d.name.toLowerCase().includes(librarySearch.toLowerCase()) || 
    d.category.toLowerCase().includes(librarySearch.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm/50 backdrop-blur-md bg-white/90">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2.5 rounded-xl text-white shadow-lg shadow-blue-500/20">
            <Activity size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">PhysioTrace <span className="text-blue-600">Pro</span></h1>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Digital Twin Simulator</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-800">{user.weight}kg • {user.age}yr • {user.gender === 'male' ? 'M' : 'F'}</p>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Subject Parameters</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
             <User size={20} className="text-slate-400" />
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Control Panel */}
        <aside className="w-full md:w-80 bg-white border-r flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
            <div className="p-4 border-b bg-slate-50/50">
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Filter Library..." 
                        className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        value={librarySearch}
                        onChange={(e) => setLibrarySearch(e.target.value)}
                    />
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                 <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Filter size={12} /> Active Protocol
                 </h2>
                 <div className="space-y-2 mb-6">
                    {activeDrugs.map(drug => (
                        <div key={drug.id} className="relative group">
                            <button
                            onClick={() => setSelectedDrugId(drug.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 ${
                                selectedDrugId === drug.id 
                                ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500 shadow-sm' 
                                : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                            >
                            <div className="w-2 h-2 rounded-full ring-2 ring-white shadow-sm" style={{ backgroundColor: drug.color }} />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate">{drug.name}</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{drug.category}</span>
                                    <span className="text-[10px] text-slate-400 capitalize">{drug.metabolism}</span>
                                </div>
                            </div>
                            </button>
                            {activeDrugs.length > 1 && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleRemoveDrug(drug.id); }}
                                    className="absolute top-2 right-2 p-1.5 rounded-md text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <X size={14}/>
                                </button>
                            )}
                        </div>
                    ))}
                 </div>

                 {librarySearch && (
                     <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Library Matches</h2>
                        <div className="space-y-1">
                            {filteredLibrary.map(drug => (
                                <button
                                    key={drug.id}
                                    onClick={() => handleAddDrugFromLibrary(drug)}
                                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-left text-sm group"
                                >
                                    <span className="font-medium text-slate-700">{drug.name}</span>
                                    <span className="text-[10px] text-slate-400 group-hover:text-blue-600 transition-colors">+ Add</span>
                                </button>
                            ))}
                        </div>
                     </div>
                 )}

                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Dose Schedule</h2>
                <div className="space-y-2 mb-6">
                    {doses.map((dose) => {
                        const drugInfo = activeDrugs.find(d => d.id === dose.drugId);
                        if (!drugInfo) return null;
                        return (
                        <div key={dose.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100/80">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: drugInfo.color}}></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-700">{drugInfo.name}</p>
                                    <p className="text-[10px] text-slate-500 font-mono">T+{dose.timestamp.toFixed(1)}h</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                            <input 
                                type="number"
                                value={dose.amountMg}
                                onChange={(e) => handleUpdateDose(dose.id, Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-16 text-right font-bold bg-white border border-slate-200 rounded px-1 py-0.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            />
                            <button 
                                onClick={() => setDoses(doses.filter(d => d.id !== dose.id))}
                                className="text-slate-400 hover:text-red-500 transition-colors p-1"
                            >
                                <Trash2 size={12} />
                            </button>
                            </div>
                        </div>
                        )
                    })}
                    <button 
                        onClick={handleAddDose}
                        className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-slate-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all font-bold text-xs flex items-center justify-center gap-2"
                    >
                        <Plus size={14} /> Add {selectedDrug.name} Dose
                    </button>
                </div>
                
                <StatusPanel status={clinicalStatus} />
                
                {metabolicWarning && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-100 rounded-xl flex gap-2 items-start">
                        <AlertOctagon className="text-yellow-600 shrink-0 mt-0.5" size={16} />
                        <p className="text-xs text-yellow-800 leading-tight">{metabolicWarning}</p>
                    </div>
                )}
            </div>
            
            <div className="p-4 border-t bg-slate-50/50">
                 <div className="bg-slate-900 rounded-xl p-4 text-white shadow-xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                         <Zap size={64} />
                     </div>
                     <div className="relative z-10">
                        <div className="flex justify-between items-end mb-2">
                           <span className="text-[10px] uppercase font-bold text-slate-400">Plasma Level</span>
                           <span className="text-2xl font-black tabular-nums tracking-tight">{currentState.concentration.toFixed(1)} <span className="text-sm font-medium text-slate-500">mg/L</span></span>
                        </div>
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-500 ${getConcentrationColor(currentState.concentration, selectedDrug.toxicityThresholdMgL)}`} 
                                style={{ width: `${Math.min((currentState.concentration / (selectedDrug.toxicityThresholdMgL || 1)) * 100, 100)}%` }}
                            />
                        </div>
                     </div>
                 </div>
            </div>
        </aside>

        {/* Center Dashboard */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-slate-50/80">
          {/* Top Info Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch justify-between">
             <div className="glass rounded-2xl p-4 shadow-sm flex items-center gap-4 min-w-[200px]">
                 <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                     <Clock size={24} />
                 </div>
                 <div>
                     <div className="text-2xl font-black text-slate-800 tabular-nums">T+{displayTime.toFixed(1)}<span className="text-sm font-bold text-slate-400 ml-1">h</span></div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Simulation Time</p>
                 </div>
             </div>

             <div className="flex-1 glass rounded-2xl p-4 shadow-sm flex flex-col justify-center">
                <input 
                    type="range" 
                    min="0" 
                    max="24" 
                    step="0.1" 
                    value={displayTime}
                    onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-500 transition-all"
                />
                <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                    <span>0h</span>
                    <span>12h</span>
                    <span>24h</span>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 glass rounded-3xl p-6 relative shadow-sm hover:shadow-md transition-shadow flex flex-col">
               <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Organ Stress Load</span>
                  </div>
               </div>
               <SystemicImpactGraph loads={currentState.organLoads} color={selectedDrug.color} />
            </div>

            <div className="lg:col-span-3 flex flex-col gap-6">
               <DrugInfoPanel details={drugDetails} isLoading={isDetailsLoading} />

              <div className="glass rounded-3xl p-6 flex-1 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center bg-slate-100/80 p-1 rounded-lg">
                       <button 
                         onClick={() => setActiveGraphTab('pk')}
                         className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeGraphTab === 'pk' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                       >
                         Pharmacokinetics
                       </button>
                       <button 
                         onClick={() => setActiveGraphTab('activity')}
                         className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeGraphTab === 'activity' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                       >
                         Metabolic Impact
                       </button>
                    </div>
                    {activeGraphTab === 'pk' && (
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-rose-500 bg-rose-50 px-2 py-1 rounded-md border border-rose-100">
                           <ShieldAlert size={12} /> Toxicity Threshold
                        </div>
                    )}
                </div>

                {activeGraphTab === 'pk' ? (
                  <PKGraph 
                      data={simulationData} 
                      displayTime={displayTime} 
                      toxicityThreshold={selectedDrug.toxicityThresholdMgL}
                      color={selectedDrug.color}
                      onMouseMove={handleGraphMouseMove}
                      onMouseLeave={() => setHoveredTime(null)}
                    />
                ) : (
                    <ClearanceImpactGraph
                      doses={doses}
                      drugs={activeDrugs}
                      user={user}
                      displayTime={displayTime}
                      onMouseMove={handleGraphMouseMove}
                      onMouseLeave={() => setHoveredTime(null)}
                    />
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
