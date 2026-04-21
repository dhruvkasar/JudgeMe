/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { generateRoast } from './services/ai';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';
import { Flame, Share2, RefreshCw, Skull, Zap, Music, Clapperboard, Pizza } from 'lucide-react';

type Intensity = 'Mild' | 'Spicy' | 'Nuclear';

interface RoastData {
  vibe_title: string;
  roast: string;
  vibe_score: number;
  redemption: string;
}

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
  
  const resultRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize Audio Context on demand
  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playHoverSound = () => {
    try {
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch(e) {}
  };

  const playBassDrop = () => {
    try {
      const ctx = getAudioCtx();
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

      gain.gain.setValueAtTime(1, time);
      gain.gain.setTargetAtTime(0.01, time + 2, 0.5);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, time);
      filter.frequency.exponentialRampToValueAtTime(50, time + 2);
      
      osc.start(time);
      osc.stop(time + 3);
    } catch(e) {}
  };

  const playCountdownBeep = () => {
    try {
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch(e) {}
  };

  const handleInputChange = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string
  ) => {
    setter(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleRoast = async () => {
    // Validate inputs (ensure at least somethings are filled)
    if (songs.every(s => !s) || movies.every(m => !m) || foods.every(f => !f)) {
      alert("Fill out at least one item per category! The AI needs *something* to mock.");
      return;
    }

    setLoading(true);
    try {
      getAudioCtx(); // Prime audio
      const response = await generateRoast(
        songs.filter(Boolean),
        movies.filter(Boolean),
        foods.filter(Boolean),
        intensity
      );
      setRoastData(response);
      setStep('countdown');
      setLoading(false);
      startCountdown();
    } catch (e) {
      console.error(e);
      alert("Uh oh, the AI broke trying to comprehend your vibe.");
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
        playBassDrop();
      }
    }, 1000);
  };

  // Typewriter effect
  useEffect(() => {
    if (step === 'result' && roastData) {
      setTypedRoast('');
      let i = 0;
      const text = roastData.roast;
      const speed = 30; // ms per char
      
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
      const canvas = await html2canvas(resultRef.current, {
        backgroundColor: '#FFFDF5',
        scale: 2
      });
      const dataUrl = canvas.toDataURL('image/png');
      
      // Attempt to download
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'my-roasted-vibe.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#FF6B6B', '#FFD93D', '#C4B5FD', '#000000']
      });
    } catch (e) {
      console.error("Export failed", e);
    }
  };

  const InputBlock = ({ 
    title, items, setter, color 
  }: { 
    title: string, items: string[], setter: any, color: string 
  }) => (
    <div className={`border-[3px] border-black panel-shadow p-3 mb-2 shrink-0 ${color}`}>
      <span className="text-[14px] uppercase mb-2 tracking-[1px] bg-black text-white inline-block px-2 py-0.5">{title}</span>
      <div className="flex flex-col gap-1 mt-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-1 mb-1">
            <input
              className="bg-white border-[2px] border-black px-2 py-1 text-[12px] w-full font-black focus:outline-none focus:ring-2 focus:ring-black"
              placeholder={`Item ${i + 1}`}
              value={item}
              onChange={(e) => handleInputChange(setter, i, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full flex flex-col border-[4px] border-black overflow-hidden relative bg-cream">
      <div className="absolute inset-0 halftone pointer-events-none z-0"></div>
      
      <header className="h-[100px] flex items-center justify-center border-b-[4px] border-black bg-vivid-yellow px-5 overflow-hidden shrink-0 z-10 relative box-content">
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-[40px] md:text-[72px] tracking-[-4px] uppercase text-stroke whitespace-nowrap font-black"
        >
          ROAST MY VIBE • JUDGE ME • ROAST MY VIBE • JUDGE ME
        </motion.div>
      </header>

      <main className="flex-grow grid grid-cols-1 md:grid-cols-[400px_1fr] overflow-hidden z-10 relative">
        <section className="p-6 border-b-[4px] md:border-b-0 md:border-r-[4px] border-black flex flex-col gap-4 bg-white overflow-y-auto shrink-0 md:shrink">
          <InputBlock title="Top 3 Bangers" items={songs} setter={setSongs} color="bg-violet" />
          <InputBlock title="Top 3 Flicks" items={movies} setter={setMovies} color="bg-vivid-yellow" />
          <InputBlock title="Top 3 Eats" items={foods} setter={setFoods} color="bg-cream" />
        </section>

        <section className="p-4 md:p-10 flex items-center justify-center bg-[#f0f0f0] relative overflow-y-auto">
          {step === 'input' && (
            <div className="text-center opacity-30 pointer-events-none">
              <div className="text-6xl font-black rotate-[-5deg]">🔥 READY 🔥</div>
            </div>
          )}

          {step === 'countdown' && (
            <div className="flex items-center justify-center min-h-[50vh]">
              <motion.div
                key={countdown}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 1 }}
                exit={{ scale: 2, opacity: 0 }}
                className="text-9xl font-black text-stroke-huge"
              >
                {countdown}
              </motion.div>
            </div>
          )}

          {step === 'result' && roastData && (
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <div className="absolute top-[20px] left-[20px] text-[40px] z-20 animate-bounce-intense hidden md:block">🔥</div>
              
              <div 
                ref={resultRef}
                className="bg-white w-[500px] max-w-full min-h-[450px] border-[4px] border-black card-shadow p-[30px] transform rotate-[-2deg] relative flex flex-col z-10"
              >
                <div className="bg-hot-red text-white px-[20px] py-[10px] border-[3px] border-black absolute -top-[20px] -right-[5px] md:-right-[20px] transform rotate-[15deg] text-[24px] z-10 shadow-sm">
                  {roastData.vibe_title.split(' ')[0]?.toUpperCase() || 'STUPID'}!
                </div>
                
                <div className="text-[18px] uppercase bg-black text-white px-3 py-1 w-fit mt-4 md:mt-0">VIBE SCORE</div>
                
                <div className="text-[80px] md:text-[120px] leading-none my-[10px] text-black tracking-tighter">
                  {roastData.vibe_score}<span className="text-[32px]">/10</span>
                </div>
                
                <div className="text-[20px] md:text-[22px] leading-tight mt-[20px] font-black">
                  "{typedRoast}<span className="animate-pulse">_</span>"
                </div>
                
                {typedRoast.length === roastData.roast.length && (
                  <div className="mt-auto text-[14px] italic text-hot-red border-t-[2px] border-black pt-[10px] mt-8">
                    {roastData.redemption}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </section>
      </main>

      <footer className="h-auto md:h-[120px] border-t-[4px] border-black flex flex-col md:grid md:grid-cols-[1fr_300px] bg-black shrink-0 z-10 relative">
        <div className="flex flex-wrap md:flex-nowrap items-center px-[15px] md:px-[30px] gap-2 md:gap-5 py-4 md:py-0 overflow-x-auto">
          <span className="text-white text-sm uppercase hidden md:block">Intensity:</span>
          {(['Mild', 'Spicy', 'Nuclear'] as Intensity[]).map(level => (
            <button
              key={level}
              onMouseEnter={playHoverSound}
              onClick={() => setIntensity(level)}
              className={`px-[15px] md:px-[30px] py-[10px] md:py-[15px] border-[3px] border-white text-sm md:text-lg cursor-pointer flex items-center gap-2 whitespace-nowrap transition-colors flex-1 md:flex-none justify-center
                ${intensity === level ? 'bg-vivid-yellow text-black btn-shadow-active' : 'bg-black text-white hover:bg-gray-800'}`}
            >
              {level}
              {level === 'Nuclear' && intensity === 'Nuclear' && (
                <div className="w-[20px] h-[20px] md:w-[30px] md:h-[30px] bg-hot-red rounded-full flex items-center justify-center animate-spin-slow text-white border-2 border-black text-xs md:text-sm">
                  ☢️
                </div>
              )}
            </button>
          ))}
        </div>
        
        {step === 'result' && roastData ? (
           <div className="grid grid-cols-2 md:border-l-[4px] border-black h-[80px] md:h-auto">
              <button 
                onClick={handleShare}
                className="bg-vivid-yellow text-black text-xl md:text-2xl font-black uppercase flex items-center justify-center gap-2 border-r-[4px] border-black hover:bg-yellow-400 active:translate-y-1 active:translate-x-1 transition-transform border-y-[4px] md:border-y-0"
              >
                <Share2 size={24} /> SAVE
              </button>
              <button 
                onClick={() => setStep('input')}
                className="bg-white text-black text-xl md:text-2xl font-bold uppercase flex items-center justify-center gap-2 hover:bg-gray-200 active:translate-y-1 active:translate-x-1 transition-transform border-y-[4px] md:border-y-0"
              >
                <RefreshCw size={24} /> AGAIN
              </button>
           </div>
        ) : (
          <button 
            onClick={handleRoast}
            disabled={loading}
            className={`bg-hot-red text-white text-3xl md:text-[48px] font-black tracking-widest flex items-center justify-center cursor-pointer border-t-[4px] md:border-t-0 md:border-l-[4px] border-black active:translate-y-1 active:translate-x-1 uppercase relative min-h-[80px] md:min-h-0 ${loading ? 'opacity-80' : ''}`}
          >
            {loading ? <RefreshCw className="animate-spin" size={40} /> : 'ROAST ME'}
          </button>
        )}
      </footer>
    </div>
  );
}
