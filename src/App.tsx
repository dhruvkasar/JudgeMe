/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { generateRoast } from './services/ai';
import { motion } from 'motion/react';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';
import { Share2, RefreshCw, AlertCircle } from 'lucide-react';

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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const resultRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize Audio Context gracefully
  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextCtor) {
        audioCtxRef.current = new AudioContextCtor();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {}); // catch resume failures silently
    }
    return audioCtxRef.current;
  };

  const playHoverSound = () => {
    try {
      const ctx = getAudioCtx();
      if (!ctx || ctx.state !== 'running') return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
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

      gain.gain.setValueAtTime(0.8, time);
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
      if (!ctx || ctx.state !== 'running') return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
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
    setErrorMsg(null);
  };

  const handleRoast = async () => {
    getAudioCtx(); // Attempt to prime audio on interaction
    
    // Validate inputs
    const validSongs = songs.filter(s => s.trim().length > 0);
    const validMovies = movies.filter(m => m.trim().length > 0);
    const validFoods = foods.filter(f => f.trim().length > 0);

    if (validSongs.length === 0 && validMovies.length === 0 && validFoods.length === 0) {
      setErrorMsg("Fill out at least one item! Give the AI something to roast.");
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
      setErrorMsg("AI breakdown! Couldn't comprehend your trash taste. Try again.");
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
      const speed = 25; // ms per char
      
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
      // Short delay ensuring fonts/layout update before drawing
      await new Promise(r => setTimeout(r, 100));
      
      const canvas = await html2canvas(resultRef.current, {
        backgroundColor: '#FFFDF5',
        scale: window.devicePixelRatio || 2, // scale dynamically based on display
        useCORS: true,
        logging: false,
      });
      const dataUrl = canvas.toDataURL('image/png');
      
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
      setErrorMsg("Image export failed! Maybe try a screenshot?");
    }
  };

  const resetTarget = () => {
    setStep('input');
    setRoastData(null);
    setTypedRoast('');
    setErrorMsg(null);
  };

  const InputBlock = ({ 
    title, items, setter, color 
  }: { 
    title: string, items: string[], setter: any, color: string 
  }) => (
    <div className={`border-[3px] border-black panel-shadow p-3 mb-3 shrink-0 ${color}`}>
      <span className="text-[14px] uppercase mb-2 tracking-[1px] bg-black text-white inline-block px-2 py-0.5">{title}</span>
      <div className="flex flex-col gap-1.5 mt-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-1 mb-1 relative">
            <input
              className="bg-white border-[2px] border-black px-2 py-1.5 text-[16px] w-full font-black focus:outline-none focus:ring-2 focus:ring-black"
              placeholder={`#${i + 1} item`}
              value={item}
              onChange={(e) => handleInputChange(setter, i, e.target.value)}
              maxLength={50}
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] md:h-[100dvh] w-full flex flex-col border-0 md:border-[4px] border-black bg-cream relative overflow-x-hidden md:overflow-hidden">
      <div className="absolute inset-0 halftone pointer-events-none z-0"></div>
      
      <header className="h-[70px] md:h-[100px] flex items-center justify-center border-b-[4px] border-black bg-vivid-yellow overflow-hidden shrink-0 z-10 relative box-content shadow-[0_4px_0_rgba(0,0,0,1)] md:shadow-none">
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-[28px] sm:text-[40px] md:text-[72px] tracking-tight md:tracking-[-4px] uppercase text-stroke whitespace-nowrap font-black px-4"
        >
          ROAST MY VIBE • JUDGE ME • ROAST MY VIBE
        </motion.div>
      </header>

      <main className="flex-grow flex flex-col md:grid md:grid-cols-[400px_1fr] md:overflow-hidden z-10 relative">
        {/* Left Side: Inputs */}
        <section className={`p-4 md:p-6 border-b-[4px] md:border-b-0 md:border-r-[4px] border-black flex flex-col bg-white overflow-y-auto shrink-0 md:shrink border-black shadow-[0_4px_0_rgba(0,0,0,1)] md:shadow-none ${step !== 'input' ? 'hidden md:flex opacity-50 pointer-events-none' : ''}`}>
          <div className="flex flex-col gap-[2px]">
            <InputBlock title="Top 3 Bangers" items={songs} setter={setSongs} color="bg-violet" />
            <InputBlock title="Top 3 Flicks" items={movies} setter={setMovies} color="bg-vivid-yellow" />
            <InputBlock title="Top 3 Eats" items={foods} setter={setFoods} color="bg-cream" />
          </div>
        </section>

        {/* Right Side: Results & Animation */}
        <section className={`p-4 md:p-10 flex items-center justify-center relative overflow-y-auto min-h-[50vh] ${step === 'input' ? 'hidden md:flex bg-[#f0f0f0]' : 'flex bg-cream md:bg-[#f0f0f0]'}`}>
          {step === 'input' && (
            <div className="text-center opacity-30 pointer-events-none hidden md:block">
              <div className="text-6xl font-black rotate-[-5deg]">🔥 READY 🔥</div>
            </div>
          )}

          {step === 'countdown' && (
            <motion.div
              key={countdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              className="text-[120px] md:text-[200px] font-black text-stroke-huge leading-none"
            >
              {countdown}
            </motion.div>
          )}

          {step === 'result' && roastData && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="w-full flex justify-center py-4 md:py-0"
            >
              <div className="absolute top-[20px] left-[20px] text-[40px] z-20 animate-bounce-intense hidden md:block select-none pointer-events-none">🔥</div>
              
              <div 
                ref={resultRef}
                className="bg-white w-[500px] max-w-full min-h-[400px] border-[4px] border-black card-shadow p-[20px] sm:p-[30px] transform md:rotate-[-2deg] relative flex flex-col z-10"
              >
                <div className="bg-hot-red text-white px-[15px] py-[8px] md:px-[20px] md:py-[10px] border-[3px] border-black absolute -top-[15px] right-[10px] md:-top-[20px] md:-right-[20px] transform rotate-[10deg] text-[18px] md:text-[24px] z-10 shadow-sm leading-none whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                  {roastData.vibe_title.toUpperCase()}
                </div>
                
                <div className="text-[14px] md:text-[18px] uppercase bg-black text-white px-3 py-1 w-fit mt-5 md:mt-0 leading-none">VIBE SCORE</div>
                
                <div className="text-[72px] md:text-[120px] leading-none my-[5px] text-black tracking-tighter">
                  {roastData.vibe_score}<span className="text-[24px] md:text-[32px]">/10</span>
                </div>
                
                <div className="text-[16px] md:text-[22px] leading-[1.3] mt-[10px] md:mt-[20px] font-black break-words">
                  "{typedRoast}<span className="animate-pulse">_</span>"
                </div>
                
                {typedRoast.length === roastData.roast.length && (
                  <div className="mt-auto text-[13px] md:text-[14px] italic text-hot-red border-t-[2px] border-black pt-[10px] mt-6">
                    {roastData.redemption}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </section>
      </main>

      <footer className={`h-auto md:h-[120px] border-t-[4px] border-black flex flex-col md:grid md:grid-cols-[1fr_300px] bg-black shrink-0 z-10 relative ${step !== 'input' && step !== 'result' ? 'opacity-50 pointer-events-none' : ''}`}>
        
        {/* Mobile Error Bar (Shows right above footer contents when active) */}
        {errorMsg && step === 'input' && (
          <div className="bg-red-500 text-white font-bold text-[14px] p-3 flex items-center justify-center gap-2 border-b-[4px] border-black w-full animate-pulse md:absolute md:-top-[48px] md:border-b-0 md:border-t-[4px] md:border-black">
            <AlertCircle size={20} className="shrink-0" />
            <span className="truncate">{errorMsg}</span>
          </div>
        )}

        <div className="flex flex-wrap md:flex-nowrap items-center px-4 md:px-[30px] gap-2 md:gap-5 py-4 overflow-x-auto min-h-[80px]">
          <span className="text-white text-[14px] uppercase shrink-0 font-black hidden md:block">Intensity:</span>
          {(['Mild', 'Spicy', 'Nuclear'] as Intensity[]).map(level => (
            <button
              key={level}
              onMouseEnter={playHoverSound}
              onClick={() => step === 'input' && setIntensity(level)}
              disabled={step !== 'input'}
              className={`px-[10px] sm:px-[15px] md:px-[30px] py-[10px] md:py-[15px] border-[3px] border-white text-[14px] sm:text-[16px] md:text-lg cursor-pointer flex items-center gap-2 whitespace-nowrap transition-colors flex-1 md:flex-none justify-center
                ${intensity === level ? 'bg-vivid-yellow text-black btn-shadow-active' : 'bg-black text-white hover:bg-gray-800'}
                ${step !== 'input' ? 'opacity-70' : ''}`}
            >
              {level}
              {level === 'Nuclear' && intensity === 'Nuclear' && (
                <div className="w-[18px] h-[18px] md:w-[30px] md:h-[30px] bg-hot-red rounded-full flex items-center justify-center animate-spin-slow text-white border-2 border-black text-[10px] md:text-sm">
                  ☢️
                </div>
              )}
            </button>
          ))}
        </div>
        
        {step === 'result' ? (
           <div className="grid grid-cols-2 md:border-l-[4px] border-black h-[70px] md:h-auto">
              <button 
                onClick={handleShare}
                className="bg-vivid-yellow text-black text-[18px] md:text-2xl font-black uppercase flex items-center justify-center gap-2 border-r-[4px] border-black hover:bg-yellow-400 active:bg-yellow-500 transition-colors border-t-[4px] md:border-t-0"
              >
                <Share2 size={24} className="shrink-0" /> 
                <span>SAVE</span>
              </button>
              <button 
                onClick={resetTarget}
                className="bg-white text-black text-[18px] md:text-2xl font-bold uppercase flex items-center justify-center gap-2 hover:bg-gray-200 active:bg-gray-300 transition-colors border-t-[4px] md:border-t-0"
              >
                <RefreshCw size={24} className="shrink-0" /> 
                <span className="hidden sm:inline">AGAIN</span>
              </button>
           </div>
        ) : (
          <button 
            onClick={handleRoast}
            disabled={loading || step !== 'input'}
            className={`bg-hot-red text-white text-[28px] sm:text-[32px] md:text-[48px] font-black tracking-widest flex items-center justify-center cursor-pointer border-t-[4px] md:border-t-0 md:border-l-[4px] border-black hover:opacity-90 active:opacity-100 uppercase relative min-h-[80px] md:min-h-0 transition-opacity ${loading ? 'opacity-50' : ''}`}
          >
            {loading ? <RefreshCw className="animate-spin" size={32} /> : 'ROAST ME'}
          </button>
        )}
      </footer>
    </div>
  );
}
