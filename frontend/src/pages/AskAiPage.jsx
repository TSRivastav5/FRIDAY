import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinanceStore } from '../store/financeStore';

// ────────────────────────────────────────────────────────
// 📊 Interactive Structured Mini-Card Component
// ────────────────────────────────────────────────────────
const StructuredCard = ({ card }) => {
  if (!card) return null;

  switch (card.type) {
    case 'table':
      return (
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 my-3 shadow-sm overflow-hidden text-left w-full">
          {card.title && (
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">table_chart</span>
              {card.title}
            </h4>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/30 text-on-surface-variant/60 font-semibold">
                  {card.headers?.map((header, idx) => (
                    <th key={idx} className="pb-2 pr-3">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 text-on-surface/90">
                {card.rows?.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-surface-container-low/20 transition-colors">
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="py-2 pr-3 font-medium">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

    case 'progress':
      const percent = card.target > 0 ? Math.min(100, Math.round((card.current / card.target) * 100)) : 0;
      const fmt = (val) => new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(val);

      return (
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 my-3 shadow-sm text-left w-full">
          {card.title && (
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">donut_large</span>
              {card.title}
            </h4>
          )}
          {card.label && <p className="text-xs text-on-surface-variant/80 mb-1.5">{card.label}</p>}
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-lg font-bold text-on-surface">
              {card.unit === '₹' ? fmt(card.current) : `${card.current}${card.unit || ''}`}
            </span>
            <span className="text-[10px] font-bold text-on-surface-variant/60">
              Target: {card.unit === '₹' ? fmt(card.target) : `${card.target}${card.unit || ''}`}
            </span>
          </div>
          <div className="w-full bg-outline-variant/20 h-2.5 rounded-full overflow-hidden mb-1">
            <div 
              className="bg-[#34C759] h-full rounded-full transition-all duration-500" 
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="text-[10px] font-semibold text-[#34C759] text-right">{percent}% achieved</div>
        </div>
      );

    case 'recommendations':
      return (
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 my-3 shadow-sm text-left w-full space-y-3">
          {card.title && (
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">ads_click</span>
              {card.title}
            </h4>
          )}
          <div className="space-y-2">
            {card.items?.map((item, idx) => (
              <div key={idx} className="p-3 bg-surface-container-low/40 border border-outline-variant/10 rounded-xl hover:border-primary/30 transition-all">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <span className="text-xs font-bold text-on-surface leading-tight">{item.name}</span>
                  <span className="text-xs font-bold text-primary shrink-0">{item.amount}</span>
                </div>
                {item.reason && <p className="text-[10px] text-on-surface-variant/80 mb-2">{item.reason}</p>}
                {item.action && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[#34C759] bg-[#34C759]/10 px-2 py-0.5 rounded-full">
                    <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    {item.action}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      );

    case 'metrics':
      return (
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 my-3 shadow-sm text-left w-full">
          {card.title && (
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">analytics</span>
              {card.title}
            </h4>
          )}
          <div className="grid grid-cols-2 gap-3">
            {card.items?.map((item, idx) => (
              <div key={idx} className="p-2.5 bg-surface-container-low/40 border border-outline-variant/10 rounded-xl">
                <span className="text-[10px] font-semibold text-on-surface-variant/60 uppercase block">{item.label}</span>
                <span className="text-sm font-bold text-on-surface block mt-0.5">{item.value}</span>
                {item.subtext && <span className="text-[9px] text-on-surface-variant/80 block mt-0.5 font-medium">{item.subtext}</span>}
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return null;
  }
};

// ────────────────────────────────────────────────────────
// 💬 Ask AI Page component
// ────────────────────────────────────────────────────────
export const AskAiPage = () => {
  const store = useFinanceStore();
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  const chatMessages = store.chatMessages || [];
  const isChatLoading = store.isChatLoading || false;
  const aiError = store.aiError || null;

  // 1. Fetch Chat History on mount
  useEffect(() => {
    store.fetchChatHistory?.();
    if (store.preloadedAiMessage) {
      setInput(store.preloadedAiMessage);
      store.setPreloadedAiMessage(null);
    }
  }, [store.preloadedAiMessage]);

  // 2. Wire Web Speech API (Speech Recognition)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN'; // Handlers Indian accent names and text beautifully

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Try Chrome or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    }
  };

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

  // 3. Dynamic User greeting calculations
  const profile = store.user?.financialProfile || {};
  const totalSalary = store.salary?.amount || profile.monthlySalary || 0;
  const emi = store.currentAllocation?.emi ?? profile.fixedExpenses?.emiDefault ?? 0;
  const rent = store.currentAllocation?.rent ?? profile.fixedExpenses?.rent ?? 0;
  const sip = store.currentAllocation?.sip ?? profile.sipDefault ?? 0;
  const travel = store.currentAllocation?.travel ?? profile.travelDefault ?? 0;
  const bills = store.currentAllocation?.bills ?? profile.billsDefault ?? 0;
  
  const totalAllocated = emi + rent + sip + travel + bills;
  const availableBalance = totalSalary - totalAllocated;

  const getFirstName = () => {
    if (!store.user?.name) return "Boss";
    return store.user.name.split(" ")[0];
  };

  const getMonthName = () => {
    return new Date().toLocaleString("default", { month: "long" });
  };

  const formattedBalance = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(availableBalance);

  const welcomeMessage = `Hey ${getFirstName()}! Your ${getMonthName()} salary is allocated. ${formattedBalance} is yours to use. What would you like to do?`;

  // 4. Contextual suggest chips state and mappings
  const [chipContext, setChipContext] = useState(() => {
    if (store.activeTab === 'invest') return 'invest';
    if (store.activeTab === 'home' && store.salary) return 'salary';
    return 'budget';
  });

  const chipContexts = {
    budget: [
      "Track my current budget",
      "Show spending analysis",
      "How are my savings doing?",
      "Analyze travel offers"
    ],
    salary: [
      "Can I afford ₹20,000?",
      "Increase my SIP?",
      "Show breakdown",
      "Optimize my salary allocation"
    ],
    invest: [
      "Best fund this month?",
      "Rebalance my portfolio?",
      "Track my holdings",
      "Compare MF vs Stocks"
    ]
  };

  // 5. XML-like tag parser for structured output card blocks
  const parseMessageContent = (content) => {
    if (!content) return [];
    
    const parts = [];
    const regex = /\[STRUCTURED_CARD\]([\s\S]*?)\[\/STRUCTURED_CARD\]/g;
    let lastIndex = 0;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.substring(lastIndex, match.index)
        });
      }
      
      try {
        const cardData = JSON.parse(match[1].trim());
        parts.push({
          type: 'card',
          card: cardData
        });
      } catch (e) {
        console.error("Failed to parse structured card JSON:", e);
        parts.push({
          type: 'text',
          content: match[0]
        });
      }
      
      lastIndex = regex.lastIndex;
    }
    
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex)
      });
    }
    
    return parts.length > 0 ? parts : [{ type: 'text', content }];
  };

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
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface">Powered by FRIDAY Intelligence</p>
        </div>

        {/* Chat List Container */}
        <div className="flex-1 space-y-4 overflow-y-auto pb-8 flex flex-col justify-start">
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
                  {welcomeMessage}
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
                <div className={`max-w-[85%] px-5 py-4 rounded-[24px] border shadow-sm transition-all flex flex-col items-start ${
                  isUser 
                    ? 'bg-surface-container-lowest border-outline-variant/30 rounded-tr-[4px] ml-auto' 
                    : 'bg-surface-container-high border-outline-variant/10 rounded-tl-[4px]'
                }`}>
                  {parseMessageContent(msg.content).map((part, pIdx) => {
                    if (part.type === 'card') {
                      return <StructuredCard key={pIdx} card={part.card} />;
                    }
                    return (
                      <p key={pIdx} className="text-sm leading-relaxed text-on-surface whitespace-pre-wrap w-full">
                        {part.content}
                      </p>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isChatLoading && (
            <div className="flex justify-start w-full gap-3 text-left animate-pulse">
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 rounded-xl bg-primary-container flex items-center justify-center text-on-primary-container shadow-sm">
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

          {/* Quick Context Selector & Suggestions - sits directly below the last message */}
          <div className="mt-6 space-y-3">
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar shrink-0">
              <button 
                onClick={() => setChipContext('budget')}
                className={`px-3 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase border transition-all whitespace-nowrap ${
                  chipContext === 'budget' 
                    ? 'bg-primary/10 border-primary text-primary' 
                    : 'bg-surface border-outline-variant/30 text-on-surface-variant/80 hover:bg-surface-container-low'
                }`}
              >
                💡 Budget Tips
              </button>
              <button 
                onClick={() => setChipContext('salary')}
                className={`px-3 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase border transition-all whitespace-nowrap ${
                  chipContext === 'salary' 
                    ? 'bg-primary/10 border-primary text-primary' 
                    : 'bg-surface border-outline-variant/30 text-on-surface-variant/80 hover:bg-surface-container-low'
                }`}
              >
                💰 Salary Context
              </button>
              <button 
                onClick={() => setChipContext('invest')}
                className={`px-3 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase border transition-all whitespace-nowrap ${
                  chipContext === 'invest' 
                    ? 'bg-primary/10 border-primary text-primary' 
                    : 'bg-surface border-outline-variant/30 text-on-surface-variant/80 hover:bg-surface-container-low'
                }`}
              >
                📈 Market & Invest
              </button>
            </div>

            <div className="flex flex-wrap gap-2 text-left">
              {chipContexts[chipContext].map((sug, idx) => (
                <button 
                  key={idx}
                  onClick={() => handleSend(sug)}
                  className="bg-surface-container-low border border-outline-variant/30 px-3 py-1.5 rounded-full text-[10px] font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors active:scale-95"
                >
                  "{sug}"
                </button>
              ))}
            </div>
          </div>
          
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Area */}
        <div className="fixed bottom-24 left-0 w-full px-5 z-40 max-w-md mx-auto right-0 pointer-events-none">
          {/* Real error banner — shown instead of fake "hit a snag" */}
          {aiError && (
            <div
              style={{
                background: "#FEF2F2",
                border: "1px solid #FCA5A5",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 13,
                color: "#991B1B",
                marginBottom: 8,
                pointerEvents: "auto",
              }}
            >
              <strong>Error:</strong> {aiError}
              <br />
              <span style={{ fontSize: 11, opacity: 0.7 }}>
                Check browser console and Render logs for full details. Make sure GROQ_API_KEY is set in Render → Environment.
              </span>
            </div>
          )}
          <div className="bg-white rounded-full p-1.5 pl-5 shadow-xl border border-outline-variant/20 flex items-center gap-2 w-full pointer-events-auto">
            <button 
              onClick={toggleListening}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined text-lg">
                {isListening ? 'mic' : 'mic'}
              </span>
            </button>
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-grow bg-transparent border-none focus:ring-0 text-sm text-on-surface placeholder:text-on-surface-variant/40 py-2 outline-none" 
              placeholder={isListening ? "Listening..." : "Ask me anything..."} 
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
