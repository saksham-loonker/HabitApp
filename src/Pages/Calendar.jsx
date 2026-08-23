import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { localStore } from '@/api/localStore';
import { runCerebrasInference } from '@/api/cerebrasClient';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import CalendarView from '@/components/calendar/CalendarView';
import TaskDetail from '@/components/tasks/TaskDetail';
import FloatingActionButton from '@/components/common/FloatingActionButton';
import VoiceInput from '@/components/voice/VoiceInput';
import QuickAddModal from '@/components/common/QuickAddModal';

export default function Calendar() {
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskDate, setNewTaskDate] = useState(null);
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

  const handleDateClick = (date) => {
    setNewTaskDate(date);
    setShowNewTask(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 pb-24">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b dark:border-slate-700 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-violet-500" />
            Calendar
          </h1>
        </div>
      </div>

      {/* Calendar */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <CalendarView
          tasks={tasks}
          onTaskClick={setSelectedTask}
          onDateClick={handleDateClick}
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
          try {
            const prompt = `Parse: "${transcript}" and extract structured data.
Today is ${format(new Date(), 'yyyy-MM-dd')}.
Return a JSON object with:
- title: string
- due_date: string (YYYY-MM-DD)
- priority: string (low/medium/high/urgent)
- category: string (work/personal/health/learning/errands/social)

Return ONLY the JSON object.`;

            const responseText = await runCerebrasInference([
              { role: 'system', content: 'You are a helpful assistant that extracts structured task data from text. You always respond with valid JSON.' },
              { role: 'user', content: prompt }
            ]);

            let jsonStr = responseText.trim();
            if (jsonStr.startsWith('```')) {
              jsonStr = jsonStr.replace(/^```(json)?/, '').replace(/```$/, '').trim();
            }
            
            const result = JSON.parse(jsonStr);
            await createTaskMutation.mutateAsync({ ...result, status: 'todo' });
          } catch (e) {
            console.error("Voice parsing failed", e);
            // Fallback to simple task creation with transcript as title
            await createTaskMutation.mutateAsync({ title: transcript, status: 'todo', priority: 'medium' });
          }
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
              status: 'todo', 
              priority: 'medium', 
              category: 'personal',
              due_date: newTaskDate ? format(newTaskDate, 'yyyy-MM-dd') : undefined
            }}
            projects={projects}
            onClose={() => { 
              setSelectedTask(null); 
              setShowNewTask(false); 
              setNewTaskDate(null);
            }}
            onSave={(data) => {
              if (selectedTask?.id) {
                updateTaskMutation.mutate({ id: selectedTask.id, data });
              } else {
                createTaskMutation.mutate(data);
              }
              setSelectedTask(null);
              setShowNewTask(false);
              setNewTaskDate(null);
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