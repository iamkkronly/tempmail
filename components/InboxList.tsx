import React from 'react';
import { MailMessage } from '../types';
import { Mail, ChevronRight, Clock } from 'lucide-react';

interface InboxListProps {
  messages: MailMessage[];
  onSelect: (id: string) => void;
  loading: boolean;
}

const InboxList: React.FC<InboxListProps> = ({ messages, onSelect, loading }) => {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
          <Mail className="w-8 h-8 text-slate-600" />
        </div>
        <h3 className="text-xl font-semibold text-slate-300 mb-2">Inbox is Empty</h3>
        <p className="max-w-xs text-center text-sm">Emails sent to your temporary address will appear here automatically.</p>
        {loading && <p className="mt-4 text-xs text-brand-400 animate-pulse">Checking for new mail...</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
       <div className="flex justify-between items-center px-2 mb-2">
         <h2 className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Inbox ({messages.length})</h2>
         {loading && <span className="text-xs text-brand-400 animate-pulse">Syncing...</span>}
       </div>
      {messages.map((msg) => (
        <div
          key={msg.id}
          onClick={() => onSelect(msg.id)}
          className="group bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 hover:border-brand-500/30 rounded-xl p-4 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                {msg.from.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate group-hover:text-brand-300 transition-colors">
                  {msg.from}
                </p>
                <p className="text-sm text-slate-300 truncate">{msg.subject || '(No Subject)'}</p>
                <p className="text-xs text-slate-500 truncate mt-1">{msg.intro}</p>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-1 ml-4">
               <span className="text-xs text-slate-500 flex items-center gap-1 whitespace-nowrap">
                  <Clock className="w-3 h-3" />
                  {new Date(msg.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
               </span>
               <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default InboxList;