
import React, { useState } from 'react';
import { FileItem, FileStatus, SUPPORTED_IMAGE_FORMATS, LANGUAGES } from '../types';

interface FileCardProps {
  item: FileItem;
  onConvert: (id: string, format: string, quality?: number) => void;
  onTranslate: (id: string, language: string) => void;
  onApplyEffects: (id: string, radius: number, enhance: boolean) => void;
  onRemove: (id: string) => void;
}

const FileCard: React.FC<FileCardProps> = ({ item, onConvert, onTranslate, onApplyEffects, onRemove }) => {
  const [activeTab, setActiveTab] = useState<'convert' | 'translate' | 'quality' | 'corners'>('convert');
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [selectedLang, setSelectedLang] = useState<string>('English');
  const [quality, setQuality] = useState<number>(0.92);
  const [cornerRadius, setCornerRadius] = useState<number>(20);
  
  const isImage = SUPPORTED_IMAGE_FORMATS.includes(item.file.type);
  const formats = isImage ? ['png', 'jpeg', 'webp', 'bmp', 'ico'] : ['txt', 'md', 'json', 'html', 'xml'];

  const getStatusLabel = () => {
    switch (item.status) {
      case FileStatus.COMPLETED: return 'Prêt';
      case FileStatus.ERROR: return 'Erreur';
      case FileStatus.CONVERTING: return 'Conversion...';
      case FileStatus.TRANSLATING: return 'Traduction...';
      case FileStatus.PROCESSING: return 'Traitement...';
      case FileStatus.ANALYZING: return 'Analyse IA...';
      default: return 'En attente';
    }
  };

  const handleDownload = () => {
    if (!item.convertedBlob) return;
    const url = URL.createObjectURL(item.convertedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omni_${item.file.name.split('.')[0]}.${item.outputFormat || 'png'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isIdle = item.status === FileStatus.IDLE;

  return (
    <div className={`bg-white rounded-xl overflow-hidden border transition-all ${item.status === FileStatus.ERROR ? 'border-red-200' : 'border-slate-200'} hover:border-black/20 shadow-sm`}>
      <div className="flex flex-col md:flex-row">
        {/* Preview Sidebar */}
        <div className="w-full md:w-48 bg-slate-50 border-r border-slate-100 flex flex-col">
          <div className="aspect-square w-full relative flex items-center justify-center bg-slate-100 overflow-hidden">
            {item.previewUrl && isImage ? (
              <img src={item.previewUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-slate-300">
                 <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              </div>
            )}
            <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-white/90 rounded text-[9px] font-bold uppercase tracking-tighter border border-slate-200">
              {item.file.name.split('.').pop()}
            </div>
          </div>
          <div className="p-3 border-t border-slate-100 mt-auto">
            <div className="flex items-center space-x-2">
              <div className={`w-1.5 h-1.5 rounded-full ${item.status === FileStatus.COMPLETED ? 'bg-green-500' : item.status === FileStatus.ERROR ? 'bg-red-500' : 'bg-blue-500'}`}></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{getStatusLabel()}</span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-grow flex flex-col">
          {/* Header Info */}
          <div className="p-4 border-b border-slate-50 flex justify-between items-start">
            <div>
              <h3 className="text-sm font-bold text-black truncate max-w-[200px]">{item.file.name}</h3>
              <p className="text-[10px] font-medium text-slate-400">{(item.file.size / 1024).toFixed(0)} KB • {item.file.type || 'Fichier'}</p>
            </div>
            <button onClick={() => onRemove(item.id)} className="text-slate-300 hover:text-black transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Nav Tabs */}
          <div className="flex bg-slate-50/50 px-4 border-b border-slate-100">
            {[
              { id: 'convert', label: 'Convertir' },
              { id: 'translate', label: 'Traduire' },
              { id: 'quality', label: 'Améliorer', icon: '✨' },
              { id: 'corners', label: 'Bords', icon: '▢' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => isIdle && setActiveTab(tab.id as any)}
                className={`py-3 px-4 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 ${
                  activeTab === tab.id ? 'border-black text-black' : 'border-transparent text-slate-400 hover:text-slate-600'
                } ${!isIdle && activeTab !== tab.id ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {tab.icon && <span className="mr-1">{tab.icon}</span>}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Actions */}
          <div className="p-6 flex-grow flex flex-col justify-center">
            {activeTab === 'convert' && (
              <div className="flex flex-wrap items-center gap-4">
                <select 
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="bg-white border border-slate-200 text-[11px] font-bold py-2 px-3 rounded-md outline-none focus:border-black"
                >
                  <option value="">FORMAT DE SORTIE...</option>
                  {formats.map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
                </select>
                <button 
                  onClick={() => selectedFormat && onConvert(item.id, selectedFormat, quality)}
                  disabled={!selectedFormat || !isIdle}
                  className="bg-black text-white text-[11px] font-bold px-6 py-2 rounded-md hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 transition"
                >
                  {item.status === FileStatus.CONVERTING ? 'Conversion...' : 'Convertir'}
                </button>
              </div>
            )}

            {activeTab === 'translate' && (
              <div className="flex flex-wrap items-center gap-4">
                <select 
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  className="bg-white border border-slate-200 text-[11px] font-bold py-2 px-3 rounded-md outline-none focus:border-black"
                >
                  {LANGUAGES.map(l => <option key={l.code} value={l.name}>{l.name}</option>)}
                </select>
                <button 
                  onClick={() => onTranslate(item.id, selectedLang)}
                  disabled={!isIdle}
                  className="bg-emerald-600 text-white text-[11px] font-bold px-6 py-2 rounded-md hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 transition"
                >
                  {item.status === FileStatus.TRANSLATING ? 'Traduction...' : 'Traduire via Gemini'}
                </button>
              </div>
            )}

            {activeTab === 'quality' && (
              <div className="flex flex-col space-y-4">
                <p className="text-[11px] text-slate-500 font-medium">L'IA Gemini va ajuster automatiquement le contraste, la netteté et la luminosité pour une qualité optimale.</p>
                <button 
                  onClick={() => onApplyEffects(item.id, 0, true)}
                  disabled={!isIdle || !isImage}
                  className="self-start bg-amber-500 text-white text-[11px] font-bold px-6 py-2 rounded-md hover:bg-amber-600 disabled:bg-slate-100 transition"
                >
                  {item.status === FileStatus.PROCESSING ? 'Amélioration...' : 'Améliorer Qualité'}
                </button>
              </div>
            )}

            {activeTab === 'corners' && (
              <div className="flex flex-col space-y-4 max-w-sm">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Rayon des coins</label>
                  <span className="text-[11px] font-bold text-black">{cornerRadius}px</span>
                </div>
                <input 
                  type="range" min="0" max="100" value={cornerRadius} 
                  onChange={(e) => setCornerRadius(parseInt(e.target.value))}
                  className="w-full accent-black"
                />
                <button 
                  onClick={() => onApplyEffects(item.id, cornerRadius, false)}
                  disabled={!isIdle || !isImage}
                  className="bg-black text-white text-[11px] font-bold px-6 py-2 rounded-md hover:bg-slate-800 disabled:bg-slate-100 transition"
                >
                  {item.status === FileStatus.PROCESSING ? 'Calcul...' : 'Arrondir les coins'}
                </button>
              </div>
            )}
          </div>

          {/* AI Insights & Results Overlay */}
          {(item.aiInsights || item.translationResult) && (
            <div className="p-4 bg-slate-50 border-t border-slate-100">
               {item.aiInsights && <p className="text-[10px] text-slate-500 italic mb-2">"{item.aiInsights}"</p>}
               {item.translationResult && (
                 <div className="bg-white p-3 rounded border border-slate-200 text-[11px] max-h-32 overflow-y-auto whitespace-pre-wrap">
                   {item.translationResult}
                 </div>
               )}
            </div>
          )}

          {/* Footer Action */}
          {item.status === FileStatus.COMPLETED && (
            <div className="p-4 bg-black flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Opération terminée</span>
              <button 
                onClick={handleDownload}
                className="bg-white text-black text-[11px] font-bold px-6 py-2 rounded-md hover:bg-slate-100 transition shadow-lg"
              >
                Télécharger
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileCard;
