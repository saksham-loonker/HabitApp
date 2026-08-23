import React from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { format, subDays, isSameDay, parseISO } from 'date-fns';
import { Activity, CheckCircle2, Clock, Target, TrendingUp, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProgressAnalytics({ tasks }) {
  const today = new Date();
  const completedCount = tasks.filter(t => t.status === 'done').length;
  const pendingCount = tasks.filter(t => t.status !== 'done').length;
  const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  // Last 7 days data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i);
    const completed = tasks.filter(t =>
      t.completed_at && isSameDay(parseISO(t.completed_at), date)
    ).length;
    return {
      day: format(date, 'EEE'),
      date: format(date, 'MMM d'),
      completed
    };
  });

  const statCards = [
    { 
      label: 'Completed', 
      value: completedCount, 
      icon: CheckCircle2, 
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      textColor: 'text-green-600'
    },
    { 
      label: 'Pending', 
      value: pendingCount, 
      icon: Clock, 
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-50 dark:bg-amber-950/20',
      textColor: 'text-amber-600'
    },
    { 
      label: 'Rate', 
      value: `${completionRate}%`, 
      icon: Target, 
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      textColor: 'text-blue-600'
    },
  ];

  return (
    <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-2xl"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-bold text-lg">Productivity</h3>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
            <TrendingUp className="w-3 h-3" />
            Last 7 Days
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {statCards.map((stat) => (
            <div 
              key={stat.label}
              className={cn(
                "p-3 rounded-2xl transition-all duration-300 hover:scale-105",
                stat.bgColor
              )}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <stat.icon className={cn("w-3.5 h-3.5", stat.textColor)} />
                <span className="text-[10px] font-medium text-muted-foreground">{stat.label}</span>
              </div>
              <div className={cn("text-xl font-bold", stat.textColor)}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={last7Days}>
              <defs>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
                dy={5}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  backdropFilter: 'blur(8px)'
                }}
                labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
                cursor={{ 
                  stroke: 'hsl(var(--primary))', 
                  strokeWidth: 2,
                  strokeDasharray: '4 4'
                }}
              />
              <Area
                type="monotone"
                dataKey="completed"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                strokeLinecap="round"
                fill="url(#colorCompleted)"
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Achievement Badge */}
        {completionRate >= 80 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-700 dark:text-amber-400">Amazing Progress!</p>
              <p className="text-xs text-amber-600 dark:text-amber-500">You're on fire with {completionRate}% completion rate</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
