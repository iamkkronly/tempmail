import React, { useState } from 'react';
import { AIAnalysisResult, FullMailMessage } from '../types';
import { analyzeEmail, draftReply } from '../services/geminiService';
import { ShieldAlert, ShieldCheck, Sparkles, Bot, PenTool, Volume2 } from 'lucide-react';

interface GeminiPanelProps {
  email: FullMailMessage;
}

const GeminiPanel: React.FC<GeminiPanelProps> = ({ email }) => {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const [replyLoading, setReplyLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    const result = await analyzeEmail(email);
    setAnalysis(result);
    setLoading(false);
  };

  const handleDraftReply = async (tone: string) => {
    setReplyLoading(true);
    setReply(null);
    const result = await draftReply(email, tone);
    setReply(result);
    setReplyLoading(false);
  };

  const handleSpeakSummary = () => {
    if (!analysis) return;
    window.speechSynthesis.cancel();
    const text = `Security Risk Level: ${analysis.riskLevel}. Summary: ${analysis.summary}`;
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  if (loading) {
    return (
      <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl animate-pulse">
        <div className="flex items-center space-x-3 mb-4">
          <Sparkles className="w-5 h-5 text-brand-400 animate-spin" />
          <span className="text-slate-300 font-medium">Gemini is analyzing email security...</span>
        </div>
        <div className="h-2 bg-slate-800 rounded w-3/4 mb-2"></div>
        <div className="h-2 bg-slate-800 rounded w-1/2"></div>
      </div>
    );
  }

  if (!analysis && !loading && !reply) {
    return (
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleAnalyze}
          className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white py-3 px-4 rounded-xl transition-all shadow-lg shadow-brand-900/20"
        >
          <Sparkles className="w-5 h-5 flex-shrink-0" />
          <span className="whitespace-nowrap">Analyze Security</span>
        </button>
        <button
          onClick={() => handleDraftReply('Professional')}
          disabled={replyLoading}
          className="flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 py-3 px-4 rounded-xl transition-all border border-slate-700"
        >
          <PenTool className="w-5 h-5 flex-shrink-0" />
          <span className="whitespace-nowrap">Draft Reply</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {analysis && (
        <div className={`p-5 rounded-xl border ${
          analysis.riskLevel === 'HIGH' ? 'bg-red-950/30 border-red-900/50' : 
          analysis.riskLevel === 'MEDIUM' ? 'bg-yellow-950/30 border-yellow-900/50' : 
          'bg-emerald-950/30 border-emerald-900/50'
        }`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              {analysis.riskLevel === 'LOW' ? (
                <ShieldCheck className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              ) : (
                <ShieldAlert className={`w-6 h-6 flex-shrink-0 ${analysis.riskLevel === 'HIGH' ? 'text-red-500' : 'text-yellow-500'}`} />
              )}
              <div>
                <h3 className="font-semibold text-white">Security Analysis</h3>
                <p className={`text-sm font-medium ${
                  analysis.riskLevel === 'HIGH' ? 'text-red-400' : 
                  analysis.riskLevel === 'MEDIUM' ? 'text-yellow-400' : 
                  'text-emerald-400'
                }`}>
                  Risk Level: {analysis.riskLevel} (Score: {analysis.phishingScore}/100)
                </p>
              </div>
            </div>
            <Bot className="w-5 h-5 text-slate-500 flex-shrink-0" />
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                 <h4 className="text-xs uppercase tracking-wider text-slate-500 font-bold">Summary</h4>
                 <button onClick={handleSpeakSummary} className="text-slate-500 hover:text-brand-400" title="Listen to summary">
                    <Volume2 className="w-3 h-3" />
                 </button>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{analysis.summary}</p>
            </div>
            
            {analysis.actionableItems.length > 0 && (
              <div>
                <h4 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Action Items</h4>
                <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                  {analysis.actionableItems.map((item, idx) => (
                    <li key={idx} className="break-words">{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {replyLoading && (
         <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-center text-slate-400">
           Generating draft...
         </div>
      )}

      {reply && (
        <div className="p-5 bg-slate-900 rounded-xl border border-slate-700">
          <div className="flex justify-between items-center mb-3">
             <h4 className="text-sm font-semibold text-brand-400 flex items-center gap-2">
               <PenTool className="w-4 h-4" /> AI Drafted Reply
             </h4>
             <button onClick={() => {navigator.clipboard.writeText(reply)}} className="text-xs text-slate-500 hover:text-white transition-colors">Copy</button>
          </div>
          <pre className="whitespace-pre-wrap text-slate-300 text-sm font-sans bg-black/20 p-4 rounded-lg border border-white/5 overflow-x-auto">
            {reply}
          </pre>
          <div className="flex flex-wrap gap-2 mt-3">
             <button onClick={() => handleDraftReply('Professional')} className="px-3 py-1 text-xs bg-slate-800 rounded border border-slate-700 text-slate-400 hover:text-white">Professional</button>
             <button onClick={() => handleDraftReply('Friendly')} className="px-3 py-1 text-xs bg-slate-800 rounded border border-slate-700 text-slate-400 hover:text-white">Friendly</button>
             <button onClick={() => handleDraftReply('Angry')} className="px-3 py-1 text-xs bg-slate-800 rounded border border-slate-700 text-slate-400 hover:text-white">Angry</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeminiPanel;