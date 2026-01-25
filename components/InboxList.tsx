import React from 'react';
import { MailMessage } from '../types';
import { Mail, ChevronRight, Clock, Circle } from 'lucide-react';

interface InboxListProps {
  messages: MailMessage[];
  onSelect: (id: string) => void;
  loading: boolean;
}

const InboxList: React.FC<InboxListProps> = ({ messages, onSelect, loading }) => {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30 backdrop-blur-sm transition-all duration-500 hover:border-slate-700">
        <div className="relative group">
           <div className="absolute -inset-1 bg-gradient-to-r from-brand-600 to-indigo-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
           <div className="relative w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center mb-6 ring-1 ring-slate-700/50">
             <Mail className="w-10 h-10 text-slate-600 group-hover:text-brand-400 transition-colors duration-300" />
           </div>
        </div>
        <h3 className="text-xl font-bold text-slate-300 mb-2 tracking-tight">Your Inbox is Empty</h3>
        <p className="max-w-xs text-center text-sm text-slate-500 leading-relaxed">
          Waiting for incoming messages. Emails sent to your temporary address will appear here instantly.
        </p>
        {loading && (
          <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-full border border-slate-700/50">
             <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce"></div>
             <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce delay-75"></div>
             <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce delay-150"></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
       <div className="flex justify-between items-end px-2 mb-4">
         <h2 className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
           <span>Messages</span>
           <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full text-[10px]">{messages.length}</span>
         </h2>
         {loading && <span className="text-[10px] text-brand-400 font-medium uppercase tracking-wider animate-pulse">Syncing...</span>}
       </div>
      
      <div className="space-y-2">
      {messages.map((msg) => (
        <div
          key={msg.id}
          onClick={() => onSelect(msg.id)}
          className={`
            group relative overflow-hidden rounded-xl p-4 cursor-pointer transition-all duration-300 
            border hover:shadow-lg hover:-translate-y-0.5
            ${!msg.seen 
              ? 'bg-slate-800/80 border-brand-500/30 shadow-md shadow-brand-900/10' 
              : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
            }
          `}
        >
          {/* Unread Indicator Bar */}
          {!msg.seen && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-400 to-indigo-500"></div>
          )}

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center space-x-4 overflow-hidden flex-1">
              <div className={`
                flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner
                ${!msg.seen 
                  ? 'bg-gradient-to-br from-brand-500 to-indigo-600 ring-2 ring-brand-500/20' 
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
                  {!msg.seen && <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></div>}
                </div>
                <p className={`text-sm truncate mb-1 ${!msg.seen ? 'text-slate-200 font-semibold' : 'text-slate-400'}`}>
                  {msg.subject || '(No Subject)'}
                </p>
                <p className="text-xs text-slate-500 truncate font-light">
                  {msg.intro || 'No preview available...'}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col items-end space-y-2 ml-2">
               <span className={`text-xs flex items-center gap-1 whitespace-nowrap ${!msg.seen ? 'text-brand-300' : 'text-slate-600'}`}>
                  <Clock className="w-3 h-3" />
                  {new Date(msg.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
               </span>
               <div className="w-8 h-8 rounded-full bg-slate-800/0 group-hover:bg-slate-800 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 -mr-2">
                 <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
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