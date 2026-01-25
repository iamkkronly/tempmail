import React, { useState } from 'react';
import { AIAnalysisResult, FullMailMessage } from '../types';
import { analyzeEmail, draftReply, translateEmail } from '../services/geminiService';
import { ShieldAlert, ShieldCheck, Sparkles, Bot, PenTool, Volume2, Languages, Globe, RefreshCw } from 'lucide-react';

interface GeminiPanelProps {
  email: FullMailMessage;
}

const GeminiPanel: React.FC<GeminiPanelProps> = ({ email }) => {
  const [activeTab, setActiveTab] = useState<'security' | 'reply' | 'translate'>('security');
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [reply, setReply] = useState<string | null>(null);
  const [replyLoading, setReplyLoading] = useState(false);
  
  const [translation, setTranslation] = useState<string | null>(null);
  const [translateLoading, setTranslateLoading] = useState(false);

  // Security Analysis
  const handleAnalyze = async () => {
    setLoading(true);
    const result = await analyzeEmail(email);
    setAnalysis(result);
    setLoading(false);
  };

  // Draft Reply
  const handleDraftReply = async (tone: string) => {
    setReplyLoading(true);
    setReply(null);
    const result = await draftReply(email, tone);
    setReply(result);
    setReplyLoading(false);
  };

  // Translate
  const handleTranslate = async () => {
    setTranslateLoading(true);
    setTranslation(null);
    const textContent = email.text || (new DOMParser().parseFromString(email.html?.[0] || '', 'text/html').body.textContent || '');
    const result = await translateEmail(textContent);
    setTranslation(result);
    setTranslateLoading(false);
  };

  const handleSpeakSummary = () => {
    if (!analysis) return;
    window.speechSynthesis.cancel();
    const text = `Security Risk Level: ${analysis.riskLevel}. Summary: ${analysis.summary}`;
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="space-y-4">
      
      {/* Tab Navigation */}
      <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
         <button 
           onClick={() => setActiveTab('security')}
           className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === 'security' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
         >
           <ShieldCheck className="w-3.5 h-3.5" /> Security
         </button>
         <button 
           onClick={() => setActiveTab('reply')}
           className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === 'reply' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
         >
           <PenTool className="w-3.5 h-3.5" /> Reply
         </button>
         <button 
           onClick={() => setActiveTab('translate')}
           className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === 'translate' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
         >
           <Languages className="w-3.5 h-3.5" /> Translate
         </button>
      </div>

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="animate-fade-in-up">
           {!analysis ? (
             <div className="text-center py-6">
                <Bot className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 text-sm mb-4">Check for phishing, scams, and summarize content.</p>
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-brand-900/20 disabled:opacity-70"
                >
                  {loading ? <Sparkles className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Analyze Now</span>
                </button>
             </div>
           ) : (
             <div className={`p-4 rounded-xl border ${
                analysis.riskLevel === 'HIGH' ? 'bg-red-950/30 border-red-900/50' : 
                analysis.riskLevel === 'MEDIUM' ? 'bg-yellow-950/30 border-yellow-900/50' : 
                'bg-emerald-950/30 border-emerald-900/50'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {analysis.riskLevel === 'LOW' ? (
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <ShieldAlert className={`w-5 h-5 ${analysis.riskLevel === 'HIGH' ? 'text-red-500' : 'text-yellow-500'}`} />
                    )}
                    <span className={`font-bold text-sm ${
                      analysis.riskLevel === 'HIGH' ? 'text-red-400' : 
                      analysis.riskLevel === 'MEDIUM' ? 'text-yellow-400' : 
                      'text-emerald-400'
                    }`}>
                      {analysis.riskLevel} RISK
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">Score: {analysis.phishingScore}</span>
                </div>

                <div className="space-y-3">
                  <div className="bg-black/20 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                       <h4 className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Summary</h4>
                       <button onClick={handleSpeakSummary} className="text-slate-500 hover:text-brand-400" title="Listen">
                          <Volume2 className="w-3 h-3" />
                       </button>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{analysis.summary}</p>
                  </div>
                  
                  {analysis.actionableItems.length > 0 && (
                    <div className="bg-black/20 p-3 rounded-lg">
                      <h4 className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Actions</h4>
                      <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                        {analysis.actionableItems.map((item, idx) => (
                          <li key={idx} className="break-words">{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
           )}
        </div>
      )}

      {/* Reply Tab */}
      {activeTab === 'reply' && (
        <div className="animate-fade-in-up">
           <div className="grid grid-cols-3 gap-2 mb-4">
              <button onClick={() => handleDraftReply('Professional')} className="py-2 text-xs bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-slate-300 transition-colors">Professional</button>
              <button onClick={() => handleDraftReply('Friendly')} className="py-2 text-xs bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-slate-300 transition-colors">Friendly</button>
              <button onClick={() => handleDraftReply('Assertive')} className="py-2 text-xs bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-slate-300 transition-colors">Assertive</button>
           </div>

           {replyLoading ? (
             <div className="p-8 text-center">
                <Sparkles className="w-8 h-8 text-brand-400 animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500">Drafting response...</p>
             </div>
           ) : reply ? (
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-700">
              <div className="flex justify-between items-center mb-2">
                 <h4 className="text-xs font-semibold text-brand-400 flex items-center gap-2">
                   <PenTool className="w-3 h-3" /> Draft
                 </h4>
                 <button onClick={() => {navigator.clipboard.writeText(reply)}} className="text-xs text-slate-500 hover:text-white transition-colors bg-slate-800 px-2 py-0.5 rounded">Copy</button>
              </div>
              <textarea 
                className="w-full bg-black/20 p-3 rounded-lg border border-white/5 text-slate-300 text-sm font-sans focus:outline-none focus:border-brand-500/50 resize-y min-h-[150px]"
                defaultValue={reply}
              />
            </div>
           ) : (
             <div className="text-center py-6 text-slate-500">
               <PenTool className="w-8 h-8 mx-auto mb-2 opacity-50" />
               <p className="text-sm">Select a tone to generate a reply.</p>
             </div>
           )}
        </div>
      )}

      {/* Translate Tab */}
      {activeTab === 'translate' && (
        <div className="animate-fade-in-up">
           {!translation ? (
             <div className="text-center py-6">
               <Globe className="w-12 h-12 text-slate-700 mx-auto mb-3" />
               <p className="text-slate-500 text-sm mb-4">Translate email content to English.</p>
               <button
                  onClick={handleTranslate}
                  disabled={translateLoading}
                  className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white py-2.5 px-4 rounded-xl transition-all border border-slate-700 disabled:opacity-70"
                >
                  {translateLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
                  <span>Translate to English</span>
                </button>
             </div>
           ) : (
             <div className="p-3 bg-slate-900 rounded-xl border border-slate-700">
               <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-semibold text-emerald-400 flex items-center gap-2">
                    <Globe className="w-3 h-3" /> Translation
                  </h4>
                  <button onClick={() => {navigator.clipboard.writeText(translation)}} className="text-xs text-slate-500 hover:text-white transition-colors bg-slate-800 px-2 py-0.5 rounded">Copy</button>
               </div>
               <div className="bg-black/20 p-3 rounded-lg border border-white/5 text-slate-300 text-sm leading-relaxed max-h-[300px] overflow-y-auto">
                 {translation}
               </div>
               <button onClick={() => setTranslation(null)} className="w-full mt-3 text-xs text-slate-500 hover:text-slate-300">Reset</button>
             </div>
           )}
        </div>
      )}

    </div>
  );
};

export default GeminiPanel;