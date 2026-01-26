import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mailbox, MailMessage, AppView, AccountDetails, ThemeOption } from './types';
import { createAccount, getMessages, deleteMessage, markMessageSeen, getAccountDetails } from './services/mailService';
import AddressBar from './components/AddressBar';
import InboxList from './components/InboxList';
import EmailView from './components/EmailView';
import Sidebar from './components/Sidebar';
import { Shield, Zap, Lock, Bell, CheckCircle, Keyboard, Palette, Moon, Sun, Droplet, Menu, HelpCircle, X, Wifi, WifiOff, Eye, EyeOff, Volume2, VolumeX, Unlock } from 'lucide-react';

const STORAGE_KEY = 'ghostmail_accounts_v2';
const THEME_KEY = 'ghostmail_theme_v1';
const AUTO_DELETE_DAYS = 7;

// RGB values for themes
const THEMES: Record<ThemeOption, Record<string, string>> = {
  dark: {
    '--slate-50': '248 250 252',
    '--slate-100': '241 245 249',
    '--slate-200': '226 232 240',
    '--slate-300': '203 213 225',
    '--slate-400': '148 163 184',
    '--slate-500': '100 116 139',
    '--slate-600': '71 85 105',
    '--slate-700': '51 65 85',
    '--slate-800': '30 41 59',
    '--slate-850': '21 31 50',
    '--slate-900': '15 23 42',
    '--slate-950': '2 6 23',
  },
  light: {
    '--slate-50': '2 6 23',
    '--slate-100': '15 23 42',
    '--slate-200': '30 41 59',
    '--slate-300': '71 85 105',
    '--slate-400': '100 116 139',
    '--slate-500': '148 163 184',
    '--slate-600': '203 213 225',
    '--slate-700': '226 232 240',
    '--slate-800': '241 245 249',
    '--slate-850': '255 255 255',
    '--slate-900': '255 255 255',
    '--slate-950': '248 250 252',
  },
  blue: {
    '--slate-50': '230 240 255',
    '--slate-100': '200 220 250',
    '--slate-200': '180 200 240',
    '--slate-300': '140 170 220',
    '--slate-400': '100 130 190',
    '--slate-500': '60 90 150',
    '--slate-600': '40 70 120',
    '--slate-700': '30 50 90',
    '--slate-800': '20 35 70',
    '--slate-850': '15 25 55',
    '--slate-900': '10 18 40',
    '--slate-950': '5 10 25',
  }
};

const ShortcutsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-fade-in-up" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
           <Keyboard className="w-5 h-5 text-brand-400" /> Shortcuts
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
      </div>
      <div className="space-y-4">
         <div className="flex justify-between items-center">
            <span className="text-slate-300 text-sm">Refresh Inbox</span>
            <span className="px-2 py-1 bg-slate-800 rounded-lg text-xs font-mono text-slate-400 border border-slate-700">R</span>
         </div>
         <div className="flex justify-between items-center">
            <span className="text-slate-300 text-sm">Back to Inbox</span>
            <span className="px-2 py-1 bg-slate-800 rounded-lg text-xs font-mono text-slate-400 border border-slate-700">Esc</span>
         </div>
         <div className="flex justify-between items-center">
            <span className="text-slate-300 text-sm">Toggle Privacy Mode</span>
            <span className="px-2 py-1 bg-slate-800 rounded-lg text-xs font-mono text-slate-400 border border-slate-700">P</span>
         </div>
         <div className="flex justify-between items-center">
            <span className="text-slate-300 text-sm">Lock Session</span>
            <span className="px-2 py-1 bg-slate-800 rounded-lg text-xs font-mono text-slate-400 border border-slate-700">L</span>
         </div>
         <div className="flex justify-between items-center">
            <span className="text-slate-300 text-sm">Focus Search</span>
            <span className="px-2 py-1 bg-slate-800 rounded-lg text-xs font-mono text-slate-400 border border-slate-700">/</span>
         </div>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  // State for multiple accounts
  const [accounts, setAccounts] = useState<Mailbox[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);

  // Derived state for active session
  const activeAccount = accounts.find(a => a.id === activeAccountId) || null;

  const [accountInfo, setAccountInfo] = useState<AccountDetails | null>(null);
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [view, setView] = useState<AppView>(AppView.INBOX);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'info' | 'error'} | null>(null);
  const [theme, setTheme] = useState<ThemeOption>('dark');
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  // Advanced Features State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  // Audio Ref
  const notificationSound = useRef<HTMLAudioElement | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    // Simple beep sound using data URI to avoid external dependencies
    const audio = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"); // Placeholder for actual sound or implement web audio api
    // Let's use a real web audio API beep for better quality without external files
    notificationSound.current = audio; 

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    // Simple oscillator beep
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch (e) {
      console.error("Audio play failed", e);
    }
  }, [soundEnabled]);

  // Show Toast
  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Persist accounts
  useEffect(() => {
    if (accounts.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    }
  }, [accounts]);

  // Request Notification Permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Theme Management
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY) as ThemeOption;
    if (savedTheme && THEMES[savedTheme]) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const colors = THEMES[theme];
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(key, value as string);
    });
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // Create a new account
  const handleAddAccount = useCallback(async (customUser?: string, customDomain?: string) => {
    setLoading(true);
    try {
      const box = await createAccount(customUser, customDomain);
      
      if (!box.id) box.id = Math.random().toString(36).substr(2, 9);
      
      setAccounts(prev => [...prev, box]);
      setActiveAccountId(box.id);
      
      setMessages([]);
      setAccountInfo(null);
      setView(AppView.INBOX);
      setSelectedEmailId(null);
      
      showToast('New identity active', 'success');
    } catch (e: any) {
      console.error("Failed to create mailbox", e);
      showToast(e.message || "Failed to generate identity", 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Initial load: Restore from storage or create new
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const storedAccounts = localStorage.getItem(STORAGE_KEY);
    if (storedAccounts) {
      try {
        const parsedAccounts = JSON.parse(storedAccounts);
        if (Array.isArray(parsedAccounts) && parsedAccounts.length > 0) {
          setAccounts(parsedAccounts);
          setActiveAccountId(parsedAccounts[0].id || null);
          return;
        }
      } catch (e) {
        console.error("Failed to restore session", e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    // If no accounts, generate one
    handleAddAccount();
  }, [handleAddAccount]); 

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;

      if (e.key === '?') setShowShortcuts(prev => !prev);
      if (e.key.toLowerCase() === 'p') {
          setPrivacyMode(prev => {
             const newVal = !prev;
             showToast(`Privacy Mode ${newVal ? 'Enabled' : 'Disabled'}`, 'info');
             return newVal;
          });
      }
      if (e.key.toLowerCase() === 'l') {
          setIsLocked(true);
      }
      
      if (e.key === 'Escape') {
        if (view === AppView.EMAIL_DETAIL) {
          handleBack();
        } else {
          setShowShortcuts(false);
        }
      }

      // Basic Slash to search handled by InboxList ideally, but we can prevent default if needed
      if (e.key === '/') {
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (searchInput) {
          e.preventDefault();
          searchInput.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, showToast]);

  const handleRemoveAccount = (id: string) => {
    if (accounts.length <= 1) {
      if (confirm("This is your last active identity. Replacing it with a new one?")) {
          handleAddAccount().then(() => {
            setAccounts(prev => prev.filter(a => a.id !== id));
          });
      }
      return;
    }
    
    if (confirm("Permanently destroy this identity? All messages will be lost.")) {
      const isCurrent = activeAccountId === id;
      setAccounts(prev => prev.filter(a => a.id !== id));
      if (isCurrent) {
         const remaining = accounts.filter(a => a.id !== id);
         if (remaining.length > 0) setActiveAccountId(remaining[0].id!);
      }
      showToast("Identity destroyed", 'info');
    }
  };

  const handleSwitchAccount = (id: string) => {
    if (id === activeAccountId) return;
    setActiveAccountId(id);
    setView(AppView.INBOX);
    setSelectedEmailId(null);
    setMessages([]); 
    setAccountInfo(null);
    setInboxLoading(true); 
  };

  const handleExport = () => {
    if (!activeAccount) return;
    const data = {
      account: activeAccount.address,
      exportedAt: new Date().toISOString(),
      messages: messages
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ghostmail_backup_${activeAccount.address.split('@')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Inbox backup downloaded", 'success');
  };

  const fetchMailData = useCallback(async () => {
    if (!activeAccount || !isOnline) return;
    
    const rawMsgs = await getMessages(activeAccount.token);
    
    const now = Date.now();
    const retentionLimit = now - (AUTO_DELETE_DAYS * 24 * 60 * 60 * 1000);
    
    const activeMsgs: MailMessage[] = [];
    const expiredMsgs: MailMessage[] = [];

    rawMsgs.forEach(msg => {
      const msgTime = new Date(msg.date).getTime();
      if (msgTime < retentionLimit) {
          expiredMsgs.push(msg);
      } else {
          activeMsgs.push(msg);
      }
    });

    if (expiredMsgs.length > 0) {
      Promise.all(expiredMsgs.map(m => deleteMessage(activeAccount.token, m.id)))
          .then(() => console.log(`Cleaned ${expiredMsgs.length} expired messages`))
          .catch(e => console.error("Auto-delete failed", e));
    }
    
    setMessages(prev => {
      if (prev.length > 0) {
         const prevIds = new Set(prev.map(m => m.id));
         const newMsgs = activeMsgs.filter(m => !prevIds.has(m.id));
         
         if (newMsgs.length > 0) {
           const latest = newMsgs[0];
           showToast(`${newMsgs.length} new message${newMsgs.length > 1 ? 's' : ''}`, 'info');
           playNotificationSound();

           if (document.hidden && Notification.permission === 'granted') {
             new Notification('New GhostMail', {
               body: `From: ${latest.from}\n${latest.subject}`,
               icon: '/vite.svg' 
             });
           }
         }
      }
      return activeMsgs;
    });

    const info = await getAccountDetails(activeAccount.token);
    if (info) setAccountInfo(info);
  }, [activeAccount, isOnline, showToast, playNotificationSound]);

  useEffect(() => {
    if (!activeAccount) return;

    setInboxLoading(true);
    fetchMailData().then(() => setInboxLoading(false)); 
    
    const interval = setInterval(fetchMailData, 5000); 
    return () => clearInterval(interval);
  }, [activeAccount, fetchMailData]);

  const handleManualRefresh = async () => {
    setInboxLoading(true);
    await fetchMailData();
    setInboxLoading(false);
  };

  const handleSelectEmail = async (id: string) => {
    setMessages(msgs => msgs.map(m => m.id === id ? { ...m, seen: true } : m));
    setSelectedEmailId(id);
    setView(AppView.EMAIL_DETAIL);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (activeAccount) {
       await markMessageSeen(activeAccount.token, id);
    }
  };

  const handleBack = () => {
    setView(AppView.INBOX);
    setSelectedEmailId(null);
  };

  const handleMarkSeen = async (id: string) => {
    if (!activeAccount) return;
    setMessages(msgs => msgs.map(m => m.id === id ? { ...m, seen: true } : m));
    await markMessageSeen(activeAccount.token, id);
  };

  const handleBulkMarkSeen = async (ids: string[]) => {
    if (!activeAccount) return;
    setMessages(msgs => msgs.map(m => ids.includes(m.id) ? { ...m, seen: true } : m));
    await Promise.all(ids.map(id => markMessageSeen(activeAccount!.token, id)));
    showToast(`Marked ${ids.length} messages as read`, 'success');
  };

  const handleDeleteEmail = async (id: string) => {
    if (!activeAccount) return;
    setMessages(msgs => msgs.filter(m => m.id !== id));
    const success = await deleteMessage(activeAccount.token, id);
    if (success) {
      showToast('Message deleted', 'info');
      if (selectedEmailId === id) {
        handleBack();
      }
    } else {
      handleManualRefresh();
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
     if (!activeAccount) return;
     setMessages(msgs => msgs.filter(m => !ids.includes(m.id)));
     await Promise.all(ids.map(id => deleteMessage(activeAccount!.token, id)));
     showToast(`Deleted ${ids.length} messages`, 'info');
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans selection:bg-brand-500/30 overflow-hidden relative transition-colors duration-500">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px] animate-pulse-slow"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-900/10 rounded-full blur-[120px] animate-pulse-slow" style={{animationDelay: '1.5s'}}></div>
         <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      </div>

      {/* Lock Screen */}
      {isLocked && (
        <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-xl flex flex-col items-center justify-center space-y-6 animate-fade-in-up">
           <div className="p-8 rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl flex flex-col items-center space-y-4 max-w-sm w-full relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div className="p-4 bg-slate-800 rounded-full ring-4 ring-slate-800/50">
                 <Lock className="w-8 h-8 text-brand-400" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">GhostMail Locked</h2>
              <p className="text-slate-400 text-center text-sm">Session is secure. Unlock to access your inbox.</p>
              <button 
                onClick={() => setIsLocked(false)}
                className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4" /> Unlock Session
              </button>
           </div>
        </div>
      )}

      {/* Shortcuts Modal */}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] animate-fade-in-left max-w-[90vw]">
           <div className={`backdrop-blur border px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-3 ${
             toast.type === 'error' ? 'bg-red-900/90 border-red-700 text-white' : 'bg-slate-800/90 border-slate-700 text-white'
           }`}>
              {toast.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" /> : 
               toast.type === 'error' ? <Bell className="w-5 h-5 text-white flex-shrink-0" /> :
               <Bell className="w-5 h-5 text-brand-400 flex-shrink-0" />}
              <span className="text-sm font-medium">{toast.message}</span>
           </div>
        </div>
      )}

      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 bg-slate-800 rounded-lg shadow-lg border border-slate-700 text-white"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 md:relative md:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar 
          accounts={accounts}
          activeId={activeAccountId}
          onSelect={(id) => { handleSwitchAccount(id); setMobileMenuOpen(false); }}
          onAdd={() => handleAddAccount()}
          onRemove={handleRemoveAccount}
          onExport={handleExport}
        />
      </div>
      
      {/* Overlay for mobile sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        
        {/* Navbar */}
        <nav className="border-b border-slate-800/60 bg-slate-900/40 backdrop-blur-md sticky top-0 z-20 transition-colors duration-500 px-4 md:px-8 h-16 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4 pl-10 md:pl-0">
             {/* Breadcrumbs or Status */}
             <div className="hidden md:flex items-center space-x-2 text-sm text-slate-500">
                <span className="hover:text-slate-300 cursor-pointer">GhostMail</span>
                <span>/</span>
                <span className="text-slate-300 font-medium">{activeAccount ? 'Inbox' : 'Dashboard'}</span>
             </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Status Indicators */}
            <div className="hidden sm:flex items-center bg-slate-800/50 rounded-lg p-1 border border-slate-700/50 mr-2">
              <button 
                onClick={() => setPrivacyMode(!privacyMode)}
                className={`p-1.5 rounded-md transition-all ${privacyMode ? 'bg-brand-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                title={privacyMode ? "Privacy Mode On" : "Privacy Mode Off"}
              >
                {privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-1.5 rounded-md transition-all ${!soundEnabled ? 'text-slate-500' : 'text-slate-300 hover:text-white'}`}
                title={soundEnabled ? "Sound On" : "Sound Off"}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              
              <button 
                onClick={() => setIsLocked(true)}
                className={`p-1.5 rounded-md transition-all text-slate-400 hover:text-white`}
                title="Lock Session"
              >
                <Lock className="w-4 h-4" />
              </button>

              <div className="w-px h-4 bg-slate-700 mx-1"></div>
              <div className="px-2 flex items-center gap-1.5 text-xs font-mono">
                {isOnline ? <Wifi className="w-3 h-3 text-emerald-400" /> : <WifiOff className="w-3 h-3 text-red-400" />}
                <span className={isOnline ? 'text-emerald-400' : 'text-red-400'}>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
              </div>
            </div>

             {/* Tech Badges */}
            <div className="hidden lg:flex items-center space-x-6 text-xs font-medium text-slate-500 mr-4">
              <div className="flex items-center space-x-1.5" title="Encrypted">
                <Shield className="w-3.5 h-3.5 text-emerald-500" /> <span>Secure</span>
              </div>
              <div className="flex items-center space-x-1.5" title="Fast">
                <Zap className="w-3.5 h-3.5 text-brand-500" /> <span>Turbo</span>
              </div>
              <div className="flex items-center space-x-1.5" title="No Logs">
                <Lock className="w-3.5 h-3.5 text-purple-500" /> <span>Private</span>
              </div>
            </div>

            <button
               onClick={() => setShowShortcuts(true)}
               className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors hidden md:block"
               title="Keyboard Shortcuts (?)"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            {/* Theme Toggle */}
            <div className="relative">
              <button 
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                title="Change Theme"
              >
                <Palette className="w-5 h-5" />
              </button>
              
              {showThemeMenu && (
                <div className="absolute right-0 top-full mt-2 w-40 bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden z-50">
                  <div className="p-1 space-y-1">
                    <button 
                      onClick={() => { setTheme('dark'); setShowThemeMenu(false); }}
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-slate-800 text-slate-400"
                    >
                      <Moon className="w-4 h-4" /> <span>Dark</span>
                    </button>
                    <button 
                      onClick={() => { setTheme('light'); setShowThemeMenu(false); }}
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-slate-800 text-slate-400"
                    >
                      <Sun className="w-4 h-4" /> <span>Light</span>
                    </button>
                    <button 
                      onClick={() => { setTheme('blue'); setShowThemeMenu(false); }}
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-slate-800 text-slate-400"
                    >
                      <Droplet className="w-4 h-4" /> <span>Blue</span>
                    </button>
                  </div>
                </div>
              )}
              {showThemeMenu && (
                <div className="fixed inset-0 z-40" onClick={() => setShowThemeMenu(false)}></div>
              )}
            </div>
          </div>
        </nav>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 space-y-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          
          {/* Address Generator / Dashboard Header */}
          <section className="transform transition-all duration-500 max-w-5xl mx-auto w-full">
            <AddressBar 
              mailbox={activeAccount} 
              onRefresh={handleAddAccount} 
              loading={loading}
              onCopy={() => showToast('Address copied to clipboard')}
              accountInfo={accountInfo}
            />
          </section>

          {/* Inbox / Email View */}
          <section className="min-h-[500px] animate-fade-in-up max-w-5xl mx-auto w-full">
            {view === AppView.INBOX ? (
               <InboxList 
                 messages={messages} 
                 onSelect={handleSelectEmail} 
                 loading={inboxLoading}
                 onRefresh={handleManualRefresh}
                 onDelete={handleDeleteEmail}
                 onMarkSeen={handleMarkSeen}
                 onBulkDelete={handleBulkDelete}
                 onBulkMarkSeen={handleBulkMarkSeen}
                 privacyMode={privacyMode}
               />
            ) : (
              activeAccount && selectedEmailId && (
                <EmailView 
                  id={selectedEmailId} 
                  mailbox={activeAccount} 
                  onBack={handleBack}
                  onDelete={handleDeleteEmail}
                />
              )
            )}
          </section>

          {/* Footer inside scroll area */}
          <footer className="pt-8 pb-4 text-center text-slate-600 text-xs">
              <p>© {new Date().getFullYear()} GhostMail. End-to-end encrypted temporary email.</p>
          </footer>

        </main>
      </div>
    </div>
  );
};

export default App;