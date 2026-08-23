import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Calendar, Tag, Flag, MapPin, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { runCerebrasInference } from '@/api/cerebrasClient';
import { format, addDays, addWeeks, nextMonday } from 'date-fns';
import { cn } from '@/lib/utils';

const quickDates = [
  { label: 'Today', getValue: () => new Date() },
  { label: 'Tomorrow', getValue: () => addDays(new Date(), 1) },
  { label: 'Next Week', getValue: () => nextMonday(new Date()) },
  { label: 'In 2 weeks', getValue: () => addWeeks(new Date(), 2) }
];

const priorities = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-700' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700' }
];

export default function QuickAddModal({ isOpen, onClose, onSave }) {
  const [input, setInput] = useState('');
  const [parsedTask, setParsedTask] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setParsedTask(null);
      setInput('');
    }
  }, [isOpen]);

  const parseWithAI = async (text) => {
    if (!text.trim()) return;
    
    setIsProcessing(true);
    
    const prompt = `Parse this natural language task input and extract structured data:
"${text}"

Today is ${format(new Date(), 'yyyy-MM-dd')}.

Extract:
- title: The main task name (clean it up if needed)
- due_date: If a date/time is mentioned (format: YYYY-MM-DD)
- due_time: If a time is mentioned (format: HH:mm)
- priority: Infer from urgency words (low/medium/high/urgent)
- category: Infer category (work/personal/health/learning/errands/social)
- location: If a place is mentioned
- tags: Any relevant tags/keywords
- estimated_duration: If duration mentioned (in minutes)

Return ONLY the JSON object. No markdown formatting or other text.`;

    try {
      const responseText = await runCerebrasInference([
        { role: 'system', content: 'You are a helpful assistant that extracts structured task data from text. You always respond with valid JSON.' },
        { role: 'user', content: prompt }
      ]);

      let jsonStr = responseText.trim();
      // Clean up markdown code blocks if present
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(json)?/, '').replace(/```$/, '').trim();
      }

      const result = JSON.parse(jsonStr);

      setParsedTask({
        title: result.title || text,
        due_date: result.due_date || null,
        due_time: result.due_time || null,
        priority: result.priority || 'medium',
        category: result.category || 'personal',
        location: result.location || null,
        tags: result.tags || [],
        estimated_duration: result.estimated_duration || null,
        status: 'todo'
      });
    } catch (error) {
      console.error("AI Parsing failed:", error);
      // Fallback if AI fails
      setParsedTask({
        title: text,
        priority: 'medium',
        status: 'todo',
        tags: []
      });
    }
    
    setIsProcessing(false);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (parsedTask) {
        handleSave();
      } else {
        parseWithAI(input);
      }
    }
  };

  const handleSave = () => {
    if (parsedTask) {
      onSave(parsedTask);
      onClose();
    }
  };

  const updateParsedField = (field, value) => {
    setParsedTask(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-4 pt-20"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -50, opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b dark:border-slate-700">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-slate-700 dark:text-white">Quick Add</span>
              <Button variant="ghost" size="icon" className="ml-auto" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-4">
              {/* Natural language input */}
              <div className="relative">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="e.g., 'Review report tomorrow at 2pm high priority'"
                  className="pr-10"
                />
                {isProcessing && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-violet-500" />
                )}
              </div>

              <p className="text-xs text-slate-500 mt-2">
                Type naturally, I'll parse dates, priorities, and more
              </p>

              {/* Parsed result preview */}
              {parsedTask && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-3"
                >
                  <Input
                    value={parsedTask.title}
                    onChange={(e) => updateParsedField('title', e.target.value)}
                    className="font-medium"
                  />

                  {/* Quick date buttons */}
                  <div className="flex flex-wrap gap-2">
                    {quickDates.map((qd) => (
                      <button
                        key={qd.label}
                        onClick={() => updateParsedField('due_date', format(qd.getValue(), 'yyyy-MM-dd'))}
                        className={cn(
                          "text-xs px-2.5 py-1 rounded-full transition-colors",
                          parsedTask.due_date === format(qd.getValue(), 'yyyy-MM-dd')
                            ? "bg-violet-500 text-white"
                            : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-violet-100"
                        )}
                      >
                        {qd.label}
                      </button>
                    ))}
                  </div>

                  {/* Priority */}
                  <div className="flex flex-wrap gap-2">
                    {priorities.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => updateParsedField('priority', p.value)}
                        className={cn(
                          "text-xs px-2.5 py-1 rounded-full transition-all",
                          parsedTask.priority === p.value
                            ? `${p.color} ring-2 ring-offset-1 ring-current`
                            : "bg-slate-100 dark:bg-slate-700 text-slate-500"
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Tags */}
                  {parsedTask.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {parsedTask.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Meta info */}
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                    {parsedTask.due_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {parsedTask.due_date}
                      </span>
                    )}
                    {parsedTask.due_time && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {parsedTask.due_time}
                      </span>
                    )}
                    {parsedTask.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {parsedTask.location}
                      </span>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-4 border-t dark:border-slate-700">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              {parsedTask ? (
                <Button 
                  className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600"
                  onClick={handleSave}
                >
                  Create Task
                </Button>
              ) : (
                <Button 
                  className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600"
                  onClick={() => parseWithAI(input)}
                  disabled={!input.trim() || isProcessing}
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Parse'}
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}