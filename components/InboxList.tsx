import React, { useState, useMemo, useEffect } from 'react';
import { MailMessage } from '../types';
import { Mail, ChevronRight, Clock, Search, X, Filter, RefreshCw, Trash2, CheckCheck, KeyRound, Copy, Square, CheckSquare } from 'lucide-react';

interface InboxListProps {
  messages: MailMessage[];
  onSelect: (id: string) => void;
  loading: boolean;
  onRefresh: () => void;
  onDelete: (id: string) => void;
  onMarkSeen: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkMarkSeen?: (ids: string[]) => void;
}

const InboxList: React.FC<InboxListProps> = ({ messages, onSelect, loading, onRefresh, onDelete, onMarkSeen, onBulkDelete, onBulkMarkSeen }) => {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Clear selections when messages change significantly
  useEffect(() => {
    setSelectedIds(new Set());
  }, [messages.length]);

  const filteredMessages = useMemo(() => {
    if (!search) return messages;
    const lowerSearch = search.toLowerCase();
    return messages.filter(m => 
      m.from.toLowerCase().includes(lowerSearch) ||
      m.subject.toLowerCase().includes(lowerSearch) ||
      (m.intro && m.intro.toLowerCase().includes(lowerSearch))
    );
  }, [messages, search]);

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredMessages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMessages.map(m => m.id)));
    }
  };

  const handleBulkDelete = () => {
    if (onBulkDelete && selectedIds.size > 0) {
      if (confirm(`Delete ${selectedIds.size} messages?`)) {
        onBulkDelete(Array.from(selectedIds));
        setSelectedIds(new Set());
      }
    }
  };

  const handleBulkRead = () => {
    if (onBulkMarkSeen && selectedIds.size > 0) {
      onBulkMarkSeen(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  // Extract verification codes (4-8 digits)
  const getVerificationCode = (msg: MailMessage): string | null => {
    const textToCheck = `${msg.subject} ${msg.intro || ''}`;
    const match = textToCheck.match(/\b\d{4,8}\b/);
    return match ? match[0] : null;
  };

  const copyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Skeleton Loader Component
  const SkeletonItem = () => (
    <div className="relative overflow-hidden rounded-xl p-4 border border-slate-800 bg-slate-900/30 mb-2">
      <div className="flex items-start gap-4">
        <div className="w-6 h-6 rounded bg-slate-800 animate-pulse"></div>
        <div className="w-12 h-12 rounded-full bg-slate-800 animate-pulse"></div>
        <div className="flex-1 space-y-2">
          <div className="w-1/3 h-4 bg-slate-800 rounded animate-pulse"></div>
          <div className="w-2/3 h-4 bg-slate-800 rounded animate-pulse"></div>
          <div className="w-full h-3 bg-slate-800/50 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 relative">
       {/* Header & Search */}
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1 mb-4">
         <div className="flex items-center gap-4">
            <h2 className="text-slate-200 text-lg font-bold flex items-center gap-2">
              Inbox <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full text-xs font-mono">{messages.length}</span>
            </h2>
            <button 
              onClick={onRefresh}
              className={`p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-all border border-slate-700/50 ${loading ? 'animate-spin text-brand-400' : ''}`}
              title="Refresh Inbox"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            
            {/* Select All Toggle */}
            {messages.length > 0 && (
              <button 
                onClick={toggleAll}
                className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-brand-400 transition-colors ml-2"
              >
                {selectedIds.size === filteredMessages.length && filteredMessages.length > 0 ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                <span className="hidden sm:inline">Select All</span>
              </button>
            )}
         </div>

         {messages.length > 0 && (
           <div className="relative group w-full sm:w-64 z-10">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               <Search className="h-4 w-4 text-slate-500 group-focus-within:text-brand-400 transition-colors" />
             </div>
             <input
               type="text"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               placeholder="Search emails..."
               className="block w-full pl-10 pr-8 py-2.5 border border-slate-700/50 rounded-xl leading-5 bg-slate-900/50 text-slate-300 placeholder-slate-500 focus:outline-none focus:bg-slate-900 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 text-sm transition-all shadow-sm backdrop-blur-sm"
             />
             {search && (
               <button 
                 onClick={() => setSearch('')}
                 className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white"
               >
                 <X className="h-3 w-3" />
               </button>
             )}
           </div>
         )}
       </div>

       {/* Bulk Action Floating Toolbar */}
       {selectedIds.size > 0 && (
         <div className="sticky top-2 z-20 mx-auto max-w-lg animate-fade-in-up">
           <div className="bg-slate-800/90 backdrop-blur-md border border-slate-600 rounded-xl shadow-2xl p-2 flex items-center justify-between px-4">
              <span className="text-sm font-semibold text-white">{selectedIds.size} selected</span>
              <div className="flex gap-2">
                 <button onClick={handleBulkRead} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-emerald-600 hover:text-white text-slate-300 transition-colors text-xs font-medium">
                    <CheckCheck className="w-3.5 h-3.5" /> Mark Read
                 </button>
                 <button onClick={handleBulkDelete} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-red-600 hover:text-white text-slate-300 transition-colors text-xs font-medium">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                 </button>
              </div>
           </div>
         </div>
       )}
      
      {/* Loading State - Skeletons */}
      {loading && messages.length === 0 && (
        <div className="space-y-3">
          <SkeletonItem />
          <SkeletonItem />
          <SkeletonItem />
        </div>
      )}

      {/* Empty State */}
      {!loading && messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-80 text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20 backdrop-blur-sm transition-all duration-500 hover:border-slate-700 group">
          <div className="relative">
             <div className="absolute -inset-4 bg-gradient-to-r from-brand-500/20 to-indigo-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition duration-700"></div>
             <div className="relative w-20 h-20 bg-slate-800/50 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-slate-700/50 group-hover:scale-110 transition-transform duration-300 shadow-xl">
               <Mail className="w-8 h-8 text-slate-600 group-hover:text-brand-400 transition-colors duration-300" />
             </div>
          </div>
          <h3 className="text-lg font-semibold text-slate-300 mb-1">Your Inbox is Empty</h3>
          <p className="max-w-xs text-center text-sm text-slate-500 leading-relaxed">
            Waiting for incoming messages...<br/>They will appear here instantly.
          </p>
        </div>
      )}

      {/* No Search Results */}
      {!loading && messages.length > 0 && filteredMessages.length === 0 && (
        <div className="text-center py-12">
          <Filter className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400">No emails match "{search}"</p>
        </div>
      )}

      {/* Message List */}
      <div className="space-y-3 pb-20">
      {filteredMessages.map((msg) => {
        const code = getVerificationCode(msg);
        const isSelected = selectedIds.has(msg.id);
        
        return (
          <div
            key={msg.id}
            className={`
              group relative overflow-hidden rounded-xl cursor-pointer transition-all duration-300 
              border 
              ${isSelected 
                ? 'bg-brand-900/20 border-brand-500/50 translate-x-1' 
                : 'hover:-translate-y-1 hover:shadow-xl hover:shadow-black/50'
              }
              ${!msg.seen && !isSelected
                ? 'bg-gradient-to-r from-slate-800 to-slate-900 border-brand-500/30' 
                : !isSelected 
                   ? 'bg-slate-900/40 border-slate-800 hover:border-slate-600 hover:bg-slate-800/80'
                   : ''
              }
            `}
            onClick={() => onSelect(msg.id)}
          >
            {/* Click area covers everything except quick actions */}
            <div className="p-3 sm:p-4 flex items-start gap-3 sm:gap-4">
              
              {/* Checkbox (Stop propagation to prevent opening email) */}
              <div 
                className="pt-1.5" 
                onClick={(e) => { e.stopPropagation(); toggleSelection(msg.id); }}
              >
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-brand-500 border-brand-500 text-white' : 'border-slate-600 hover:border-slate-400 bg-slate-900/50 text-transparent'}`}>
                   <CheckCheck className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Left Side: Avatar & Content */}
              <div className="flex items-center space-x-3 sm:space-x-4 overflow-hidden flex-1">
                <div className={`
                  flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-inner transition-transform group-hover:scale-105
                  ${!msg.seen 
                    ? 'bg-gradient-to-br from-brand-600 to-indigo-600 ring-2 ring-brand-500/20' 
                    : 'bg-slate-800 text-slate-400'
                  }
                `}>
                  {msg.from.charAt(0).toUpperCase()}
                </div>
                
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={`text-sm truncate transition-colors ${!msg.seen ? 'text-white font-bold' : 'text-slate-300 font-medium'}`}>
                      {msg.from}
                    </p>
                    {!msg.seen && (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className={`text-sm truncate ${!msg.seen ? 'text-slate-100 font-semibold' : 'text-slate-400'}`}>
                      {msg.subject || '(No Subject)'}
                    </p>
                    
                    {/* Instant Verification Code Badge - Clickable */}
                    {code && (
                      <button 
                        onClick={(e) => copyCode(code, e)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-all border 
                          ${copiedCode === code 
                             ? 'bg-emerald-500 text-white border-emerald-500' 
                             : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:scale-105'
                          }
                        `}
                        title="Click to Copy Code"
                      >
                        {copiedCode === code ? <CheckCheck className="w-3 h-3" /> : <KeyRound className="w-3 h-3" />}
                        {copiedCode === code ? 'COPIED' : code}
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 truncate font-light group-hover:text-slate-400 transition-colors">
                    {msg.intro || 'No preview available...'}
                  </p>
                </div>
              </div>
              
              {/* Right Side: Meta & Actions */}
              <div className="flex flex-col items-end space-y-3 ml-1 sm:ml-2">
                 <span className={`text-[10px] sm:text-xs flex items-center gap-1 whitespace-nowrap ${!msg.seen ? 'text-brand-300 font-medium' : 'text-slate-600'}`}>
                    <Clock className="w-3 h-3" />
                    {new Date(msg.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                 </span>
                 
                 {/* Hover Action Arrow */}
                 <div className="w-8 h-8 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 -mr-2 transform translate-x-2 group-hover:translate-x-0 hidden sm:flex">
                   <ChevronRight className="w-4 h-4 text-brand-400" />
                 </div>
              </div>
            </div>

            {/* Quick Actions (Slide in on hover/focus) */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-2 translate-x-12 group-hover:translate-x-0 transition-transform duration-300 opacity-0 group-hover:opacity-100 z-10 bg-slate-950/80 backdrop-blur p-1 rounded-lg border border-slate-800 shadow-xl">
               <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(msg.id); }}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                  title="Delete"
               >
                  <Trash2 className="w-4 h-4" />
               </button>
               {!msg.seen && (
                 <button 
                    onClick={(e) => { e.stopPropagation(); onMarkSeen(msg.id); }}
                    className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors"
                    title="Mark Read"
                 >
                    <CheckCheck className="w-4 h-4" />
                 </button>
               )}
            </div>

            {/* Unread Indicator Bar */}
            {!msg.seen && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-400 to-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
};

export default InboxList;