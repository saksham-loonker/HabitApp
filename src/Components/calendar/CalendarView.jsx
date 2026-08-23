import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday,
  addWeeks, subWeeks, startOfDay, parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, List, Grid3X3, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const categoryColors = {
  work: 'bg-blue-500',
  personal: 'bg-purple-500',
  health: 'bg-green-500',
  learning: 'bg-amber-500',
  errands: 'bg-rose-500',
  social: 'bg-cyan-500'
};

export default function CalendarView({ tasks, onTaskClick, onDateClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // month, week, day, agenda

  const getTasksForDate = (date) => {
    return tasks.filter(task => {
      if (!task.due_date) return false;
      return isSameDay(parseISO(task.due_date), date);
    });
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const currentDay = day;
        const dayTasks = getTasksForDate(currentDay);
        const isCurrentMonth = isSameMonth(day, monthStart);

        days.push(
          <motion.div
            key={day.toString()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "min-h-[80px] sm:min-h-[100px] p-1 border-b border-r dark:border-slate-700 cursor-pointer transition-colors",
              !isCurrentMonth && "bg-slate-50 dark:bg-slate-800/50",
              isToday(day) && "bg-violet-50 dark:bg-violet-900/20"
            )}
            onClick={() => onDateClick(currentDay)}
          >
            <div className={cn(
              "text-xs sm:text-sm font-medium mb-1",
              !isCurrentMonth && "text-slate-400",
              isToday(day) && "text-violet-600 dark:text-violet-400"
            )}>
              {isToday(day) ? (
                <span className="inline-flex items-center justify-center w-6 h-6 bg-violet-500 text-white rounded-full">
                  {format(day, 'd')}
                </span>
              ) : (
                format(day, 'd')
              )}
            </div>
            <div className="space-y-0.5 overflow-hidden">
              {dayTasks.slice(0, 3).map((task, idx) => (
                <div
                  key={task.id}
                  className={cn(
                    "text-[10px] sm:text-xs px-1.5 py-0.5 rounded truncate text-white",
                    categoryColors[task.category] || 'bg-slate-500',
                    task.status === 'done' && 'opacity-50 line-through'
                  )}
                  onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
                >
                  {task.due_time && <span className="opacity-70">{task.due_time} </span>}
                  {task.title}
                </div>
              ))}
              {dayTasks.length > 3 && (
                <div className="text-[10px] text-slate-500 dark:text-slate-400 px-1">
                  +{dayTasks.length - 3} more
                </div>
              )}
            </div>
          </motion.div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      );
      days = [];
    }

    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border dark:border-slate-700">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b dark:border-slate-700">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.charAt(0)}</span>
            </div>
          ))}
        </div>
        {rows}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const days = [];

    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const dayTasks = getTasksForDate(day);

      days.push(
        <div 
          key={i} 
          className={cn(
            "flex-1 min-h-[300px] border-r dark:border-slate-700 p-2",
            isToday(day) && "bg-violet-50 dark:bg-violet-900/10"
          )}
          onClick={() => onDateClick(day)}
        >
          <div className={cn(
            "text-center mb-3",
            isToday(day) && "text-violet-600"
          )}>
            <div className="text-xs text-slate-500">{format(day, 'EEE')}</div>
            <div className={cn(
              "text-lg font-semibold",
              isToday(day) && "w-8 h-8 bg-violet-500 text-white rounded-full flex items-center justify-center mx-auto"
            )}>
              {format(day, 'd')}
            </div>
          </div>
          <div className="space-y-1">
            {dayTasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  "text-xs p-2 rounded-lg text-white cursor-pointer",
                  categoryColors[task.category] || 'bg-slate-500'
                )}
                onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
              >
                {task.due_time && <div className="opacity-70">{task.due_time}</div>}
                <div className="font-medium truncate">{task.title}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border dark:border-slate-700">
        <div className="flex overflow-x-auto">
          {days}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayTasks = getTasksForDate(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border dark:border-slate-700">
        <div className="p-4 border-b dark:border-slate-700">
          <h3 className="text-lg font-semibold">{format(currentDate, 'EEEE, MMMM d')}</h3>
          <p className="text-sm text-slate-500">{dayTasks.length} tasks</p>
        </div>
        <div className="max-h-[500px] overflow-y-auto">
          {hours.map(hour => {
            const hourTasks = dayTasks.filter(t => {
              if (!t.due_time) return hour === 9; // Default unscheduled to 9am
              const taskHour = parseInt(t.due_time.split(':')[0]);
              return taskHour === hour;
            });

            return (
              <div key={hour} className="flex border-b dark:border-slate-700/50 min-h-[60px]">
                <div className="w-16 py-2 px-3 text-xs text-slate-500 dark:text-slate-400 border-r dark:border-slate-700">
                  {format(new Date().setHours(hour, 0), 'h a')}
                </div>
                <div className="flex-1 p-1 space-y-1">
                  {hourTasks.map(task => (
                    <div
                      key={task.id}
                      className={cn(
                        "text-sm p-2 rounded-lg text-white cursor-pointer",
                        categoryColors[task.category] || 'bg-slate-500'
                      )}
                      onClick={() => onTaskClick(task)}
                    >
                      <div className="font-medium">{task.title}</div>
                      {task.estimated_duration && (
                        <div className="text-xs opacity-70">{task.estimated_duration} min</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAgendaView = () => {
    const upcomingTasks = tasks
      .filter(t => t.due_date)
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

    const groupedTasks = upcomingTasks.reduce((acc, task) => {
      const dateKey = format(parseISO(task.due_date), 'yyyy-MM-dd');
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(task);
      return acc;
    }, {});

    return (
      <div className="space-y-4">
        {Object.entries(groupedTasks).map(([dateKey, dateTasks]) => (
          <div key={dateKey} className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border dark:border-slate-700">
            <div className="p-3 bg-slate-50 dark:bg-slate-700/50 border-b dark:border-slate-700">
              <div className={cn(
                "font-semibold",
                isToday(parseISO(dateKey)) && "text-violet-600"
              )}>
                {isToday(parseISO(dateKey)) ? 'Today' : format(parseISO(dateKey), 'EEEE, MMMM d')}
              </div>
            </div>
            <div className="divide-y dark:divide-slate-700">
              {dateTasks.map(task => (
                <div
                  key={task.id}
                  className="p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  onClick={() => onTaskClick(task)}
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    categoryColors[task.category] || 'bg-slate-400'
                  )} />
                  <div className="flex-1">
                    <div className={cn(
                      "font-medium",
                      task.status === 'done' && 'line-through text-slate-400'
                    )}>
                      {task.title}
                    </div>
                    {task.due_time && (
                      <div className="text-xs text-slate-500">{task.due_time}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const navigate = (direction) => {
    if (view === 'month') {
      setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === 'next' ? addDays(currentDate, 1) : addDays(currentDate, -1));
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('prev')}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
            {view === 'day' 
              ? format(currentDate, 'MMMM d, yyyy')
              : format(currentDate, 'MMMM yyyy')
            }
          </h2>
          <Button variant="ghost" size="icon" onClick={() => navigate('next')}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          {[
            { id: 'month', icon: Grid3X3, label: 'Month' },
            { id: 'week', icon: LayoutGrid, label: 'Week' },
            { id: 'day', icon: Calendar, label: 'Day' },
            { id: 'agenda', icon: List, label: 'Agenda' }
          ].map(v => (
            <Button
              key={v.id}
              variant={view === v.id ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                "h-8",
                view === v.id && "bg-white dark:bg-slate-700 shadow-sm"
              )}
              onClick={() => setView(v.id)}
            >
              <v.icon className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline text-xs">{v.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Today button */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentDate(new Date())}
          className="text-xs"
        >
          Today
        </Button>
      </div>

      {/* Calendar content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={view + currentDate.toISOString()}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {view === 'month' && renderMonthView()}
          {view === 'week' && renderWeekView()}
          {view === 'day' && renderDayView()}
          {view === 'agenda' && renderAgendaView()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}