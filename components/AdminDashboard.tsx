import React, { useState, useEffect, useMemo } from 'react';
import { X, RotateCcw, HelpCircle, FileText, Box, PenTool, BrainCircuit, Palette } from 'lucide-react';
import { GeoConfig, GEO_META, GeoKey } from '../services/geometryConfig';
import { AppConfigService, BROCK_SPECS } from '../constants';
import { BrockType } from '../types';

interface AdminDashboardProps {
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'GEO' | 'APP' | 'DIAGRAM' | 'AI' | 'STYLE'>('STYLE');
  const [geoConfig, setGeoConfig] = useState(GeoConfig.getAll() || {});
  const [appConfig, setAppConfig] = useState(AppConfigService.get() || {});
  const [currentSpecs, setCurrentSpecs] = useState({ ...BROCK_SPECS });
  const [selectedDiagram, setSelectedDiagram] = useState<BrockType>(BrockType.CONN_1D);

  useEffect(() => {
    const unsubGeo = GeoConfig.subscribe(() => setGeoConfig(GeoConfig.getAll() || {}));
    const unsubApp = AppConfigService.subscribe(() => {
        setAppConfig({ ...AppConfigService.get() });
        setCurrentSpecs({ ...BROCK_SPECS }); 
    });
    return () => { unsubGeo(); unsubApp(); };
  }, []);

