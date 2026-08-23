import React from 'react';
import { motion } from 'framer-motion';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import {
  Calendar, Clock, MapPin, Users, Paperclip,
  Repeat, Timer, Circle, CheckCircle2, ChevronRight,
  Flag, Sparkles
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const priorityConfig = {
  urgent: { 
    color: 'text-red-500', 
    badge: 'bg-gradient-to-r from-red-500 to-pink-500 text-white border-0',
    glow: 'shadow-red-500/30'
  },
  high: { 
    color: 'text-orange-500', 
    badge: 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0',
    glow: 'shadow-orange-500/30'
  },
  medium: { 
    color: 'text-amber-500', 
    badge: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0',
    glow: 'shadow-amber-500/30'
  },
  low: { 
    color: 'text-green-500', 
    badge: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0',
    glow: 'shadow-green-500/30'
  }
};

const categoryIcons = {
  work: <Calendar className="w-3 h-3" />,
  personal: <Sparkles className="w-3 h-3" />,
  health: <HeartIcon className="w-3 h-3" />,
  learning: <BookIcon className="w-3 h-3" />,
  errands: <ShoppingIcon className="w-3 h-3" />,
  social: <UsersIcon className="w-3 h-3" />
};

const categoryColors = {
  work: 'bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400',
  personal: 'bg-purple-100 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400',
  health: 'bg-green-100 text-green-600 dark:bg-green-950/30 dark:text-green-400',
  learning: 'bg-amber-100 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400',
  errands: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-950/30 dark:text-cyan-400',
  social: 'bg-pink-100 text-pink-600 dark:bg-pink-950/30 dark:text-pink-400'
};

export default function TaskCard({ task, onToggle, onClick, isDragging }) {
  const isCompleted = task.status === 'done';
  const dueDate = task.due_date ? new Date(task.due_date) : null;
  const isOverdue = dueDate && isPast(dueDate) && !isCompleted;

  const priorityStyle = priorityConfig[task.priority] || priorityConfig.medium;
  const categoryColor = categoryColors[task.category] || categoryColors.personal;
  const categoryIcon = categoryIcons[task.category];

  const formatDueDate = () => {
    if (!dueDate) return null;
    if (isToday(dueDate)) return 'Today';
    if (isTomorrow(dueDate)) return 'Tomorrow';
    return format(dueDate, 'MMM d');
  };

  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "group relative bg-white/80 dark:bg-card/80 backdrop-blur-xl rounded-2xl p-4 border transition-all duration-300 cursor-pointer overflow-hidden",
        isCompleted 
          ? "border-border/30 bg-secondary/10 opacity-70" 
          : isOverdue
            ? "border-red-300 dark:border-red-800 shadow-lg shadow-red-500/10"
            : "border-border/50 hover:border-primary/30 hover:shadow-lg card-hover",
        isDragging && "shadow-2xl rotate-2 z-50 scale-105"
      )}
      onClick={onClick}
    >
      {/* Priority Glow Effect */}
      {!isCompleted && (
        <div className={cn(
          "absolute top-0 left-0 w-1 h-full bg-gradient-to-b opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          task.priority === 'urgent' && "from-red-500 to-pink-500",
          task.priority === 'high' && "from-orange-500 to-amber-500",
          task.priority === 'medium' && "from-amber-500 to-yellow-500",
          task.priority === 'low' && "from-green-500 to-emerald-500"
        )}></div>
      )}

      <div className="flex items-start gap-3">
        {/* Enhanced Checkbox */}
        <motion.button
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); onToggle(task); }}
          className="mt-0.5 flex-shrink-0 transition-all duration-300"
        >
          {isCompleted ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
            </motion.div>
          ) : (
            <motion.div
              whileHover={{ scale: 1.1 }}
              className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                isOverdue 
                  ? "border-red-500 bg-red-50 dark:bg-red-950/20" 
                  : "border-muted-foreground/30 group-hover:border-primary group-hover:bg-primary/5"
              )}
            >
              {isOverdue && <div className="w-2 h-2 rounded-full bg-red-500"></div>}
            </motion.div>
          )}
        </motion.button>

        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className={cn(
            "font-semibold text-sm leading-tight mb-2 transition-all duration-300 line-clamp-2",
            isCompleted 
              ? "line-through text-muted-foreground/60" 
              : "text-foreground group-hover:text-primary"
          )}>
            {task.title}
          </h3>

          {/* Meta Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Priority Badge */}
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-md",
              priorityStyle.badge
            )}>
              {task.priority}
            </span>

            {/* Category Badge */}
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-medium capitalize flex items-center gap-1",
              categoryColor
            )}>
              {categoryIcon}
              {task.category}
            </span>

            {/* Due Date */}
            {dueDate && (
              <span className={cn(
                "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
                isOverdue 
                  ? "bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400" 
                  : "bg-secondary text-muted-foreground"
              )}>
                <Calendar className="w-3 h-3" />
                {formatDueDate()}
              </span>
            )}

            {/* Estimated Duration */}
            {task.estimated_duration && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                <Timer className="w-3 h-3" />
                {task.estimated_duration}m
              </span>
            )}
          </div>

          {/* Subtasks Progress */}
          {totalSubtasks > 0 && (
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{completedSubtasks}/{totalSubtasks} subtasks</span>
                <span>{Math.round(subtaskProgress)}%</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${subtaskProgress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Hover Chevron */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          whileHover={{ opacity: 1, x: 0 }}
          className="self-center opacity-0 group-hover:opacity-100 transition-all duration-300"
        >
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </motion.div>
      </div>
    </motion.div>
  );
}

// Simple icon components
function HeartIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
  );
}

function BookIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
  );
}

function ShoppingIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
  );
}

function UsersIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  );
}
