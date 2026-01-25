import React, { useState, useEffect, useCallback } from 'react';
import { Mailbox, MailMessage, AppView, AccountDetails } from './types';
import { createAccount, getMessages, deleteMessage, markMessageSeen, getAccountDetails } from './services/mailService';
import AddressBar from './components/AddressBar';
import InboxList from './components/InboxList';
import EmailView from './components/EmailView';
import { Ghost, Shield, Zap, Lock, Bell, CheckCircle, Database, Keyboard } from 'lucide-react';

const STORAGE_KEY = 'ghostmail_account_v1';

const App: React.FC = () => {
  const [mailbox, setMailbox] = useState<Mailbox | null>(null);
  const [accountInfo, setAccountInfo] = useState<AccountDetails | null>(null);
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [view, setView] = useState<AppView>(AppView.INBOX);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'info'} | null>(null);

  // Show Toast
  const showToast = useCallback((message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Request Notification Permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;

      if (e.key === 'r' || e.key === 'R') {
         // Refresh logic could go here but we use auto-poll mostly.
         // Maybe force reload page or just toast?
      }

      if (e.key === 'Escape') {
        if (view === AppView.EMAIL_DETAIL) {
          handleBack();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view]);

  // Generate a brand new account
  const generateNewIdentity = useCallback(async () => {
    setLoading(true);
    try {
      const box = await createAccount();
      setMailbox(box);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(box));
      setMessages([]);
      setAccountInfo(null);
      setView(AppView.INBOX);
      setSelectedEmailId(null);
      showToast('New secure identity created', 'success');
    } catch (e) {
      console.error("Failed to create mailbox", e);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Initial load: Restore from storage or create new
  useEffect(() => {
    const storedAccount = localStorage.getItem(STORAGE_KEY);
    if (storedAccount) {
      try {
        const parsedBox = JSON.parse(storedAccount);
        if (parsedBox && parsedBox.address && parsedBox.token) {
          setMailbox(parsedBox);
          return;
        }
      } catch (e) {
        console.error("Failed to restore session", e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    generateNewIdentity();
  }, [generateNewIdentity]);

  // Polling for emails and account info
  useEffect(() => {
    if (!mailbox) return;

    const fetchData = async () => {
      // 1. Get Messages
      const msgs = await getMessages(mailbox.token);
      
      setMessages(prev => {
        // Detect new messages
        if (msgs.length > prev.length && prev.length > 0) {
           const newCount = msgs.length - prev.length;
           const latest = msgs[0];
           showToast(`${newCount} new message${newCount > 1 ? 's' : ''} received`, 'info');
           
           // Browser Notification
           if (document.hidden && Notification.permission === 'granted') {
             new Notification('New GhostMail', {
               body: `From: ${latest.from}\n${latest.subject}`,
               icon: '/vite.svg' // Fallback icon
             });
           }
        }
        return msgs;
      });

      // 2. Get Account Usage (Quota)
      const info = await getAccountDetails(mailbox.token);
      if (info) setAccountInfo(info);
    };

    setInboxLoading(true);
    fetchData().then(() => setInboxLoading(false)); // Initial explicit fetch
    
    const interval = setInterval(fetchData, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [mailbox, showToast]);

  const handleSelectEmail = async (id: string) => {
    // Optimistically mark as seen in UI
    setMessages(msgs => msgs.map(m => m.id === id ? { ...m, seen: true } : m));
    setSelectedEmailId(id);
    setView(AppView.EMAIL_DETAIL);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // API Call
    if (mailbox) {
       await markMessageSeen(mailbox.token, id);
    }
  };

  const handleBack = () => {
    setView(AppView.INBOX);
    setSelectedEmailId(null);
  };

  const handleDeleteEmail = async (id: string) => {
    if (!mailbox) return;
    
    const success = await deleteMessage(mailbox.token, id);
    if (success) {
      setMessages(msgs => msgs.filter(m => m.id !== id));
      showToast('Message deleted permanently', 'info');
      if (selectedEmailId === id) {
        handleBack();
      }
    }
  };

  // Helper to format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-brand-500/30 overflow-x-hidden relative flex flex-col">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px] animate-pulse-slow"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-900/10 rounded-full blur-[120px] animate-pulse-slow" style={{animationDelay: '1.5s'}}></div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 right-4 z-[100] animate-fade-in-left">
           <div className="bg-slate-800/90 backdrop-blur border border-slate-700 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-3">
              {toast.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <Bell className="w-5 h-5 text-brand-400" />}
              <span className="text-sm font-medium">{toast.message}</span>
           </div>
        </div>
      )}

      {/* Navbar */}
      <nav className="border-b border-slate-800/60 bg-slate-900/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => window.location.reload()}>
            <div className="bg-gradient-to-tr from-brand-600 to-indigo-600 p-2 rounded-lg shadow-lg shadow-brand-500/20 group-hover:shadow-brand-500/40 transition-shadow">
              <Ghost className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
              GhostMail AI
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-400">
            <div className="flex items-center space-x-2 hover:text-emerald-400 transition-colors cursor-help" title="End-to-end encryption compatible">
               <Shield className="w-4 h-4" /> <span>Secure</span>
            </div>
             <div className="flex items-center space-x-2 hover:text-brand-400 transition-colors cursor-help" title="Instant delivery">
               <Zap className="w-4 h-4" /> <span>Real-time</span>
            </div>
            <div className="flex items-center space-x-2 hover:text-purple-400 transition-colors cursor-help" title="No logs kept">
               <Lock className="w-4 h-4" /> <span>Anonymous</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8 space-y-8 flex-grow">
        
        {/* Address Generator */}
        <section className="transform transition-all duration-500 hover:scale-[1.005]">
          <AddressBar 
            mailbox={mailbox} 
            onRefresh={generateNewIdentity} 
            loading={loading}
            onCopy={() => showToast('Address copied to clipboard')}
          />
        </section>

        {/* Content Area */}
        <section className="min-h-[600px] animate-fade-in-up">
          {view === AppView.INBOX ? (
             <InboxList 
               messages={messages} 
               onSelect={handleSelectEmail} 
               loading={inboxLoading} 
             />
          ) : (
            mailbox && selectedEmailId && (
              <EmailView 
                id={selectedEmailId} 
                mailbox={mailbox} 
                onBack={handleBack}
                onDelete={handleDeleteEmail}
              />
            )
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-8 mt-auto text-slate-600 text-sm relative z-10 bg-slate-900/30">
         <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="font-medium text-slate-500">© {new Date().getFullYear()} GhostMail AI.</p>
              <p className="text-xs mt-1 text-slate-600">Anonymous & Encrypted Temporary Email.</p>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Stats / Quota */}
              {accountInfo && (
                <div className="hidden md:flex items-center gap-3 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50">
                   <Database className="w-3 h-3 text-brand-400" />
                   <div className="flex items-center gap-1 text-xs font-mono">
                     <span className="text-slate-300">{formatBytes(accountInfo.used)}</span>
                     <span className="text-slate-600">/</span>
                     <span className="text-slate-500">{formatBytes(accountInfo.quota)}</span>
                   </div>
                </div>
              )}
              
              <div className="hidden md:flex items-center gap-2 text-[10px] text-slate-600 font-mono border border-slate-800 rounded px-2 py-1">
                 <Keyboard className="w-3 h-3" />
                 <span>ESC to Back</span>
              </div>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default App;