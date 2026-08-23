import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { localStore } from '@/api/localStore';
import { Columns } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import KanbanBoard from '@/components/kanban/KanbanBoard';
import TaskDetail from '@/components/tasks/TaskDetail';
import FloatingActionButton from '@/components/common/FloatingActionButton';
import VoiceInput from '@/components/voice/VoiceInput';
import QuickAddModal from '@/components/common/QuickAddModal';

export default function Kanban() {
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskStatus, setNewTaskStatus] = useState('todo');
  const [projectFilter, setProjectFilter] = useState('all');
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

  const filteredTasks = projectFilter === 'all' 
    ? tasks 
    : tasks.filter(t => t.project === projectFilter);

  const handleAddTask = (status) => {
    setNewTaskStatus(status);
    setShowNewTask(true);
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-1">
        <h1 className="text-2xl font-light tracking-tight text-foreground flex items-center gap-2">
          <Columns className="w-5 h-5 text-primary" />
          Kanban Board
        </h1>
        <div className="flex items-center gap-2">
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-40 bg-card">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Board Container */}
      <div className="flex-1 overflow-hidden">
        <KanbanBoard
          tasks={filteredTasks}
          onTaskUpdate={(id, data) => updateTaskMutation.mutate({ id, data })}
          onTaskClick={setSelectedTask}
          onAddTask={handleAddTask}
          onDeleteTask={(id) => deleteTaskMutation.mutate(id)} // Pass delete handler
        />
      </div>

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
          // Mock parser for now, should use Assistant in real app
          await createTaskMutation.mutateAsync({ title: transcript, status: 'todo' });
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
            task={selectedTask || { 
              status: newTaskStatus, 
              priority: 'medium', 
              category: 'personal' 
            }}
            projects={projects}
            onClose={() => { 
              setSelectedTask(null); 
              setShowNewTask(false); 
            }}
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