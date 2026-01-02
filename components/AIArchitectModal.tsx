
import React, { useState, useEffect } from 'react';
import { X, Wand2, Loader2, Check, AlertCircle, RefreshCw, Building2, Users, Home, Lightbulb, ChevronRight, Sparkles, Key, ExternalLink, ShieldCheck } from 'lucide-react';
import { generateDesigns, GeneratedDesign } from '../services/aiArchitect';
import { PlacedBrock, BrockType } from '../types';
import { MARKET_TEMPLATES } from '../constants';

interface AIArchitectModalProps {
  onClose: () => void;
  onApplyDesign: (blocks: PlacedBrock[]) => void;
}

export const AIArchitectModal: React.FC<AIArchitectModalProps> = ({ onClose, onApplyDesign }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [designs, setDesigns] = useState<GeneratedDesign[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<keyof typeof MARKET_TEMPLATES | null>('Commercial');
  
  const [userKey, setUserKey] = useState(localStorage.getItem('corkbrick_user_gemini_key') || '');
  const [showKeyInput, setShowKeyInput] = useState(!userKey);

  const isConnected = !!userKey;

  const handleSaveKey = () => {
    if (userKey.trim()) {
        localStorage.setItem('corkbrick_user_gemini_key', userKey.trim());
        setShowKeyInput(false);
        setError(null);
    }
  };

  const handleClearKey = () => {
      localStorage.removeItem('corkbrick_user_gemini_key');
      setUserKey('');
      setShowKeyInput(true);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !isConnected) return;
    setLoading(true);
    setError(null);
    setDesigns([]);

    try {
      const results = await generateDesigns(prompt);
      setDesigns(results);
    } catch (err: any) {
      if (err.message === "NO_API_KEY") {
          setError("Please provide a Gemini API Key to use the Architect.");
          setShowKeyInput(true);
      } else if (err.message?.includes("API_KEY_INVALID") || err.message?.includes("403")) {
          setError("The provided API Key is invalid or restricted. Please check your Google AI Studio settings.");
          handleClearKey();
      } else {
          setError("Generation failed. Ensure your key is from a paid project with billing enabled.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (design: GeneratedDesign) => {
    const newBlocks: PlacedBrock[] = design.blocks.map((b) => ({
      id: Math.random().toString(36).substr(2, 9),
      type: b.type as BrockType,
      position: b.position,
      rotation: b.rotation,
      timestamp: Date.now(),
    }));
    onApplyDesign(newBlocks);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh] overflow-hidden border border-indigo-100">
        
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex justify-between items-start shrink-0">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2"><Wand2 className="text-yellow-300" /> Master Architect AI</h2>
            <p className="text-indigo-100 text-sm mt-1">Design sustainable furniture instantly using Gemini 3 Pro.</p>
          </div>
          <div className="flex items-center gap-3">
             {isConnected && !showKeyInput && (
                 <button onClick={() => setShowKeyInput(true)} className="flex items-center gap-1.5 bg-green-500/20 text-green-100 px-3 py-1.5 rounded-full text-xs font-bold border border-green-500/30 hover:bg-green-500/30 transition-colors">
                    <ShieldCheck size={14}/> Key Active
                 </button>
             )}
             <button onClick={onClose} className="text-white/70 hover:text-white p-1 hover:bg-white/10 rounded-full"><X size={24} /></button>
          </div>
        </div>

        {showKeyInput && (
            <div className="bg-indigo-50 border-b border-indigo-100 p-6 animate-in slide-in-from-top duration-300">
                <div className="max-w-xl mx-auto">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-indigo-600 p-2 rounded-lg text-white"><Key size={20}/></div>
                        <div>
                            <h4 className="text-sm font-bold text-indigo-900">Enter Your Gemini API Key</h4>
                            <p className="text-xs text-indigo-700">To keep this project sustainable, please use your own key. We never store it on our servers.</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <input 
                            type="password"
                            value={userKey}
                            onChange={(e) => setUserKey(e.target.value)}
                            placeholder="AIzaSy..."
                            className="flex-1 p-2.5 bg-white border border-indigo-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <button 
                            onClick={handleSaveKey}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition shadow-md"
                        >
                            Save Key
                        </button>
                        {localStorage.getItem('corkbrick_user_gemini_key') && (
                             <button onClick={() => setShowKeyInput(false)} className="px-4 py-2 text-indigo-600 text-sm font-medium hover:bg-indigo-100 rounded-lg">Cancel</button>
                        )}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[10px] font-bold text-indigo-500 flex items-center gap-1 hover:underline">GET FREE KEY <ExternalLink size={10}/></a>
                        <button onClick={handleClearKey} className="text-[10px] text-red-500 font-bold hover:underline">DELETE KEY FROM BROWSER</button>
                    </div>
                </div>
            </div>
        )}

        <div className="flex flex-1 overflow-hidden">
            <div className="w-1/3 bg-gray-50 border-r overflow-y-auto p-4 flex flex-col gap-2">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2"><Lightbulb size={12}/> Inspiration Library</h3>
                <div className="space-y-1">
                    {['Commercial', 'Public', 'Residential'].map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat as any)} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${activeCategory === cat ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                            {cat === 'Commercial' ? <Building2 size={16}/> : cat === 'Public' ? <Users size={16}/> : <Home size={16}/>} {cat}
                        </button>
                    ))}
                </div>
                <div className="mt-4 border-t pt-4">
                     <h4 className="text-[10px] font-bold text-indigo-600 uppercase mb-2">{activeCategory} Templates</h4>
                     <div className="space-y-2">
                         {activeCategory && (MARKET_TEMPLATES[activeCategory] as any).map((tmpl: any, idx: number) => (
                             <button key={idx} onClick={() => setPrompt(tmpl.prompt)} className="w-full text-left p-2.5 rounded-lg border border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm transition-all group">
                                 <div className="flex justify-between items-center mb-1"><span className="font-bold text-xs text-gray-800">{tmpl.label}</span><ChevronRight size={12} className="text-gray-300 group-hover:text-indigo-500"/></div>
                                 <p className="text-[10px] text-gray-500 line-clamp-2">{tmpl.title}</p>
                             </button>
                         ))}
                     </div>
                </div>
            </div>

            <div className={`flex-1 p-6 overflow-y-auto bg-white transition-opacity ${!isConnected ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700 flex justify-between"><span>Describe your design...</span>{prompt && <button onClick={() => setPrompt('')} className="text-xs text-gray-400">Clear</button>}</label>
                    <div className="relative">
                        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., An L-shaped workspace for two people..." className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-32 text-sm leading-relaxed" />
                        <button onClick={handleGenerate} disabled={loading || !prompt.trim()} className="absolute bottom-3 right-3 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-50">
                            {loading ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />} {loading ? 'Architecting...' : 'Generate Design'}
                        </button>
                    </div>
                </div>

                {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3 border border-red-100 mt-4"><AlertCircle size={20} /><p className="text-sm">{error}</p></div>}

                {designs.length > 0 && (
                    <div className="space-y-4 mt-8">
                        <h3 className="font-bold text-gray-800 border-b pb-2">AI Proposals</h3>
                        <div className="grid gap-4">
                            {designs.map((design, idx) => (
                                <div key={idx} className="border border-gray-200 rounded-xl p-4 hover:border-indigo-300 bg-gray-50 hover:bg-white transition-all flex justify-between items-start">
                                    <div><h4 className="font-bold text-indigo-700">Proposal #{idx+1}: {design.name}</h4><p className="text-sm text-gray-600 mt-1">{design.description}</p></div>
                                    <button onClick={() => handleApply(design)} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-600 hover:text-white transition-all shadow-sm">Apply</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
        <div className="p-4 bg-gray-50 border-t flex justify-between items-center"><span className="text-[10px] text-gray-400">Visitor Privacy: Your API key is stored locally in your browser and is never shared with Corkbrick servers.</span></div>
      </div>
    </div>
  );
};
