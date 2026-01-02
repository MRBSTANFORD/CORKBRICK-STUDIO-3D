
import React, { useState, useRef } from 'react';
import { Upload, X, FileBox, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { parseGltfToBlocks } from '../services/importer';
import { PlacedBrock } from '../types';

interface ImportWizardProps {
  onClose: () => void;
  onImport: (blocks: PlacedBrock[]) => void;
}

export const ImportWizard: React.FC<ImportWizardProps> = ({ onClose, onImport }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ found: number, ignored: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setLoading(true);
      setError(null);

      try {
          const buffer = await file.arrayBuffer();
          const result = await parseGltfToBlocks(buffer);
          
          if (result.blocks.length === 0) {
              setError("No recognizably shaped Corkbrick blocks were found in this file. Ensure your SketchUp model uses standard dimensions (200mm cubes, etc).");
          } else {
              setStats(result.stats);
              // Delay slightly to show success state before closing/applying
              setTimeout(() => {
                  if (confirm(`Found ${result.blocks.length} blocks. ${result.stats.ignored} objects ignored. Import now?`)) {
                      onImport(result.blocks);
                      onClose();
                  }
              }, 100);
          }
      } catch (err) {
          console.error(err);
          setError("Failed to parse file. Please ensure it is a valid .GLTF or .GLB file.");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-start">
            <div>
                <h2 className="text-xl font-bold flex items-center gap-2"><FileBox /> Import from SketchUp</h2>
                <p className="text-blue-100 text-sm mt-1">Convert your existing 3D models into Corkbrick Studio.</p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white"><X /></button>
        </div>

        <div className="p-6 space-y-6">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 space-y-2">
                <p className="font-bold flex items-center gap-2"><AlertTriangle size={16}/> How to prepare your file:</p>
                <ol className="list-decimal pl-5 space-y-1 text-blue-700">
                    <li>Open your design in <strong>SketchUp</strong>.</li>
                    <li>Go to <strong>File &gt; Export &gt; 3D Model</strong>.</li>
                    <li>Select <strong>GLTF</strong> or <strong>GLB</strong> format.</li>
                    <li>Ensure "Export Component Hierarchies" is checked.</li>
                    <li>Upload the resulting file here.</li>
                </ol>
            </div>

            {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
                    <AlertTriangle size={16} /> {error}
                </div>
            )}

            <div 
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${loading ? 'border-gray-300 bg-gray-50' : 'border-indigo-300 hover:bg-indigo-50 hover:border-indigo-500'}`}
                onClick={() => !loading && fileInputRef.current?.click()}
            >
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".gltf,.glb" />
                
                {loading ? (
                    <div className="flex flex-col items-center gap-2 text-indigo-600">
                        <Loader2 className="animate-spin" size={32} />
                        <span className="font-medium">Analyzing Geometry...</span>
                    </div>
                ) : (
                    <>
                        <Upload size={40} className="text-indigo-400 mb-2" />
                        <h3 className="font-bold text-gray-700">Click to Upload GLTF/GLB</h3>
                        <p className="text-xs text-gray-400 mt-1">Supports standard Corkbrick dimensions</p>
                    </>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
