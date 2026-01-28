
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

    // Automatically trigger AI analysis
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

      setFiles(prev => prev.map(f => f.id === id ? { 
        ...f, 
        status: FileStatus.COMPLETED,
        outputFormat: format,
        convertedBlob: blob
      } : f));
    } catch (error) {
      console.error(error);
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
      
      setFiles(prev => prev.map(f => f.id === id ? { 
        ...f, 
        status: FileStatus.IDLE,
        translationResult: translation
      } : f));
    } catch (error) {
      console.error(error);
      setFiles(prev => prev.map(f => f.id === id ? { ...f, status: FileStatus.ERROR } : f));
    }
  };

  const handleApplyEffects = async (id: string, radius: number, enhance: boolean) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, status: FileStatus.PROCESSING } : f));
    
    try {
      const item = files.find(f => f.id === id);
      if (!item) return;

      const blob = await applyImageEffects(item.file, radius, enhance);
      
      setFiles(prev => prev.map(f => f.id === id ? { 
        ...f, 
        status: FileStatus.COMPLETED,
        outputFormat: 'png',
        convertedBlob: blob
      } : f));
    } catch (error) {
      console.error(error);
      setFiles(prev => prev.map(f => f.id === id ? { ...f, status: FileStatus.ERROR } : f));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      
      {isCameraOpen && (
        <CameraModal 
          onCapture={(file) => processFiles([file])} 
          onClose={() => setIsCameraOpen(false)} 
        />
      )}

      <main className="flex-grow max-w-5xl mx-auto w-full px-4 py-12">
        {/* Upload Zone */}
        <section 
          className={`relative group border-2 border-dashed rounded-3xl p-12 text-center transition-all ${
            isDragging ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 bg-white hover:border-indigo-300 shadow-sm'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            onFilesSelected(e.dataTransfer.files);
          }}
        >
          <input 
            type="file" 
            multiple 
            className="hidden" 
            ref={fileInputRef}
            onChange={(e) => onFilesSelected(e.target.files)}
          />
          
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">OmniProcess your files</h2>
            <p className="text-slate-500 mb-6 max-w-md mx-auto text-sm leading-relaxed">
              Convert, translate, and enhance your files instantly. Powered by Gemini AI with high-speed client-side processing.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition shadow-lg active:scale-95 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                <span>Select Files</span>
              </button>
              
              <button 
                onClick={() => setIsCameraOpen(true)}
                className="px-8 py-3 bg-white text-indigo-600 border-2 border-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition shadow-sm active:scale-95 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span>Take Photo</span>
              </button>
            </div>
          </div>
        </section>

        {/* Processing Queue */}
        {files.length > 0 && (
          <section className="mt-16 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                <span>Active Queue</span>
                <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-xs font-bold uppercase">{files.length}</span>
              </h2>
              <button 
                onClick={() => setFiles([])}
                className="text-sm font-medium text-slate-400 hover:text-slate-600"
              >
                Clear All
              </button>
            </div>
            
            <div className="grid gap-4">
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
          </section>
        )}

        {/* Info Blocks */}
        {files.length === 0 && (
          <section className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm transition hover:shadow-md">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>
              </div>
              <h3 className="font-bold text-slate-800 mb-2">Smart Effects</h3>
              <p className="text-sm text-slate-600 leading-relaxed">Round corners for UI design or enhance clarity with our local AI-powered filters instantly.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm transition hover:shadow-md">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 mb-4">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
              </div>
              <h3 className="font-bold text-slate-800 mb-2">AI Translation</h3>
              <p className="text-sm text-slate-600 leading-relaxed">Extract and translate text from any image or document using Gemini's advanced multimodal models.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm transition hover:shadow-md">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
              </div>
              <h3 className="font-bold text-slate-800 mb-2">Bulk Conversion</h3>
              <p className="text-sm text-slate-600 leading-relaxed">Drag multiple files and convert them to PNG, WebP, JPEG or PDF-compatible formats in seconds.</p>
            </div>
          </section>
        )}
      </main>

      <footer className="py-8 text-center text-slate-400 text-sm border-t border-slate-200 bg-white">
        <p>© {new Date().getFullYear()} OmniConvert AI. Built with privacy in mind.</p>
      </footer>
    </div>
  );
};

export default App;
