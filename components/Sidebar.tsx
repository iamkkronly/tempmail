import React from 'react';
import { Mailbox } from '../types';
import { Plus, Trash2, User, Download, Shield, Ghost } from 'lucide-react';

interface SidebarProps {
  accounts: Mailbox[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onExport: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ accounts, activeId, onSelect, onAdd, onRemove, onExport }) => {
  return (
    <div className="w-[80px] md:w-72 bg-slate-950/80 backdrop-blur-2xl border-r border-slate-800/50 flex flex-col h-full flex-shrink-0 transition-all duration-300 z-30 relative overflow-hidden">
      
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-brand-900/10 to-transparent pointer-events-none"></div>

      {/* Header */}
      <div className="p-5 md:p-6 border-b border-slate-800/50 flex items-center justify-center md:justify-start gap-4">
         <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/20 ring-1 ring-white/10">
            <Ghost className="w-6 h-6 text-white" />
         </div>
         <div className="hidden md:block">
            <h1 className="font-bold text-slate-100 text-lg tracking-tight">GhostMail</h1>
            <p className="text-[10px] text-brand-400 font-mono tracking-wider uppercase">Pro Dashboard</p>
         </div>
      </div>

      {/* Accounts List */}
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-2 scrollbar-none">
        <div className="px-2 mb-2 hidden md:flex items-center justify-between">
           <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Identities</span>
           <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-md font-mono">{accounts.length}</span>
        </div>
        
        {accounts.map(acc => (
          <button 
            key={acc.id || acc.token} 
            onClick={() => acc.id && onSelect(acc.id)}
            className={`w-full group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 outline-none ${
              activeId === acc.id 
                ? 'bg-slate-800 text-white shadow-lg ring-1 ring-slate-700' 
                : 'hover:bg-slate-900/50 text-slate-400 hover:text-slate-200'
            }`}
          >
            {activeId === acc.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-brand-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
            )}

            <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold transition-all ${
               activeId === acc.id 
               ? 'bg-gradient-to-br from-brand-500 to-purple-600 text-white shadow-inner' 
               : 'bg-slate-800 group-hover:bg-slate-700 border border-slate-700'
            }`}>
              {acc.address.charAt(0).toUpperCase()}
            </div>
            
            <div className="flex-1 min-w-0 hidden md:block text-left">
              <p className={`text-sm font-medium truncate ${activeId === acc.id ? 'text-white' : 'text-slate-300'}`}>
                {acc.address.split('@')[0]}
              </p>
              <p className="text-[10px] text-slate-500 truncate group-hover:text-slate-400 transition-colors">
                @{acc.address.split('@')[1]}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-slate-800/50 space-y-2 bg-slate-900/30">
         <button 
           onClick={onAdd}
           className="w-full flex items-center justify-center md:justify-start gap-3 p-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white shadow-lg shadow-brand-900/20 transition-all hover:shadow-brand-500/20 active:scale-[0.98] group"
         >
           <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
           <span className="hidden md:inline font-semibold text-sm">New Identity</span>
         </button>

         {activeId && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <button 
                 onClick={onExport}
                 className="flex flex-col md:flex-row items-center justify-center gap-2 p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-emerald-400 transition-all border border-transparent hover:border-slate-700/50"
                 title="Backup JSON"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden md:inline text-xs font-medium">Backup</span>
                </button>

                <button 
                 onClick={() => activeId && onRemove(activeId)}
                 className="flex flex-col md:flex-row items-center justify-center gap-2 p-2 rounded-lg text-slate-400 hover:bg-red-950/30 hover:text-red-400 transition-all border border-transparent hover:border-red-900/30"
                 title="Delete Identity"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden md:inline text-xs font-medium">Destroy</span>
                </button>
            </div>
         )}
      </div>
      
      <div className="p-2 text-center hidden md:block">
         <div className="flex items-center justify-center gap-2 text-[10px] text-slate-600">
            <Shield className="w-3 h-3" />
            <span>Encrypted Session</span>
         </div>
      </div>
    </div>
  );
};

export default Sidebar;