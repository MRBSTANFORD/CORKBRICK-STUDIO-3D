
import React, { useState } from 'react';
import { X, MousePointer2, Hammer, Hand, Move, Keyboard, Settings, BrainCircuit, Info, Heart, Leaf, Box, Layers, Mouse } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'WELCOME' | 'CONTROLS' | 'TOOLS' | 'VISION'>('WELCOME');

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh] overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-orange-500 to-amber-600 text-white flex justify-between items-start shrink-0">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Info className="text-white/80" /> Corkbrick Studio Guide
            </h2>
            <p className="text-orange-100 text-sm mt-1">
              Your gateway to sustainable, modular furniture design.
            </p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1 hover:bg-white/10 rounded-full transition">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50 overflow-x-auto">
            <button onClick={() => setActiveTab('WELCOME')} className={`px-6 py-4 text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'WELCOME' ? 'bg-white text-orange-600 border-t-2 border-orange-600' : 'text-gray-500 hover:text-gray-700'}`}>
                <Hand size={16}/> Welcome
            </button>
            <button onClick={() => setActiveTab('VISION')} className={`px-6 py-4 text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'VISION' ? 'bg-white text-orange-600 border-t-2 border-orange-600' : 'text-gray-500 hover:text-gray-700'}`}>
                <Leaf size={16}/> Vision & Values
            </button>
            <button onClick={() => setActiveTab('CONTROLS')} className={`px-6 py-4 text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'CONTROLS' ? 'bg-white text-orange-600 border-t-2 border-orange-600' : 'text-gray-500 hover:text-gray-700'}`}>
                <Mouse size={16}/> Controls
            </button>
            <button onClick={() => setActiveTab('TOOLS')} className={`px-6 py-4 text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'TOOLS' ? 'bg-white text-orange-600 border-t-2 border-orange-600' : 'text-gray-500 hover:text-gray-700'}`}>
                <Box size={16}/> Advanced Tools
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-white">
            
            {/* TAB: WELCOME */}
            {activeTab === 'WELCOME' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-2">
                    <div className="text-center space-y-4 max-w-2xl mx-auto mb-8">
                        <h3 className="text-2xl font-bold text-gray-800">Build Anything. Change Everything.</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Welcome to the digital playground for <strong>Corkbrick</strong>. 
                            Our modular system allows you to build furniture, walls, and structures without tools, screws, or glue.
                            Just purely natural, sustainable cork blocks that interlock like magic.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-orange-50 p-5 rounded-xl border border-orange-100">
                            <h4 className="font-bold text-orange-800 mb-2 flex items-center gap-2"><Hammer size={18}/> 1. Build Mode</h4>
                            <p className="text-sm text-gray-700 mb-2">The default mode. Select a block from the left panel and click anywhere in the 3D space to place it.</p>
                            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1 ml-1">
                                <li>Blocks snap to the grid automatically.</li>
                                <li>Connectors automatically align to structural blocks.</li>
                                <li>Use arrow keys to rotate before placing.</li>
                            </ul>
                        </div>
                        <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                            <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2"><MousePointer2 size={18}/> 2. Edit Mode</h4>
                            <p className="text-sm text-gray-700 mb-2">Switch to Edit Mode (Tab) to modify your creation.</p>
                            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1 ml-1">
                                <li>Click a block to select it.</li>
                                <li><strong>Shift + Click</strong> to select multiple blocks.</li>
                                <li>Press 'M' or click "Move" to drag selected blocks.</li>
                                <li>Press 'Delete' to remove blocks.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: VISION */}
            {activeTab === 'VISION' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-2">
                    <div className="prose prose-orange max-w-none">
                        <h3 className="flex items-center gap-2 text-xl font-bold text-gray-800">
                            <Heart className="text-red-500 fill-current" /> A System for Life
                        </h3>
                        <p className="text-gray-600">
                            Corkbrick Europe is dedicated to creating sustainable, dynamic structures that adapt to your life. 
                            We believe in a future where you don't buy furniture; you invent it, use it, and reinvent it.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="border p-4 rounded-xl hover:shadow-md transition bg-gray-50">
                            <Leaf className="text-green-600 mb-3" size={32} />
                            <h4 className="font-bold text-gray-800 mb-2">Sustainable</h4>
                            <p className="text-sm text-gray-600">Made from cork oak bark—a renewable resource harvested without harming the tree. Carbon negative and eco-friendly.</p>
                        </div>
                        <div className="border p-4 rounded-xl hover:shadow-md transition bg-gray-50">
                            <Layers className="text-indigo-600 mb-3" size={32} />
                            <h4 className="font-bold text-gray-800 mb-2">Modular</h4>
                            <p className="text-sm text-gray-600">7 unique block types create infinite possibilities. From beds and sofas to partition walls and desks.</p>
                        </div>
                        <div className="border p-4 rounded-xl hover:shadow-md transition bg-gray-50">
                            <Hand className="text-orange-600 mb-3" size={32} />
                            <h4 className="font-bold text-gray-800 mb-2">DIY Friendly</h4>
                            <p className="text-sm text-gray-600">No tools. No glue. No screws. It's like a life-sized logic puzzle that anyone can build.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: CONTROLS */}
            {activeTab === 'CONTROLS' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-2">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         
                         {/* Mouse */}
                         <div>
                             <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2"><Mouse size={18}/> Mouse Interactions</h4>
                             <div className="space-y-3 text-sm text-gray-600">
                                 <div className="flex justify-between">
                                     <span>Left Click</span>
                                     <span className="font-semibold text-gray-800">Place Block / Select</span>
                                 </div>
                                 <div className="flex justify-between">
                                     <span>Left Drag</span>
                                     <span className="font-semibold text-gray-800">Orbit Camera</span>
                                 </div>
                                 <div className="flex justify-between">
                                     <span>Right Drag</span>
                                     <span className="font-semibold text-gray-800">Pan Camera</span>
                                 </div>
                                 <div className="flex justify-between">
                                     <span>Scroll Wheel</span>
                                     <span className="font-semibold text-gray-800">Zoom In / Out</span>
                                 </div>
                                 <div className="flex justify-between">
                                     <span>Shift + Drag</span>
                                     <span className="font-semibold text-blue-600">Box Select (Edit Mode)</span>
                                 </div>
                             </div>
                         </div>

                         {/* Keyboard */}
                         <div>
                             <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2"><Keyboard size={18}/> Keyboard Shortcuts</h4>
                             <div className="space-y-3 text-sm text-gray-600">
                                 <div className="flex justify-between">
                                     <span className="bg-gray-100 px-2 py-0.5 rounded border">Tab</span>
                                     <span className="font-semibold text-gray-800">Toggle Build / Edit Mode</span>
                                 </div>
                                 <div className="flex justify-between">
                                     <span className="bg-gray-100 px-2 py-0.5 rounded border">Arrows</span>
                                     <span className="font-semibold text-gray-800">Rotate Block (X/Y Axis)</span>
                                 </div>
                                 <div className="flex justify-between">
                                     <span className="bg-gray-100 px-2 py-0.5 rounded border">Page Up / Down</span>
                                     <span className="font-semibold text-gray-800">Rotate Block (Z Axis)</span>
                                 </div>
                                 <div className="flex justify-between">
                                     <span className="bg-gray-100 px-2 py-0.5 rounded border">Ctrl + Z / Y</span>
                                     <span className="font-semibold text-gray-800">Undo / Redo</span>
                                 </div>
                                 <div className="flex justify-between">
                                     <span className="bg-gray-100 px-2 py-0.5 rounded border">Ctrl + C / V</span>
                                     <span className="font-semibold text-gray-800">Copy / Paste Selection</span>
                                 </div>
                             </div>
                         </div>
                     </div>
                </div>
            )}

            {/* TAB: TOOLS */}
            {activeTab === 'TOOLS' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-2">
                    
                    <div className="flex gap-4 items-start p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                        <div className="bg-indigo-600 text-white p-2 rounded-lg shrink-0"><BrainCircuit size={24}/></div>
                        <div>
                            <h4 className="font-bold text-indigo-900 mb-1">AI Architect (Experimental)</h4>
                            <p className="text-sm text-indigo-800 mb-2">
                                Describe what you want (e.g., "A modern TV stand with shelves"), and our AI will generate a structural blueprint for you.
                            </p>
                            <p className="text-xs text-indigo-600 italic bg-white/50 p-2 rounded">
                                * Note: This feature is experimental. The designs are generated creatively and may require manual adjustment for stability. We welcome your feedback!
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 items-start p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="bg-gray-600 text-white p-2 rounded-lg shrink-0"><Settings size={24}/></div>
                        <div>
                            <h4 className="font-bold text-gray-900 mb-1">Admin Dashboard & Settings</h4>
                            <p className="text-sm text-gray-600 mb-2">
                                Tweak the physics engine (collision tolerance), adjust block prices, or change the color theme.
                            </p>
                            <div className="flex items-center gap-2 text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded w-fit">
                                <Info size={12}/> Important: Settings are Local
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Any changes you make to settings (price, weight, colors) only affect <strong>your current browser session</strong>. 
                                They will not affect the official version or other users. Refreshing the page restores defaults.
                            </p>
                        </div>
                    </div>
                </div>
            )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t flex justify-end">
           <button onClick={onClose} className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium">
               Got it, let's build!
           </button>
        </div>
      </div>
    </div>
  );
};
