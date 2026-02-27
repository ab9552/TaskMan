
import React, { useState } from 'react';
import { ViewType, Workspace } from '../types';

interface HeaderProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  activeWorkspaceId: string;
  workspaces: Workspace[];
  onWorkspaceChange: (id: string) => void;
  onCreateWorkspace: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  activeView, 
  onViewChange, 
  activeWorkspaceId, 
  workspaces, 
  onWorkspaceChange,
  onCreateWorkspace
}) => {
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const navItems: ViewType[] = ['Dashboard', 'Infrastructure', 'Reports'];
  const activeWs = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];

  return (
    <header className="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-lg border-b border-slate-800">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onViewChange('Dashboard')}>
            <div className="bg-orange-500 p-2 rounded-lg shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="hidden lg:block">
              <h1 className="text-xl font-bold tracking-tight">AWS Decommission</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Live Operation Tracker</p>
            </div>
          </div>

          <div className="relative border-l border-slate-700 pl-6 h-10 flex items-center">
            <button 
              onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
              className="flex items-center gap-2 group hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors"
            >
              <div className="flex flex-col items-start">
                <span className="text-[9px] font-black text-orange-500 uppercase tracking-tighter leading-none mb-0.5">Workspace</span>
                <span className="text-sm font-bold text-slate-100 group-hover:text-white truncate max-w-[150px]">{activeWs.name}</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-slate-500 transition-transform ${showWorkspaceMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showWorkspaceMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowWorkspaceMenu(false)}></div>
                <div className="absolute top-12 left-6 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden py-2 animate-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-slate-100 mb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Workspaces</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {workspaces.map(ws => (
                      <button
                        key={ws.id}
                        onClick={() => {
                          onWorkspaceChange(ws.id);
                          setShowWorkspaceMenu(false);
                        }}
                        className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors ${activeWorkspaceId === ws.id ? 'bg-orange-50' : ''}`}
                      >
                        <div className="flex flex-col">
                          <span className={`text-sm font-bold ${activeWorkspaceId === ws.id ? 'text-orange-600' : 'text-slate-700'}`}>{ws.name}</span>
                          <span className="text-[10px] text-slate-400 uppercase">{ws.region} • {ws.tasks.length} tasks</span>
                        </div>
                        {activeWorkspaceId === ws.id && <div className="w-2 h-2 rounded-full bg-orange-500"></div>}
                      </button>
                    ))}
                  </div>
                  <div className="px-4 py-3 border-t border-slate-100 mt-2">
                    <button 
                      onClick={() => {
                        onCreateWorkspace();
                        setShowWorkspaceMenu(false);
                      }}
                      className="w-full bg-slate-900 text-white text-xs font-bold py-2 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Workspace
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          <nav className="flex gap-6">
            {navItems.map((item) => (
              <button
                key={item}
                onClick={() => onViewChange(item)}
                className={`text-sm font-semibold transition-all relative pb-1 ${
                  activeView === item 
                    ? 'text-orange-500' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {item}
                {activeView === item && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500 rounded-full animate-in fade-in slide-in-from-bottom-1 duration-300"></span>
                )}
              </button>
            ))}
          </nav>
          
          <div className="flex items-center gap-3 pl-6 border-l border-slate-700">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-500 uppercase">System Time</span>
              <span className="text-xs font-bold text-slate-300">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} UTC</span>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
