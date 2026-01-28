
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="py-6 px-4 md:px-12 flex items-center justify-between glass sticky top-0 z-50">
      <div className="flex items-center space-x-2">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-none">OmniConvert</h1>
          <p className="text-xs font-medium text-slate-500 tracking-wider uppercase">AI Powered Processing</p>
        </div>
      </div>
      
      <nav className="hidden md:flex space-x-8">
        <a href="#" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition">How it works</a>
        <a href="#" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition">Privacy</a>
        <a href="#" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition">API</a>
      </nav>

      <div className="flex items-center">
        <span className="hidden sm:inline-block text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full">System Ready</span>
      </div>
    </header>
  );
};

export default Header;
