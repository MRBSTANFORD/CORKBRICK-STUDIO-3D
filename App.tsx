
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Scene, SceneHandle } from './components/Scene';
import { BrockType, PlacedBrock, Vector3, Rotation3, RoomSize, FloorMaterial } from './types';
import { BROCK_SPECS, APP_CONFIG, AppConfigService, ROOM_SPECS, FLOOR_PROPS } from './constants';
import { calculateStats, generateInstructionSteps, calculateSelectionBounds } from './services/builder';
import { GeoConfig } from './services/geometryConfig';
import { AdminDashboard } from './components/AdminDashboard';
import { AIArchitectModal } from './components/AIArchitectModal';
import { BOMModal } from './components/BOMModal';
import { ImportWizard } from './components/ImportWizard';
import { HelpModal } from './components/HelpModal';
import { 
  Box, RotateCw, Play, Pause, ShoppingCart, Trash2, Info, Layers, Undo, Redo, 
  Image as ImageIcon, Hammer, MousePointer2, Save, Upload, Move, AlertTriangle, Focus, Magnet, Settings, Wand2, Copy, Clipboard, Leaf, Euro, Cuboid, Ruler, Layout, Grid3X3, Camera, Scaling, FileBox, HelpCircle, ChevronUp, ChevronDown,
  // Added missing Check icon import
  Check
} from 'lucide-react';

const BlockIcon: React.FC<{ type: BrockType; color: string; isSelected: boolean }> = ({ type, color, isSelected }) => {
  const strokeColor = isSelected ? '#ea580c' : '#78350f'; 
  const fillColor = color;
  const renderShape = () => {
    switch (type) {
      case BrockType.BASE: return <rect x="5" y="5" width="14" height="14" rx="1" fill={fillColor} stroke={strokeColor} strokeWidth="1.5" />;
      case BrockType.DOUBLE: return <g><rect x="6" y="3" width="12" height="18" rx="1" fill={fillColor} stroke={strokeColor} strokeWidth="1.5" /><line x1="6" y1="12" x2="18" y2="12" stroke={strokeColor} strokeWidth="1" opacity="0.6" /></g>;
      case BrockType.CONN_1D: return <path d="M6 5h3v5.5h6V5h3v14h-3v-5.5H9V19H6z" fill={fillColor} stroke={strokeColor} strokeWidth="1.5" />;
      case BrockType.CONN_2D: return <path d="M5 5h3v11h11v3H5z" fill={fillColor} stroke={strokeColor} strokeWidth="1.5" />;
      case BrockType.CONN_3D: return <path d="M4 6h16v3.5h-6.25v10h-3.5v-10H4z" fill={fillColor} stroke={strokeColor} strokeWidth="1.5" />;
      case BrockType.CONN_4D: return <path d="M10.25 4h3.5v6.25H20v3.5h-6.25V20h-3.5v-6.25H4v-3.5h6.25z" fill={fillColor} stroke={strokeColor} strokeWidth="1.5" />;
      case BrockType.TERMINAL: return <path d="M4 10h16v6H4z" fill={fillColor} stroke={strokeColor} strokeWidth="1.5" />;
      default: return <circle cx="12" cy="12" r="6" fill={fillColor} />;
    }
  };
  return <svg width="24" height="24" viewBox="0 0 24 24" className={`transition-transform duration-200 ${isSelected ? 'scale-110' : ''}`}>{renderShape()}</svg>;
};

