import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinanceStore } from '../store/financeStore';

export const AskAiPage = () => {
  const store = useFinanceStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const chatMessages = store.chatMessages || [];
  const isChatLoading = store.isChatLoading || false;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isChatLoading]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    if (!textToSend) {
      setInput('');
    }

    try {
      await store.chatWithFriday(query);
    } catch (e) {
      console.error("Error chatting with AI:", e);
    }
  };

  const suggestions = [
    "Can I afford a ₹50k trip in 3 months?",
    "Show trip savings goal",
    "Analyze travel offers",
    "Track my current budget"
  ];

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col items-center pb-32">
      {/* TopAppBar */}
      <header className="bg-inverse-surface fixed top-0 left-0 w-full z-50">
        <div className="flex justify-between items-center w-full px-5 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-fixed-dim border border-outline-variant/20">
              <img 
                alt="Profile picture" 
                className="w-full h-full object-cover scale-110" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCCX0xxkFY5XGvL5V1FBPkkAaob4937P2y3M3RJ9DbQw74sTgyAIlMOn1k20oEXYFkIg2PYiGAuiJWdIDYV6Ck-Q-3JwGIPTdzuFxNQE3FJsVTZQSpdtf_OhiVn352t4iBrRsH7I0bOnJxjE0JQNJKikbRdAvqj4cBomb0_BJQmvg6pvu415tFBoXMifvBPFv5WMN6jc-cTXO9KDF3xcRnOuU1vINj9JwAMNSbisVTYlFURbT4qm8vB-iBCV4AnXkE0RVr8VW-hoJ0"
              />
            </div>
            <h1 className="text-lg font-bold text-on-primary text-left">Ask AI</h1>
          </div>
          <button className="text-on-primary opacity-70 hover:opacity-100 transition-all">
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </div>
      </header>

      {/* Main Canvas */}
      <main className="w-full max-w-md pt-20 pb-40 px-5 mx-auto min-h-screen flex flex-col items-stretch">
        {/* Welcome / Contextual Message */}
        <div className="mb-6 flex flex-col items-center text-center opacity-40 mt-4">
          <span className="material-symbols-outlined text-4xl mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface">Powered by FinVault Intelligence</p>
        </div>

        {/* Chat List Container */}
        <div className="flex-1 space-y-4 overflow-y-auto pb-8 flex flex-col">
          {/* Welcome Message if no chat exists */}
          {chatMessages.length === 0 && (
            <div className="flex justify-start w-full gap-3 mt-2 text-left">
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 rounded-xl bg-primary-container flex items-center justify-center text-on-primary-container shadow-sm">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                </div>
              </div>
              <div className="max-w-[85%] bg-surface-container-high px-5 py-4 rounded-[24px] rounded-tl-[4px] border border-outline-variant/10">
                <p className="text-sm leading-relaxed text-on-surface">
                  Systems online, Boss. All financial telemetry grids are synchronized. How can I assist you with your assets or cash flows today?
                </p>
              </div>
            </div>
          )}

          {/* Dynamic Message Logs */}
          {chatMessages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full gap-3 text-left`}>
                {!isUser && (
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-xl bg-primary-container flex items-center justify-center text-on-primary-container shadow-sm">
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    </div>
                  </div>
                )}
                <div className={`max-w-[85%] px-5 py-4 rounded-[24px] border shadow-sm transition-all ${
                  isUser 
                    ? 'bg-surface-container-lowest border-outline-variant/30 rounded-tr-[4px] ml-auto' 
                    : 'bg-surface-container-high border-outline-variant/10 rounded-tl-[4px]'
                }`}>
                  <p className="text-sm leading-relaxed text-on-surface whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isChatLoading && (
            <div className="flex justify-start w-full gap-3 text-left">
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 rounded-xl bg-primary-container flex items-center justify-center text-on-primary-container shadow-sm animate-pulse">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                </div>
              </div>
              <div className="max-w-[85%] bg-surface-container-high px-5 py-4 rounded-[24px] rounded-tl-[4px] border border-outline-variant/10">
                <div className="flex items-center gap-1.5 py-1 text-primary text-xs font-bold">
                  <span className="material-symbols-outlined text-sm animate-spin">radar</span>
                  ANALYZING TELEMETRY...
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestions */}
        <div className="flex flex-wrap gap-2 mt-4 text-left">
          {suggestions.map((sug, idx) => (
            <button 
              key={idx}
              onClick={() => handleSend(sug)}
              className="bg-surface-container-low border border-outline-variant/30 px-3 py-1.5 rounded-full text-[10px] font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              "{sug}"
            </button>
          ))}
        </div>

        {/* Chat Input Area */}
        <div className="fixed bottom-24 left-0 w-full px-5 z-40 max-w-md mx-auto right-0 pointer-events-none">
          <div className="bg-white rounded-full p-1.5 pl-5 shadow-xl border border-outline-variant/20 flex items-center gap-2 w-full pointer-events-auto">
            <span className="material-symbols-outlined text-on-surface-variant/60 text-lg">mic</span>
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-grow bg-transparent border-none focus:ring-0 text-sm text-on-surface placeholder:text-on-surface-variant/40 py-2 outline-none" 
              placeholder="Ask me anything..." 
              type="text"
            />
            <button 
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">arrow_upward</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
