import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { localStore } from '@/api/localStore';
import { format, isToday, isPast, parseISO } from 'date-fns';
import {
  Sparkles, Calendar, ChevronRight, Sun, Plus, Zap, Target,
  TrendingUp, Award, Clock, CheckCircle2, Flame, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

import TaskCard from '@/components/tasks/TaskCard';
import PomodoroTimer from '@/components/widgets/PomodoroTimer';
import HabitTracker from '@/components/widgets/HabitTracker';
import ProgressAnalytics from '@/components/widgets/ProgressAnalytics';
import MoodTracker from '@/components/widgets/MoodTracker';
import FloatingActionButton from '@/components/common/FloatingActionButton';
import VoiceInput from '@/components/voice/VoiceInput';
import QuickAddModal from '@/components/common/QuickAddModal';
import TaskDetail from '@/components/tasks/TaskDetail';
import AIAssistant from '@/components/ai/AIAssistant';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const statCardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } }
};

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showVoice, setShowVoice] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showNewTask, setShowNewTask] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const u = await localStore.auth.me();
      setUser(u);
    };
    loadUser();
  }, []);

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => localStore.entities.Task.list('-created_date')
  });

  const { data: habits = [] } = useQuery({
    queryKey: ['habits'],
    queryFn: () => localStore.entities.Habit.list()
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => localStore.entities.Project.list()
  });

  const { data: moods = [] } = useQuery({
    queryKey: ['moods'],
    queryFn: () => localStore.entities.Mood.list()
  });

  const { data: preferences = {} } = useQuery({
    queryKey: ['preferences'],
    queryFn: async () => {
      const user = await localStore.auth.me();
      if (!user) return {};
      const prefs = await localStore.entities.UserPreferences.filter({ user_email: user.email });
      return prefs[0] || {};
    }
  });

  const createTaskMutation = useMutation({
    mutationFn: (data) => localStore.entities.Task.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => localStore.entities.Task.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => localStore.entities.Task.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const updateHabitMutation = useMutation({
    mutationFn: ({ id, data }) => localStore.entities.Habit.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] })
  });

  const handleVoiceTranscript = async (transcript) => { /* Logic */ };
  const handleToggleHabit = async (habit, date) => { /* Logic */ };

  // Calculate stats
  const todayTasks = tasks.filter(t => t.due_date && isToday(parseISO(t.due_date)) && t.status !== 'done');
  const completedToday = tasks.filter(t => t.completed_at && isToday(parseISO(t.completed_at))).length;
  const pendingTasks = tasks.filter(t => t.status !== 'done').length;
  const totalHabits = habits.length;
  const activeStreak = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getMotivationalQuote = () => {
    const quotes = [
      { text: "Small progress is still progress.", author: "Unknown" },
      { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
      { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
      { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
      { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" }
    ];
    return quotes[new Date().getDay() % quotes.length];
  };

  return (
    <motion.div 
      className="space-y-8 pb-20"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Hero Section with Gradient Background */}
      <motion.div 
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl p-8 md:p-10"
        style={{
          background: 'linear-gradient(135deg, hsla(252, 87%, 64%, 0.15) 0%, hsla(262, 83%, 58%, 0.1) 50%, hsla(280, 87%, 64%, 0.1) 100%)',
          border: '1px solid hsla(252, 87%, 64%, 0.2)'
        }}
      >
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <motion.div 
                className="flex items-center gap-2 text-muted-foreground"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium">{format(new Date(), 'EEEE, MMMM d')}</span>
              </motion.div>
              
              <motion.h1 
                className="text-3xl md:text-5xl font-bold tracking-tight"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <span className="text-muted-foreground">{getGreeting()}, </span>
                <span className="gradient-text">{user?.full_name?.split(' ')[0] || 'Friend'}</span>
              </motion.h1>
              
              <motion.p 
                className="text-muted-foreground text-sm md:text-base max-w-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {getMotivationalQuote().text}
              </motion.p>
            </div>
            
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Button 
                variant="outline" 
                className="rounded-full border-2 hover:shadow-lg transition-all duration-300"
                onClick={() => setShowAI(true)}
              >
                <Sparkles className="w-4 h-4 mr-2 text-amber-500" />
                Assistant
              </Button>
              <Button 
                className="rounded-full shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-300"
                onClick={() => setShowNewTask(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { 
            label: 'Tasks Today', 
            value: todayTasks.length, 
            icon: Target, 
            color: 'from-blue-500 to-cyan-500',
            bgColor: 'bg-blue-50 dark:bg-blue-950/20'
          },
          { 
            label: 'Completed', 
            value: completedToday, 
            icon: CheckCircle2, 
            color: 'from-green-500 to-emerald-500',
            bgColor: 'bg-green-50 dark:bg-green-950/20'
          },
          { 
            label: 'Active Habits', 
            value: totalHabits, 
            icon: Flame, 
            color: 'from-orange-500 to-red-500',
            bgColor: 'bg-orange-50 dark:bg-orange-950/20'
          },
          { 
            label: 'Best Streak', 
            value: activeStreak, 
            icon: Award, 
            color: 'from-purple-500 to-pink-500',
            bgColor: 'bg-purple-50 dark:bg-purple-950/20'
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            variants={statCardVariants}
            whileHover={{ y: -4, scale: 1.02 }}
            className={`${stat.bgColor} rounded-2xl p-5 border border-white/50 dark:border-white/5 backdrop-blur-sm card-hover`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              {index === 1 && completedToday > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-2 h-2 bg-green-500 rounded-full pulse-ring"
                />
              )}
            </div>
            <div className="text-2xl md:text-3xl font-bold">{stat.value}</div>
            <div className="text-xs text-muted-foreground font-medium">{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Tasks */}
        <div className="lg:col-span-7 space-y-6">
          <motion.div 
            variants={itemVariants}
            className="glass-card rounded-3xl p-1 overflow-hidden"
          >
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Today's Focus</h2>
                  <p className="text-xs text-muted-foreground">{todayTasks.length} tasks awaiting</p>
                </div>
              </div>
              <Link to={createPageUrl('Tasks')}>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="px-5 pb-5 space-y-3">
              <AnimatePresence mode="popLayout">
                {todayTasks.length > 0 ? (
                  todayTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      whileHover={{ scale: 1.01 }}
                    >
                      <TaskCard
                        task={task}
                        onClick={() => setSelectedTask(task)}
                        onToggle={(t) => updateTaskMutation.mutate({
                          id: t.id,
                          data: {
                            status: t.status === 'done' ? 'todo' : 'done',
                            completed_at: t.status === 'done' ? null : new Date().toISOString()
                          }
                        })}
                      />
                    </motion.div>
                  ))
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-blue-500" />
                    </div>
                    <p className="text-muted-foreground font-medium">No tasks for today.</p>
                    <Button variant="link" onClick={() => setShowNewTask(true)} className="mt-2">
                      Add your first task
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <ProgressAnalytics tasks={tasks} />
          </motion.div>
        </div>

        {/* Right: Widgets */}
        <div className="lg:col-span-5 space-y-6">
          <motion.div variants={itemVariants} whileHover={{ y: -2 }}>
            <MoodTracker />
          </motion.div>
          <motion.div variants={itemVariants} whileHover={{ y: -2 }}>
            <PomodoroTimer settings={preferences} />
          </motion.div>
          <motion.div variants={itemVariants} whileHover={{ y: -2 }}>
            <HabitTracker
              habits={habits}
              onToggle={handleToggleHabit}
              onAdd={() => {}}
            />
          </motion.div>
        </div>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton
        onAddTask={() => setShowNewTask(true)}
        onVoiceInput={() => setShowVoice(true)}
        onQuickAdd={() => setShowQuickAdd(true)}
      />

      {/* Modals */}
      <VoiceInput isOpen={showVoice} onClose={() => setShowVoice(false)} onTranscript={handleVoiceTranscript} />
      <QuickAddModal isOpen={showQuickAdd} onClose={() => setShowQuickAdd(false)} onSave={(task) => createTaskMutation.mutate(task)} />
      <AIAssistant tasks={tasks} moods={moods} settings={preferences} isOpen={showAI} onClose={() => setShowAI(false)} />

      <AnimatePresence>
        {(selectedTask || showNewTask) && (
          <TaskDetail
            task={selectedTask || { status: 'todo', priority: 'medium', category: 'personal' }}
            projects={projects}
            onClose={() => { setSelectedTask(null); setShowNewTask(false); }}
            onSave={(data) => {
              if (selectedTask?.id) {
                updateTaskMutation.mutate({ id: selectedTask.id, data });
              } else {
                createTaskMutation.mutate(data);
              }
              setSelectedTask(null);
              setShowNewTask(false);
            }}
            onDelete={(id) => {
              deleteTaskMutation.mutate(id);
              setSelectedTask(null);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}