const ProjectStatsHUD: React.FC<{ 
    stats: { totalCost: number, totalWeight: number, totalSDG: number }, 
    blockCount: number,
    selectionSize: { width: number, height: number, depth: number } | null 
}> = ({ stats, blockCount, selectionSize }) => {
    if (!stats) return null;
    return (
        <div className="absolute top-4 left-4 z-20 pointer-events-none select-none">
            <div className="bg-white/80 backdrop-blur-md shadow-lg border border-white/50 rounded-xl p-3 min-w-[160px] animate-in slide-in-from-left-4 fade-in duration-500">
                <div className="flex flex-col mb-2">
                    <div className="flex items-center gap-1.5 text-green-700 font-bold text-sm uppercase tracking-wider">
                        <Leaf size={14} fill="currentColor" className="text-green-600" />
                        SDG Impact
                    </div>
                    <div className="text-2xl font-bold text-green-800 tabular-nums leading-none mt-1">
                        €{(stats.totalSDG || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-green-600/80 leading-tight mt-0.5">Sustainable Value Generated</div>
                </div>
                <div className="w-full h-px bg-gradient-to-r from-gray-300 to-transparent my-2"></div>
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-gray-600 text-xs font-medium">
                        <div className="flex items-center gap-2"><Euro size={12} /> Cost</div>
                        <span className="tabular-nums">€{(stats.totalCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-600 text-xs font-medium">
                        <div className="flex items-center gap-2"><Cuboid size={12} /> Blocks</div>
                        <span className="tabular-nums">{blockCount}</span>
                    </div>
                </div>
                {selectionSize && (
                    <>
                        <div className="w-full h-px bg-gradient-to-r from-gray-300 to-transparent my-2"></div>
                        <div className="bg-blue-50/80 rounded p-1.5 border border-blue-100/50">
                             <div className="text-[10px] font-bold text-blue-700 uppercase mb-1 flex items-center gap-1"><Ruler size={10}/> Selection Size</div>
                             <div className="grid grid-cols-3 gap-1 text-[10px] text-blue-900 tabular-nums">
                                 <div className="flex flex-col items-center"><span className="text-blue-400">W</span>{selectionSize.width.toFixed(2)}m</div>
                                 <div className="flex flex-col items-center"><span className="text-blue-400">H</span>{selectionSize.height.toFixed(2)}m</div>
                                 <div className="flex flex-col items-center"><span className="text-blue-400">D</span>{selectionSize.depth.toFixed(2)}m</div>
                             </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// --- SELECTION INSPECTOR (GUMBALL) ---
const SelectionInspector: React.FC<{
    selectedBlocks: PlacedBrock[];
    onUpdate: (absPos: Vector3, absRot: Rotation3) => void;
}> = ({ selectedBlocks, onUpdate }) => {
    if (selectedBlocks.length === 0) return null;
    
    // Always bind to the first selected item as the leader
    const leader = selectedBlocks[0];
    const [localPos, setLocalPos] = useState<Vector3>({ ...leader.position });
    const [localRot, setLocalRot] = useState<Rotation3>({ ...leader.rotation });

    useEffect(() => {
        setLocalPos({ ...leader.position });
        setLocalRot({ ...leader.rotation });
    }, [leader]);

    const handleApply = () => {
        onUpdate(localPos, localRot);
    };

    const updateAxis = (axis: 'x' | 'y' | 'z', val: number, isRot: boolean) => {
        if (isRot) {
            const steps = Math.round(val / 90);
            setLocalRot(prev => ({ ...prev, [axis]: steps }));
        } else {
            setLocalPos(prev => ({ ...prev, [axis]: val }));
        }
    };

    return (
        <div className="absolute bottom-6 left-6 z-30 bg-white/90 backdrop-blur-md shadow-2xl border border-indigo-100 rounded-2xl p-4 w-72 animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="bg-indigo-600 p-1.5 rounded-lg text-white"><Move size={16}/></div>
                    <span className="text-sm font-bold text-gray-800">Transform Inspector</span>
                </div>
                <div className="text-[10px] font-bold text-gray-400 uppercase">{selectedBlocks.length} Items</div>
            </div>

            <div className="space-y-4">
                {/* Position Group */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Position (Units)</label>
                    <div className="grid grid-cols-3 gap-2">
                        {['x', 'y', 'z'].map((axis) => (
                            <div key={axis} className="relative">
                                <span className={`absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase ${axis === 'x' ? 'text-red-500' : axis === 'y' ? 'text-green-500' : 'text-blue-500'}`}>{axis}</span>
                                <input 
                                    type="number" step="0.5"
                                    value={localPos[axis as keyof Vector3]}
                                    onChange={(e) => updateAxis(axis as 'x'|'y'|'z', parseFloat(e.target.value), false)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-6 pr-1 py-1.5 text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Rotation Group */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rotation (Degrees)</label>
                    <div className="grid grid-cols-3 gap-2">
                        {['x', 'y', 'z'].map((axis) => (
                            <div key={axis} className="relative">
                                <span className={`absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase ${axis === 'x' ? 'text-red-500' : axis === 'y' ? 'text-green-500' : 'text-blue-500'}`}>{axis}</span>
                                <input 
                                    type="number" step="90"
                                    value={Math.round(localRot[axis as keyof Rotation3] * 90)}
                                    onChange={(e) => updateAxis(axis as 'x'|'y'|'z', parseFloat(e.target.value), true)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-6 pr-1 py-1.5 text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <button 
                    onClick={handleApply}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                >
                    <Check size={14}/> Apply Changes
                </button>
            </div>
        </div>
    );
}

const App: React.FC = () => {
  const [history, setHistory] = useState<PlacedBrock[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const blocks = useMemo(() => history[historyIndex] || [], [history, historyIndex]);

  const [mode, setMode] = useState<'BUILD' | 'EDIT' | 'MEASURE'>('BUILD');
  const [selectedType, setSelectedType] = useState<BrockType>(BrockType.BASE);
  
  const [roomSize, setRoomSize] = useState<RoomSize>(RoomSize.UNLIMITED);
  const [floorMaterial, setFloorMaterial] = useState<FloorMaterial>(FloorMaterial.CORK);
  const [showRuler, setShowRuler] = useState(true);

  const [rotation, setRotation] = useState<Rotation3>({ x: 0, y: 0, z: 0 });
  const [isPrecisionMode, setIsPrecisionMode] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showBOM, setShowBOM] = useState(false); 
  const [showImport, setShowImport] = useState(false); 
  const [showHelp, setShowHelp] = useState(false);
  const [forceRender, setForceRender] = useState(0); 
  
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set());
  const [isMoving, setIsMoving] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ start: {x:number, y:number}, current: {x:number, y:number} } | null>(null);
  const [isShiftDown, setIsShiftDown] = useState(false);
  const [clipboard, setClipboard] = useState<PlacedBrock[]>([]);

  const [instructionMode, setInstructionMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const controlsRef = useRef<any>(null);
  const sceneRef = useRef<SceneHandle>(null);
  const [logoError, setLogoError] = useState(false);

  const stats = useMemo(() => calculateStats(blocks), [blocks, forceRender]);
  const selectionSize = useMemo(() => calculateSelectionBounds(blocks, selectedBlockIds), [blocks, selectedBlockIds]);
  const instructionSteps = useMemo(() => generateInstructionSteps(blocks), [blocks]);
  
  const selectedBlocks = useMemo(() => 
    blocks.filter(b => selectedBlockIds.has(b.id)),
  [blocks, selectedBlockIds]);

  const visibleBlockIds = useMemo(() => {
    if (!instructionMode) return new Set<string>();
    const ids = new Set<string>();
    for (let i = 0; i <= currentStep; i++) {
        if (instructionSteps[i]) instructionSteps[i].forEach(b => ids.add(b.id));
    }
    return ids;
  }, [instructionMode, currentStep, instructionSteps]);

  const currentStepName = useMemo(() => {
      if (!instructionMode || !instructionSteps[currentStep] || instructionSteps[currentStep].length === 0) return "";
      const firstBlock = instructionSteps[currentStep][0];
      const spec = BROCK_SPECS[firstBlock.type];
      return `Add ${spec ? spec.name : 'blocks'} to Layer ${Math.round(firstBlock.position.y)}`;
  }, [instructionMode, currentStep, instructionSteps, forceRender]);

  useEffect(() => {
    const unsubGeo = GeoConfig.subscribe(() => setForceRender(prev => prev + 1));
    const unsubApp = AppConfigService.subscribe(() => setForceRender(prev => prev + 1));
    return () => { unsubGeo(); unsubApp(); };
  }, []);

  useEffect(() => {
      const hasSeenHelp = localStorage.getItem('corkbrick_welcome_seen');
      if (!hasSeenHelp) {
          setShowHelp(true);
          localStorage.setItem('corkbrick_welcome_seen', 'true');
      }
  }, []);

  const pushState = useCallback((newBlocks: PlacedBrock[]) => {
      setHistory(prev => {
          const next = prev.slice(0, historyIndex + 1);
          return [...next, newBlocks];
      });
      setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const undo = () => {
      if (historyIndex > 0) {
          setHistoryIndex(prev => prev - 1);
          setSelectedBlockIds(new Set());
          setIsMoving(false);
      }
  };

  const redo = () => {
      if (historyIndex < history.length - 1) {
          setHistoryIndex(prev => prev + 1);
          setSelectedBlockIds(new Set());
          setIsMoving(false);
      }
  };

  const handlePlaceBlock = useCallback((position: Vector3, rot: Rotation3) => {
    if (mode !== 'BUILD') return;
    const newBlock: PlacedBrock = {
      id: Math.random().toString(36).substr(2, 9),
      type: selectedType,
      position: { x: position.x, y: position.y, z: position.z },
      rotation: { x: rot.x, y: rot.y, z: rot.z },
      timestamp: Date.now(),
    };
    pushState([...blocks, newBlock]);
    setSelectedBlockIds(new Set()); 
  }, [blocks, selectedType, pushState, mode]);

  const handleSelectBlock = useCallback((id: string, isMulti: boolean) => {
      if (mode === 'EDIT') {
          if (isMulti) {
              setSelectedBlockIds(prev => {
                  const newSet = new Set(prev);
                  if (newSet.has(id)) newSet.delete(id);
                  else newSet.add(id);
                  return newSet;
              });
              setIsMoving(false); 
          } else {
              if (selectedBlockIds.has(id)) {
                  setIsMoving(true);
              } else {
                  setSelectedBlockIds(new Set([id]));
                  setIsMoving(false);
              }
          }
      } else if (mode === 'BUILD' || mode === 'MEASURE') {
          setSelectedBlockIds(new Set([id]));
      }
  }, [mode, selectedBlockIds]);

  const handleMoveBlock = useCallback((leaderPos: Vector3, leaderRot: Rotation3) => {
      if (!isMoving || selectedBlockIds.size === 0) return;
      
      const leaderId = Array.from(selectedBlockIds)[0];
      const leaderBlock = blocks.find(b => b.id === leaderId);
      if (!leaderBlock) return;

      const dx = leaderPos.x - leaderBlock.position.x;
      const dy = leaderPos.y - leaderBlock.position.y;
      const dz = leaderPos.z - leaderBlock.position.z;

      const newBlocks = blocks.map(b => {
          if (selectedBlockIds.has(b.id)) {
              return { 
                  ...b, 
                  position: {
                      x: b.position.x + dx,
                      y: b.position.y + dy,
                      z: b.position.z + dz
                  },
                  rotation: (b.id === leaderId) ? { ...leaderRot } : { ...b.rotation }
              };
          }
          return b;
      });
      
      pushState(newBlocks);
      setIsMoving(false); 
  }, [blocks, isMoving, selectedBlockIds, pushState]);

  const handleSetAbsoluteTransform = useCallback((absPos: Vector3, absRot: Rotation3) => {
      if (selectedBlockIds.size === 0) return;
      
      const leaderId = Array.from(selectedBlockIds)[0];
      const leaderBlock = blocks.find(b => b.id === leaderId);
      if (!leaderBlock) return;

      const dx = absPos.x - leaderBlock.position.x;
      const dy = absPos.y - leaderBlock.position.y;
      const dz = absPos.z - leaderBlock.position.z;

      const newBlocks = blocks.map(b => {
          if (selectedBlockIds.has(b.id)) {
              if (b.id === leaderId) {
                  return { ...b, position: { ...absPos }, rotation: { ...absRot } };
              }
              // For followers, maintain relative position but use absolute rotation?
              // Usually, users want absolute rotation to align the whole set.
              return {
                  ...b,
                  position: {
                      x: b.position.x + dx,
                      y: b.position.y + dy,
                      z: b.position.z + dz
                  },
                  rotation: { ...absRot }
              };
          }
          return b;
      });
      pushState(newBlocks);
  }, [blocks, selectedBlockIds, pushState]);

  const executeClear = () => {
    pushState([]);
    setSelectedBlockIds(new Set());
    setHistoryIndex(0);
    setHistory([[]]);
    setInstructionMode(false);
    setIsMoving(false);
    setShowClearConfirm(false);
  };

  const handleDeleteSelected = () => {
      if (selectedBlockIds.size > 0) {
          const newBlocks = blocks.filter(b => !selectedBlockIds.has(b.id));
          pushState(newBlocks);
          setSelectedBlockIds(new Set());
          setIsMoving(false);
      }
  };

  const handleCopy = () => {
      if (selectedBlockIds.size === 0) return;
      const selectedBlocks = blocks.filter(b => selectedBlockIds.has(b.id));
      setClipboard(JSON.parse(JSON.stringify(selectedBlocks)));
  };

  const handlePaste = () => {
      if (clipboard.length === 0) return;
      const newIds = new Set<string>();
      const newBlocks: PlacedBrock[] = clipboard.map(b => {
          const newId = Math.random().toString(36).substr(2, 9);
          newIds.add(newId);
          return {
              ...JSON.parse(JSON.stringify(b)),
              id: newId,
              timestamp: Date.now()
          };
      });
      const updatedWorld = [...blocks, ...newBlocks];
      pushState(updatedWorld);
      setSelectedBlockIds(newIds);
      setMode('EDIT');
      setIsMoving(true); 
  };

  const handleUpdateSelected = (
      posDelta: {x:number, y:number, z:number}, 
      rotDelta: {x:number, y:number, z:number}
  ) => {
      if (selectedBlockIds.size === 0) return;
      const leaderId = Array.from(selectedBlockIds)[0];
      const leader = blocks.find(b => b.id === leaderId);
      if (!leader) return;

      const newBlocks = blocks.map(b => {
          if (!selectedBlockIds.has(b.id)) return b;
          let dx = b.position.x - leader.position.x;
          let dy = b.position.y - leader.position.y;
          let dz = b.position.z - leader.position.z;
          
          if (rotDelta.x !== 0) { const s = Math.sign(rotDelta.x); const oldY = dy; const oldZ = dz; dy = -oldZ * s; dz = oldY * s; }
          if (rotDelta.y !== 0) { const s = Math.sign(rotDelta.y); const oldX = dx; const oldZ = dz; dx = oldZ * s; dz = -oldX * s; }
          if (rotDelta.z !== 0) { const s = Math.sign(rotDelta.z); const oldX = dx; const oldY = dy; dx = -oldY * s; dy = oldX * s; }
          
          return { 
              ...b, 
              position: { 
                  x: leader.position.x + dx + posDelta.x, 
                  y: leader.position.y + dy + posDelta.y, 
                  z: leader.position.z + dz + posDelta.z 
              }, 
              rotation: { 
                  x: b.rotation.x + rotDelta.x, 
                  y: b.rotation.y + rotDelta.y, 
                  z: b.rotation.z + rotDelta.z 
              } 
          };
      });
      pushState(newBlocks);
  };

  const toggleInstructionMode = () => {
      if (blocks.length === 0) { alert("Place some blocks first!"); return; }
      setInstructionMode(prev => {
          if (!prev) {
              setCurrentStep(0); setIsPlaying(false); setSelectedBlockIds(new Set()); setIsMoving(false); setMode('EDIT');
          }
          return !prev;
      });
  };

  const handleSaveScene = () => {
      const data = JSON.stringify(blocks, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `corkbrick-scene-${new Date().toISOString().slice(0,10)}.json`;
      a.click(); URL.revokeObjectURL(url);
  };

  const handleLoadScene = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
          try {
              const loadedBlocks = JSON.parse(ev.target?.result as string);
              if (Array.isArray(loadedBlocks)) { pushState(loadedBlocks); alert("Scene loaded successfully!"); }
          } catch (err) { alert("Error parsing file."); }
      };
      reader.readAsText(file); if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleScreenshot = () => {
     const canvas = document.querySelector('canvas');
     if (canvas) {
         try {
             const dataUrl = canvas.toDataURL('image/png');
             const link = document.createElement('a');
             link.download = `corkbrick-design-${new Date().getTime()}.png`;
             link.href = dataUrl;
             link.click();
         } catch (e) {
             console.error("Screenshot failed", e);
             alert("Could not capture screenshot.");
         }
     }
  };
  
  const handleClearRequest = () => {
      setShowClearConfirm(true);
  };

  const handleRecenter = () => {
      if (controlsRef.current) {
          controlsRef.current.reset();
      }
  };
  
  const handleApplyAIDesign = (newBlocks: PlacedBrock[]) => {
      pushState(newBlocks);
      setInstructionMode(false);
      setMode('EDIT');
      handleRecenter();
  };

  const handleImport3D = (importedBlocks: PlacedBrock[]) => {
      pushState(importedBlocks);
      setMode('EDIT');
      handleRecenter();
  };

  const handlePointerDown = (e: React.PointerEvent) => {
      if (mode === 'EDIT' && e.shiftKey) {
          const rect = mainContainerRef.current?.getBoundingClientRect();
          if (rect) {
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            setSelectionBox({ start: { x, y }, current: { x, y } });
          }
      }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      if (selectionBox) {
          const rect = mainContainerRef.current?.getBoundingClientRect();
          if (rect) {
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            setSelectionBox(prev => prev ? { ...prev, current: { x, y } } : null);
          }
      }
  };

  const handlePointerUp = () => {
      if (selectionBox) {
          const x = Math.min(selectionBox.start.x, selectionBox.current.x);
          const y = Math.min(selectionBox.start.y, selectionBox.current.y);
          const w = Math.abs(selectionBox.current.x - selectionBox.start.x);
          const h = Math.abs(selectionBox.current.y - selectionBox.start.y);
          if (w > 5 && h > 5 && sceneRef.current && mainContainerRef.current) {
             const rect = mainContainerRef.current.getBoundingClientRect();
             const selectedIds = sceneRef.current.getBlocksInRect({ x, y, w, h }, { w: rect.width, h: rect.height });
             setSelectedBlockIds(prev => {
                const newSet = new Set(prev);
                selectedIds.forEach(id => newSet.add(id));
                return newSet;
             });
          }
          setSelectionBox(null);
      }
  };

  useEffect(() => { if (mainContainerRef.current) mainContainerRef.current.focus(); }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftDown(true);
      if ((e.metaKey || e.ctrlKey) && (e.key === 'c' || e.key === 'C')) { e.preventDefault(); handleCopy(); return; }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'v' || e.key === 'V')) { e.preventDefault(); handlePaste(); return; }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') { e.preventDefault(); redo(); return; }
      if (instructionMode) { if (e.key === 'Escape') setInstructionMode(false); return; }
      if (e.key === 'PageUp') {
          e.preventDefault();
          if (mode === 'BUILD') setRotation(r => ({ ...r, z: r.z + 1 }));
          else if (mode === 'EDIT' && selectedBlockIds.size > 0 && !isMoving) handleUpdateSelected({x:0, y:0, z:0}, {x:0, y:0, z:1});
          return;
      }
      if (e.key === 'PageDown') {
          e.preventDefault();
          if (mode === 'BUILD') setRotation(r => ({ ...r, z: r.z - 1 }));
          else if (mode === 'EDIT' && selectedBlockIds.size > 0 && !isMoving) handleUpdateSelected({x:0, y:0, z:0}, {x:0, y:0, z:-1});
          return;
      }
      if (e.key === 'Tab') {
          e.preventDefault();
          setMode(prev => prev === 'BUILD' ? 'EDIT' : 'BUILD');
          setIsMoving(false);
          return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') { handleDeleteSelected(); return; }
      if (e.key === 'm' || e.key === 'M') { if (mode === 'EDIT' && selectedBlockIds.size > 0) setIsMoving(!isMoving); }
      if (e.key === 'p' || e.key === 'P') setIsPrecisionMode(prev => !prev);
      if (mode === 'EDIT' && selectedBlockIds.size > 0 && !isMoving) {
          if (e.key === 'w' || e.key === 'W') handleUpdateSelected({x:0, y:0, z:-0.5}, {x:0, y:0, z:0});
          if (e.key === 's' || e.key === 'S') handleUpdateSelected({x:0, y:0, z:0.5}, {x:0, y:0, z:0});
          if (e.key === 'a' || e.key === 'A') handleUpdateSelected({x:-0.5, y:0, z:0}, {x:0, y:0, z:0});
          if (e.key === 'd' || e.key === 'D') handleUpdateSelected({x:0.5, y:0, z:0}, {x:0, y:0, z:0});
          if (e.key === 'ArrowRight' && !e.shiftKey) handleUpdateSelected({x:0, y:0, z:0}, {x:0, y:1, z:0});
          if (e.key === 'ArrowLeft' && !e.shiftKey) handleUpdateSelected({x:0, y:0, z:0}, {x:0, y:-1, z:0});
          if (e.key === 'ArrowUp' && !e.shiftKey) handleUpdateSelected({x:0, y:0, z:0}, {x:-1, y:0, z:0});
          if (e.key === 'ArrowDown' && !e.shiftKey) handleUpdateSelected({x:0, y:0, z:0}, {x:1, y:0, z:0});
          if (e.key === 'ArrowRight' && e.shiftKey) handleUpdateSelected({x:0, y:0, z:0}, {x:0, y:0, z:-1});
          if (e.key === 'ArrowLeft' && e.shiftKey) handleUpdateSelected({x:0, y:0, z:0}, {x:0, y:0, z:1});
      } 
      if (mode === 'BUILD') {
          if (e.key === 'ArrowRight') setRotation(r => ({ ...r, y: r.y + 1 }));
          if (e.key === 'ArrowLeft') setRotation(r => ({ ...r, y: r.y - 1 }));
          if (e.key === 'ArrowUp') setRotation(r => e.shiftKey ? ({ ...r, z: r.z - 1 }) : ({ ...r, x: r.x - 1 }));
          if (e.key === 'ArrowDown') setRotation(r => e.shiftKey ? ({ ...r, z: r.z + 1 }) : ({ ...r, x: r.x + 1 }));
          if (e.code === 'KeyZ') setRotation(r => ({ ...r, z: r.z + 1 }));
      }
      if (e.key === 'Escape') {
          if (isMoving) setIsMoving(false);
          else if (showClearConfirm) setShowClearConfirm(false);
          else if (showDashboard) setShowDashboard(false);
          else if (showAI) setShowAI(false);
          else if (showBOM) setShowBOM(false);
          else if (showImport) setShowImport(false);
          else if (showHelp) setShowHelp(false);
          else if (mode === 'MEASURE') setMode('EDIT'); 
          else setSelectedBlockIds(new Set());
      }
      if (e.code === 'KeyO' && mode === 'BUILD') setRotation({ x: 0, y: 0, z: 0 });
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftDown(false);
  };

  return (
    <div 
        ref={mainContainerRef} 
        className={`h-screen w-screen flex flex-col font-sans text-gray-800 outline-none select-none ${isShiftDown && mode === 'EDIT' ? 'cursor-crosshair' : (mode === 'MEASURE' ? 'cursor-none' : '')}`}
        tabIndex={0} 
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
    >
      <input type="file" ref={fileInputRef} onChange={handleLoadScene} className="hidden" accept=".json"/>
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showDashboard && <AdminDashboard onClose={() => setShowDashboard(false)} />}
      {showAI && <AIArchitectModal onClose={() => setShowAI(false)} onApplyDesign={handleApplyAIDesign} />}
      {showBOM && <BOMModal blocks={blocks} onClose={() => setShowBOM(false)} />}
      {showImport && <ImportWizard onClose={() => setShowImport(false)} onImport={handleImport3D} />}
      {selectionBox && (
          <div className="absolute z-50 border border-blue-500 bg-blue-500/20 pointer-events-none" style={{ left: Math.min(selectionBox.start.x, selectionBox.current.x), top: Math.min(selectionBox.start.y, selectionBox.current.y), width: Math.abs(selectionBox.current.x - selectionBox.start.x), height: Math.abs(selectionBox.current.y - selectionBox.start.y), }} />
      )}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 border border-gray-100">
             <div className="flex items-center gap-3 text-red-600 mb-2"><AlertTriangle size={24} /><h3 className="text-lg font-bold text-gray-900">Clear Workspace?</h3></div>
             <p className="text-gray-600 mb-6">Are you sure? This will clear your current scene.</p>
             <div className="flex justify-end gap-3">
                 <button onClick={() => setShowClearConfirm(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium">Cancel</button>
                 <button onClick={executeClear} className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium shadow-sm">Yes, Clear All</button>
             </div>
          </div>
        </div>
      )}
      <header className="bg-white border-b p-4 flex flex-col md:flex-row justify-between items-center shadow-sm z-10 select-none gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
            <div className="h-12 flex items-center shrink-0">
              {!logoError ? <img src="corkbrick-logo.png" alt="Corkbrick Studio" className="h-full w-auto object-contain" onError={() => setLogoError(true)}/> : 
                <div className="flex items-center gap-2">
                    <h1 className="font-bold text-xl tracking-tight text-gray-900">Corkbrick<span className="font-normal text-gray-500">Studio</span></h1>
                </div>}
            </div>
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 px-2 border border-gray-200">
                <div className="flex items-center gap-2"><Layout size={14} className="text-gray-500" />
                    <select value={roomSize} onChange={(e) => setRoomSize(e.target.value as RoomSize)} className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer w-24 sm:w-32">
                        {(Object.entries(ROOM_SPECS) || []).map(([key, spec]) => (<option key={key} value={key}>{spec.name}</option>))}
                    </select>
                </div>
                <div className="w-px h-4 bg-gray-300"></div>
                <div className="flex items-center gap-2"><Grid3X3 size={14} className="text-gray-500" />
                    <select value={floorMaterial} onChange={(e) => setFloorMaterial(e.target.value as FloorMaterial)} className="bg-transparent text-xs font-medium text-gray-700 outline-none cursor-pointer w-20 sm:w-24">
                        {(Object.entries(FLOOR_PROPS) || []).map(([key, prop]) => (<option key={key} value={key}>{prop.name}</option>))}
                    </select>
                </div>
            </div>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
             <button onClick={() => { setMode('BUILD'); setIsMoving(false); setSelectedBlockIds(new Set()); }} className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'BUILD' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Hammer size={16} />Build</button>
             <button onClick={() => setMode('EDIT')} className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'EDIT' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><MousePointer2 size={16} />Edit</button>
             <button onClick={() => setMode('MEASURE')} className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'MEASURE' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`} title="Tape Measure Tool"><Ruler size={16} />Measure</button>
             <div className="w-px h-6 bg-gray-300 mx-2 hidden sm:block"></div>
             <button onClick={() => setIsPrecisionMode(!isPrecisionMode)} className={`hidden sm:flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-all ${isPrecisionMode ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`} title="Toggle Precision Snapping (P)"><Magnet size={16} className={isPrecisionMode ? 'text-purple-600' : 'text-gray-400'} /><span>{isPrecisionMode ? 'Free Move' : 'Snap'}</span></button>
        </div>
        <div className="flex gap-2 items-center">
             <button onClick={() => setShowRuler(!showRuler)} className={`p-2 rounded-lg transition-colors ${showRuler ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`} title="Toggle Ruler"><Scaling size={20}/></button>
             <button onClick={() => setShowAI(!showAI)} className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 font-bold shadow-sm ${showAI ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-lg'}`} title="AI Architect"><Wand2 size={18} className="animate-pulse"/><span className="hidden lg:inline">AI Architect</span></button>
             <div className="w-px h-6 bg-gray-300 mx-1 hidden sm:block"></div>
             <button onClick={() => setShowDashboard(!showDashboard)} className={`p-2 rounded-lg transition-colors ${showDashboard ? 'bg-gray-200 text-gray-800' : 'text-gray-600 hover:bg-gray-100'}`} title="Geometry Settings"><Settings size={20}/></button>
             <button onClick={handleScreenshot} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg" title="Take Screenshot"><Camera size={20} /></button>
             <div className="w-px h-6 bg-gray-300 mx-1 hidden sm:block"></div>
             <button onClick={handleSaveScene} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg" title="Save Scene"><Save size={20} /></button>
             <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg" title="Load Scene"><Upload size={20} /></button>
             <button onClick={() => setShowImport(true)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg" title="Import 3D Model"><FileBox size={20} /></button>
             <div className="w-px h-6 bg-gray-300 mx-1 hidden sm:block"></div>
             <button onClick={toggleInstructionMode} className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${instructionMode ? 'bg-indigo-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}><Layers size={18} /><span className="hidden md:inline">{instructionMode ? 'Exit' : 'Instructions'}</span></button>
             <button onClick={() => setShowBOM(true)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm"><ShoppingCart size={18} /><span className="hidden md:inline">Order BOM</span></button>
             <div className="w-px h-6 bg-gray-300 mx-1 hidden sm:block"></div>
             <button onClick={() => setShowHelp(true)} className="p-2 rounded-full bg-orange-100 text-orange-600 hover:bg-orange-200 transition" title="Help & Getting Started"><HelpCircle size={20}/></button>
        </div>
      </header>

      <div className="flex-1 flex relative overflow-hidden">
        <aside className="w-64 bg-white border-r flex flex-col z-10 overflow-y-auto shrink-0 select-none hidden md:flex">
            <div className="p-2 grid grid-cols-2 gap-2 border-b bg-gray-50">
                <button onClick={undo} disabled={historyIndex <= 0} className="flex items-center justify-center gap-1 p-2 rounded bg-white border hover:bg-gray-100 disabled:opacity-50 text-sm font-medium"><Undo size={14} /> Undo</button>
                <button onClick={redo} disabled={historyIndex >= history.length - 1} className="flex items-center justify-center gap-1 p-2 rounded bg-white border hover:bg-gray-100 disabled:opacity-50 text-sm font-medium"><Redo size={14} /> Redo</button>
            </div>
            <div className="p-4 border-b">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{mode === 'BUILD' ? 'Builder Mode' : (mode === 'MEASURE' ? 'Measure Tool' : 'Editor Mode')}</h3>
                <div className="text-xs text-gray-500 mb-2 space-y-1">
                    {mode === 'BUILD' ? (
                        <><p><span className="font-bold text-orange-600">Click Floor</span> to Place</p><p><span className="font-bold text-orange-600">Click Block</span> to Stack</p><p><span className="font-bold text-orange-600">Arrows</span> to Rotate Ghost</p><p><span className="font-bold text-orange-600">PgUp/Dn</span> Rotate Z</p><p><span className="font-bold text-blue-600">Tab</span> to Edit Mode</p></>
                    ) : mode === 'MEASURE' ? (
                        <><p><span className="font-bold text-emerald-600">Click Pt 1</span> to Start</p><p><span className="font-bold text-emerald-600">Click Pt 2</span> to End</p><p><span className="font-bold text-emerald-600">Click Pt 3</span> to Clear</p></>
                    ) : (
                        <><p><span className="font-bold text-blue-600">Shift+Drag</span> Marquee Select</p><p><span className="font-bold text-blue-600">Shift+Click</span> Multi-Select</p><p><span className="font-bold text-blue-600">Ctrl+C/V</span> Copy & Paste</p><p><span className="font-bold text-blue-600">PgUp/Dn</span> Rotate Z</p><p><span className="font-bold text-orange-600">Tab</span> to Build Mode</p></>
                    )}
                </div>
                {mode === 'EDIT' && (
                    <div className="space-y-2 mt-2">
                        {selectedBlockIds.size > 0 && (
                            <div className={`p-2 rounded flex items-center gap-2 text-sm transition-colors ${isMoving ? 'bg-orange-100 text-orange-700 animate-pulse' : 'bg-gray-100 text-gray-600'}`}>
                                <Move size={16} />{isMoving ? 'Click to Drop' : `${selectedBlockIds.size} Selected`}
                            </div>
                        )}
                        {clipboard.length > 0 && (
                             <div className="p-2 rounded bg-blue-50 text-blue-600 text-xs flex items-center gap-2 border border-blue-100"><Clipboard size={14}/>{clipboard.length} items in Clipboard</div>
                        )}
                    </div>
                )}
            </div>
            <div className={`flex-1 p-2 space-y-2 transition-opacity ${mode === 'EDIT' ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                {(Object.values(BROCK_SPECS) || []).map((spec, idx) => (
                    <button key={idx} onClick={() => { setSelectedType(Object.keys(BROCK_SPECS)[idx] as BrockType); if(mode !== 'BUILD') setMode('BUILD'); }} className={`w-full p-2 rounded-lg border text-left transition flex items-center gap-3 group ${selectedType === Object.keys(BROCK_SPECS)[idx] ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-200' : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'}`}>
                        <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-white rounded shadow-sm border border-gray-100"><BlockIcon type={Object.keys(BROCK_SPECS)[idx] as BrockType} color={spec.color} isSelected={selectedType === Object.keys(BROCK_SPECS)[idx]}/></div>
                        <div className="min-w-0"><div className="font-semibold text-gray-700 text-sm truncate">{spec.name}</div><div className="text-xs text-gray-400 truncate">{spec.dimensions.x}x{spec.dimensions.y}x{spec.dimensions.z}</div></div>
                    </button>
                ))}
            </div>
            <div className="p-4 border-t space-y-2"><button onClick={handleClearRequest} className="w-full flex items-center justify-center gap-2 p-2 rounded text-red-600 hover:bg-red-50 text-sm"><Trash2 size={16} /> Clear Scene</button></div>
        </aside>

        <div className="flex-1 relative bg-gray-100 cursor-crosshair group overflow-hidden">
             <ProjectStatsHUD stats={stats} blockCount={blocks.length} selectionSize={selectionSize} />
             <Scene 
                key={forceRender} ref={sceneRef} blocks={blocks} selectedType={selectedType} roomSize={roomSize} floorMaterial={floorMaterial}
                onPlaceBlock={handlePlaceBlock} onSelectBlock={handleSelectBlock} selectedBlockIds={selectedBlockIds} 
                rotation={rotation} instructionMode={instructionMode} visibleBlockIds={visibleBlockIds} 
                mode={mode} isMoving={isMoving} onMoveBlock={handleMoveBlock} controlsRef={controlsRef} 
                isPrecisionMode={isPrecisionMode} isBoxSelecting={!!selectionBox} showRuler={showRuler}
             />
             
             {/* Gumball / Selection Inspector */}
             {mode === 'EDIT' && selectedBlocks.length > 0 && !isMoving && (
                <SelectionInspector selectedBlocks={selectedBlocks} onUpdate={handleSetAbsoluteTransform} />
             )}

             <button onClick={handleRecenter} className="absolute bottom-6 right-6 p-3 bg-white/90 backdrop-blur rounded-full shadow-lg text-gray-600 hover:text-orange-600 hover:scale-110 transition-all z-20" title="Recenter View"><Focus size={24} /></button>
             {!instructionMode && mode === 'BUILD' && <div className="absolute top-4 right-4 bg-white/80 backdrop-blur p-2 rounded text-xs text-gray-500 font-mono pointer-events-none z-10">ROT: [X:{rotation.x % 4}, Y:{rotation.y % 4}, Z:{rotation.z % 4}]</div>}
             {instructionMode && (
                 <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t p-6 shadow-up-lg transition-transform duration-300 z-20">
                     <div className="max-w-3xl mx-auto">
                        <div className="flex justify-between items-center mb-4"><div><h2 className="text-lg font-bold text-gray-800">Assembly Instructions</h2><p className="text-orange-600 font-medium">{currentStepName}</p></div><div className="text-2xl font-mono text-gray-300">{String(currentStep + 1).padStart(2, '0')} / {String(instructionSteps.length).padStart(2, '0')}</div></div>
                        <div className="flex items-center gap-4"><button onClick={() => setIsPlaying(!isPlaying)} className="w-12 h-12 rounded-full bg-orange-600 text-white flex items-center justify-center hover:bg-orange-700 shadow-lg">{isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" className="ml-1" />}</button><input type="range" min="0" max={Math.max(0, instructionSteps.length - 1)} value={currentStep} onChange={(e) => { setIsPlaying(false); setCurrentStep(parseInt(e.target.value)); }} className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600" /></div>
                     </div>
                 </div>
             )}
        </div>
      </div>
    </div>
  );
};

export default App;
