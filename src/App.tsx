/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { generateRoast } from './services/ai';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';
import { Share2, RefreshCw, AlertCircle, Sparkles, Music, Clapperboard, Pizza } from 'lucide-react';

type Intensity = 'Mild' | 'Spicy' | 'Nuclear';

interface RoastData {
  vibe_title: string;
  roast: string;
  vibe_score: number;
  redemption: string;
}

const InputBlock = ({ 
  title, items, onChange, icon: Icon
}: { 
  title: string, items: string[], onChange: (index: number, value: string) => void, icon: any
}) => (
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
        />
      ))}
    </div>
  </motion.div>
);

export default function App() {
  const [songs, setSongs] = useState(['', '', '']);
  const [movies, setMovies] = useState(['', '', '']);
  const [foods, setFoods] = useState(['', '', '']);
  const [intensity, setIntensity] = useState<Intensity>('Spicy');
  const [step, setStep] = useState<'input' | 'countdown' | 'result'>('input');
  const [countdown, setCountdown] = useState(3);
  const [roastData, setRoastData] = useState<RoastData | null>(null);
  const [loading, setLoading] = useState(false);
  const [typedRoast, setTypedRoast] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const resultRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextCtor) {
        audioCtxRef.current = new AudioContextCtor();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  };

  const playHoverSound = () => {
    try {
      const ctx = getAudioCtx();
      if (!ctx || ctx.state !== 'running') return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch(e) {}
  };

  const playBassDrop = () => {
    try {
      const ctx = getAudioCtx();
      if (!ctx || ctx.state !== 'running') return;
      const time = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(20, time + 2);

      gain.gain.setValueAtTime(0.5, time);
      gain.gain.setTargetAtTime(0.01, time + 2, 0.5);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, time);
      filter.frequency.exponentialRampToValueAtTime(40, time + 2);
      
      osc.start(time);
      osc.stop(time + 3);
    } catch(e) {}
  };

  const playCountdownBeep = () => {
    try {
      const ctx = getAudioCtx();
      if (!ctx || ctx.state !== 'running') return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch(e) {}
  };

  const createChangeHandler = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (index: number, value: string) => {
    setter(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    setErrorMsg(null);
  };

  const handleRoast = async () => {
    getAudioCtx();
    
    const validSongs = songs.filter(s => s.trim().length > 0);
    const validMovies = movies.filter(m => m.trim().length > 0);
    const validFoods = foods.filter(f => f.trim().length > 0);

    if (validSongs.length === 0 && validMovies.length === 0 && validFoods.length === 0) {
      setErrorMsg("Please enter at least one item. The AI needs material.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await generateRoast(validSongs, validMovies, validFoods, intensity);
      setRoastData(response);
      setStep('countdown');
      startCountdown();
    } catch (e) {
      console.error(e);
      setErrorMsg("System overload. Could not analyze inputs. Try again.");
      setLoading(false);
    }
  };

  const startCountdown = () => {
    let count = 3;
    setCountdown(count);
    playCountdownBeep();
    
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
        playCountdownBeep();
      } else {
        clearInterval(interval);
        setStep('result');
        setLoading(false);
        playBassDrop();
      }
    }, 1000);
  };

  useEffect(() => {
    if (step === 'result' && roastData) {
      setTypedRoast('');
      let i = 0;
      const text = roastData.roast;
      const speed = 25;
      
      const typeInterval = setInterval(() => {
        if (i < text.length) {
          setTypedRoast(prev => prev + text.charAt(i));
          i++;
        } else {
          clearInterval(typeInterval);
        }
      }, speed);
      
      return () => clearInterval(typeInterval);
    }
  }, [step, roastData]);

  const handleShare = async () => {
    if (!resultRef.current) return;
    try {
      await new Promise(r => setTimeout(r, 100));
      const canvas = await html2canvas(resultRef.current, {
        backgroundColor: '#09090b',
        scale: window.devicePixelRatio || 2,
        useCORS: true,
        logging: false,
      });
      const dataUrl = canvas.toDataURL('image/png');
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'vibe-check-result.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#a855f7', '#ec4899', '#ef4444', '#ffffff']
      });
    } catch (e) {
      console.error("Export failed", e);
      setErrorMsg("Image export failed. You might need to screenshot instead.");
    }
  };

  const resetTarget = () => {
    setStep('input');
    setRoastData(null);
    setTypedRoast('');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen w-full flex flex-col pt-8 md:pt-16 pb-12 px-4 selection:bg-purple-500/30 relative">
      {/* Ambient glowing background */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/10 via-zinc-950/0 to-zinc-950/0 mix-blend-screen" />
      
      {/* Header */}
      <header className="mb-10 text-center flex flex-col items-center max-w-2xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 tracking-[0.15em] uppercase mb-6 shadow-sm">
           <Sparkles className="w-3.5 h-3.5 text-purple-400" /> AI-Powered Protocol
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-display font-black tracking-tighter text-white mb-4">
          Roast My <span className="text-gradient">Vibe</span>
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base md:text-lg max-w-md mx-auto leading-relaxed">
          Input your favorite songs, movies, and foods. Our AI will brutally dissect your personality.
        </p>
      </header>

      <main className="flex-grow flex flex-col items-center w-full max-w-5xl mx-auto">
        
        {step === 'input' && (
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
            {/* Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full">
              <InputBlock title="Top Bangers" items={songs} onChange={createChangeHandler(setSongs)} icon={Music} />
              <InputBlock title="Top Flicks" items={movies} onChange={createChangeHandler(setMovies)} icon={Clapperboard} />
              <InputBlock title="Top Eats" items={foods} onChange={createChangeHandler(setFoods)} icon={Pizza} />
            </div>

            {/* Intensity & Submit Container */}
            <motion.div 
              variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }}
              className="mt-10 max-w-md mx-auto w-full flex flex-col items-center gap-6"
            >
              
              <div className="glass-panel p-1.5 rounded-full flex w-full relative">
                {(['Mild', 'Spicy', 'Nuclear'] as Intensity[]).map(level => (
                  <button
                    key={level}
                    onMouseEnter={playHoverSound}
                    onClick={() => setIntensity(level)}
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
                      {level} {level === 'Nuclear' && intensity === 'Nuclear' && <span className="text-[10px]">☢️</span>}
                    </span>
                  </button>
                ))}
              </div>

              {errorMsg && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  className="flex items-center gap-2 text-red-400 bg-red-500/10 px-4 py-2 rounded-lg text-sm font-medium w-full justify-center"
                >
                  <AlertCircle className="w-4 h-4" /> {errorMsg}
                </motion.div>
              )}

              <button 
                onClick={handleRoast}
                disabled={loading}
                className={`w-full relative shimmer-container overflow-hidden bg-gradient-btn text-white text-[15px] font-bold tracking-[0.2em] uppercase py-4 rounded-full transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none glow-shadow`}
              >
                {loading ? <RefreshCw className="animate-spin w-6 h-6 mx-auto" /> : 'Roast Me'}
              </button>
            </motion.div>
          </motion.div>
        )}

        {step === 'countdown' && (
          <div className="flex items-center justify-center flex-grow w-full min-h-[40vh]">
            <motion.div
              key={countdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              className="text-[120px] md:text-[200px] font-display font-black text-white leading-none text-transparent bg-clip-text bg-gradient-btn"
            >
              {countdown}
            </motion.div>
          </div>
        )}

        {step === 'result' && roastData && (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="w-full flex flex-col items-center gap-8 mt-4"
          >
            {/* Shareable Card */}
            <div 
              ref={resultRef}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 sm:p-12 relative flex flex-col items-center justify-center text-center overflow-hidden w-full max-w-2xl mx-auto shadow-2xl bg-gradient-card"
            >
              <div className="relative z-10 w-full flex flex-col items-center">
                
                {/* Visual Ring / Score */}
                <div className="inline-flex items-center justify-center w-32 h-32 md:w-40 md:h-40 rounded-full bg-zinc-950/80 border border-zinc-800 shadow-[0_0_30px_rgba(168,85,247,0.15)] mb-8">
                   <div className="flex flex-col items-center">
                     <span className="text-5xl md:text-6xl font-display font-black text-white leading-none pb-1">{roastData.vibe_score}</span>
                     <span className="text-[10px] md:text-xs font-bold text-zinc-500 tracking-[0.2em] uppercase">Score</span>
                   </div>
                </div>
                
                <h3 className="text-sm md:text-base font-bold text-pink-400 tracking-[0.2em] uppercase mb-6 px-4">
                   {roastData.vibe_title}
                </h3>
                
                <p className="text-lg md:text-2xl text-zinc-100 font-medium leading-relaxed mb-10 max-w-xl">
                   "{typedRoast}<span className="inline-block w-2 md:w-3 h-5 md:h-6 ml-1 bg-purple-500 animate-pulse-slow align-middle"></span>"
                </p>

                {typedRoast.length === roastData.roast.length && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="text-sm text-zinc-400 italic max-w-md mx-auto"
                  >
                    <span className="text-zinc-600 font-semibold not-italic text-[10px] md:text-xs uppercase tracking-widest block mb-1">Redemption</span>
                    {roastData.redemption}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
              <button 
                onClick={handleShare}
                className="bg-zinc-800 text-white text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 py-4 rounded-xl hover:bg-zinc-700 transition-colors"
              >
                <Share2 className="w-4 h-4" /> Save
              </button>
              <button 
                onClick={resetTarget}
                className="bg-zinc-100 text-zinc-900 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 py-4 rounded-xl hover:bg-white transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Again
              </button>
            </div>

          </motion.div>
        )}
      </main>
    </div>
  );
}
