import React, { useState, useMemo } from 'react';
import { MailMessage } from '../types';
import { Mail, ChevronRight, Clock, Search, X, Filter } from 'lucide-react';

interface InboxListProps {
  messages: MailMessage[];
  onSelect: (id: string) => void;
  loading: boolean;
}

const InboxList: React.FC<InboxListProps> = ({ messages, onSelect, loading }) => {
  const [search, setSearch] = useState('');

  const filteredMessages = useMemo(() => {
    if (!search) return messages;
    const lowerSearch = search.toLowerCase();
    return messages.filter(m => 
      m.from.toLowerCase().includes(lowerSearch) ||
      m.subject.toLowerCase().includes(lowerSearch) ||
      (m.intro && m.intro.toLowerCase().includes(lowerSearch))
    );
  }, [messages, search]);

  // Skeleton Loader Component
  const SkeletonItem = () => (
    <div className="relative overflow-hidden rounded-xl p-4 border border-slate-800 bg-slate-900/30 mb-2">
      <div className="flex items-start gap-4">
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
    <div className="space-y-4">
       {/* Header & Search */}
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1 mb-6">
         <div className="flex items-center gap-3">
            <h2 className="text-slate-200 text-lg font-bold flex items-center gap-2">
              Inbox <span className="text-slate-500 text-sm font-normal">({messages.length})</span>
            </h2>
            {loading && <div className="w-2 h-2 rounded-full bg-brand-400 animate-ping"></div>}
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
               className="block w-full pl-10 pr-8 py-2 border border-slate-700/50 rounded-xl leading-5 bg-slate-900/50 text-slate-300 placeholder-slate-500 focus:outline-none focus:bg-slate-900 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 sm:text-sm transition-all shadow-sm"
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
      
      {/* Loading State - Skeletons */}
      {loading && messages.length === 0 && (
        <div className="space-y-2">
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
             <div className="relative w-20 h-20 bg-slate-800/50 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-slate-700/50 group-hover:scale-110 transition-transform duration-300">
               <Mail className="w-8 h-8 text-slate-600 group-hover:text-brand-400 transition-colors duration-300" />
             </div>
          </div>
          <h3 className="text-lg font-semibold text-slate-300 mb-1">Your Inbox is Empty</h3>
          <p className="max-w-xs text-center text-sm text-slate-500 leading-relaxed">
            Ready to receive secure, anonymous emails.
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
      <div className="space-y-3">
      {filteredMessages.map((msg) => (
        <div
          key={msg.id}
          onClick={() => onSelect(msg.id)}
          className={`
            group relative overflow-hidden rounded-xl p-4 cursor-pointer transition-all duration-300 
            border hover:-translate-y-1 hover:shadow-xl
            ${!msg.seen 
              ? 'bg-gradient-to-r from-slate-800/90 to-slate-900/90 border-brand-500/30 shadow-lg shadow-brand-900/10' 
              : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
            }
          `}
        >
          {/* Unread Indicator Effect */}
          {!msg.seen && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-400 to-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
          )}

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center space-x-4 overflow-hidden flex-1">
              <div className={`
                flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner transition-transform group-hover:scale-105
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
                  {!msg.seen && <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                  </span>}
                </div>
                <p className={`text-sm truncate mb-1 ${!msg.seen ? 'text-slate-100 font-semibold' : 'text-slate-400'}`}>
                  {msg.subject || '(No Subject)'}
                </p>
                <p className="text-xs text-slate-500 truncate font-light group-hover:text-slate-400 transition-colors">
                  {msg.intro || 'No preview available...'}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col items-end space-y-3 ml-2">
               <span className={`text-[10px] sm:text-xs flex items-center gap-1 whitespace-nowrap ${!msg.seen ? 'text-brand-300 font-medium' : 'text-slate-600'}`}>
                  <Clock className="w-3 h-3" />
                  {new Date(msg.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
               </span>
               <div className="w-8 h-8 rounded-full bg-slate-800/0 group-hover:bg-brand-500/10 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 -mr-2 transform translate-x-2 group-hover:translate-x-0">
                 <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-400" />
               </div>
            </div>
          </div>
        </div>
      ))}
      </div>
    </div>
  );
};

export default InboxList;