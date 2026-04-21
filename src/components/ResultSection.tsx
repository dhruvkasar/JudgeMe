import React from 'react';
import { motion } from 'motion/react';
import { Share2, RefreshCw } from 'lucide-react';
import { RoastData } from '../types';

interface ResultSectionProps {
  roastData: RoastData;
  typedRoast: string;
  resultRef: React.RefObject<HTMLDivElement | null>;
  onShare: () => void;
  onReset: () => void;
}

export const ResultSection: React.FC<ResultSectionProps> = ({
  roastData,
  typedRoast,
  resultRef,
  onShare,
  onReset
}) => {
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      className="w-full flex flex-col items-center gap-8 mt-4"
      aria-live="polite"
    >
      <div
        ref={resultRef}
        className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 sm:p-12 relative flex flex-col items-center justify-center text-center overflow-hidden w-full max-w-2xl mx-auto shadow-2xl bg-gradient-card"
      >
        <div className="relative z-10 w-full flex flex-col items-center">
          <div className="inline-flex items-center justify-center w-32 h-32 md:w-40 md:h-40 rounded-full bg-zinc-950/80 border border-zinc-800 shadow-[0_0_30px_rgba(168,85,247,0.15)] mb-8">
            <div className="flex flex-col items-center">
              <span className="text-5xl md:text-6xl font-display font-black text-white leading-none pb-1" aria-label={`Score: ${roastData.vibe_score} out of 10`}>
                {roastData.vibe_score}
              </span>
              <span className="text-[10px] md:text-xs font-bold text-zinc-500 tracking-[0.2em] uppercase" aria-hidden="true">Score</span>
            </div>
          </div>

          <h3 className="text-sm md:text-base font-bold text-pink-400 tracking-[0.2em] uppercase mb-6 px-4">
            {roastData.vibe_title}
          </h3>

          <p className="text-lg md:text-2xl text-zinc-100 font-medium leading-relaxed mb-10 max-w-xl min-h-[100px]">
            "{typedRoast}<span className="inline-block w-2 md:w-3 h-5 md:h-6 ml-1 bg-purple-500 animate-pulse-slow align-middle"></span>"
          </p>

          {typedRoast.length === roastData.roast.length && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-zinc-400 italic max-w-md mx-auto mt-4"
            >
              <span className="text-zinc-600 font-semibold not-italic text-[10px] md:text-xs uppercase tracking-widest block mb-2">Redemption</span>
              {roastData.redemption}
            </motion.div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        <button
          onClick={onShare}
          className="bg-zinc-800 text-white text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 py-4 rounded-xl hover:bg-zinc-700 transition-colors focus-visible:ring-2 focus-visible:ring-purple-500"
        >
          <Share2 className="w-4 h-4" aria-hidden="true" /> Save & Share
        </button>
        <button
          onClick={onReset}
          className="bg-zinc-100 text-zinc-900 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 py-4 rounded-xl hover:bg-white transition-colors focus-visible:ring-2 focus-visible:ring-purple-500"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" /> Roast Again
        </button>
      </div>
    </motion.div>
  );
};
