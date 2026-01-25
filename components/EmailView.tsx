import React, { useEffect, useState } from 'react';
import { FullMailMessage, Mailbox } from '../types';
import { getMessageContent } from '../services/mailService';
import { ArrowLeft, Trash2, Download, Code, Eye, Sparkles } from 'lucide-react';
import GeminiPanel from './GeminiPanel';

interface EmailViewProps {
  id: string;
  mailbox: Mailbox;
  onBack: () => void;
}

const EmailView: React.FC<EmailViewProps> = ({ id, mailbox, onBack }) => {
  const [email, setEmail] = useState<FullMailMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'visual' | 'source'>('visual');
  const [showAI, setShowAI] = useState(true);

  useEffect(() => {
    const fetchEmail = async () => {
      setLoading(true);
      const data = await getMessageContent(mailbox.token, id);
      setEmail(data);
      setLoading(false);
    };
    fetchEmail();
  }, [id, mailbox]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-brand-500 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-slate-800"></div>
          </div>
        </div>
        <p className="text-slate-400 animate-pulse font-medium">Decrypting message...</p>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="text-center p-12 border border-slate-800 rounded-2xl bg-slate-900/50">
        <p className="text-red-400 mb-4">Unable to retrieve email content.</p>
        <button onClick={onBack} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-colors">
          Return to Inbox
        </button>
      </div>
    );
  }

  // Determine content to show
  const content = email.html && email.html.length > 0 ? email.html[0] : email.text;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full items-start">
      
      {/* Main Email Content */}
      <div className="flex-1 w-full bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col h-auto min-h-[600px]">
        
        {/* Toolbar */}
        <div className="bg-slate-900/95 backdrop-blur border-b border-slate-800 p-4 flex items-center justify-between sticky top-0 z-20">
          <button 
            onClick={onBack}
            className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-800 px-3 py-2 rounded-lg group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Inbox</span>
          </button>
          
          <div className="flex space-x-1">
            <button 
              onClick={() => setViewMode(viewMode === 'visual' ? 'source' : 'visual')}
              className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-medium px-3 ${viewMode === 'source' ? 'bg-brand-500/10 text-brand-400' : 'text-slate-400 hover:bg-slate-800'}`}
              title="Toggle Source View"
            >
              {viewMode === 'visual' ? <Code className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="hidden sm:inline">{viewMode === 'visual' ? 'View Source' : 'Visual Preview'}</span>
            </button>
             <div className="w-px h-6 bg-slate-700 mx-2 self-center"></div>
            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" title="Download">
              <Download className="w-4 h-4" />
            </button>
            <button className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Email Header Info */}
        <div className="p-6 bg-gradient-to-b from-slate-800/50 to-transparent">
          <h1 className="text-2xl font-bold text-white leading-tight mb-6">{email.subject || '(No Subject)'}</h1>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                 {email.from.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-white font-semibold text-base">{email.from}</p>
                <div className="flex items-center gap-2 mt-0.5">
                   <p className="text-slate-400 text-xs font-mono bg-slate-800/80 px-2 py-0.5 rounded">To: {mailbox.address}</p>
                   <span className="text-slate-600 text-xs">•</span>
                   <p className="text-slate-500 text-xs">{new Date(email.date).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 bg-white relative">
          {viewMode === 'visual' ? (
             <iframe
             title="Email Content"
             srcDoc={`
               <html>
                 <head>
                   <style>
                     body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; padding: 24px; line-height: 1.6; font-size: 16px; margin: 0; }
                     a { color: #4f46e5; text-decoration: none; }
                     a:hover { text-decoration: underline; }
                     img { max-width: 100%; height: auto; border-radius: 8px; }
                     blockquote { border-left: 4px solid #e2e8f0; margin: 0; padding-left: 16px; color: #64748b; }
                     pre { background: #f1f5f9; padding: 12px; border-radius: 8px; overflow-x: auto; }
                   </style>
                 </head>
                 <body>
                   ${content}
                 </body>
               </html>
             `}
             className="w-full h-full min-h-[500px]"
             sandbox="allow-popups allow-popups-to-escape-sandbox" 
           />
          ) : (
            <div className="absolute inset-0 bg-slate-950 p-6 overflow-auto">
              <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap font-light leading-relaxed">
                {content}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* AI Sidebar */}
      <div className="w-full lg:w-[350px] space-y-4 flex-shrink-0">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl sticky top-24">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-800">
            <Sparkles className="w-5 h-5 text-brand-400" />
            <h3 className="font-bold text-slate-200">Gemini AI Assistant</h3>
          </div>
          
          <GeminiPanel email={email} />
          
          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
             <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Protected by GhostMail Shield</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default EmailView;