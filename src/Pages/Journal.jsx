import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { PenTool, Save, Calendar, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Mock storage
const useJournal = () => {
  const [entries, setEntries] = useState({});
  
  const saveEntry = (date, content) => {
    setEntries(prev => ({ ...prev, [date]: content }));
  };

  const getEntry = (date) => entries[date] || '';

  return { saveEntry, getEntry };
};

export default function Journal() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const dateKey = format(currentDate, 'yyyy-MM-dd');
  const { saveEntry, getEntry } = useJournal();
  const [content, setContent] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setContent(getEntry(dateKey));
    setIsSaved(true);
  }, [dateKey]);

  const handleChange = (e) => {
    setContent(e.target.value);
    setIsSaved(false);
  };

  const handleSave = () => {
    saveEntry(dateKey, content);
    setIsSaved(true);
  };

  const prompts = [
    "What are you grateful for today?",
    "What was the highlight of your day?",
    "What is one thing you want to improve tomorrow?",
    "How are you feeling right now?"
  ];

  return (
    <div className="max-w-3xl mx-auto h-full flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-3xl font-serif font-medium text-foreground flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-muted-foreground" />
              Daily Journal
           </h1>
           <p className="text-muted-foreground mt-1">Reflect on your journey.</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-card p-1 rounded-lg border border-border/50 shadow-sm">
           <Button variant="ghost" size="icon" onClick={() => setCurrentDate(d => new Date(d.setDate(d.getDate() - 1))) }>
              <ChevronLeft className="w-4 h-4" />
           </Button>
           <div className="px-4 font-medium min-w-[120px] text-center">
              {format(currentDate, 'MMM d, yyyy')}
           </div>
           <Button variant="ghost" size="icon" onClick={() => setCurrentDate(d => new Date(d.setDate(d.getDate() + 1)))} disabled={format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')}>
              <ChevronRight className="w-4 h-4" />
           </Button>
        </div>
      </div>

      {/* Editor Card */}
      <motion.div 
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         className="flex-1 bg-white dark:bg-card rounded-2xl shadow-sm border border-border/50 p-8 md:p-12 flex flex-col relative min-h-[60vh]"
      >
         {/* Prompt Suggestions */}
         <div className="flex gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
            {prompts.map((prompt, i) => (
               <button
                  key={i}
                  onClick={() => setContent(prev => prev + (prev ? '\n\n' : '') + prompt + '\n')}
                  className="flex-shrink-0 px-4 py-2 bg-secondary/30 hover:bg-secondary rounded-full text-xs text-muted-foreground hover:text-foreground transition-colors"
               >
                  {prompt}
               </button>
            ))}
         </div>

         {/* Text Area */}
         <textarea
            value={content}
            onChange={handleChange}
            placeholder="Start writing..."
            className="flex-1 w-full resize-none bg-transparent border-none focus:ring-0 text-lg leading-relaxed font-serif placeholder:text-muted-foreground/30 p-0"
         />

         {/* Save Status */}
         <div className="absolute bottom-6 right-8 flex items-center gap-4">
            <span className="text-xs text-muted-foreground">
               {content.split(/\s+/).filter(w => w.length > 0).length} words
            </span>
            <Button 
               onClick={handleSave}
               disabled={isSaved}
               className={cn(
                  "rounded-full transition-all",
                  isSaved ? "bg-green-500 hover:bg-green-600 text-white" : ""
               )}
            >
               {isSaved ? 'Saved' : 'Save Entry'}
            </Button>
         </div>
      </motion.div>
    </div>
  );
}
