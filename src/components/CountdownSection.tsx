import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface CountdownSectionProps {
  countdown: number;
}

export const CountdownSection: React.FC<CountdownSectionProps> = ({ countdown }) => {
  return (
    <div className="flex flex-col items-center justify-center flex-grow w-full min-h-[40vh]" aria-live="assertive">
      <AnimatePresence mode="wait">
        <motion.div
          key={countdown}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1.5, opacity: 1 }}
          exit={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="text-[120px] md:text-[200px] font-display font-black text-white leading-none text-transparent bg-clip-text bg-gradient-btn select-none pointer-events-none"
        >
          {countdown}
        </motion.div>
      </AnimatePresence>
      <span className="sr-only">Analyzing vibe... {countdown}</span>
    </div>
  );
};
