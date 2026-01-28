
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
  const [activeTab, setActiveTab] = useState<'convert' | 'translate' | 'effects'>('convert');
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [selectedLang, setSelectedLang] = useState<string>('English');
  const [quality, setQuality] = useState<number>(0.92);
  const [cornerRadius, setCornerRadius] = useState<number>(0);
  const [enhanceQuality, setEnhanceQuality] = useState<boolean>(false);
  
  const isImage = SUPPORTED_IMAGE_FORMATS.includes(item.file.type);
  const formats = isImage ? ['png', 'jpeg', 'webp', 'bmp', 'ico'] : ['txt', 'md', 'json', 'html', 'xml'];

  const getStatusColor = () => {
    switch (item.status) {
      case FileStatus.COMPLETED: return 'bg-green-500';
      case FileStatus.ERROR: return 'bg-red-500';
      case FileStatus.CONVERTING:
      case FileStatus.TRANSLATING:
      case FileStatus.PROCESSING:
      case FileStatus.ANALYZING: return 'bg-indigo-500 animate-pulse';
      default: return 'bg-slate-300';
    }
  };

  const handleDownload = () => {
    if (!item.convertedBlob) return;
    const url = URL.createObjectURL(item.convertedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `processed_${item.file.name.split('.')[0]}.${item.outputFormat || 'png'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isIdle = item.status === FileStatus.IDLE;
  const isProcessing = item.status === FileStatus.CONVERTING || item.status === FileStatus.TRANSLATING || item.status === FileStatus.PROCESSING;

  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm border transition-all hover:shadow-md ${item.status === FileStatus.ERROR ? 'border-red-200' : 'border-slate-100'}`}>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Preview Section */}
        <div className="w-full md:w-32 h-32 flex-shrink-0 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center border border-slate-100 relative group">
          {item.previewUrl && isImage ? (
            <img src={item.previewUrl} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400">
               <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
               </svg>
               <span className="text-[10px] font-bold uppercase">{item.file.name.split('.').pop() || 'file'}</span>
            </div>
          )}
          {item.status === FileStatus.COMPLETED && (
            <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center backdrop-blur-[1px]">
               <div className="bg-white rounded-full p-1 shadow-sm">
                 <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
               </div>
            </div>
          )}
        </div>

        {/* Info & Tabs Section */}
        <div className="flex-grow min-w-0">
          <div className="flex justify-between items-start mb-4">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-900 truncate pr-4">{item.file.name}</h3>
              <p className="text-xs text-slate-500">{(item.file.size / 1024 / 1024).toFixed(2)} MB • {item.file.type || 'Unknown'}</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.status}</span>
                <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
              </div>
              <button 
                onClick={() => onRemove(item.id)}
                className="text-slate-400 hover:text-red-500 transition-colors p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          {item.aiInsights && (
            <div className="mb-4 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100/50 flex items-start space-x-2">
               <span className="text-indigo-600 mt-0.5"><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0z" /></svg></span>
               <p className="text-xs text-slate-600 leading-relaxed italic">{item.aiInsights}</p>
            </div>
          )}

          {/* Action Tabs */}
          <div className="border-b border-slate-100 flex space-x-4 mb-4">
            <button 
              onClick={() => setActiveTab('convert')}
              className={`pb-2 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'convert' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Convert
            </button>
            <button 
              onClick={() => setActiveTab('translate')}
              className={`pb-2 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'translate' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Translate
            </button>
            {isImage && (
              <button 
                onClick={() => setActiveTab('effects')}
                className={`pb-2 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'effects' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Effects
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className="min-h-[60px] flex items-center">
            {activeTab === 'convert' && (
              <div className="flex flex-wrap items-center gap-3">
                <select 
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  disabled={!isIdle}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
                >
                  <option value="">Target Format...</option>
                  {formats.map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
                </select>
                {isImage && (selectedFormat === 'jpeg' || selectedFormat === 'webp') && (
                  <select
                    value={quality}
                    onChange={(e) => setQuality(parseFloat(e.target.value))}
                    disabled={!isIdle}
                    className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2 py-2 outline-none"
                  >
                    <option value={0.75}>Normal Qual.</option>
                    <option value={0.92}>High Qual.</option>
                    <option value={1.0}>Original</option>
                  </select>
                )}
                <button 
                  onClick={() => selectedFormat && onConvert(item.id, selectedFormat, quality)}
                  disabled={!selectedFormat || !isIdle}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 transition shadow-sm"
                >
                  {item.status === FileStatus.CONVERTING ? 'Converting...' : 'Start Conversion'}
                </button>
              </div>
            )}

            {activeTab === 'translate' && (
              <div className="flex flex-wrap items-center gap-3">
                <select 
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  disabled={!isIdle}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
                >
                  {LANGUAGES.map(l => <option key={l.code} value={l.name}>{l.name}</option>)}
                </select>
                <button 
                  onClick={() => onTranslate(item.id, selectedLang)}
                  disabled={!isIdle}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 transition shadow-sm flex items-center space-x-2"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
                  <span>{item.status === FileStatus.TRANSLATING ? 'Translating...' : 'Translate Content'}</span>
                </button>
              </div>
            )}

            {activeTab === 'effects' && isImage && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full">
                <div className="flex-1 w-full max-w-xs">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Corner Radius</label>
                    <span className="text-[10px] font-bold text-amber-600">{cornerRadius}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" value={cornerRadius} 
                    onChange={(e) => setCornerRadius(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
                
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer group">
                    <div className="relative">
                      <input 
                        type="checkbox" checked={enhanceQuality} 
                        onChange={(e) => setEnhanceQuality(e.target.checked)} 
                        className="sr-only"
                      />
                      <div className={`w-8 h-4 rounded-full transition-colors ${enhanceQuality ? 'bg-amber-500' : 'bg-slate-200'}`}></div>
                      <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${enhanceQuality ? 'translate-x-4' : ''}`}></div>
                    </div>
                    <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">Enhance AI</span>
                  </label>
                  
                  <button 
                    onClick={() => onApplyEffects(item.id, cornerRadius, enhanceQuality)}
                    disabled={!isIdle}
                    className="px-6 py-2 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 disabled:bg-slate-100 disabled:text-slate-400 transition shadow-sm"
                  >
                    {item.status === FileStatus.PROCESSING ? 'Processing...' : 'Apply Effects'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Special Message/Result Area */}
          {item.translationResult && (
            <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-100 text-xs text-slate-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
              <div className="font-bold text-emerald-800 mb-1 uppercase tracking-tighter">Translation Output:</div>
              {item.translationResult}
            </div>
          )}

          {item.status === FileStatus.COMPLETED && (
            <div className="mt-4 flex justify-end">
              <button 
                onClick={handleDownload}
                className="px-8 py-2.5 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition shadow-lg shadow-green-100 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                <span>Download Result</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileCard;
