import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { localStore } from '@/api/localStore';
import {
  Search, Filter, SortAsc, Grid3X3, List,
  ChevronDown, X, Plus, FolderOpen, CheckCircle2,
  Clock, Flag, Calendar, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import TaskCard from '@/components/tasks/TaskCard';
import TaskDetail from '@/components/tasks/TaskDetail';
import FloatingActionButton from '@/components/common/FloatingActionButton';
import VoiceInput from '@/components/voice/VoiceInput';
import QuickAddModal from '@/components/common/QuickAddModal';

const categories = ['all', 'work', 'personal', 'health', 'learning', 'errands', 'social'];
const priorities = ['all', 'urgent', 'high', 'medium', 'low'];
const statuses = ['all', 'backlog', 'todo', 'in_progress', 'review', 'done'];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const taskVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -100, transition: { duration: 0.2 } }
};

export default function Tasks() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_date');
  const [viewMode, setViewMode] = useState('list');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => localStore.entities.Task.list('-created_date')
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => localStore.entities.Project.list()
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

  const filteredTasks = tasks.filter(task => {
    if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter !== 'all' && task.category !== categoryFilter) return false;
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (projectFilter !== 'all' && task.project !== projectFilter) return false;
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case 'due_date':
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      case 'priority':
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return new Date(b.created_date) - new Date(a.created_date);
    }
  });

  const activeFiltersCount = [categoryFilter, priorityFilter, statusFilter, projectFilter]
    .filter(f => f !== 'all').length;

  const clearFilters = () => {
    setCategoryFilter('all');
    setPriorityFilter('all');
    setStatusFilter('all');
    setProjectFilter('all');
    setSearch('');
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'done').length;
    const pending = total - completed;
    const urgent = tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length;
    return { total, completed, pending, urgent };
  };

  const stats = getTaskStats();

  return (
    <div className="min-h-screen pb-24">
      {/* Enhanced Header with Stats */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-8 mb-8"
        style={{
          background: 'linear-gradient(135deg, hsla(252, 87%, 64%, 0.15) 0%, hsla(200, 87%, 64%, 0.1) 100%)',
          border: '1px solid hsla(252, 87%, 64%, 0.2)'
        }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
                <span className="gradient-text">Tasks</span>
              </h1>
              <p className="text-muted-foreground">Manage your tasks and conquer your goals.</p>
            </div>
            <Button 
              onClick={() => setShowNewTask(true)}
              className="rounded-full shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 self-start"
            >
              <Plus className="w-4 h-4 mr-2" /> New Task
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total', value: stats.total, icon: FolderOpen, color: 'from-blue-500 to-cyan-500' },
              { label: 'Pending', value: stats.pending, icon: Clock, color: 'from-amber-500 to-orange-500' },
              { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'from-green-500 to-emerald-500' },
              { label: 'Urgent', value: stats.urgent, icon: Zap, color: 'from-red-500 to-pink-500' },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ y: -2 }}
                className="bg-white/50 dark:bg-black/30 backdrop-blur-sm rounded-2xl p-4 border border-white/30 dark:border-white/10"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-2xl font-bold">{stat.value}</span>
                </div>
                <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Search & Filters Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl mb-6"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="pl-9 rounded-xl"
            />
          </div>
          
          <Button
            variant={showFilters || activeFiltersCount > 0 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn("rounded-full relative", showFilters && "shadow-lg")}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-primary to-accent text-white text-xs rounded-full flex items-center justify-center shadow-lg">
                {activeFiltersCount}
              </span>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full">
                <SortAsc className="w-4 h-4 mr-2" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="rounded-xl">
              <DropdownMenuItem onClick={() => setSortBy('created_date')}>Newest</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('due_date')}>Due Date</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('priority')}>Priority</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('title')}>Alphabetical</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center bg-secondary rounded-full p-1">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 w-8 rounded-full p-0"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 w-8 rounded-full p-0"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Expandable Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {categories.map(c => (
                      <SelectItem key={c} value={c}>
                        {c === 'all' ? 'All Categories' : c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {priorities.map(p => (
                      <SelectItem key={p} value={p}>
                        {p === 'all' ? 'All Priorities' : p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {statuses.map(s => (
                      <SelectItem key={s} value={s}>
                        {s === 'all' ? 'All Statuses' : s.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Project" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={clearFilters}
                >
                  <X className="w-4 h-4 mr-1" /> Clear all filters
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Tasks Grid/List */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={cn(
          viewMode === 'grid'
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            : "space-y-3"
        )}
      >
        <AnimatePresence mode="popLayout">
          {sortedTasks.length > 0 ? (
            sortedTasks.map(task => (
              <motion.div
                key={task.id}
                variants={taskVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
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
              className="col-span-full text-center py-20 glass-card rounded-3xl border-2 border-dashed"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <FolderOpen className="w-10 h-10 text-blue-500" />
              </motion.div>
              <h3 className="text-xl font-bold mb-2">
                {activeFiltersCount > 0 ? "No tasks match your filters" : "No tasks yet"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {activeFiltersCount > 0
                  ? "Try adjusting your filters to see more tasks"
                  : "Create your first task and start being productive"
                }
              </p>
              <div className="flex gap-3 justify-center">
                {activeFiltersCount > 0 && (
                  <Button variant="outline" onClick={clearFilters} className="rounded-full">
                    Clear Filters
                  </Button>
                )}
                <Button onClick={() => setShowNewTask(true)} className="rounded-full shadow-lg">
                  <Plus className="w-4 h-4 mr-2" /> Add Task
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* FAB */}
      <FloatingActionButton
        onAddTask={() => setShowNewTask(true)}
        onVoiceInput={() => setShowVoice(true)}
        onQuickAdd={() => setShowQuickAdd(true)}
      />

      {/* Modals */}
      <VoiceInput
        isOpen={showVoice}
        onClose={() => setShowVoice(false)}
        onTranscript={async (transcript) => {
          await createTaskMutation.mutateAsync({
            title: transcript,
            status: 'todo',
            created_date: new Date().toISOString()
          });
        }}
      />

      <QuickAddModal
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onSave={(task) => createTaskMutation.mutate(task)}
      />

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
    </div>
  );
}
