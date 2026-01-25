import React, { useState, useEffect, useCallback } from 'react';
import { Mailbox, MailMessage, AppView } from './types';
import { createAccount, getMessages } from './services/mailService';
import AddressBar from './components/AddressBar';
import InboxList from './components/InboxList';
import EmailView from './components/EmailView';
import { Ghost, Shield, Zap } from 'lucide-react';

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
    // Only create new if restoration failed or didn't exist
    generateNewIdentity();
  }, [generateNewIdentity]);

  // Polling for emails
  useEffect(() => {
    if (!mailbox) return;

    const fetchMessages = async () => {
      // Don't show loading spinner on background polls to keep UI stable
      // Only show if we have 0 messages (initial fetch for this session)
      if (messages.length === 0) setInboxLoading(true);
      
      const msgs = await getMessages(mailbox.token);
      setMessages(msgs);
      setInboxLoading(false);
    };

    fetchMessages(); // Initial fetch
    const interval = setInterval(fetchMessages, 5000); // Poll every 5s

    return () => clearInterval(interval);
  }, [mailbox]); // Remove messages dependency to avoid loops, mailbox is stable enough

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
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-brand-500/30">
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.location.reload()}>
            <div className="bg-brand-600 p-2 rounded-lg shadow-lg shadow-brand-500/20">
              <Ghost className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              GhostMail AI
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-400">
            <div className="flex items-center space-x-1 hover:text-brand-400 transition-colors">
               <Shield className="w-4 h-4" /> <span>Secure</span>
            </div>
             <div className="flex items-center space-x-1 hover:text-brand-400 transition-colors">
               <Zap className="w-4 h-4" /> <span>Fast</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        
        {/* Address Generator */}
        <section>
          <AddressBar 
            mailbox={mailbox} 
            onRefresh={generateNewIdentity} 
            loading={loading} 
          />
        </section>

        {/* Content Area */}
        <section className="min-h-[500px]">
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
      <footer className="border-t border-slate-800 py-8 mt-12 text-center text-slate-600 text-sm">
         <p>© {new Date().getFullYear()} GhostMail AI. Anonymous. Encrypted.</p>
      </footer>
    </div>
  );
};

export default App;