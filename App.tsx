import React, { useState, useEffect, useCallback } from 'react';
import { Mailbox, MailMessage, AppView } from './types';
import { createAccount, getMessages } from './services/mailService';
import AddressBar from './components/AddressBar';
import InboxList from './components/InboxList';
import EmailView from './components/EmailView';
import { Ghost, Shield, Zap, Lock } from 'lucide-react';

const STORAGE_KEY = 'ghostmail_account_v1';

const App: React.FC = () => {
  const [mailbox, setMailbox] = useState<Mailbox | null>(null);
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [view, setView] = useState<AppView>(AppView.INBOX);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [inboxLoading, setInboxLoading] = useState(false);

  // Generate a brand new account
  const generateNewIdentity = useCallback(async () => {
    setLoading(true);
    try {
      const box = await createAccount();
      setMailbox(box);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(box));
      setMessages([]);
      setView(AppView.INBOX);
      setSelectedEmailId(null);
    } catch (e) {
      console.error("Failed to create mailbox", e);
    } finally {
      setLoading(false);
    }
  }, []);

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

  // Polling for emails
  useEffect(() => {
    if (!mailbox) return;

    const fetchMessages = async () => {
      // Background poll - update silently
      const msgs = await getMessages(mailbox.token);
      setMessages(msgs);
    };

    setInboxLoading(true);
    fetchMessages().then(() => setInboxLoading(false)); // Initial explicit fetch
    
    const interval = setInterval(fetchMessages, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [mailbox]);

  const handleSelectEmail = (id: string) => {
    setSelectedEmailId(id);
    setView(AppView.EMAIL_DETAIL);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setView(AppView.INBOX);
    setSelectedEmailId(null);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-brand-500/30 overflow-x-hidden relative">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px] animate-pulse-slow"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-900/10 rounded-full blur-[120px] animate-pulse-slow" style={{animationDelay: '1.5s'}}></div>
      </div>

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

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8 space-y-8">
        
        {/* Address Generator */}
        <section className="transform transition-all duration-500 hover:scale-[1.01]">
          <AddressBar 
            mailbox={mailbox} 
            onRefresh={generateNewIdentity} 
            loading={loading} 
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
              />
            )
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-10 mt-12 text-center text-slate-600 text-sm relative z-10 bg-slate-900/30">
         <div className="max-w-2xl mx-auto space-y-4">
            <p className="font-medium text-slate-500">© {new Date().getFullYear()} GhostMail AI.</p>
            <p className="text-xs max-w-md mx-auto">
              Temporary email service provided for testing and privacy purposes. 
              Emails are automatically deleted after a period of time. 
              Powered by Google Gemini for intelligent analysis.
            </p>
         </div>
      </footer>
    </div>
  );
};

export default App;