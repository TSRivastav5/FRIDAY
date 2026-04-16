import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fridayResponses } from '../data/mockData';

export const ChatWidget = ({ isOpen, onClose, messages, onSendMessage }) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [localMessages, setLocalMessages] = useState([
    { id: 1, text: 'Systems online. All holographic matrices calibrated. How may I assist your command today?', sender: 'bot', time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) },
  ]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [localMessages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;

    const timeString = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const userMessage = { id: Date.now(), text: input, sender: 'user', time: timeString };
    setLocalMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const response = fridayResponses[Math.floor(Math.random() * fridayResponses.length)];
      const botMessage = {
        id: Date.now() + 1,
        text: response.response,
        sender: 'bot',
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
      setLocalMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed bottom-24 right-4 md:right-8 w-full md:w-[400px] max-w-[90vw] z-50 flex flex-col h-[600px] max-h-[80vh] overflow-hidden rounded-3xl backdrop-blur-3xl border border-primary/20 shadow-[0_0_50px_rgba(0,0,0,0.8),_inset_0_0_20px_rgba(129,236,255,0.1)] bg-surface-container-lowest/80"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          style={{ backgroundImage: 'linear-gradient(rgba(129,236,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(129,236,255,0.02) 1px, transparent 1px)', backgroundSize: '20px 20px' }}
        >
          {/* Header */}
          <div className="bg-black/60 backdrop-blur-xl border-b border-cyan-400/20 p-4 flex justify-between items-center z-10 shrink-0">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-cyan-400" style={{fontVariationSettings: "'FILL' 1"}}>account_tree</span>
              <h3 className="font-bold text-cyan-400 tracking-tighter font-headline uppercase text-sm">COMMAND_CENTER</h3>
            </div>
            <button onClick={onClose} className="text-cyan-400/60 hover:text-cyan-400 transition-colors drop-shadow-[0_0_5px_currentColor]">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* AI Core Projection Area (Miniaturized) */}
          <div className="flex-none flex flex-col items-center justify-center py-4 border-b border-primary/10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent">
            <div className="relative w-16 h-16 flex items-center justify-center group cursor-pointer">
              <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(129,236,255,0.8)_0%,rgba(129,236,255,0.2)_50%,transparent_70%)] rounded-full animate-pulse opacity-40"></div>
              <div className="absolute inset-0 border border-primary/30 rounded-full animate-[spin_8s_linear_infinite]"></div>
              <div className="absolute inset-1 border border-secondary/40 rounded-full animate-[spin_12s_linear_infinite_reverse]"></div>
              <div className="w-8 h-8 bg-primary-container/20 rounded-full glass-panel flex items-center justify-center shadow-[0_0_15px_rgba(129,236,255,0.3)]">
                <span className="material-symbols-outlined text-primary text-xl" style={{fontVariationSettings: "'FILL' 1"}}>bolt</span>
              </div>
            </div>
            <span className="font-headline text-[8px] tracking-[0.3em] text-primary uppercase font-bold mt-2">CORE_ACTIVE</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar relative z-10">
            {localMessages.map((msg) => (
              <motion.div
                key={msg.id}
                className={`flex flex-col gap-1 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto items-end' : 'items-start'}`}
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[9px] font-headline font-bold uppercase tracking-widest ${msg.sender === 'user' ? 'text-primary' : 'text-secondary'}`}>
                    {msg.sender === 'user' ? 'USER_CMD // ROOT_EXEC' : 'F.R.I.D.A.Y. // PROTOCOL_01'}
                  </span>
                </div>
                
                <div
                  className={`p-3 relative overflow-hidden group ${
                    msg.sender === 'user'
                      ? 'glass-panel rounded-xl rounded-tr-none bg-primary/5 border border-primary/20'
                      : 'glass-panel rounded-xl rounded-tl-none border border-secondary/10 bg-secondary/5'
                  }`}
                >
                  <div className={`absolute top-0 w-1 h-full ${msg.sender === 'user' ? 'right-0 bg-primary' : 'left-0 bg-secondary'}`}></div>
                  <p className="text-on-surface text-sm leading-relaxed font-body">{msg.text}</p>
                </div>
                <span className="text-[9px] font-headline text-outline uppercase">{msg.time}</span>
              </motion.div>
            ))}

            {isTyping && (
              <motion.div
                className="flex flex-col items-start gap-1 max-w-[85%]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-headline font-bold text-secondary uppercase tracking-widest">F.R.I.D.A.Y. // PROCESSING</span>
                </div>
                <div className="glass-panel p-3 rounded-xl rounded-tl-none relative overflow-hidden bg-surface-container-high/40 border border-secondary/20">
                  <div className="absolute top-0 left-0 w-1 h-full bg-secondary-container"></div>
                  <div className="flex items-center gap-2 text-primary text-[10px] font-headline font-bold">
                    <span className="material-symbols-outlined text-sm animate-pulse">radar</span>
                    ANALYZING_QUERY...
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-surface-container-lowest/90 backdrop-blur-md border-t border-primary/10 z-20 shrink-0">
             <div className="flex items-center gap-3 mb-3 px-2 h-4">
              <div className="flex items-end gap-[2px] h-3">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-primary rounded-full"
                    animate={{ height: ["4px", "12px", "4px"] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                  />
                ))}
              </div>
              <span className="text-[8px] font-headline font-medium text-primary/60 tracking-widest uppercase">AWAITING_INPUT</span>
            </div>
            
            <div className="relative group">
              <div className="absolute -inset-[1px] bg-gradient-to-r from-primary/30 via-secondary/30 to-primary/30 rounded-full blur opacity-30 group-focus-within:opacity-100 transition-opacity"></div>
              <div className="relative flex items-center bg-surface-container-highest/60 backdrop-blur-xl rounded-full px-4 py-2 glass-panel border border-primary/20">
                <span className="material-symbols-outlined text-primary/60 mr-3 text-sm">keyboard</span>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Enter command..."
                  className="bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-outline w-full font-body text-sm py-1 outline-none"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="bg-primary/10 text-primary px-4 py-1.5 rounded-full font-headline font-bold text-[10px] tracking-widest border border-primary/30 hover:bg-primary hover:text-on-primary transition-all active:scale-95 disabled:opacity-50 disabled:hover:bg-primary/10 disabled:hover:text-primary whitespace-nowrap ml-2"
                >
                  EXEC
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
