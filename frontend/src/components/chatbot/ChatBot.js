import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { useAuth } from '../../contexts/AuthContext';
import {
  Bot,
  X,
  Send,
  Loader2,
  Minimize2,
  Maximize2
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ChatBot = () => {
  const { user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your RetailIQ Assistant. How can I help you today? I can provide insights on inventory, sales trends, and customer analytics."
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading || !token) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionId
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSessionId(data.session_id);
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: "Sorry, I couldn't process that request. Please try again." 
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Connection error. Please check your network and try again." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 chatbot-bubble rounded-full flex items-center justify-center z-50"
            data-testid="chatbot-toggle"
          >
            <Bot className="w-6 h-6 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? 60 : 500
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-[380px] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50"
            style={{ maxHeight: '80vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">RetailIQ Assistant</p>
                  <p className="text-xs text-zinc-500">AI-Powered</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setIsMinimized(!isMinimized)}
                  data-testid="chatbot-minimize"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setIsOpen(false)}
                  data-testid="chatbot-close"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Chat Content */}
            {!isMinimized && (
              <>
                <ScrollArea className="h-[380px] p-4" ref={scrollRef}>
                  <div className="space-y-4">
                    {messages.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                            msg.role === 'user'
                              ? 'bg-violet-500 text-white rounded-br-md'
                              : 'bg-zinc-800 text-zinc-200 rounded-bl-md'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </motion.div>
                    ))}
                    {loading && (
                      <div className="flex justify-start">
                        <div className="bg-zinc-800 rounded-2xl rounded-bl-md px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                            <span className="text-sm text-zinc-400">Thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Input */}
                <form onSubmit={sendMessage} className="p-4 border-t border-zinc-800">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask me anything..."
                      className="flex-1 bg-zinc-800 border-zinc-700"
                      disabled={loading}
                      data-testid="chatbot-input"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className="btn-primary"
                      disabled={loading || !input.trim()}
                      data-testid="chatbot-send"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatBot;
