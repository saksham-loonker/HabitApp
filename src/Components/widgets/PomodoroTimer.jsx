import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Coffee, Timer, Zap, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function PomodoroTimer({
  workMinutes = 25,
  breakMinutes = 5,
  settings,
  onComplete
}) {
  const effectiveWorkMinutes = settings?.pomodoro_work_minutes || workMinutes;
  const effectiveBreakMinutes = settings?.pomodoro_break_minutes || breakMinutes;

  const [timeLeft, setTimeLeft] = useState(effectiveWorkMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isRunning) {
       setTimeLeft(isBreak ? effectiveBreakMinutes * 60 : effectiveWorkMinutes * 60);
    }
  }, [effectiveWorkMinutes, effectiveBreakMinutes, isBreak, isRunning]);

  const totalSeconds = isBreak ? effectiveBreakMinutes * 60 : effectiveWorkMinutes * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;
  const circumference = 2 * Math.PI * 88;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleComplete();
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft]);

  const handleComplete = () => {
    setIsRunning(false);
    if (!isBreak) {
      setSessionsCompleted(prev => prev + 1);
      onComplete?.();
    }
    const nextIsBreak = !isBreak;
    setIsBreak(nextIsBreak);
    setTimeLeft(nextIsBreak ? effectiveBreakMinutes * 60 : effectiveWorkMinutes * 60);
  };

  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(isBreak ? effectiveBreakMinutes * 60 : effectiveWorkMinutes * 60);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTotalTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hrs > 0) {
      return `${hrs}h ${remainingMins}m`;
    }
    return `${mins}m`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-3xl p-6 relative overflow-hidden"
    >
      {/* Background Glow */}
      <div className={cn(
        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl transition-colors duration-500",
        isBreak ? "bg-emerald-500/10" : "bg-indigo-500/10"
      )}></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
              isBreak 
                ? "bg-gradient-to-br from-emerald-400 to-green-500" 
                : "bg-gradient-to-br from-indigo-400 to-purple-500"
            )}>
              {isBreak ? <Coffee className="w-4 h-4 text-white" /> : <Timer className="w-4 h-4 text-white" />}
            </div>
            <div>
              <h3 className="font-bold text-lg">{isBreak ? 'Break Time' : 'Focus Session'}</h3>
              <p className="text-xs text-muted-foreground">
                {isBreak ? 'Relax and recharge' : 'Stay focused and productive'}
              </p>
            </div>
          </div>
          {sessionsCompleted > 0 && (
            <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/20 px-2 py-1 rounded-full">
              <Trophy className="w-3 h-3 text-amber-500" />
              <span className="text-xs font-bold text-amber-600">{sessionsCompleted}</span>
            </div>
          )}
        </div>

        {/* Timer Ring */}
        <div className="relative w-48 h-48 mx-auto mb-6">
          {/* Outer Glow Ring */}
          <div className={cn(
            "absolute inset-0 rounded-full blur-xl transition-colors duration-500",
            isBreak ? "bg-emerald-500/20" : "bg-indigo-500/20"
          )}></div>
          
          <svg className="w-full h-full transform -rotate-90">
            {/* Background Circle */}
            <circle 
              cx="96" 
              cy="96" 
              r="88" 
              className="stroke-secondary/50" 
              strokeWidth="4" 
              fill="none" 
            />
            {/* Progress Circle */}
            <motion.circle
              cx="96" 
              cy="96" 
              r="88"
              className={cn(
                "transition-colors duration-500",
                isBreak ? "stroke-emerald-500" : "stroke-indigo-500"
              )}
              strokeWidth="6" 
              fill="none" 
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{
                filter: isBreak 
                  ? 'drop-shadow(0 0 8px hsla(142, 76%, 36%, 0.5))' 
                  : 'drop-shadow(0 0 8px hsla(252, 87%, 64%, 0.5))'
              }}
            />
          </svg>

          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span 
              key={formatTime(timeLeft)}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-5xl font-bold tracking-tighter text-foreground tabular-nums"
            >
              {formatTime(timeLeft)}
            </motion.span>
            <span className={cn(
              "text-xs font-medium mt-2 px-2 py-1 rounded-full",
              isRunning 
                ? isBreak 
                  ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                  : "bg-indigo-100 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400"
                : "bg-secondary text-muted-foreground"
            )}>
              {isRunning ? (isBreak ? 'Relaxing' : 'Focusing') : 'Paused'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={resetTimer}
            className="w-12 h-12 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
          >
            <RotateCcw className="w-5 h-5 text-muted-foreground" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTimer}
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300",
              isBreak 
                ? "bg-gradient-to-br from-emerald-400 to-green-500 shadow-lg shadow-emerald-500/30" 
                : "bg-gradient-to-br from-indigo-400 to-purple-500 shadow-lg shadow-indigo-500/30"
            )}
          >
            {isRunning ? (
              <Pause className="w-7 h-7 fill-white text-white" />
            ) : (
              <Play className="w-7 h-7 fill-white text-white ml-1" />
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => { setIsBreak(!isBreak); resetTimer(); }}
            className="w-12 h-12 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
          >
            {isBreak ? <Zap className="w-5 h-5 text-muted-foreground" /> : <Coffee className="w-5 h-5 text-muted-foreground" />}
          </motion.button>
        </div>

        {/* Session Info */}
        <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
          <span>Work: {formatTotalTime(effectiveWorkMinutes * 60)}</span>
          <span>Break: {formatTotalTime(effectiveBreakMinutes * 60)}</span>
        </div>
      </div>
    </motion.div>
  );
}
