import React from 'react';
import { motion } from 'motion/react';
import { Music, Clapperboard, Pizza, RefreshCw, AlertCircle } from 'lucide-react';
import { Intensity } from '../types';

interface InputBlockProps {
  title: string;
  items: string[];
  onChange: (index: number, value: string) => void;
  icon: React.ElementType;
}

const InputBlock = ({ title, items, onChange, icon: Icon }: InputBlockProps) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 15 },
      show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 25 } }
    }}
    className="glass-panel rounded-2xl p-6 transition-colors hover:border-purple-500/30 group"
  >
    <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2 mb-4 uppercase tracking-[0.1em]">
      <Icon className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform duration-300" /> {title}
    </h3>
    <div className="space-y-3">
      {items.map((item, i) => (
        <input
          key={i}
          className="w-full glass-input border border-zinc-800/80 rounded-xl px-4 py-3.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-medium"
          placeholder={`Enter item #${i + 1}`}
          value={item}
          onChange={(e) => onChange(i, e.target.value)}
          maxLength={50}
          aria-label={`${title} item ${i + 1}`}
        />
      ))}
    </div>
  </motion.div>
);

interface InputSectionProps {
  songs: string[];
  setSongs: React.Dispatch<React.SetStateAction<string[]>>;
  movies: string[];
  setMovies: React.Dispatch<React.SetStateAction<string[]>>;
  foods: string[];
  setFoods: React.Dispatch<React.SetStateAction<string[]>>;
  intensity: Intensity;
  setIntensity: React.Dispatch<React.SetStateAction<Intensity>>;
  loading: boolean;
  errorMsg: string | null;
  setErrorMsg: React.Dispatch<React.SetStateAction<string | null>>;
  onRoast: () => void;
  onHoverSound: () => void;
}

export const InputSection: React.FC<InputSectionProps> = ({
  songs, setSongs,
  movies, setMovies,
  foods, setFoods,
  intensity, setIntensity,
  loading, errorMsg, setErrorMsg,
  onRoast, onHoverSound
}) => {
  const createChangeHandler = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (index: number, value: string) => {
    setter(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    setErrorMsg(null);
  };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: 0.1 }
        }
      }}
      className="w-full flex flex-col"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full">
        <InputBlock title="Top Bangers" items={songs} onChange={createChangeHandler(setSongs)} icon={Music} />
        <InputBlock title="Top Flicks" items={movies} onChange={createChangeHandler(setMovies)} icon={Clapperboard} />
        <InputBlock title="Top Eats" items={foods} onChange={createChangeHandler(setFoods)} icon={Pizza} />
      </div>

      <motion.div
        variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }}
        className="mt-10 max-w-md mx-auto w-full flex flex-col items-center gap-6"
      >
        <fieldset className="glass-panel p-1.5 rounded-full flex w-full relative">
          <legend className="sr-only">Select Roast Intensity</legend>
          {(['Mild', 'Spicy', 'Nuclear'] as Intensity[]).map(level => (
            <button
              key={level}
              type="button"
              onMouseEnter={onHoverSound}
              onClick={() => setIntensity(level)}
              aria-pressed={intensity === level}
              className={`relative flex-1 py-3 rounded-full text-sm font-bold transition-all
                ${intensity === level ? 'text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              {intensity === level && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-zinc-800 rounded-full z-0 border border-zinc-700/50"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-2">
                {level} {level === 'Nuclear' && intensity === 'Nuclear' && <span className="text-[10px]" aria-hidden="true">☢️</span>}
              </span>
            </button>
          ))}
        </fieldset>

        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            role="alert"
            className="flex items-center gap-2 text-red-400 bg-red-500/10 px-4 py-2 rounded-lg text-sm font-medium w-full justify-center"
          >
            <AlertCircle className="w-4 h-4" /> {errorMsg}
          </motion.div>
        )}

        <button
          onClick={onRoast}
          disabled={loading}
          aria-busy={loading}
          className={`w-full relative shimmer-container overflow-hidden bg-gradient-btn text-white text-[15px] font-bold tracking-[0.2em] uppercase py-4 rounded-full transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none glow-shadow`}
        >
          {loading ? <RefreshCw className="animate-spin w-6 h-6 mx-auto" aria-label="Loading" /> : 'Roast Me'}
        </button>
      </motion.div>
    </motion.div>
  );
};
