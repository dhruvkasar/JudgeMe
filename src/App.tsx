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
    title, icon: Icon, items, setter, color 
  }: { 
    title: string, icon: any, items: string[], setter: any, color: string 
  }) => (
    <div className={`brutal-box p-6 border-4 flex flex-col gap-4 relative bg-[${color}]`} style={{ backgroundColor: color }}>
      <div className="absolute -top-6 -left-4 bg-black text-white px-4 py-1 text-xl brutal-shadow transform -rotate-2 flex items-center gap-2">
        <Icon size={24} /> {title}
      </div>
      <div className="mt-4 flex flex-col gap-3">
        {items.map((item, i) => (
          <input
            key={i}
            className="w-full border-2 border-black p-3 text-lg focus-glow"
            placeholder={`#${i + 1} ${title}...`}
            value={item}
            onChange={(e) => handleInputChange(setter, i, e.target.value)}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen py-12 px-4 md:px-8 overflow-hidden relative">
      <div className="max-w-5xl mx-auto z-10 relative">
        <header className="text-center mb-16">
          <motion.h1 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-6xl md:text-8xl font-black text-stroke uppercase mb-4 tracking-tighter"
          >
            JudgeMe
          </motion.h1>
          <div className="bg-vivid-yellow text-black border-4 border-black px-6 py-2 inline-block transform rotate-1 brutal-shadow text-xl md:text-2xl font-bold">
            ROAST MY VIBE 
          </div>
        </header>

        {step === 'input' && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col gap-12"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <InputBlock title="Songs" icon={Music} items={songs} setter={setSongs} color="#C4B5FD" />
              <InputBlock title="Movies" icon={Clapperboard} items={movies} setter={setMovies} color="#FFD93D" />
              <InputBlock title="Foods" icon={Pizza} items={foods} setter={setFoods} color="#FF6B6B" />
            </div>

            <div className="bg-white border-4 border-black p-6 brutal-shadow mx-auto w-full max-w-2xl text-center">
              <h2 className="text-2xl font-bold mb-6">SELECT ROAST INTENSITY</h2>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {(['Mild', 'Spicy', 'Nuclear'] as Intensity[]).map(level => (
                  <button
                    key={level}
                    onMouseEnter={playHoverSound}
                    onClick={() => setIntensity(level)}
                    className={`flex-1 border-4 border-black py-3 px-6 text-xl font-bold uppercase transition-transform brutal-btn-shadow relative
                      ${intensity === level ? 'bg-black text-white transform scale-105' : 'bg-white text-black hover:bg-gray-100'}`}
                  >
                    {level}
                    {level === 'Nuclear' && intensity === 'Nuclear' && (
                      <div className="absolute -top-4 -right-4 bg-hot-red text-white p-2 rounded-full border-2 border-black animate-spin-slow">
                        <Skull size={20} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleRoast}
              disabled={loading}
              className={`mx-auto bg-hot-red text-white text-3xl font-black uppercase tracking-widest border-4 border-black py-6 px-12 brutal-btn relative w-full max-w-2xl ${loading ? 'opacity-50' : ''}`}
            >
              {loading ? 'ANALYZING TRASH TASTE...' : 'ROAST ME'}
              {loading && <RefreshCw className="animate-spin absolute right-6 top-1/2 transform -translate-y-1/2" size={32} />}
            </button>
          </motion.div>
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
            className="flex flex-col items-center gap-8 pb-20"
          >
            {/* The Shareable Poster */}
            <div 
              ref={resultRef}
              className="w-full max-w-3xl bg-cream border-8 border-black p-8 md:p-12 brutal-shadow relative overflow-hidden"
            >
              {/* Halftone BG overlay inside poster */}
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(black 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
              
              <div className="absolute top-4 right-4 bg-black text-white border-2 border-black px-4 py-2 text-xl font-bold transform rotate-6 brutal-shadow">
                SCORE: {roastData.vibe_score}/10
              </div>

              <div className="absolute -left-6 top-10 bg-vivid-yellow border-4 border-black px-6 py-2 transform -rotate-3 brutal-shadow">
                <span className="text-2xl font-black">{roastData.vibe_title}</span>
              </div>

              <div className="mt-20 mb-10">
                <h2 className="text-5xl font-black uppercase text-stroke mb-8 tracking-tighter">THE VERDICT</h2>
                <div className="text-2xl leading-relaxed font-bold bg-white/80 p-6 border-4 border-black box-shadow-solid">
                  {typedRoast}
                  <span className="animate-pulse">_</span>
                </div>
              </div>

              {typedRoast.length === roastData.roast.length && (
                <motion.div 
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: -2 }}
                  className="bg-violet border-4 border-black p-4 inline-block brutal-shadow mt-4 text-xl"
                >
                  <span className="font-bold">Redemption:</span> {roastData.redemption}
                </motion.div>
              )}

              {/* Badges & Decor */}
              <div className="absolute bottom-4 right-4 animate-bounce-intense text-5xl">
                🔥
              </div>
              <div className="absolute bottom-8 left-8 text-black opacity-20 text-6xl font-black uppercase text-stroke transform -rotate-12 pointer-events-none">
                ROASTED
              </div>
            </div>

            {/* Action Buttons (Not included in screenshot) */}
            <div className="flex gap-4 w-full max-w-3xl">
              <button 
                onClick={handleShare}
                className="flex-1 bg-vivid-yellow text-black text-2xl font-black uppercase border-4 border-black py-4 brutal-btn flex items-center justify-center gap-2"
              >
                <Share2 size={28} /> SAVE POSTER
              </button>
              <button 
                onClick={() => setStep('input')}
                className="bg-white text-black text-xl font-bold uppercase border-4 border-black py-4 px-8 brutal-btn flex items-center gap-2"
              >
                <RefreshCw size={24} /> AGAIN
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
