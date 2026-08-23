import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { localStore } from '@/api/localStore';
import { format, isSameDay, parseISO, subDays } from 'date-fns';
import { Plus, Trash2, Check, Bell, BellOff, Flame, TrendingUp, Calendar, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const habitCardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, x: -100, transition: { duration: 0.3 } }
};

const heatmapVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 500 } }
};

export default function Habits() {
  const queryClient = useQueryClient();
  const [showNewHabit, setShowNewHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitTime, setNewHabitTime] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const { data: habits = [] } = useQuery({
    queryKey: ['habits'],
    queryFn: () => localStore.entities.Habit.list()
  });

  const createHabitMutation = useMutation({
    mutationFn: (data) => localStore.entities.Habit.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      setShowNewHabit(false);
      setNewHabitName('');
      setNewHabitTime('');
    }
  });

  const updateHabitMutation = useMutation({
    mutationFn: ({ id, data }) => localStore.entities.Habit.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] })
  });

  const deleteHabitMutation = useMutation({
    mutationFn: (id) => localStore.entities.Habit.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] })
  });

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const requestNotifications = async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === 'granted');
  };

  // Background Habit Monitor
  useEffect(() => {
    if (!notificationsEnabled) return;

    const checkReminders = () => {
      const now = new Date();
      const currentTime = format(now, 'HH:mm');

      habits.forEach(habit => {
        if (habit.reminder_time === currentTime) {
          new Notification(`Habit Reminder: ${habit.name}`, {
            body: "It's time to complete your habit!",
            icon: '/favicon.ico'
          });
        }
      });
    };

    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, [habits, notificationsEnabled]);

  const handleToggle = (habit, date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const completed = habit.completed_dates || [];
    const isCompleted = completed.includes(dateStr);

    const newCompleted = isCompleted
      ? completed.filter(d => d !== dateStr)
      : [...completed, dateStr];

    updateHabitMutation.mutate({
      id: habit.id,
      data: {
        completed_dates: newCompleted
      }
    });
  };

  const handleCreate = () => {
    if (!newHabitName.trim()) return;
    createHabitMutation.mutate({
      name: newHabitName,
      icon: '✨',
      reminder_time: newHabitTime || null
    });
  };

  const today = new Date();
  const last30Days = Array.from({ length: 30 }, (_, i) => subDays(today, 29 - i));
  const last7Days = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));

  const getCompletionColor = (habit, date) => {
    const isCompleted = habit.completed_dates?.includes(format(date, 'yyyy-MM-dd'));
    if (!isCompleted) return 'bg-secondary/50';
    
    const streak = habit.streak || 0;
    if (streak > 21) return 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/50';
    if (streak > 14) return 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/50';
    if (streak > 7) return 'bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg shadow-green-500/50';
    return 'bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/50';
  };

  const getStreakLevel = (streak) => {
    if (streak >= 30) return { label: 'Legendary', color: 'text-purple-500', bg: 'bg-purple-500' };
    if (streak >= 21) return { label: 'Epic', color: 'text-pink-500', bg: 'bg-pink-500' };
    if (streak >= 14) return { label: 'Amazing', color: 'text-blue-500', bg: 'bg-blue-500' };
    if (streak >= 7) return { label: 'Great', color: 'text-green-500', bg: 'bg-green-500' };
    if (streak >= 3) return { label: 'Good', color: 'text-emerald-500', bg: 'bg-emerald-500' };
    return { label: 'Starting', color: 'text-muted-foreground', bg: 'bg-muted-foreground' };
  };

  return (
    <motion.div 
      className="max-w-5xl mx-auto space-y-8 pb-20"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header with Gradient */}
      <motion.div variants={habitCardVariants} className="relative overflow-hidden rounded-3xl p-8"
        style={{
          background: 'linear-gradient(135deg, hsla(341, 87%, 94%, 0.5) 0%, hsla(262, 87%, 94%, 0.3) 100%)',
          border: '1px solid hsla(341, 87%, 84%, 0.3)'
        }}
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
              <span className="gradient-text">Habit Tracker</span>
            </h1>
            <p className="text-muted-foreground">Build consistency, one day at a time. Small steps lead to big changes.</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={requestNotifications}
              className={cn(
                "rounded-full border-2 transition-all duration-300",
                notificationsEnabled 
                  ? "bg-green-500/10 border-green-500 text-green-600 hover:bg-green-500/20" 
                  : "hover:shadow-lg"
              )}
            >
              {notificationsEnabled ? <Bell className="w-4 h-4 mr-2" /> : <BellOff className="w-4 h-4 mr-2" />}
              {notificationsEnabled ? "Alerts On" : "Enable"}
            </Button>
            <Button 
              onClick={() => setShowNewHabit(true)}
              className="rounded-full shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-300"
            >
              <Plus className="w-4 h-4 mr-2" /> New Habit
            </Button>
          </div>
        </div>
      </motion.div>

      {/* New Habit Form */}
      <AnimatePresence>
        {showNewHabit && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card rounded-3xl space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Habit Name
                  </label>
                  <Input
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    placeholder="e.g., Read 10 pages"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary" />
                    Reminder Time
                  </label>
                  <Input
                    type="time"
                    value={newHabitTime}
                    onChange={(e) => setNewHabitTime(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowNewHabit(false)} className="rounded-full">Cancel</Button>
                <Button onClick={handleCreate} className="rounded-full shadow-lg">Create Habit</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Habits List */}
      <motion.div variants={containerVariants} className="space-y-4">
        {habits.map((habit) => {
          const streakLevel = getStreakLevel(habit.streak || 0);
          return (
            <motion.div
              key={habit.id}
              variants={habitCardVariants}
              layout
              initial="hidden"
              animate="visible"
              exit="exit"
              whileHover={{ y: -2, scale: 1.01 }}
              className="glass-card rounded-3xl overflow-hidden"
            >
              {/* Habit Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-border/50">
                <div className="flex items-center gap-4">
                  <motion.div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, hsla(341, 87%, 94%, 0.8) 0%, hsla(262, 87%, 94%, 0.6) 100%)`,
                      backdropFilter: 'blur(10px)'
                    }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    {habit.icon || '✨'}
                  </motion.div>
                  <div>
                    <h3 className="font-bold text-xl">{habit.name}</h3>
                    <div className="flex items-center gap-3 text-sm">
                      <span className={`flex items-center gap-1 font-semibold ${streakLevel.color}`}>
                        <Flame className="w-4 h-4" />
                        {habit.streak || 0} days - {streakLevel.label}
                      </span>
                      {habit.reminder_time && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Bell className="w-3 h-3" /> {habit.reminder_time}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-red-500/10 hover:text-red-500 transition-colors"
                  onClick={() => deleteHabitMutation.mutate(habit.id)}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>

              {/* 30-Day Heatmap */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Last 30 Days
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {habit.completed_dates?.filter(d => {
                      const date = parseISO(d);
                      return date >= last30Days[0];
                    }).length || 0} / 30 days completed
                  </span>
                </div>
                
                <div className="grid grid-cols-15 gap-1.5">
                  {last30Days.map((day, i) => {
                    const isCompleted = habit.completed_dates?.includes(format(day, 'yyyy-MM-dd'));
                    const isTodayDate = isSameDay(day, today);
                    const dayOfWeek = format(day, 'EEE');

                    return (
                      <motion.div 
                        key={i} 
                        className="flex flex-col items-center gap-1"
                        variants={heatmapVariants}
                        custom={i}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: i * 0.02 }}
                      >
                        <button
                          onClick={() => isTodayDate && handleToggle(habit, day)}
                          disabled={!isTodayDate}
                          className={cn(
                            "w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-300",
                            isCompleted 
                              ? getCompletionColor(habit, day)
                              : "bg-secondary/30 hover:bg-secondary/50",
                            isTodayDate && !isCompleted && "ring-2 ring-primary ring-offset-2 animate-pulse"
                          )}
                          title={`${dayOfWeek}: ${isCompleted ? 'Completed' : 'Not completed'}`}
                        >
                          {isCompleted && <Check className="w-3 h-3 text-white" />}
                        </button>
                        {i % 5 === 4 && (
                          <span className="text-[9px] text-muted-foreground hidden sm:block">
                            {format(day, 'd')}
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Weekly Summary */}
              <div className="mt-6 pt-6 border-t border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    This Week
                  </span>
                  <span className="text-sm font-bold">
                    {last7Days.reduce((acc, day) => {
                      return acc + (habit.completed_dates?.includes(format(day, 'yyyy-MM-dd')) ? 1 : 0);
                    }, 0)} / 7
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  {last7Days.map((day, i) => {
                    const isCompleted = habit.completed_dates?.includes(format(day, 'yyyy-MM-dd'));
                    const isTodayDate = isSameDay(day, today);

                    return (
                      <div key={i} className="flex flex-col items-center gap-2 flex-1">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase">
                          {format(day, 'EEE')}
                        </span>
                        <motion.button
                          onClick={() => isTodayDate && handleToggle(habit, day)}
                          disabled={!isTodayDate}
                          whileHover={{ scale: isTodayDate ? 1.1 : 1 }}
                          whileTap={{ scale: isTodayDate ? 0.95 : 1 }}
                          className={cn(
                            "w-full aspect-square rounded-xl flex items-center justify-center transition-all duration-300",
                            isCompleted
                              ? "bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/30"
                              : isTodayDate
                                ? "bg-secondary hover:bg-secondary/80 ring-2 ring-primary/30 cursor-pointer"
                                : "bg-secondary/30"
                          )}
                        >
                          {isCompleted && <Check className="w-4 h-4" />}
                        </motion.button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          );
        })}

        {habits.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 glass-card rounded-3xl border-2 border-dashed"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Sparkles className="w-10 h-10 text-primary" />
            </motion.div>
            <h3 className="text-xl font-bold mb-2">Start Your Journey</h3>
            <p className="text-muted-foreground mb-4">Build your first habit and track your progress.</p>
            <Button onClick={() => setShowNewHabit(true)} className="rounded-full shadow-lg">
              <Plus className="w-4 h-4 mr-2" /> Create Your First Habit
            </Button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}