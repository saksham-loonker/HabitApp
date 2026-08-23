import React from 'react';
import { motion } from 'framer-motion';
import { format, subDays, isSameDay, parseISO } from 'date-fns';
import { Plus, Check, Flame, TrendingUp, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function HabitTracker({ habits, onToggle, onAdd }) {
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));

  const isCompletedOnDate = (habit, date) => {
    return habit.completed_dates?.some(d =>
      isSameDay(parseISO(d), date)
    );
  };

  const getStreakColor = (streak) => {
    if (streak >= 21) return 'from-purple-500 to-pink-500';
    if (streak >= 14) return 'from-blue-500 to-cyan-500';
    if (streak >= 7) return 'from-green-500 to-emerald-500';
    if (streak >= 3) return 'from-amber-500 to-orange-500';
    return 'from-gray-400 to-gray-500';
  };

  const totalToday = habits.length;
  const completedToday = habits.filter(h => isCompletedOnDate(h, today)).length;
  const progressPercent = totalToday > 0 ? (completedToday / totalToday) * 100 : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-3xl p-6 relative overflow-hidden"
    >
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-500/10 to-rose-500/10 rounded-full blur-2xl"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Habits</h3>
              <p className="text-xs text-muted-foreground">{completedToday}/{totalToday} completed today</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onAdd}
            className="h-8 text-xs rounded-full hover:bg-primary/10 hover:text-primary"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add
          </Button>
        </div>

        {/* Progress Bar */}
        {totalToday > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-muted-foreground font-medium">Daily Progress</span>
              <span className="font-bold text-primary">{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full"
              />
            </div>
          </div>
        )}

        {/* Habits List */}
        <div className="space-y-3">
          {habits.slice(0, 4).map((habit, index) => {
            const isCompletedToday = isCompletedOnDate(habit, today);
            const streakColor = getStreakColor(habit.streak || 0);

            return (
              <motion.div
                key={habit.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ x: 4 }}
                className="group flex items-center justify-between p-3 rounded-2xl bg-secondary/30 hover:bg-secondary/50 transition-all duration-300"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => isSameDay(today, today) && onToggle(habit, today)}
                    className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 flex-shrink-0",
                      isCompletedToday
                        ? `bg-gradient-to-br ${streakColor} shadow-lg`
                        : "bg-secondary hover:bg-primary/20"
                    )}
                  >
                    {isCompletedToday ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        <Check className="w-4 h-4 text-white" />
                      </motion.div>
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/30"></div>
                    )}
                  </motion.button>
                  
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-sm truncate">{habit.name}</h4>
                    <div className="flex items-center gap-2 text-xs">
                      {habit.streak > 0 && (
                        <span className={cn(
                          "flex items-center gap-1 font-medium",
                          streakColor.includes('purple') ? 'text-purple-500' :
                          streakColor.includes('blue') ? 'text-blue-500' :
                          streakColor.includes('green') ? 'text-green-500' :
                          streakColor.includes('amber') ? 'text-amber-500' :
                          'text-muted-foreground'
                        )}>
                          <Flame className="w-3 h-3" />
                          {habit.streak} day{habit.streak !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mini Week Progress */}
                <div className="flex items-center gap-1 ml-2">
                  {last7Days.map((day, i) => {
                    const isCompleted = isCompletedOnDate(habit, day);
                    const isTodayDate = isSameDay(day, today);

                    return (
                      <div 
                        key={i}
                        className={cn(
                          "w-1.5 h-5 rounded-full transition-all duration-300",
                          isCompleted
                            ? `bg-gradient-to-t ${streakColor}`
                            : isTodayDate
                              ? "bg-primary/30"
                              : "bg-secondary"
                        )}
                        title={`${format(day, 'EEE')}: ${isCompleted ? 'Completed' : 'Not completed'}`}
                      />
                    );
                  })}
                </div>
              </motion.div>
            );
          })}

          {habits.length === 0 && (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-950/30 dark:to-rose-950/30 flex items-center justify-center">
                <Target className="w-5 h-5 text-pink-500" />
              </div>
              <p className="text-sm text-muted-foreground">No active habits.</p>
              <Button variant="link" onClick={onAdd} className="text-xs">
                Start building one today
              </Button>
            </div>
          )}

          {habits.length > 4 && (
            <div className="text-center pt-2">
              <span className="text-xs text-muted-foreground">
                +{habits.length - 4} more habits
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
