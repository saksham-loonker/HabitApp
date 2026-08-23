import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Loader2, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { runCerebrasInference } from '@/api/cerebrasClient';

export default function Assistant() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm your AI assistant powered by Cerebras (Llama 3.3 70B). How can I help you organize your life today?"
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessages = [
      ...messages,
      { role: 'user', content: input }
    ];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    // Prepare context for the AI (limited history + user query)
    // We send the last 10 messages to keep context window manageable but useful
    const apiMessages = newMessages.slice(-10).map(m => ({
      role: m.role,
      content: m.content
    }));

    const responseContent = await runCerebrasInference(apiMessages);

    setMessages(prev => [...prev, {
      role: 'assistant',
      content: responseContent
    }]);
    setIsLoading(false);
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: "Chat history cleared. Ready for a new topic!"
    }]);
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4 px-4 md:px-0">
        <div>
          <h1 className="text-2xl font-light tracking-tight">AI Assistant</h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Cerebras Cloud (Llama 3.3-70b)</span>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={clearChat} className="text-muted-foreground hover:text-destructive">
          <Trash2 className="w-4 h-4 mr-2" /> Clear
        </Button>
      </div>

      <div className="flex-1 bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden flex flex-col">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-4 max-w-[85%]",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              )}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={cn(
                "p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                msg.role === 'user' 
                  ? "bg-primary text-primary-foreground rounded-tr-none" 
                  : "bg-secondary/50 text-foreground rounded-tl-none"
              )}>
                {msg.content}
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex gap-4 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center flex-shrink-0 mt-1">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div className="p-4 rounded-2xl bg-secondary/50 text-foreground rounded-tl-none flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs">Processing...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-card border-t border-border/50">
          <div className="relative flex gap-2">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about your schedule, habits, or anything..."
              className="h-12 rounded-full px-6 pr-12 bg-secondary/30 border-transparent focus:bg-background focus:border-primary transition-all"
              disabled={isLoading}
            />
            <Button 
              size="icon" 
              className="absolute right-1 top-1 h-10 w-10 rounded-full" 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-center mt-2">
             <p className="text-[10px] text-muted-foreground">AI can make mistakes. Please verify important information.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
