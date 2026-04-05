import React, { useState, useEffect, useMemo } from 'react';
import { Drug, UserProfile, Dose, FdaDrugInfo, ClinicalStatus } from './types';
import { DRUG_LIBRARY } from './constants';
import { runFullSimulation, computePeakSummary } from './lib/simulation';
import { getFdaDetails, analyzeClinicalStatus } from './services/drugService';
import { PKGraph } from './components/PKGraph';
import { SystemicImpactGraph } from './components/SystemicImpactGraph';
import { DrugInfoPanel } from './components/DrugInfoPanel';
import { StatusPanel } from './components/SuggestionPanel';
import { ClearanceImpactGraph } from './components/ClearanceImpactGraph';
import { DrugSearchPanel } from './components/DrugSearchPanel';
import { PeakSummaryBar } from './components/PeakSummaryBar';
import { OrganImpactCards } from './components/OrganImpactCards';
import { DisclaimerModal } from './components/DisclaimerModal';
import {
  Activity, Clock, User, ShieldAlert, Plus, Trash2, AlertOctagon, Zap, ChevronDown, ChevronUp
} from 'lucide-react';

type GraphTab = 'pk' | 'activity';

const SAVED_PROFILE_KEY = 'physiotrace_user_profile';
const DISCLAIMER_KEY = 'physiotrace_disclaimer_accepted';

const loadProfile = (): UserProfile => {
  try {
    const s = localStorage.getItem(SAVED_PROFILE_KEY);
    if (s) return JSON.parse(s);
  } catch {}
  return { age:30, gender:'male', weight:75, height:180, activityLevel:3 };
};

