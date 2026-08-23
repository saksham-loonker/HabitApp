import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { localStore } from '@/api/localStore';
import { Play, Pause, CheckCircle2, X, Music, Volume2, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import PomodoroTimer from '@/components/widgets/PomodoroTimer';

// Actual MP3 links for ambient sounds
const ambientSounds = [
  { id: 'rain', name: 'Rainfall', icon: '🌧️', url: 'https://cdn.pixabay.com/audio/2021/09/06/audio_8b0b8128a8.mp3' },
  { id: 'forest', name: 'Forest', icon: '🌲', url: 'https://cdn.pixabay.com/audio/2021/09/06/audio_5c4b5d2b2d.mp3' },
  { id: 'cafe', name: 'Cafe', icon: '☕', url: 'https://cdn.pixabay.com/audio/2022/01/18/audio_03c8441185.mp3' }, // Using white noise as placeholder for cafe if specific cafe sound not found, or just a generic calm track
  { id: 'white_noise', name: 'White Noise', icon: '🌊', url: 'https://cdn.pixabay.com/audio/2021/08/09/audio_2e90902f99.mp3' }, // Gentle ocean/white noise
];

export default function Focus() {
  const [activeTask, setActiveTask] = useState('');
  const [isFocusing, setIsFocusing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSound, setActiveSound] = useState(null);
  const audioRef = useRef(new Audio());

  // Fetch settings for the timer
  const { data: settings = {} } = useQuery({
    queryKey: ['preferences'],
    queryFn: async () => {
      const user = await localStore.auth.me();
      if (!user) return {};
      const prefs = await localStore.entities.UserPreferences.filter({ user_email: user.email });
      return prefs[0] || {};
    }
  });

  useEffect(() => {
    const audio = audioRef.current;
    audio.loop = true;
    
    if (activeSound) {
      const sound = ambientSounds.find(s => s.id === activeSound);
      if (sound) {
        audio.src = sound.url;
        audio.play().catch(e => console.error("Audio play failed:", e));
      }
    } else {
      audio.pause();
      audio.currentTime = 0;
    }

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [activeSound]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(e => console.log(e));
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div className={cn(
      "min-h-[80vh] flex flex-col items-center justify-center transition-all duration-500",
      isFocusing ? "justify-center" : "justify-start pt-20"
    )}>
      <AnimatePresence mode="wait">
        {!isFocusing ? (
          <motion.div 
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md text-center space-y-8"
          >
            <div className="space-y-2">
              <h1 className="text-3xl font-light tracking-tight">What is your focus?</h1>
              <p className="text-muted-foreground">Enter your primary task to begin a distraction-free session.</p>
            </div>
            
            <div className="relative">
               <input 
                  type="text" 
                  value={activeTask}
                  onChange={(e) => setActiveTask(e.target.value)}
                  placeholder="e.g., Write Project Proposal"
                  className="w-full text-center text-2xl bg-transparent border-b-2 border-border focus:border-primary outline-none py-4 placeholder:text-muted-foreground/30 transition-colors"
                  autoFocus
                  onKeyPress={(e) => e.key === 'Enter' && activeTask && setIsFocusing(true)}
               />
            </div>

            <Button 
               size="lg" 
               className="rounded-full px-8 h-12 text-lg font-light"
               disabled={!activeTask}
               onClick={() => setIsFocusing(true)}
            >
               Start Focus Session
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="session"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-4xl flex flex-col items-center gap-12"
          >
             {/* Header Actions */}
             <div className="absolute top-4 right-4 flex gap-2 z-50">
                <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
                   {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setIsFocusing(false)}>
                   <X className="w-5 h-5" />
                </Button>
             </div>

             {/* Main Task Display */}
             <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-secondary/50 text-sm text-muted-foreground">
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                   Focus Mode Active
                </div>
                <h2 className="text-4xl md:text-5xl font-light">{activeTask}</h2>
             </div>

             {/* Timer Integration - Now using Settings */}
             <div className="w-full max-w-md">
                <PomodoroTimer settings={settings} />
             </div>

             {/* Ambient Sounds */}
             <div className="flex flex-wrap justify-center gap-4 p-4 bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-2xl">
                {ambientSounds.map((sound) => (
                   <button
                      key={sound.id}
                      onClick={() => setActiveSound(activeSound === sound.id ? null : sound.id)}
                      className={cn(
                         "flex flex-col items-center gap-2 p-3 rounded-xl transition-all w-24",
                         activeSound === sound.id 
                           ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary ring-offset-2" 
                           : "hover:bg-secondary text-muted-foreground"
                      )}
                   >
                      <span className="text-2xl">{sound.icon}</span>
                      <span className="text-xs font-medium">{sound.name}</span>
                      {activeSound === sound.id && (
                        <div className="flex gap-0.5 items-end h-3">
                          <span className="w-0.5 h-1 bg-current animate-[bounce_1s_infinite]" />
                          <span className="w-0.5 h-2 bg-current animate-[bounce_1.2s_infinite]" />
                          <span className="w-0.5 h-1.5 bg-current animate-[bounce_0.8s_infinite]" />
                        </div>
                      )}
                   </button>
                ))}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
