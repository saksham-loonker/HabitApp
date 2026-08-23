import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Loader2, X, Sparkles, Command } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function VoiceInput({ onTranscript, onClose, isOpen }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Voice uplink offline (Not Supported)');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      setTranscript(finalTranscript || interimTranscript);
    };

    recognitionRef.current.onerror = (event) => {
      if (event.error !== 'no-speech') {
        setError(`System Error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen && !isListening && recognitionRef.current) {
      startListening();
    }
  }, [isOpen]);

  const startListening = () => {
    setError(null);
    setTranscript('');
    setIsListening(true);
    recognitionRef.current?.start();
  };

  const stopListening = () => {
    setIsListening(false);
    recognitionRef.current?.stop();
  };

  const handleSubmit = async () => {
    if (!transcript.trim()) return;
    
    setIsProcessing(true);
    stopListening();
    await onTranscript(transcript);
    setIsProcessing(false);
    setTranscript('');
    onClose();
  };

  const handleCancel = () => {
    stopListening();
    setTranscript('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
          onClick={handleCancel}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass-panel border border-primary/30 rounded-3xl w-full max-w-md p-8 shadow-[0_0_50px_rgba(124,58,237,0.15)] relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Glow */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent transition-opacity duration-500 pointer-events-none",
              isListening ? "opacity-100" : "opacity-0"
            )} />

            <div className="relative z-10 flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/20 rounded-lg border border-primary/30">
                   <Command className="w-5 h-5 text-primary animate-pulse" />
                </div>
                <div>
                   <span className="font-display font-bold text-lg text-white tracking-wide block">Voice Command</span>
                   <span className="text-[10px] text-primary uppercase tracking-widest">Uplink Established</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleCancel} className="text-muted-foreground hover:text-white hover:bg-white/10">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex flex-col items-center relative z-10">
              {/* Ring Animation */}
              <div className="relative">
                 {isListening && (
                    <>
                      <motion.div 
                        className="absolute inset-0 rounded-full border border-primary/30"
                        animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                      />
                      <motion.div 
                        className="absolute inset-0 rounded-full border border-secondary/30"
                        animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                        transition={{ repeat: Infinity, duration: 2, delay: 0.5, ease: "easeOut" }}
                      />
                    </>
                 )}
                 
                 <motion.button
                  onClick={isListening ? stopListening : startListening}
                  className={cn(
                    "relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all border-4",
                    isListening 
                      ? "bg-black border-primary shadow-[0_0_30px_rgba(124,58,237,0.4)]" 
                      : "bg-black border-white/10 shadow-none"
                  )}
                  whileTap={{ scale: 0.95 }}
                >
                  {isProcessing ? (
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  ) : isListening ? (
                    <Mic className="w-10 h-10 text-primary" />
                  ) : (
                    <MicOff className="w-10 h-10 text-muted-foreground" />
                  )}
                </motion.button>
              </div>

              {/* Audio Visualizer Bars */}
              <div className="h-12 flex items-end justify-center gap-1 mt-6 mb-2">
                {isListening ? (
                  [...Array(7)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 bg-gradient-to-t from-primary to-secondary rounded-full"
                      animate={{ height: [4, Math.random() * 24 + 4, 4] }}
                      transition={{ repeat: Infinity, duration: 0.4, delay: i * 0.05 }}
                    />
                  ))
                ) : (
                   <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Awaiting Input</div>
                )}
              </div>
            </div>

            <AnimatePresence>
              {transcript && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-white/5 border border-white/10 rounded-xl"
                >
                  <p className="text-white text-center font-medium font-display text-lg leading-relaxed">
                    "{transcript}"
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <p className="text-red-400 text-xs font-mono text-center mt-4 border border-red-500/30 bg-red-500/10 p-2 rounded">
                 [!] {error}
              </p>
            )}

            <AnimatePresence>
              {transcript && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3 mt-6"
                >
                  <Button variant="outline" className="flex-1 border-white/10 text-muted-foreground hover:text-white hover:bg-white/10" onClick={handleCancel}>
                    Abort
                  </Button>
                  <Button 
                    className="flex-1 bg-primary hover:bg-primary/80 text-white shadow-glow-primary border border-primary/50"
                    onClick={handleSubmit}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Execute Protocol'}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
