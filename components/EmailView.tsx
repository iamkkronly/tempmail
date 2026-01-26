import React, { useEffect, useState } from 'react';
import { FullMailMessage, Mailbox, Attachment } from '../types';
import { getMessageContent, downloadAttachment } from '../services/mailService';
import { ArrowLeft, Trash2, Download, Code, Eye, Sparkles, Printer, Volume2, StopCircle, Paperclip, File, RefreshCw } from 'lucide-react';
import GeminiPanel from './GeminiPanel';

interface EmailViewProps {
  id: string;
  mailbox: Mailbox;
  onBack: () => void;
  onDelete: (id: string) => void;
}

const EmailView: React.FC<EmailViewProps> = ({ id, mailbox, onBack, onDelete }) => {
  const [email, setEmail] = useState<FullMailMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'visual' | 'source'>('visual');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [downloadingAttId, setDownloadingAttId] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmail = async () => {
      setLoading(true);
      const data = await getMessageContent(mailbox.token, id);
      setEmail(data);
      setLoading(false);
    };
    fetchEmail();
    
    // Cleanup speech on unmount
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [id, mailbox]);

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this email permanently?')) {
      setIsDeleting(true);
      await onDelete(id);
      onBack();
    }
  };

  const handleDownload = () => {
    if (!email) return;
    const content = email.html && email.html.length > 0 ? email.html[0] : email.text;
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/html'});
    element.href = URL.createObjectURL(file);
    element.download = `${email.subject.replace(/[^a-z0-9]/gi, '_').substring(0, 50) || 'email'}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleAttachmentDownload = async (att: Attachment) => {
    setDownloadingAttId(att.id);
    const blob = await downloadAttachment(mailbox.token, id, att.id);
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = att.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      alert("Failed to download attachment");
    }
    setDownloadingAttId(null);
  };

  const handlePrint = () => {
    if (!email) return;
    const content = email.html && email.html.length > 0 ? email.html[0] : email.text;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${email.subject}</title>
            <style>
              body { font-family: sans-serif; padding: 20px; line-height: 1.6; }
              img { max-width: 100%; }
            </style>
          </head>
          <body>
            <h1>${email.subject}</h1>
            <p><strong>From:</strong> ${email.from}<br><strong>Date:</strong> ${new Date(email.date).toLocaleString()}</p>
            <hr>
            ${content}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  const handleSpeak = () => {
    if (!email) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const text = new DOMParser().parseFromString(
      email.html && email.html.length > 0 ? email.html[0] : email.text, 
      'text/html'
    ).body.textContent || email.text;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsSpeaking(false);
    
    // Select a decent voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

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
    <div className="flex flex-col lg:flex-row gap-6 h-full items-start animate-fade-in-up w-full max-w-full">
      
      {/* Main Email Content */}
      <div className="flex-1 w-full max-w-full bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col h-auto min-h-[600px]">
        
        {/* Toolbar - Responsive horizontal scroll */}
        <div className="bg-slate-900/95 backdrop-blur border-b border-slate-800 p-4 sticky top-0 z-20">
          <div className="flex items-center justify-between gap-4 overflow-x-auto no-scrollbar pb-1">
            <button 
              onClick={onBack}
              className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-800 px-3 py-2 rounded-lg group flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium hidden xs:inline">Inbox</span>
            </button>
            
            <div className="flex space-x-1 flex-shrink-0">
              <button 
                onClick={handleSpeak}
                className={`p-2 rounded-lg transition-colors ${isSpeaking ? 'text-brand-400 bg-brand-500/10 animate-pulse' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`} 
                title={isSpeaking ? "Stop Reading" : "Read Aloud"}
              >
                {isSpeaking ? <StopCircle className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button 
                onClick={handlePrint}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors hidden sm:block" 
                title="Print Email"
              >
                <Printer className="w-4 h-4" />
              </button>
              <div className="w-px h-6 bg-slate-700 mx-2 self-center hidden sm:block"></div>
              <button 
                onClick={() => setViewMode(viewMode === 'visual' ? 'source' : 'visual')}
                className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-medium px-3 ${viewMode === 'source' ? 'bg-brand-500/10 text-brand-400' : 'text-slate-400 hover:bg-slate-800'}`}
                title="Toggle Source View"
              >
                {viewMode === 'visual' ? <Code className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span className="hidden sm:inline whitespace-nowrap">{viewMode === 'visual' ? 'View Source' : 'Visual Preview'}</span>
              </button>
              <div className="w-px h-6 bg-slate-700 mx-2 self-center"></div>
              <button 
                onClick={handleDownload}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" 
                title="Download HTML"
              >
                <Download className="w-4 h-4" />
              </button>
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50" 
                title="Delete Email"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Email Header Info */}
        <div className="p-4 md:p-6 bg-gradient-to-b from-slate-800/50 to-transparent">
          <h1 className="text-lg md:text-2xl font-bold text-white leading-tight mb-4 md:mb-6 break-words">{email.subject || '(No Subject)'}</h1>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 md:space-x-4 min-w-0 flex-1">
              <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-tr from-brand-600 to-purple-600 flex items-center justify-center text-white font-bold text-base md:text-lg shadow-lg">
                 {email.from.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white font-semibold text-sm md:text-base truncate">{email.from}</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-0.5">
                   <p className="text-slate-400 text-xs font-mono bg-slate-800/80 px-2 py-0.5 rounded truncate w-fit max-w-full">To: {mailbox.address}</p>
                   <span className="text-slate-600 text-xs hidden sm:inline">•</span>
                   <p className="text-slate-500 text-xs whitespace-nowrap">{new Date(email.date).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Attachments Section */}
          {email.attachments && email.attachments.length > 0 && (
             <div className="mt-4 flex flex-wrap gap-2">
               {email.attachments.map(att => (
                 <button 
                   key={att.id}
                   onClick={() => handleAttachmentDownload(att)}
                   disabled={downloadingAttId === att.id}
                   className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-700/80 border border-slate-700/50 rounded-lg px-3 py-2 text-xs transition-all group"
                 >
                   {downloadingAttId === att.id ? (
                     <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-400" />
                   ) : (
                     <Paperclip className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-400" />
                   )}
                   <div className="flex flex-col items-start">
                     <span className="text-slate-200 font-medium truncate max-w-[150px]">{att.filename}</span>
                     <span className="text-[10px] text-slate-500">{formatBytes(att.size)}</span>
                   </div>
                   <Download className="w-3.5 h-3.5 text-slate-500 group-hover:text-white ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                 </button>
               ))}
             </div>
          )}
        </div>

        {/* Content Viewer */}
        <div className="flex-1 bg-white relative w-full">
          {viewMode === 'visual' ? (
             <iframe
             title="Email Content"
             srcDoc={`
               <html>
                 <head>
                   <style>
                     body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; padding: 16px; line-height: 1.6; font-size: 16px; margin: 0; word-wrap: break-word; }
                     a { color: #4f46e5; text-decoration: none; word-break: break-all; }
                     a:hover { text-decoration: underline; }
                     img { max-width: 100%; height: auto; border-radius: 8px; }
                     blockquote { border-left: 4px solid #e2e8f0; margin: 0; padding-left: 16px; color: #64748b; }
                     pre { background: #f1f5f9; padding: 12px; border-radius: 8px; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word; }
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
            <div className="absolute inset-0 bg-slate-950 p-4 md:p-6 overflow-auto">
              <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap font-light leading-relaxed break-all">
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
            <Sparkles className="w-5 h-5 text-brand-400 flex-shrink-0" />
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
