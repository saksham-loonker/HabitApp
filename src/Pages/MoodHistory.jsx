import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { localStore } from '@/api/localStore';
import { format, parseISO } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Sparkles, Zap, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const moodColors = {
  'Great': '#10b981', // Emerald
  'Good': '#f59e0b',  // Amber
  'Okay': '#3b82f6',  // Blue
  'Low': '#64748b',   // Slate
  'Bad': '#f43f5e'    // Rose
};

const moodValues = {
  'Great': 5,
  'Good': 4,
  'Okay': 3,
  'Low': 2,
  'Bad': 1
};

export default function MoodHistory() {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['moodHistory'],
    queryFn: () => localStore.entities.Mood.list()
  });

  // Process data for chart
  const chartData = history.map(entry => ({
    date: format(parseISO(entry.date), 'MMM d'),
    energy: entry.energy + 1, // 0-2 -> 1-3 for visual
    moodScore: moodValues[entry.mood] || 3,
    mood: entry.mood,
    rawDate: entry.date
  }));

  if (isLoading) return <div className="p-8 text-center">Loading history...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-light tracking-tight">Mood & Energy History</h1>
        <p className="text-muted-foreground mt-1">Track your emotional trends over time.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-card p-6 rounded-3xl border border-border/50 shadow-sm">
          <h3 className="text-lg font-medium mb-6 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Mood Trends
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
                  dy={10}
                />
                <YAxis hide domain={[0, 6]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="moodScore" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorMood)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stats / Recent List */}
        <div className="space-y-6">
           {/* Quick Stats */}
           <div className="bg-card p-6 rounded-3xl border border-border/50 shadow-sm">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Overview</h3>
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500" /> Average Mood</span>
                    <span className="font-semibold">Good</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-blue-500" /> Energy Peak</span>
                    <span className="font-semibold">Morning</span>
                 </div>
              </div>
           </div>

           {/* Recent Entries List */}
           <div className="bg-card p-6 rounded-3xl border border-border/50 shadow-sm max-h-[400px] overflow-y-auto">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Recent Logs</h3>
              <div className="space-y-3">
                 {history.slice().reverse().map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                       <div className="flex items-center gap-3">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: moodColors[entry.mood] || '#94a3b8' }} 
                          />
                          <div>
                             <p className="font-medium text-sm">{entry.mood}</p>
                             <p className="text-xs text-muted-foreground">{format(parseISO(entry.date), 'MMM d, h:mm a')}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Zap className="w-3 h-3" />
                          {['Low', 'Med', 'High'][entry.energy]}
                       </div>
                    </div>
                 ))}
                 {history.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No entries yet.</p>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}