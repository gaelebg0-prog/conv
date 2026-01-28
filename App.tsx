
import React, { useState, useCallback, useRef } from 'react';
import Header from './components/Header';
import FileCard from './components/FileCard';
import CameraModal from './components/CameraModal';
import { FileItem, FileStatus, SUPPORTED_IMAGE_FORMATS } from './types';
import { analyzeFile, translateFile } from './services/geminiService';
import { convertImage, convertText, applyImageEffects } from './utils/converters';

const App: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(async (newFiles: File[]) => {
    const newItems: FileItem[] = newFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      previewUrl: SUPPORTED_IMAGE_FORMATS.includes(file.type) ? URL.createObjectURL(file) : null,
      status: FileStatus.IDLE,
      progress: 0,
      outputFormat: null
    }));

    setFiles(prev => [...prev, ...newItems]);

    newItems.forEach(async (item) => {
      setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: FileStatus.ANALYZING } : f));
      
      let fileData: string | undefined;
      if (SUPPORTED_IMAGE_FORMATS.includes(item.file.type)) {
        fileData = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(item.file);
        });
      }

      const insights = await analyzeFile(item.file.name, item.file.type, fileData);
      
      setFiles(prev => prev.map(f => f.id === item.id ? { 
        ...f, 
        aiInsights: insights,
        status: FileStatus.IDLE 
      } : f));
    });
  }, []);

  const onFilesSelected = (selectedFiles: FileList | null) => {
    if (selectedFiles) processFiles(Array.from(selectedFiles));
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const item = prev.find(f => f.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter(f => f.id !== id);
    });
  };

  const handleConvert = async (id: string, format: string, quality?: number) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, status: FileStatus.CONVERTING } : f));
    try {
      const item = files.find(f => f.id === id);
      if (!item) return;
      let blob: Blob;
      if (SUPPORTED_IMAGE_FORMATS.includes(item.file.type)) {
        blob = await convertImage(item.file, format, quality);
      } else {
        blob = await convertText(item.file, format);
      }
      setFiles(prev => prev.map(f => f.id === id ? { ...f, status: FileStatus.COMPLETED, outputFormat: format, convertedBlob: blob } : f));
    } catch (error) {
      setFiles(prev => prev.map(f => f.id === id ? { ...f, status: FileStatus.ERROR } : f));
    }
  };

  const handleTranslate = async (id: string, language: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, status: FileStatus.TRANSLATING } : f));
    try {
      const item = files.find(f => f.id === id);
      if (!item) return;
      let fileData: string | undefined;
      if (SUPPORTED_IMAGE_FORMATS.includes(item.file.type)) {
        fileData = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(item.file);
        });
      }
      const translation = await translateFile(item.file, language, fileData);
      setFiles(prev => prev.map(f => f.id === id ? { ...f, status: FileStatus.IDLE, translationResult: translation } : f));
    } catch (error) {
      setFiles(prev => prev.map(f => f.id === id ? { ...f, status: FileStatus.ERROR } : f));
    }
  };

  const handleApplyEffects = async (id: string, radius: number, enhance: boolean) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, status: FileStatus.PROCESSING } : f));
    try {
      const item = files.find(f => f.id === id);
      if (!item) return;
      const blob = await applyImageEffects(item.file, radius, enhance);
      setFiles(prev => prev.map(f => f.id === id ? { ...f, status: FileStatus.COMPLETED, outputFormat: 'png', convertedBlob: blob } : f));
    } catch (error) {
      setFiles(prev => prev.map(f => f.id === id ? { ...f, status: FileStatus.ERROR } : f));
    }
  };

  return (
    <div className="min-h-screen bg-white text-black selection:bg-black selection:text-white">
      <Header />
      
      {isCameraOpen && (
        <CameraModal 
          onCapture={(file) => processFiles([file])} 
          onClose={() => setIsCameraOpen(false)} 
        />
      )}

      <main className="max-w-4xl mx-auto w-full px-6 py-20">
        <section className="text-center mb-20 animate-in fade-in duration-1000">
          <h2 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6">
            Optimisez vos fichiers <br className="hidden md:block"/> instantanément.
          </h2>
          <p className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
            Convertissez, traduisez et améliorez vos images localement. <br/>Simple, rapide et privé.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
             <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto px-10 py-3.5 bg-black text-white rounded-md text-sm font-bold hover:bg-slate-800 transition shadow-xl"
            >
              Importer des fichiers
            </button>
            <button 
              onClick={() => setIsCameraOpen(true)}
              className="w-full sm:w-auto px-10 py-3.5 bg-white text-black border border-slate-200 rounded-md text-sm font-bold hover:bg-slate-50 transition"
            >
              Scanner un document
            </button>
          </div>
        </section>

        <div 
          className={`border-2 border-dashed rounded-xl p-16 transition-all duration-300 ${
            isDragging ? 'border-black bg-slate-50 scale-[1.02]' : 'border-slate-200 bg-white'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            onFilesSelected(e.dataTransfer.files);
          }}
        >
          <input type="file" multiple className="hidden" ref={fileInputRef} onChange={(e) => onFilesSelected(e.target.files)} />
          <div className="flex flex-col items-center">
            <svg width="40" height="40" viewBox="0 0 76 65" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-4 text-slate-300">
              <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="currentColor"/>
            </svg>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Déposez vos fichiers pour commencer</p>
          </div>
        </div>

        <div className="mt-20 space-y-12">
          {files.length > 0 ? (
            <div className="grid gap-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">File System ({files.length})</h3>
                <button onClick={() => setFiles([])} className="text-[10px] font-bold text-red-500 hover:underline uppercase tracking-widest">Tout effacer</button>
              </div>
              {files.map(item => (
                <FileCard 
                  key={item.id} 
                  item={item} 
                  onConvert={handleConvert}
                  onTranslate={handleTranslate}
                  onApplyEffects={handleApplyEffects}
                  onRemove={removeFile}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left py-10 border-t border-slate-100">
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-black mb-3">01. Confidentialité</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Les conversions d'images se font directement dans votre navigateur.</p>
              </div>
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-black mb-3">02. Puissance IA</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Gemini analyse et traduit vos textes avec une précision de pointe.</p>
              </div>
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-black mb-3">03. Design Moderne</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Optimisez vos visuels avec des bords arrondis et une qualité pro.</p>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="py-20 border-t border-slate-100 mt-20">
        <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <div className="flex items-center space-x-6 mb-6 md:mb-0">
             <a href="#" className="hover:text-black transition">Status</a>
             <a href="#" className="hover:text-black transition">Support</a>
             <a href="#" className="hover:text-black transition">Sécurité</a>
          </div>
          <div>© {new Date().getFullYear()} OmniConvert AI Platform</div>
        </div>
      </footer>
    </div>
  );
};

export default App;