const App: React.FC = () => {
  const [showDisclaimer, setShowDisclaimer] = useState(() => !localStorage.getItem(DISCLAIMER_KEY));
  const [user, setUser] = useState<UserProfile>(loadProfile);
  const [activeDrugs, setActiveDrugs] = useState<Drug[]>([DRUG_LIBRARY[0]]);
  const [selectedDrugId, setSelectedDrugId] = useState<string>(DRUG_LIBRARY[0].id);
  const [doses, setDoses] = useState<Dose[]>([{ id:'initial', drugId:DRUG_LIBRARY[0].id, timestamp:0, amountMg:DRUG_LIBRARY[0].defaultDoseMg }]);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [hoveredTime, setHoveredTime] = useState<number|null>(null);
  const [drugDetails, setDrugDetails] = useState<FdaDrugInfo|null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [activeGraphTab, setActiveGraphTab] = useState<GraphTab>('pk');
  const [showProfileEdit, setShowProfileEdit] = useState(false);

  const selectedDrug = useMemo(() =>
    activeDrugs.find(d => d.id === selectedDrugId) || activeDrugs[0],
    [activeDrugs, selectedDrugId]
  );

  const simulationData = useMemo(() => {
    const timeRange = Array.from({length:97}, (_,i) => i * 0.25);
    return runFullSimulation(timeRange, doses, activeDrugs, user);
  }, [doses, activeDrugs, user]);

  const displayTime = hoveredTime ?? currentTime;

  const currentState = useMemo(() => {
    const idx = Math.round(displayTime * 4);
    return simulationData[Math.min(idx, simulationData.length-1)] || simulationData[0];
  }, [simulationData, displayTime]);

  const prevState = useMemo(() => {
    const idx = Math.max(0, Math.round(displayTime * 4) - 1);
    return simulationData[idx] || simulationData[0];
  }, [simulationData, displayTime]);

  const clinicalStatus: ClinicalStatus = useMemo(() =>
    analyzeClinicalStatus(currentState.concentration, prevState.concentration, selectedDrug.toxicityThresholdMgL, displayTime),
    [currentState, prevState, selectedDrug, displayTime]
  );

  const peakSummary = useMemo(() => computePeakSummary(simulationData, selectedDrug), [simulationData, selectedDrug]);

  const metabolicWarning = useMemo(() => {
    const pathways = activeDrugs.map(d => d.metabolism);
    const dupes = pathways.filter((p,i) => pathways.indexOf(p) !== i);
    return dupes.length > 0
      ? `Metabolic crowding: multiple drugs competing for the ${dupes[0]} clearance pathway. Expect altered concentrations.`
      : null;
  }, [activeDrugs]);

  useEffect(() => {
    localStorage.setItem(SAVED_PROFILE_KEY, JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    setIsDetailsLoading(true);
    getFdaDetails(selectedDrug.name).then(d => {
      setDrugDetails(d);
      setIsDetailsLoading(false);
    });
  }, [selectedDrugId]);

  const handleAddDose = () => {
    const d: Dose = {
      id: Math.random().toString(36).substr(2,9),
      drugId: selectedDrugId,
      timestamp: currentTime,
      amountMg: selectedDrug.defaultDoseMg,
    };
    setDoses(prev => [...prev, d].sort((a,b) => a.timestamp - b.timestamp));
  };

  const handleAddDrugFromLibrary = (drug: Drug) => {
    if (!activeDrugs.some(d => d.id === drug.id)) setActiveDrugs(prev => [...prev, drug]);
    setSelectedDrugId(drug.id);
  };

  const handleRemoveDrug = (drugId: string) => {
    if (activeDrugs.length === 1) return;
    const next = activeDrugs.filter(d => d.id !== drugId);
    setActiveDrugs(next);
    setDoses(prev => prev.filter(d => d.drugId !== drugId));
    if (selectedDrugId === drugId) setSelectedDrugId(next[0].id);
  };

  const concPct = selectedDrug.toxicityThresholdMgL > 0
    ? Math.min((currentState.concentration / selectedDrug.toxicityThresholdMgL) * 100, 100)
    : 0;
  const concColor = concPct > 80 ? '#ef4444' : concPct > 50 ? '#f97316' : '#3b82f6';

  const acceptDisclaimer = () => {
    localStorage.setItem(DISCLAIMER_KEY, '1');
    setShowDisclaimer(false);
  };

  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',background:'#f8fafc',fontFamily:"'Inter',system-ui,sans-serif"}}>
      {showDisclaimer && <DisclaimerModal onAccept={acceptDisclaimer} />}

      {/* Header */}
      <header style={{background:'white',borderBottom:'1px solid #e2e8f0',padding:'0 24px',display:'flex',alignItems:'center',justifyContent:'space-between',height:'56px',position:'sticky',top:0,zIndex:50,boxShadow:'0 1px 3px rgba(0,0,0,0.04)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{background:'linear-gradient(135deg,#2563eb,#4f46e5)',padding:'8px',borderRadius:'10px',display:'flex',boxShadow:'0 4px 12px rgba(37,99,235,0.3)'}}>
            <Activity size={18} color="white" />
          </div>
          <div>
            <h1 style={{fontSize:'17px',fontWeight:800,color:'#0f172a',margin:0,letterSpacing:'-0.01em'}}>
              PhysioTrace <span style={{color:'#2563eb'}}>Pro</span>
            </h1>
            <p style={{fontSize:'9px',color:'#94a3b8',margin:0,fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase'}}>Digital Twin Simulator</p>
          </div>
        </div>
        <button
          onClick={() => setShowProfileEdit(v => !v)}
          style={{display:'flex',alignItems:'center',gap:'8px',background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'10px',padding:'6px 12px',cursor:'pointer'}}
        >
          <User size={14} color="#64748b" />
          <span style={{fontSize:'12px',fontWeight:600,color:'#334155'}}>{user.weight}kg · {user.age}yr · {user.gender==='male'?'M':'F'} · Activity {user.activityLevel}/5</span>
          {showProfileEdit ? <ChevronUp size={12} color="#94a3b8"/> : <ChevronDown size={12} color="#94a3b8"/>}
        </button>
      </header>

      {/* Profile editor */}
      {showProfileEdit && (
        <div style={{background:'white',borderBottom:'1px solid #e2e8f0',padding:'16px 24px',display:'flex',gap:'20px',flexWrap:'wrap',alignItems:'flex-end'}}>
          {[
            {label:'Age (yrs)', key:'age', min:12, max:100, step:1},
            {label:'Weight (kg)', key:'weight', min:30, max:200, step:1},
            {label:'Height (cm)', key:'height', min:130, max:220, step:1},
          ].map(({label,key,min,max,step}) => (
            <div key={key}>
              <p style={{fontSize:'10px',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.06em',margin:'0 0 4px'}}>{label}</p>
              <input type="number" min={min} max={max} step={step}
                value={(user as any)[key]}
                onChange={e => setUser(u => ({...u,[key]:+e.target.value}))}
                style={{width:'80px',padding:'6px 8px',border:'1px solid #e2e8f0',borderRadius:'8px',fontSize:'13px',fontWeight:600,color:'#0f172a',outline:'none'}} />
            </div>
          ))}
          <div>
            <p style={{fontSize:'10px',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.06em',margin:'0 0 4px'}}>Gender</p>
            <div style={{display:'flex',gap:'4px'}}>
              {(['male','female'] as const).map(g => (
                <button key={g} onClick={() => setUser(u => ({...u,gender:g}))}
                  style={{padding:'6px 12px',borderRadius:'8px',border:'1px solid',fontSize:'12px',fontWeight:600,cursor:'pointer',
                    borderColor:user.gender===g?'#2563eb':'#e2e8f0',
                    background:user.gender===g?'#eff6ff':'white',
                    color:user.gender===g?'#2563eb':'#64748b'}}>
                  {g.charAt(0).toUpperCase()+g.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p style={{fontSize:'10px',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.06em',margin:'0 0 4px'}}>Activity Level</p>
            <div style={{display:'flex',gap:'4px'}}>
              {([1,2,3,4,5] as const).map(l => (
                <button key={l} onClick={() => setUser(u => ({...u,activityLevel:l}))}
                  style={{width:'32px',height:'32px',borderRadius:'8px',border:'1px solid',fontSize:'12px',fontWeight:700,cursor:'pointer',
                    borderColor:user.activityLevel===l?'#2563eb':'#e2e8f0',
                    background:user.activityLevel===l?'#2563eb':'white',
                    color:user.activityLevel===l?'white':'#64748b'}}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <main style={{flex:1,display:'flex',flexDirection:'row',overflow:'hidden'}}>

        {/* Left: Drug browser */}
        <aside style={{width:'260px',background:'white',borderRight:'1px solid #e2e8f0',display:'flex',flexDirection:'column',flexShrink:0,overflow:'hidden'}}>
          <DrugSearchPanel
            activeDrugs={activeDrugs}
            selectedDrugId={selectedDrugId}
            onSelect={d => setSelectedDrugId(d.id)}
            onAdd={handleAddDrugFromLibrary}
            onRemove={handleRemoveDrug}
          />
        </aside>

        {/* Center: Simulation controls + charts */}
        <div style={{flex:1,overflowY:'auto',padding:'20px',display:'flex',flexDirection:'column',gap:'16px',minWidth:0}}>

          {/* Time slider */}
          <div style={{background:'white',border:'1px solid #e2e8f0',borderRadius:'14px',padding:'14px 20px',display:'flex',alignItems:'center',gap:'16px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'8px',flexShrink:0}}>
              <Clock size={16} color="#64748b" />
              <span style={{fontSize:'20px',fontWeight:800,color:'#0f172a',fontVariantNumeric:'tabular-nums'}}>T+{displayTime.toFixed(1)}<span style={{fontSize:'12px',fontWeight:500,color:'#94a3b8',marginLeft:'2px'}}>h</span></span>
            </div>
            <input type="range" min={0} max={24} step={0.1} value={displayTime}
              onChange={e => setCurrentTime(+e.target.value)}
              style={{flex:1,accentColor:'#2563eb',height:'4px'}} />
            <div style={{display:'flex',gap:'12px',fontSize:'10px',color:'#94a3b8',fontWeight:600,flexShrink:0}}>
              <span>0h</span><span>12h</span><span>24h</span>
            </div>
          </div>

          {/* Peak summary */}
          <PeakSummaryBar summary={peakSummary} drug={selectedDrug} />

          {/* Dose schedule */}
          <div style={{background:'white',border:'1px solid #e2e8f0',borderRadius:'14px',padding:'16px 20px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
              <h3 style={{fontSize:'12px',fontWeight:700,color:'#334155',textTransform:'uppercase',letterSpacing:'0.07em',margin:0}}>Dose Schedule</h3>
              <button onClick={handleAddDose}
                style={{display:'flex',alignItems:'center',gap:'5px',padding:'5px 10px',background:'#eff6ff',color:'#2563eb',border:'1px solid #bfdbfe',borderRadius:'7px',fontSize:'11px',fontWeight:700,cursor:'pointer'}}>
                <Plus size={12}/> Add {selectedDrug.name} at T+{currentTime.toFixed(1)}h
              </button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              {doses.map(dose => {
                const drug = activeDrugs.find(d => d.id === dose.drugId);
                if (!drug) return null;
                return (
                  <div key={dose.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 12px',background:'#f8fafc',borderRadius:'8px',border:'1px solid #e2e8f0'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <div style={{width:'6px',height:'6px',borderRadius:'50%',background:drug.color}}/>
                      <div>
                        <p style={{fontSize:'12px',fontWeight:700,color:'#0f172a',margin:0}}>{drug.name}</p>
                        <p style={{fontSize:'10px',color:'#94a3b8',margin:0,fontFamily:'monospace'}}>T+{dose.timestamp.toFixed(1)}h</p>
                      </div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <input type="number" value={dose.amountMg}
                        onChange={e => setDoses(prev => prev.map(d => d.id===dose.id ? {...d,amountMg:Math.max(0,+e.target.value)} : d))}
                        style={{width:'64px',textAlign:'right',fontWeight:700,fontSize:'12px',border:'1px solid #e2e8f0',borderRadius:'6px',padding:'3px 6px',background:'white',color:'#0f172a'}} />
                      <span style={{fontSize:'10px',color:'#94a3b8'}}>mg</span>
                      <button onClick={() => setDoses(prev => prev.filter(d => d.id!==dose.id))}
                        style={{background:'none',border:'none',cursor:'pointer',color:'#cbd5e1',padding:'4px',display:'flex',borderRadius:'4px'}}>
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status + warnings */}
          <StatusPanel status={clinicalStatus} />
          {selectedDrug.warnings && selectedDrug.warnings.length > 0 && (
            <div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:'12px',padding:'12px 14px'}}>
              <p style={{fontSize:'10px',fontWeight:700,color:'#92400e',textTransform:'uppercase',letterSpacing:'0.06em',margin:'0 0 6px',display:'flex',alignItems:'center',gap:'5px'}}>
                <AlertOctagon size={12}/> Drug-Specific Warnings
              </p>
              <ul style={{margin:0,paddingLeft:'16px'}}>
                {selectedDrug.warnings.map((w,i) => (
                  <li key={i} style={{fontSize:'11px',color:'#78350f',lineHeight:1.5,marginBottom:'2px'}}>{w}</li>
                ))}
              </ul>
            </div>
          )}
          {metabolicWarning && (
            <div style={{background:'#fff7ed',border:'1px solid #fed7aa',borderRadius:'12px',padding:'12px 14px',display:'flex',gap:'8px',alignItems:'flex-start'}}>
              <AlertOctagon size={14} color="#ea580c" style={{flexShrink:0,marginTop:'1px'}}/>
              <p style={{fontSize:'12px',color:'#7c2d12',margin:0,lineHeight:1.5}}>{metabolicWarning}</p>
            </div>
          )}

          {/* Plasma level bar */}
          <div style={{background:'#0f172a',borderRadius:'14px',padding:'16px 20px',color:'white',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,right:0,padding:'16px',opacity:0.08}}>
              <Zap size={64}/>
            </div>
            <div style={{position:'relative'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:'8px'}}>
                <span style={{fontSize:'10px',fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'0.07em'}}>Plasma Concentration Now</span>
                <span style={{fontSize:'26px',fontWeight:900,letterSpacing:'-0.02em',fontVariantNumeric:'tabular-nums'}}>
                  {currentState.concentration.toFixed(2)} <span style={{fontSize:'13px',fontWeight:400,color:'#64748b'}}>mg/L</span>
                </span>
              </div>
              <div style={{height:'6px',background:'#1e293b',borderRadius:'99px',overflow:'hidden'}}>
                <div style={{height:'100%',width:`${concPct}%`,background:concColor,borderRadius:'99px',transition:'width 0.5s ease,background 0.3s'}}/>
              </div>
              <p style={{fontSize:'10px',color:'#475569',margin:'5px 0 0'}}>{Math.round(concPct)}% of toxicity threshold · {selectedDrug.name}</p>
            </div>
          </div>

          {/* Graphs */}
          <div style={{background:'white',border:'1px solid #e2e8f0',borderRadius:'14px',padding:'16px 20px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px'}}>
              <div style={{display:'flex',background:'#f1f5f9',borderRadius:'8px',padding:'3px',gap:'2px'}}>
                {(['pk','activity'] as GraphTab[]).map(tab => (
                  <button key={tab} onClick={() => setActiveGraphTab(tab)}
                    style={{padding:'5px 12px',fontSize:'11px',fontWeight:700,borderRadius:'6px',border:'none',cursor:'pointer',
                      background:activeGraphTab===tab?'white':'transparent',
                      color:activeGraphTab===tab?'#2563eb':'#64748b',
                      boxShadow:activeGraphTab===tab?'0 1px 4px rgba(0,0,0,0.08)':'none'}}>
                    {tab==='pk'?'Pharmacokinetics':'Activity Impact'}
                  </button>
                ))}
              </div>
              {activeGraphTab==='pk' && (
                <span style={{fontSize:'10px',fontWeight:700,color:'#ef4444',background:'#fef2f2',padding:'3px 8px',borderRadius:'6px',display:'flex',alignItems:'center',gap:'4px',border:'1px solid #fecaca'}}>
                  <ShieldAlert size={11}/> Toxicity Threshold
                </span>
              )}
            </div>
            {activeGraphTab==='pk'
              ? <PKGraph data={simulationData} displayTime={displayTime} toxicityThreshold={selectedDrug.toxicityThresholdMgL} color={selectedDrug.color} onMouseMove={e => { if(e?.activePayload?.[0]) setHoveredTime(e.activePayload[0].payload.time); }} onMouseLeave={() => setHoveredTime(null)} />
              : <ClearanceImpactGraph doses={doses} drugs={activeDrugs} user={user} displayTime={displayTime} onMouseMove={e => { if(e?.activePayload?.[0]) setHoveredTime(e.activePayload[0].payload.time); }} onMouseLeave={() => setHoveredTime(null)} />
            }
          </div>

          {/* FDA Info */}
          <DrugInfoPanel details={drugDetails} isLoading={isDetailsLoading} />
        </div>

        {/* Right: Organ impact */}
        <aside style={{width:'260px',background:'white',borderLeft:'1px solid #e2e8f0',padding:'16px',overflowY:'auto',flexShrink:0,display:'flex',flexDirection:'column',gap:'16px'}}>
          <div>
            <p style={{fontSize:'10px',fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 10px',display:'flex',alignItems:'center',gap:'5px'}}>
              <span style={{width:'6px',height:'6px',borderRadius:'50%',background:'#ef4444',display:'inline-block',animation:'pulse 2s infinite'}}/>
              Organ Stress Load
            </p>
            <SystemicImpactGraph loads={currentState.organLoads} color={selectedDrug.color} />
          </div>
          <div>
            <p style={{fontSize:'10px',fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 10px'}}>Body Impact Analysis</p>
            <OrganImpactCards loads={currentState.organLoads} primaryOrgan={selectedDrug.metabolism} />
          </div>
          <div style={{background:'#f8fafc',borderRadius:'10px',padding:'12px',border:'1px solid #e2e8f0',marginTop:'auto'}}>
            <p style={{fontSize:'10px',fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.06em',margin:'0 0 4px'}}>Selected Drug</p>
            <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
              <div style={{width:'8px',height:'8px',borderRadius:'50%',background:selectedDrug.color}}/>
              <span style={{fontSize:'13px',fontWeight:700,color:'#0f172a'}}>{selectedDrug.name}</span>
            </div>
            <p style={{fontSize:'11px',color:'#64748b',margin:'4px 0 0',lineHeight:1.5}}>{selectedDrug.description}</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px',marginTop:'10px'}}>
              {[
                {label:'Half-Life', value:`${selectedDrug.halfLifeHours}h`},
                {label:'Peak Time', value:`${selectedDrug.timeToPeakHours}h`},
                {label:'Bioavailability', value:`${Math.round(selectedDrug.bioavailability*100)}%`},
                {label:'Default Dose', value:`${selectedDrug.defaultDoseMg}mg`},
              ].map(({label,value}) => (
                <div key={label} style={{background:'white',borderRadius:'6px',padding:'6px 8px',border:'1px solid #e2e8f0'}}>
                  <p style={{fontSize:'9px',color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',margin:0}}>{label}</p>
                  <p style={{fontSize:'13px',fontWeight:700,color:'#0f172a',margin:0}}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
};

export default App;
