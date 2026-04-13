import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fridayResponses } from '../data/mockData';

export const ChatWidget = ({ isOpen, onClose, messages, onSendMessage }) => {
  const [input, setInput] = useState('');
  const [localMessages, setLocalMessages] = useState([
    { id: 1, text: 'Hi! I\'m FRIDAY, your AI financial assistant. How can I help you today? 💰', sender: 'bot' },
  ]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = { id: Date.now(), text: input, sender: 'user' };
    setLocalMessages((prev) => [...prev, userMessage]);

    // Simulate bot response
    setTimeout(() => {
      const response = fridayResponses[Math.floor(Math.random() * fridayResponses.length)];
      const botMessage = {
        id: Date.now() + 1,
        text: response.response,
        sender: 'bot',
      };
      setLocalMessages((prev) => [...prev, botMessage]);
    }, 1000);

    setInput('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed bottom-24 right-4 w-80 max-w-[90vw] bg-white dark:bg-gray-800 rounded-3xl shadow-premium border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-[500px]"
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 flex justify-between items-center">
            <h3 className="font-bold">FRIDAY Assistant</h3>
            <button onClick={onClose} className="text-xl">✕</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {localMessages.map((msg) => (
              <motion.div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-2xl ${
                    msg.sender === 'user'
                      ? 'bg-indigo-500 text-white rounded-br-none'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask FRIDAY..."
              className="flex-1 input-field py-2 text-sm rounded-full"
            />
            <motion.button
              onClick={handleSend}
              className="btn-primary py-2 px-4 text-sm"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              →
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
