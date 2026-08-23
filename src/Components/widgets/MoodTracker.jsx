import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { localStore } from '@/api/localStore';
import { Smile, Meh, Frown, Sun, Cloud, Zap, Check, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const moods = [
  { icon: Smile, label: 'Great', color: 'text-emerald-500', bg: 'bg-emerald-500', lightBg: 'bg-emerald-50 dark:bg-emerald-950/30', gradient: 'from-emerald-400 to-green-500' },
  { icon: Sun, label: 'Good', color: 'text-amber-500', bg: 'bg-amber-500', lightBg: 'bg-amber-50 dark:bg-amber-950/30', gradient: 'from-amber-400 to-orange-500' },
  { icon: Meh, label: 'Okay', color: 'text-blue-500', bg: 'bg-blue-500', lightBg: 'bg-blue-50 dark:bg-blue-950/30', gradient: 'from-blue-400 to-cyan-500' },
  { icon: Cloud, label: 'Low', color: 'text-slate-500', bg: 'bg-slate-500', lightBg: 'bg-slate-50 dark:bg-slate-800', gradient: 'from-slate-400 to-gray-500' },
  { icon: Frown, label: 'Bad', color: 'text-rose-500', bg: 'bg-rose-500', lightBg: 'bg-rose-50 dark:bg-rose-950/30', gradient: 'from-rose-400 to-pink-500' },
];

const moodVariants = {
  unselected: { scale: 1, opacity: 0.5 },
  selected: { scale: 1.15, opacity: 1, y: -5 },
  hover: { scale: 1.1 }
};

export default function MoodTracker() {
  const queryClient = useQueryClient();
  const [selectedMood, setSelectedMood] = useState(null);
  const [energyLevel, setEnergyLevel] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const logMoodMutation = useMutation({
    mutationFn: (data) => localStore.entities.Mood.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moods'] });
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setSelectedMood(null);
      }, 3000);
    }
  });

  const handleSubmit = () => {
    if (!selectedMood) return;
    logMoodMutation.mutate({
      mood: selectedMood,
      energy: energyLevel
    });
  };

  const selectedMoodData = moods.find(m => m.label === selectedMood);

  if (isSubmitted) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card rounded-3xl p-8 flex flex-col items-center justify-center min-h-[280px] relative overflow-hidden"
      >
        {/* Confetti-like Background */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 300, opacity: 1, rotate: Math.random() * 360 }}
              transition={{ duration: 2 + Math.random(), delay: Math.random() * 0.5 }}
              className={cn(
                "absolute w-2 h-2 rounded-full",
                ['bg-primary', 'bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500'][i % 5]
              )}
              style={{ left: `${Math.random() * 100}%` }}
            />
          ))}
        </div>
        
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-green-500/30 relative z-10"
        >
          <Check className="w-10 h-10 text-white" />
        </motion.div>
        <motion.h3 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-center"
        >
          Check-in Saved!
        </motion.h3>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground mt-2 text-center text-sm"
        >
          Thanks for tracking your wellness. Keep it up!
        </motion.p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-3xl p-6 relative overflow-hidden"
    >
      {/* Background Gradient */}
      <AnimatePresence>
        {selectedMoodData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            exit={{ opacity: 0 }}
            className={cn("absolute inset-0 bg-gradient-to-br", selectedMoodData.gradient)}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-bold text-lg">Daily Check-in</h3>
          </div>
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">How are you?</span>
        </div>

        {/* Mood Selection */}
        <div className="flex justify-between items-center mb-8">
          {moods.map((mood, index) => {
            const Icon = mood.icon;
            const isSelected = selectedMood === mood.label;

            return (
              <motion.button
                key={mood.label}
                custom={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                variants={moodVariants}
                whileHover="hover"
                onClick={() => setSelectedMood(mood.label)}
                className="flex flex-col items-center gap-2"
              >
                <div className={cn(
                  "p-3 rounded-2xl transition-all duration-300 relative",
                  isSelected 
                    ? `bg-gradient-to-br ${mood.gradient} shadow-lg` 
                    : mood.lightBg
                )}>
                  <Icon className={cn(
                    "w-6 h-6 transition-all",
                    isSelected ? "text-white fill-white" : mood.color
                  )} />
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center"
                    >
                      <Check className="w-2.5 h-2.5 text-green-500" />
                    </motion.div>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-medium transition-colors",
                  isSelected ? "text-foreground font-semibold" : "text-muted-foreground"
                )}>{mood.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Energy Level */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Zap className="w-4 h-4" />
              <span className="font-medium">Energy Level</span>
            </div>
            <span className={cn(
              "px-2 py-1 rounded-full text-xs font-bold",
              energyLevel === 0 ? "bg-blue-100 text-blue-600" :
              energyLevel === 1 ? "bg-amber-100 text-amber-600" :
              "bg-green-100 text-green-600"
            )}>
              {energyLevel === 0 ? 'Low' : energyLevel === 1 ? 'Balanced' : 'High'}
            </span>
          </div>
          
          <div className="flex gap-2 h-14">
            {['Low', 'Balanced', 'High'].map((level, idx) => (
              <motion.button
                key={level}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setEnergyLevel(idx)}
                className={cn(
                  "flex-1 rounded-xl text-xs font-bold transition-all duration-300 flex flex-col items-center justify-center gap-1",
                  energyLevel === idx
                    ? idx === 0 
                      ? "bg-gradient-to-br from-blue-400 to-blue-500 text-white shadow-lg shadow-blue-500/30"
                      : idx === 1
                        ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/30"
                        : "bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg shadow-green-500/30"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                )}
              >
                <Zap className={cn("w-4 h-4", energyLevel === idx ? "fill-white" : "")} />
                {level}
              </motion.button>
            ))}
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "w-full py-3.5 rounded-xl font-semibold text-white shadow-lg transition-all duration-300",
            selectedMood 
              ? selectedMoodData 
                ? `bg-gradient-to-r ${selectedMoodData.gradient} shadow-lg`
                : 'bg-primary'
              : 'bg-secondary text-muted-foreground cursor-not-allowed'
          )}
          onClick={handleSubmit}
          disabled={!selectedMood || logMoodMutation.isPending}
        >
          {logMoodMutation.isPending ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mx-auto"
            />
          ) : (
            'Save Check-in'
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
