import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  X, Calendar, Clock, MapPin, Users, Paperclip, Flag,
  CheckCircle2, Circle, Plus, Trash2, Edit3, Save,
  Repeat, Timer, Tag, FolderOpen, Bell, MessageSquare,
  Sword, Shield, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const priorities = ['low', 'medium', 'high', 'urgent'];
const categories = ['work', 'personal', 'health', 'learning', 'errands', 'social'];
const statuses = ['backlog', 'todo', 'in_progress', 'review', 'done'];
const recurrencePatterns = ['daily', 'weekly', 'biweekly', 'monthly', 'yearly'];

export default function TaskDetail({ task, onClose, onSave, onDelete, projects = [] }) {
  const [editedTask, setEditedTask] = useState({ ...task });
  const [newSubtask, setNewSubtask] = useState('');
  const [newTag, setNewTag] = useState('');
  const [isEditing, setIsEditing] = useState(!task.id);

  const handleSave = () => {
    onSave(editedTask);
    setIsEditing(false);
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    const subtasks = editedTask.subtasks || [];
    setEditedTask({
      ...editedTask,
      subtasks: [...subtasks, { id: Date.now().toString(), title: newSubtask, completed: false }]
    });
    setNewSubtask('');
  };

  const toggleSubtask = (id) => {
    const subtasks = editedTask.subtasks.map(s =>
      s.id === id ? { ...s, completed: !s.completed } : s
    );
    setEditedTask({ ...editedTask, subtasks });
  };

  const removeSubtask = (id) => {
    const subtasks = editedTask.subtasks.filter(s => s.id !== id);
    setEditedTask({ ...editedTask, subtasks });
  };

  const addTag = () => {
    if (!newTag.trim()) return;
    const tags = editedTask.tags || [];
    if (!tags.includes(newTag)) {
      setEditedTask({ ...editedTask, tags: [...tags, newTag] });
    }
    setNewTag('');
  };

  const removeTag = (tag) => {
    const tags = editedTask.tags.filter(t => t !== tag);
    setEditedTask({ ...editedTask, tags });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="glass-panel w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-white/10 shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 glass-panel border-b border-white/5 p-4 flex items-center justify-between z-10 rounded-t-3xl backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
               <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="font-display font-bold text-sm uppercase tracking-widest text-muted-foreground">Quest Log</span>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <Button size="sm" onClick={handleSave} className="bg-primary hover:bg-primary/90 text-white shadow-glow-primary">
                <Save className="w-4 h-4 mr-1" /> Save Quest
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)} className="text-white hover:bg-white/10">
                <Edit3 className="w-4 h-4 mr-1" /> Edit
              </Button>
            )}
            {task.id && (
              <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-950/30 hover:text-red-300" onClick={() => onDelete(task.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Button size="icon" variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-white">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Title Section */}
          <div className="space-y-2">
            {isEditing ? (
              <Input
                value={editedTask.title || ''}
                onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                placeholder="Quest Title"
                className="text-2xl font-display font-bold bg-transparent border-0 border-b border-white/10 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-white/20 text-white h-auto py-2"
              />
            ) : (
              <h2 className="text-3xl font-display font-bold text-white leading-tight">{editedTask.title}</h2>
            )}
          </div>

          {/* Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-white/5 rounded-2xl border border-white/5">
             {/* Status Selector */}
             <div className="space-y-1">
               <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold pl-1">Status</label>
               <Select
                  value={editedTask.status}
                  onValueChange={(v) => setEditedTask({ ...editedTask, status: v })}
                  disabled={!isEditing}
                >
                  <SelectTrigger className="bg-black/20 border-white/10 text-white h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/10 text-white">
                    {statuses.map(s => (
                      <SelectItem key={s} value={s} className="focus:bg-primary/20 focus:text-white">{s.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
             </div>

             {/* Priority Selector */}
             <div className="space-y-1">
               <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold pl-1">Difficulty</label>
               <Select
                  value={editedTask.priority}
                  onValueChange={(v) => setEditedTask({ ...editedTask, priority: v })}
                  disabled={!isEditing}
                >
                  <SelectTrigger className={cn(
                    "bg-black/20 border-white/10 text-white h-10",
                    editedTask.priority === 'urgent' && "text-red-400 border-red-500/30",
                    editedTask.priority === 'high' && "text-orange-400 border-orange-500/30"
                  )}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/10 text-white">
                    {priorities.map(p => (
                      <SelectItem key={p} value={p} className="focus:bg-primary/20 focus:text-white uppercase font-bold text-xs">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
             </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" /> Deadline
              </label>
              <Input
                type="date"
                value={editedTask.due_date ? format(new Date(editedTask.due_date), 'yyyy-MM-dd') : ''}
                onChange={(e) => setEditedTask({ ...editedTask, due_date: e.target.value })}
                disabled={!isEditing}
                className="bg-black/20 border-white/10 text-white"
              />
            </div>
            
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" /> Time
              </label>
              <Input
                type="time"
                value={editedTask.due_time || ''}
                onChange={(e) => setEditedTask({ ...editedTask, due_time: e.target.value })}
                disabled={!isEditing}
                className="bg-black/20 border-white/10 text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <FolderOpen className="w-3 h-3" /> Category
              </label>
              <Select
                value={editedTask.category}
                onValueChange={(v) => setEditedTask({ ...editedTask, category: v })}
                disabled={!isEditing}
              >
                <SelectTrigger className="bg-black/20 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10 text-white">
                  {categories.map(c => (
                    <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
               <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Timer className="w-3 h-3" /> Duration (m)
               </label>
               <Input
                  type="number"
                  value={editedTask.estimated_duration || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, estimated_duration: parseInt(e.target.value) || null })}
                  disabled={!isEditing}
                  className="bg-black/20 border-white/10 text-white"
                  placeholder="30"
               />
            </div>
          </div>

          {/* Recurring Toggle */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                 <Repeat className="w-4 h-4" />
              </div>
              <div>
                 <p className="text-sm font-bold text-white">Recurring Quest</p>
                 <p className="text-[10px] text-muted-foreground">Does this quest repeat?</p>
              </div>
            </div>
            <Switch
              checked={editedTask.is_recurring || false}
              onCheckedChange={(v) => setEditedTask({ ...editedTask, is_recurring: v })}
              disabled={!isEditing}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          {editedTask.is_recurring && (
             <div className="animate-accordion-down overflow-hidden">
                <Select
                  value={editedTask.recurrence_pattern || 'daily'}
                  onValueChange={(v) => setEditedTask({ ...editedTask, recurrence_pattern: v })}
                  disabled={!isEditing}
                >
                  <SelectTrigger className="bg-black/20 border-white/10 text-white w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/10 text-white">
                    {recurrencePatterns.map(p => (
                      <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
             </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-3 h-3" /> Mission Briefing
            </label>
            <Textarea
              value={editedTask.notes || ''}
              onChange={(e) => setEditedTask({ ...editedTask, notes: e.target.value })}
              disabled={!isEditing}
              placeholder="Add notes..."
              rows={4}
              className="bg-black/20 border-white/10 text-white resize-none focus-visible:ring-primary"
            />
          </div>

          {/* Subtasks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
               <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" /> Objectives
               </label>
               <span className="text-[10px] text-muted-foreground">
                  {editedTask.subtasks?.filter(s => s.completed).length || 0}/{editedTask.subtasks?.length || 0} Complete
               </span>
            </div>
            
            <div className="space-y-2 bg-black/20 p-2 rounded-xl border border-white/5">
              <AnimatePresence mode="popLayout">
                {editedTask.subtasks?.map((subtask) => (
                  <motion.div
                    key={subtask.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg group transition-colors"
                  >
                    <button 
                       onClick={() => isEditing && toggleSubtask(subtask.id)}
                       className="flex-shrink-0"
                    >
                      {subtask.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                      )}
                    </button>
                    <span className={cn(
                      "flex-1 text-sm text-white transition-all",
                      subtask.completed && "line-through text-muted-foreground opacity-50"
                    )}>
                      {subtask.title}
                    </span>
                    {isEditing && (
                      <button onClick={() => removeSubtask(subtask.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-4 h-4 text-red-400 hover:text-red-300" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {(!editedTask.subtasks || editedTask.subtasks.length === 0) && (
                 <div className="text-center py-4 text-muted-foreground text-xs italic opacity-50">No sub-objectives defined</div>
              )}
            </div>

            {isEditing && (
              <div className="flex gap-2">
                <Input
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  placeholder="Add new objective..."
                  onKeyPress={(e) => e.key === 'Enter' && addSubtask()}
                  className="bg-black/20 border-white/10 text-white"
                />
                <Button size="icon" className="bg-primary hover:bg-primary/80 text-white" onClick={addSubtask}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
