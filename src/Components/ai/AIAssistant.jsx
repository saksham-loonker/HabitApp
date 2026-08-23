import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, X, Send, Loader2, Calendar, Clock, 
  TrendingUp, Lightbulb, Brain, Zap, Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { runCerebrasInference } from '@/api/cerebrasClient';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function AIAssistant({ tasks, moods = [], settings = {}, isOpen, onClose }) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm your AI assistant powered by Cerebras. I can analyze your tasks, schedule, and help you stay organized. How can I assist you today?",
      suggestions: ['Summarize my tasks', 'Help me prioritize', 'Suggest a schedule']
    }
  ]);

  const analyzeAndRespond = async (query) => {
    setIsLoading(true);
    
    // Context preparation
    const taskContext = tasks.map(t => ({
      title: t.title,
      status: t.status,
      priority: t.priority,
      due_date: t.due_date,
      time: t.due_time || 'Unspecified',
      category: t.category,
      description: t.description
    }));

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayMood = moods.find(m => m.date.startsWith(todayStr))?.mood || "Unknown";
    
    const hasTasks = taskContext.length > 0;

    const systemPrompt = `You are a helpful productivity assistant powered by Cerebras.
    
    CRITICAL INSTRUCTION: You HAVE access to the user's data. It is provided below in JSON format.
    You must answer questions about the user's schedule, tasks, and preferences using ONLY this data.
    Do NOT say "I don't have access to your schedule". You do. It is right here.

    Current Context:
    - Today's Date: ${todayStr}
    - User's Mood Today: ${todayMood}
    - User Settings: ${JSON.stringify(settings)}
    
    User's Task List (Database Dump):
    ${hasTasks ? JSON.stringify(taskContext, null, 2) : "The user's task list is currently EMPTY."}
    
    If the user asks "What is my schedule?", look at the 'due_date' and 'time' in the Task List above and summarize the tasks for today (${todayStr}).
    If the task list is empty, tell them they have no tasks scheduled and suggest adding one.
    
    Be concise, actionable, and friendly.`;

    console.log("AI System Prompt:", systemPrompt);

    try {
      const response = await runCerebrasInference([
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })), // History
        { role: 'user', content: query }
      ]);

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I encountered an error processing your request. Please check your connection or API key."
      }]);
    }
    
    setIsLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    const query = input;
    setInput('');
    await analyzeAndRespond(query);
  };

  const handleSuggestionClick = async (suggestion) => {
    setMessages(prev => [...prev, { role: 'user', content: suggestion }]);
    await analyzeAndRespond(suggestion);
  };

  // ... (rest of the UI rendering logic remains similar, just ensuring no base44 refs)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-card border border-border w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl rounded-3xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">AI Assistant</h3>
                  <p className="text-xs text-muted-foreground">Cerebras • Llama 3.3</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex",
                    msg.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={cn(
                    "max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm",
                    msg.role === 'user' 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-secondary text-secondary-foreground rounded-tl-none"
                  )}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-secondary rounded-2xl p-4 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-xs">Thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-background">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  className="flex-1 rounded-full"
                />
                <Button 
                  onClick={handleSend} 
                  disabled={isLoading}
                  size="icon"
                  className="rounded-full"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}