import React, { useState, useEffect, useRef } from 'react';
import { Copy, RefreshCw, Check, Sparkles, QrCode, X } from 'lucide-react';
import { Mailbox } from '../types';

interface AddressBarProps {
  mailbox: Mailbox | null;
  onRefresh: () => void;
  loading: boolean;
  onCopy: () => void;
}

const AddressBar: React.FC<AddressBarProps> = ({ mailbox, onRefresh, loading, onCopy }) => {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [progress, setProgress] = useState(0);
  const qrRef = useRef<HTMLDivElement>(null);

  // Sync animation with the 5s polling interval
  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0;
        return prev + 2; 
      });
    }, 100);
    return () => clearInterval(interval);
  }, [mailbox]);

  // Click outside to close QR
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (qrRef.current && !qrRef.current.contains(event.target as Node)) {
        setShowQr(false);
      }
    };
    if (showQr) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showQr]);

  const handleCopy = () => {
    if (mailbox) {
      navigator.clipboard.writeText(mailbox.address);
      setCopied(true);
      onCopy();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative group rounded-2xl p-[1px] bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 shadow-2xl z-20">
      <div className="absolute inset-0 bg-gradient-to-r from-brand-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-lg opacity-50 group-hover:opacity-100 transition duration-1000"></div>
      
      <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl p-4 md:p-6 relative overflow-visible">
        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-brand-500 to-purple-500 transition-all duration-100 ease-linear rounded-b-2xl" style={{ width: `${progress}%`, opacity: loading ? 0 : 0.5 }}></div>

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
            
            <div className="relative group/input flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  readOnly
                  value={mailbox?.address || 'Initializing secure tunnel...'}
                  className="w-full bg-slate-950/50 border border-slate-700/50 text-white text-lg md:text-xl font-mono py-4 pl-6 pr-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500/50 transition-all shadow-inner"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                   {mailbox && (
                    <button
                      onClick={handleCopy}
                      className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all active:scale-95"
                      title="Copy to clipboard"
                    >
                      {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                    </button>
                  )}
                </div>
              </div>

              {mailbox && (
                <div className="relative" ref={qrRef}>
                  <button 
                    onClick={() => setShowQr(!showQr)}
                    className={`h-full px-4 rounded-xl border border-slate-700/50 flex items-center justify-center transition-all ${showQr ? 'bg-brand-500 text-white' : 'bg-slate-950/50 text-slate-400 hover:text-brand-400 hover:border-brand-500/30'}`}
                    title="Show QR Code"
                  >
                    <QrCode className="w-6 h-6" />
                  </button>

                  {/* QR Popover */}
                  {showQr && (
                    <div className="absolute top-full right-0 mt-4 p-4 bg-white rounded-2xl shadow-2xl shadow-brand-500/20 border-4 border-slate-800 animate-fade-in-up z-50 w-48 flex flex-col items-center">
                       <div className="relative">
                         <img 
                           src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${mailbox.address}&bgcolor=ffffff`} 
                           alt="QR Code" 
                           className="w-40 h-40 rounded-lg"
                         />
                         <div className="absolute inset-0 border-2 border-brand-500/20 rounded-lg pointer-events-none"></div>
                       </div>
                       <p className="text-slate-900 text-[10px] font-bold mt-2 uppercase tracking-wider">Scan to transfer</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 py-4 px-8 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed h-full mt-2 md:mt-8 shadow-lg hover:shadow-xl hover:shadow-brand-900/20 whitespace-nowrap"
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