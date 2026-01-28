
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="py-4 px-6 md:px-12 flex items-center justify-between glass sticky top-0 z-50 border-b border-slate-100">
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 76 65" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-black">
            <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="currentColor"/>
          </svg>
        </div>
        <div className="h-4 w-[1px] bg-slate-200 mx-2"></div>
        <div>
          <h1 className="text-[13px] font-bold text-black tracking-tight uppercase">
            OmniConvert <span className="text-slate-400 font-medium">AI</span>
          </h1>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] hidden sm:block">
          Secured by Gemini
        </span>
        <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold">
          AI
        </div>
      </div>
    </header>
  );
};

export default Header;
