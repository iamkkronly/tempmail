import React, { useEffect, useState } from 'react';
import { FullMailMessage, Mailbox } from '../types';
import { getMessageContent } from '../services/mailService';
import { ArrowLeft, Trash2, Download } from 'lucide-react';

interface EmailViewProps {
  id: string;
  mailbox: Mailbox;
  onBack: () => void;
}

const EmailView: React.FC<EmailViewProps> = ({ id, mailbox, onBack }) => {
  const [email, setEmail] = useState<FullMailMessage | null>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400">Loading message...</p>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="text-center p-10">
        <p className="text-red-400">Failed to load email content.</p>
        <button onClick={onBack} className="mt-4 text-slate-300 underline">Back to Inbox</button>
      </div>
    );
  }

  // Determine content to show (HTML prefers, then Text)
  const content = email.html && email.html.length > 0 ? email.html[0] : email.text;

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Header Toolbar */}
      <div className="bg-slate-800/80 backdrop-blur border-b border-slate-700 p-4 flex items-center justify-between sticky top-0 z-10">
        <button 
          onClick={onBack}
          className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors bg-slate-700/50 hover:bg-slate-700 px-3 py-2 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Inbox</span>
        </button>
        
        <div className="flex space-x-2">
          <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors" title="Download">
            <Download className="w-5 h-5" />
          </button>
          <button className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors" title="Delete">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        {/* Metadata */}
        <div className="space-y-4 border-b border-slate-800 pb-6">
          <h1 className="text-2xl font-bold text-white leading-tight">{email.subject}</h1>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold">
                 {email.from.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-white font-medium">{email.from}</p>
                <p className="text-slate-500 text-xs">{new Date(email.date).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Email Body */}
        <div className="bg-white rounded-lg p-1 min-h-[300px] border border-slate-700">
           {/* Sandbox iframe for security */}
           <iframe
             title="Email Content"
             srcDoc={`
               <html>
                 <head>
                   <style>
                     body { font-family: sans-serif; color: #1e293b; padding: 20px; line-height: 1.6; }
                     a { color: #4f46e5; }
                   </style>
                 </head>
                 <body>
                   ${content}
                 </body>
               </html>
             `}
             className="w-full h-[500px] rounded"
             sandbox="allow-popups allow-popups-to-escape-sandbox" 
           />
        </div>
      </div>
    </div>
  );
};

export default EmailView;