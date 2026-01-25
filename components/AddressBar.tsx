import React, { useState } from 'react';
import { Copy, RefreshCw, Check } from 'lucide-react';
import { Mailbox } from '../types';

interface AddressBarProps {
  mailbox: Mailbox | null;
  onRefresh: () => void;
  loading: boolean;
}

const AddressBar: React.FC<AddressBarProps> = ({ mailbox, onRefresh, loading }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (mailbox) {
      navigator.clipboard.writeText(mailbox.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 via-purple-500 to-pink-500"></div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <label className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-2 block">
            Your Temporary Identity
          </label>
          <div className="relative">
            <input
              type="text"
              readOnly
              value={mailbox?.address || 'Click New Address to start...'}
              className="w-full bg-slate-950 border border-slate-700 text-white text-lg md:text-xl font-mono py-4 pl-6 pr-16 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              {mailbox && (
                <button
                  onClick={handleCopy}
                  className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center justify-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white py-4 px-6 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed h-full mt-6 md:mt-0"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          <span>New Address</span>
        </button>
      </div>
      
      <div className="mt-4 flex items-center space-x-2 text-xs text-slate-500">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>Auto-refreshing inbox every 5s</span>
      </div>
    </div>
  );
};

export default AddressBar;