  const handleGeoChange = (key: GeoKey, val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num)) GeoConfig.set(key, num);
  };

  const geoCategories = useMemo(() => {
      const groups: Record<string, GeoKey[]> = {};
      const metaObj = GEO_META || {};
      const keys = (Object.keys(metaObj) as GeoKey[]) || [];
      keys.forEach(key => {
          const meta = metaObj[key];
          if (!meta) return;
          const cat = meta.category || 'General';
          if (!groups[cat]) groups[cat] = [];
          groups[cat].push(key);
      });
      return groups;
  }, []);

  // --- DIAGRAM RENDERERS ---
  const renderDiagram = (type: BrockType) => {
      const strokeCol = "#d2b48c"; 
      const fillCol = "#fdf6e3";   
      const dimCol = "#2563eb";    
      const tipCol = "#ea580c";    

      const defs = (
        <defs>
            <marker id="arrow" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
                <path d="M0,0 L4,2 L0,4" fill={dimCol} />
            </marker>
             <marker id="arrow-red" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
                <path d="M0,0 L4,2 L0,4" fill="#dc2626" />
            </marker>
        </defs>
      );

      const Grid = () => (
          <>
            <line x1="50" y1="0" x2="50" y2="100" stroke="#eee" strokeWidth="0.5" strokeDasharray="2" />
            <line x1="0" y1="50" x2="100" y2="50" stroke="#eee" strokeWidth="0.5" strokeDasharray="2" />
          </>
      );

      switch(type) {
        case BrockType.BASE:
            return (
                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                    {defs} <Grid />
                    <rect x="25" y="25" width="50" height="50" fill={fillCol} stroke={strokeCol} strokeWidth="1" />
                    <text x="50" y="55" textAnchor="middle" fontSize="5" fill="#aaa">Top View</text>
                    {[ [20,20], [80,20], [20,80], [80,80] ].map(([x,y],i) => (
                        <rect key={i} x={x-5} y={y-5} width="10" height="10" fill="#e3cca8" stroke={strokeCol} />
                    ))}
                    <line x1="50" y1="50" x2="75" y2="25" stroke={dimCol} strokeWidth="0.5" strokeDasharray="2" />
                    <line x1="50" y1="50" x2="20" y2="20" stroke={dimCol} strokeWidth="0.5" markerEnd="url(#arrow)" />
                    <text x="35" y="40" textAnchor="middle" fontSize="4" fill={dimCol}>pillar_offset</text>
                    <line x1="80" y1="12" x2="90" y2="12" stroke="#dc2626" strokeWidth="0.5" />
                    <text x="85" y="10" textAnchor="middle" fontSize="4" fill="#dc2626">pillar_size</text>
                    <line x1="75" y1="15" x2="75" y2="20" stroke="#dc2626" strokeWidth="0.2" />
                    <line x1="85" y1="15" x2="85" y2="20" stroke="#dc2626" strokeWidth="0.2" />
                    <g transform="translate(70, 70)">
                        <rect x="0" y="0" width="20" height="20" fill={fillCol} stroke={strokeCol} />
                        <rect x="0" y="10" width="20" height="10" fill="#d4d4d8" opacity="0.5" />
                        <line x1="22" y1="10" x2="22" y2="20" stroke="#059669" strokeWidth="0.5" />
                        <text x="25" y="15" fontSize="3" fill="#059669" style={{writingMode: 'vertical-rl'}}>slab_height</text>
                        <text x="10" y="-2" fontSize="3" textAnchor="middle" fill="#aaa">Side</text>
                    </g>
                </svg>
            );

        case BrockType.DOUBLE:
             return (
                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                    {defs} <Grid />
                    <rect x="35" y="20" width="30" height="60" fill={fillCol} stroke={strokeCol} />
                    <text x="50" y="55" textAnchor="middle" fontSize="5" fill="#aaa">Side View</text>
                    <rect x="38" y="15" width="8" height="5" fill="#e3cca8" stroke={strokeCol} />
                    <rect x="54" y="15" width="8" height="5" fill="#e3cca8" stroke={strokeCol} />
                    <rect x="38" y="80" width="8" height="5" fill="#e3cca8" stroke={strokeCol} />
                    <rect x="54" y="80" width="8" height="5" fill="#e3cca8" stroke={strokeCol} />
                    <line x1="50" y1="50" x2="58" y2="17" stroke={dimCol} strokeWidth="0.5" strokeDasharray="2" />
                    <text x="70" y="40" textAnchor="middle" fontSize="4" fill={dimCol}>pillar_offset</text>
                    <line x1="25" y1="20" x2="25" y2="80" stroke="#059669" strokeWidth="0.5" />
                    <text x="20" y="50" textAnchor="middle" fontSize="4" fill="#059669" style={{writingMode: 'vertical-rl'}}>Height (1.0)</text>
                    <text x="40" y="18" fontSize="3" fill="#dc2626">col_h_shrink (gap)</text>
                </svg>
            );

        case BrockType.CONN_1D:
             return (
                 <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                    {defs} <Grid />
                    <rect x="25" y="40" width="50" height="20" fill={fillCol} stroke={strokeCol} strokeWidth="1" />
                    <text x="50" y="53" textAnchor="middle" fontSize="5" fill="#555">col_1d_thick</text>
                    <rect x="15" y="20" width="10" height="60" fill={fillCol} stroke={tipCol} strokeWidth="1" />
                    <rect x="75" y="20" width="10" height="60" fill={fillCol} stroke={tipCol} strokeWidth="1" />
                    <line x1="50" y1="15" x2="80" y2="15" stroke={dimCol} strokeWidth="0.5" markerEnd="url(#arrow)" />
                    <text x="65" y="12" textAnchor="middle" fontSize="4" fill={dimCol}>col_1d_tip_center</text>
                    <line x1="75" y1="85" x2="85" y2="85" stroke="#dc2626" strokeWidth="0.5" />
                    <text x="80" y="90" textAnchor="middle" fontSize="4" fill="#dc2626">tip_width</text>
                    <line x1="90" y1="20" x2="90" y2="80" stroke="#059669" strokeWidth="0.5" />
                    <text x="95" y="50" textAnchor="middle" fontSize="4" fill="#059669" style={{writingMode: "vertical-rl"}}>tip_len</text>
                </svg>
             );
        
        case BrockType.CONN_2D:
        case BrockType.CONN_3D:
        case BrockType.CONN_4D:
            return (
                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                    {defs} <Grid />
                    <text x="50" y="60" textAnchor="middle" fontSize="10" fill="#eee" fontWeight="bold">TOP VIEW</text>
                    <rect x="35" y="35" width="30" height="30" fill="#e5e5e5" />
                    <rect x="50" y="40" width="40" height="20" fill={fillCol} stroke={strokeCol} />
                    <rect x="85" y="38" width="8" height="24" fill={tipCol} opacity="0.5" />
                    <text x="70" y="53" fontSize="4" fill="#555">Arm</text>
                    <rect x="40" y="50" width="20" height="40" fill={fillCol} stroke={strokeCol} />
                    <rect x="38" y="85" width="24" height="8" fill={tipCol} opacity="0.5" />
                    {(type !== BrockType.CONN_2D) && (
                         <rect x="10" y="40" width="40" height="20" fill={fillCol} stroke={strokeCol} />
                    )}
                    {(type === BrockType.CONN_4D) && (
                         <rect x="40" y="10" width="20" height="40" fill={fillCol} stroke={strokeCol} />
                    )}
                    <line x1="50" y1="50" x2="90" y2="50" stroke={dimCol} strokeWidth="0.5" markerEnd="url(#arrow)" />
                    <text x="70" y="35" textAnchor="middle" fontSize="4" fill={dimCol}>vis_arm_long</text>
                    <line x1="50" y1="50" x2="65" y2="65" stroke="#aaa" strokeWidth="0.5" strokeDasharray="2" />
                    <text x="45" y="45" fontSize="4" fill="#555">Hub</text>
                    <line x1="94" y1="38" x2="94" y2="62" stroke="#dc2626" strokeWidth="0.5" />
                    <text x="96" y="50" fontSize="3" fill="#dc2626" style={{writingMode:'vertical-rl'}}>tip_len</text>
                </svg>
            );

        case BrockType.TERMINAL:
             return (
                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                    {defs} <Grid />
                    <rect x="40" y="20" width="20" height="60" fill={fillCol} stroke={strokeCol} />
                    <rect x="35" y="40" width="30" height="40" fill="#8B4513" opacity="0.3" stroke="#8B4513" />
                    <line x1="20" y1="50" x2="40" y2="50" stroke={dimCol} strokeWidth="0.5" markerEnd="url(#arrow)" />
                    <text x="30" y="45" textAnchor="middle" fontSize="4" fill={dimCol}>plate_z</text>
                    <line x1="70" y1="40" x2="70" y2="80" stroke="#059669" strokeWidth="0.5" />
                    <text x="75" y="60" fontSize="4" fill="#059669" style={{writingMode: 'vertical-rl'}}>plate_depth</text>
                </svg>
             );
      }
      return null;
  };

  return (
    <div className="fixed top-20 right-4 w-96 bg-white/95 backdrop-blur-md shadow-2xl rounded-xl border border-gray-200 z-50 flex flex-col max-h-[85vh] overflow-hidden animate-in slide-in-from-right">
      <div className="p-4 border-b bg-gray-50 shrink-0">
         <div className="flex justify-between items-start mb-4">
            <div>
                <h2 className="font-bold text-gray-800 flex items-center gap-2">System Config</h2>
                <p className="text-[10px] text-gray-500">Global application settings</p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded text-gray-500"><X size={18}/></button>
         </div>
         <div className="flex bg-gray-200 rounded-lg p-1 gap-1">
             <button onClick={() => setActiveTab('AI')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'AI' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><BrainCircuit size={14}/>AI</button>
             <button onClick={() => setActiveTab('APP')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'APP' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><FileText size={14}/>App</button>
             <button onClick={() => setActiveTab('GEO')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'GEO' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Box size={14}/>Phys</button>
             <button onClick={() => setActiveTab('STYLE')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'STYLE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Palette size={14}/>Style</button>
             <button onClick={() => setActiveTab('DIAGRAM')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'DIAGRAM' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><PenTool size={14}/>Info</button>
         </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">

        {activeTab === 'AI' && (
            <div className="space-y-6">
                <div>
                    <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider border-b pb-1 mb-3">Master Architect</h3>
                    <div className="space-y-3">
                         <div className="grid grid-cols-2 gap-2">
                             <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-700 block">Model</label>
                                <input 
                                    type="text" 
                                    value={appConfig?.aiArchitect?.model || ''} 
                                    onChange={(e) => AppConfigService.setAiArchitect('model', e.target.value)}
                                    className="w-full p-1.5 text-xs border rounded bg-gray-50 focus:bg-white focus:ring-1 focus:ring-indigo-500"
                                />
                             </div>
                             <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-700 block">Temp ({appConfig?.aiArchitect?.temperature || 0})</label>
                                <input 
                                    type="range" min="0" max="1" step="0.1"
                                    value={appConfig?.aiArchitect?.temperature || 0} 
                                    onChange={(e) => AppConfigService.setAiArchitect('temperature', parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                             </div>
                         </div>
                         <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-700 block">System Instruction (The "Brain")</label>
                            <textarea 
                                value={appConfig?.aiArchitect?.systemInstruction || ''} 
                                onChange={(e) => AppConfigService.setAiArchitect('systemInstruction', e.target.value)}
                                className="w-full p-2 text-xs border rounded-md text-gray-600 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none resize-y min-h-[150px] font-mono leading-tight"
                            />
                        </div>
                    </div>
                </div>
                <div>
                    <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider border-b pb-1 mb-3">Generative Agents</h3>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-700 block">Instruction Generation Prompt</label>
                            <textarea 
                                value={appConfig?.prompts?.instructionGeneration || ''} 
                                onChange={(e) => AppConfigService.setPrompt('instructionGeneration', e.target.value)}
                                className="w-full p-2 text-xs border rounded-md text-gray-600 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none resize-y min-h-[80px]"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-700 block">Design Validation Prompt</label>
                            <textarea 
                                value={appConfig?.prompts?.designValidation || ''} 
                                onChange={(e) => AppConfigService.setPrompt('designValidation', e.target.value)}
                                className="w-full p-2 text-xs border rounded-md text-gray-600 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none resize-y min-h-[80px]"
                            />
                        </div>
                    </div>
                 </div>
            </div>
        )}

        {activeTab === 'STYLE' && (
             <div className="space-y-6">
                <div>
                     <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider border-b pb-1 mb-3">Unified Theme</h3>
                     <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                         <div className="text-sm font-medium text-gray-700">Master Color</div>
                         <div className="flex items-center gap-2">
                             <input 
                                type="color" 
                                onChange={(e) => AppConfigService.setGlobalColor(e.target.value)}
                                className="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
                                title="Change all block colors"
                             />
                             <button onClick={() => AppConfigService.setGlobalColor('#C49A6C')} className="text-xs text-indigo-600 hover:underline">Reset to Cork</button>
                         </div>
                     </div>
                </div>
                <div>
                    <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider border-b pb-1 mb-3">Individual Block Styles</h3>
                    <div className="space-y-2">
                        {(Object.values(BrockType) as BrockType[] || []).map(type => (
                            <div key={type} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded border border-transparent hover:border-gray-200 transition">
                                <span className="text-xs font-medium text-gray-700 truncate">{type.replace('CONN_', '').replace('TERMINAL', 'T')}</span>
                                <div className="flex items-center gap-2">
                                     <span className="text-[10px] text-gray-400 font-mono uppercase">{currentSpecs[type]?.color || '#000'}</span>
                                     <input 
                                        type="color" 
                                        value={currentSpecs[type]?.color || '#000000'}
                                        onChange={(e) => AppConfigService.setColor(type, e.target.value)}
                                        className="w-6 h-6 rounded border-none cursor-pointer bg-transparent"
                                     />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
             </div>
        )}
        
        {activeTab === 'DIAGRAM' && (
            <div className="space-y-4">
                <div className="flex flex-wrap gap-1">
                    {(Object.values(BrockType) || []).map(t => (
                        <button 
                            key={t}
                            onClick={() => setSelectedDiagram(t)}
                            className={`px-2 py-1 text-[10px] rounded border transition-colors ${selectedDiagram === t ? 'bg-orange-100 border-orange-300 text-orange-800 font-bold' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                            {t.replace('CONN_', '').replace('TERMINAL', 'T')}
                        </button>
                    ))}
                </div>
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                    <h3 className="text-xs font-bold text-orange-800 mb-1">{selectedDiagram} Schematic</h3>
                    <div className="relative w-full aspect-square bg-white border rounded p-4 flex items-center justify-center">
                        {renderDiagram(selectedDiagram)}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'GEO' && (
             <>
                <div className="flex justify-end mb-2">
                    <button onClick={() => GeoConfig.reset()} className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-indigo-600 px-2 py-1 rounded border bg-white"><RotateCcw size={10}/> Reset Physics</button>
                </div>
                {(Object.entries(geoCategories || {})).map(([catName, keys]) => (
                    <div key={catName} className="space-y-3">
                        <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider border-b pb-1 mb-2 sticky top-0 bg-white/95 backdrop-blur z-10 py-1">{catName}</h3>
                        {(keys as GeoKey[] || []).map(key => {
                            const meta = GEO_META[key];
                            const val = geoConfig[key];
                            if (!meta || typeof val === 'undefined') return null;
                            return (
                                <div key={key} className="space-y-1.5 group">
                                <div className="flex justify-between items-center text-xs">
                                    <div className="flex items-center gap-1.5 text-gray-700 font-medium relative">
                                        {meta.label}
                                        <div className="relative group/tooltip">
                                            <HelpCircle size={12} className="text-gray-400 cursor-help" />
                                            <div className="absolute left-0 top-full mt-1 w-48 p-2 bg-gray-800 text-white text-[10px] rounded shadow-lg opacity-0 group-hover/tooltip:opacity-100 pointer-events-none z-50 transition-opacity whitespace-normal break-words border border-gray-600">
                                                {meta.desc}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="font-mono text-gray-500">{(val || 0).toFixed(3)}</span>
                                </div>
                                <input type="range" min={meta.min} max={meta.max} step={meta.step} value={val} onChange={(e) => handleGeoChange(key, e.target.value)} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-500 transition-colors"/>
                                </div>
                            );
                        })}
                    </div>
                ))}
             </>
        )}

        {activeTab === 'APP' && (
            <div className="space-y-6">
                 <div>
                    <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider border-b pb-1 mb-3">Economics & Physics</h3>
                    <div className="grid grid-cols-[1fr_60px_60px_60px] gap-2 items-end mb-2">
                         <span className="text-[10px] font-bold text-gray-400">BLOCK</span>
                         <span className="text-[10px] font-bold text-gray-400 text-center">PRICE</span>
                         <span className="text-[10px] font-bold text-gray-400 text-center">W(kg)</span>
                         <span className="text-[10px] font-bold text-gray-400 text-center">SDG(€)</span>
                    </div>
                    <div className="space-y-2">
                        {(Object.values(BrockType) as BrockType[] || []).map(type => (
                            <div key={type} className="grid grid-cols-[1fr_60px_60px_60px] gap-2 items-center">
                                <span className="text-xs font-medium text-gray-700 truncate" title={type}>{type.replace('CONN_', '').replace('TERMINAL', 'T')}</span>
                                <input 
                                    type="number" step="0.5" min="0" 
                                    value={appConfig?.prices?.[type] || 0} 
                                    onChange={(e) => AppConfigService.setPrice(type, parseFloat(e.target.value))}
                                    className="w-full p-1 text-xs text-center border rounded bg-gray-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                />
                                <input 
                                    type="number" step="0.1" min="0" 
                                    value={appConfig?.weights?.[type] || 0} 
                                    onChange={(e) => AppConfigService.setWeight(type, parseFloat(e.target.value))}
                                    className="w-full p-1 text-xs text-center border rounded bg-gray-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                />
                                <input 
                                    type="number" step="0.1" min="0" 
                                    value={appConfig?.sdgImpacts?.[type] || 0} 
                                    onChange={(e) => AppConfigService.setSdgImpact(type, parseFloat(e.target.value))}
                                    className="w-full p-1 text-xs text-center border rounded bg-gray-50 focus:bg-white focus:ring-1 focus:ring-green-500 outline-none text-green-700 font-medium"
                                />
                            </div>
                        ))}
                    </div>
                 </div>
            </div>
        )}
      </div>
      <div className="p-3 bg-gray-50 text-center border-t shrink-0">
        <span className="text-[10px] text-gray-400">Updates propagate instantly</span>
      </div>
    </div>
  );
};