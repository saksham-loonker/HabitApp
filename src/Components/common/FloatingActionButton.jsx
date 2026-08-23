import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Mic, FileText, Calendar, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FloatingActionButton({ 
  onAddTask, 
  onVoiceInput, 
  onQuickAdd 
}) {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { icon: Mic, label: 'Voice', color: 'bg-violet-500', action: onVoiceInput },
    { icon: FileText, label: 'Quick Add', color: 'bg-blue-500', action: onQuickAdd },
    { icon: Calendar, label: 'Schedule', color: 'bg-amber-500', action: () => onAddTask('scheduled') },
    { icon: CheckSquare, label: 'Task', color: 'bg-green-500', action: () => onAddTask() }
  ];

  return (
    <div className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-16 right-0 flex flex-col-reverse gap-3 mb-2"
          >
            {actions.map((action, i) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => { action.action(); setIsOpen(false); }}
                className="flex items-center gap-3 group justify-end"
              >
                <span className="px-2 py-1 bg-popover text-popover-foreground text-xs font-medium rounded-md shadow-sm border border-border opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {action.label}
                </span>
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110",
                  action.color
                )}>
                  <action.icon className="w-4 h-4" />
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95",
          isOpen 
            ? "bg-secondary text-secondary-foreground" 
            : "bg-primary text-primary-foreground"
        )}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
      >
        <Plus className="w-7 h-7" />
      </motion.button>
    </div>
  );
}
