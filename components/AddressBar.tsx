import React, { useState, useEffect } from 'react';
import { Copy, RefreshCw, Check, Sparkles } from 'lucide-react';
import { Mailbox } from '../types';

interface AddressBarProps {
  mailbox: Mailbox | null;
  onRefresh: () => void;
  loading: boolean;
  onCopy: () => void; // New prop for triggering toast
}

const AddressBar: React.FC<AddressBarProps> = ({ mailbox, onRefresh, loading, onCopy }) => {
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(0);

  // Sync animation with the 5s polling interval of the parent
  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0;
        return prev + 2; // 50 steps * 100ms = 5000ms
      });
    }, 100);
    return () => clearInterval(interval);
  }, [mailbox]); // Reset when mailbox changes

  const handleCopy = () => {
    if (mailbox) {
      navigator.clipboard.writeText(mailbox.address);
      setCopied(true);
      onCopy();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative group rounded-2xl p-[1px] bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-r from-brand-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-lg opacity-50 group-hover:opacity-100 transition duration-1000"></div>
      
      <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl p-6 relative overflow-hidden">
        {/* Progress Bar for Auto-Refresh */}
        <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-brand-500 to-purple-500 transition-all duration-100 ease-linear" style={{ width: `${progress}%`, opacity: loading ? 0 : 0.5 }}></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-brand-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-3 h-3" /> Temporary Identity
              </label>
              <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                 <span className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                 {loading ? 'CREATING...' : 'ACTIVE'}
              </div>
            </div>
            
            <div className="relative group/input">
              <input
                type="text"
                readOnly
                value={mailbox?.address || 'Initializing secure tunnel...'}
                className="w-full bg-slate-950/50 border border-slate-700/50 text-white text-lg md:text-xl font-mono py-4 pl-6 pr-20 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500/50 transition-all shadow-inner"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                {mailbox && (
                  <button
                    onClick={handleCopy}
                    className="p-2.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all active:scale-95"
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
            className="flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 py-4 px-8 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed h-full mt-2 md:mt-8 shadow-lg hover:shadow-xl hover:shadow-brand-900/20"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            <span className="font-medium">Generate New</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddressBar;