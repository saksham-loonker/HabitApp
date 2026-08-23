import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Circle, Clock, CheckCircle2, Inbox, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import TaskCard from '../tasks/TaskCard';

const defaultColumns = [
  { id: 'backlog', title: 'Backlog', icon: Inbox },
  { id: 'todo', title: 'To Do', icon: Circle },
  { id: 'in_progress', title: 'In Progress', icon: Clock },
  { id: 'done', title: 'Done', icon: CheckCircle2 }
];

export default function KanbanBoard({ 
  tasks, 
  onTaskUpdate, 
  onTaskClick, 
  onAddTask,
  onDeleteTask, // New prop for deletion
  customColumns 
}) {
  const [draggedTask, setDraggedTask] = useState(null);
  
  const columns = customColumns?.length ? customColumns.map((col, i) => ({
    id: col.toLowerCase().replace(/\s+/g, '_'),
    title: col,
    icon: defaultColumns[i]?.icon || Circle,
  })) : defaultColumns;

  const getColumnTasks = (columnId) => {
    return tasks.filter(task => task.status === columnId);
  };

  const handleDragStart = (result) => {
    const task = tasks.find(t => t.id === result.draggableId);
    setDraggedTask(task);
  };

  const handleDragEnd = (result) => {
    setDraggedTask(null);
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId !== destination.droppableId) {
      const task = tasks.find(t => t.id === draggableId);
      if (task) {
        onTaskUpdate(task.id, { 
          status: destination.droppableId,
          completed_at: destination.droppableId === 'done' ? new Date().toISOString() : null
        });
      }
    }
  };

  return (
    <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-6 overflow-x-auto pb-6 w-full h-full items-start snap-x">
        {columns.map((column) => {
          const columnTasks = getColumnTasks(column.id);
          const Icon = column.icon;

          return (
            <div
              key={column.id}
              className="flex-shrink-0 w-80 flex flex-col snap-center"
            >
              {/* Column header */}
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    {column.title}
                  </h3>
                  <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
                    {columnTasks.length}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => onAddTask(column.id)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Droppable area */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "min-h-[150px] rounded-2xl p-2 transition-colors",
                      snapshot.isDraggingOver ? "bg-secondary/50" : "bg-secondary/10"
                    )}
                  >
                    <AnimatePresence>
                      {columnTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="mb-3 last:mb-0 relative group"
                              style={provided.draggableProps.style}
                            >
                              <TaskCard
                                task={task}
                                onClick={() => onTaskClick(task)}
                                onToggle={(t) => onTaskUpdate(t.id, { 
                                  status: t.status === 'done' ? 'todo' : 'done',
                                  completed_at: t.status === 'done' ? null : new Date().toISOString()
                                })}
                                isDragging={snapshot.isDragging}
                              />
                              
                              {/* Delete Button for Done column */}
                              {column.id === 'done' && onDeleteTask && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('Delete this task permanently?')) {
                                      onDeleteTask(task.id);
                                    }
                                  }}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600 z-10"
                                  title="Delete Task"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                    </AnimatePresence>
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
        
        {/* Spacer to ensure last column is visible in overflow */}
        <div className="w-4 flex-shrink-0" /> 
      </div>
    </DragDropContext>
  );
}