/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { generateRoast } from './services/ai';
import { Sparkles } from 'lucide-react';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';

import { Intensity, RoastData } from './types';
import { useSoundEffects } from './hooks/useSoundEffects';
import { InputSection } from './components/InputSection';
import { CountdownSection } from './components/CountdownSection';
import { ResultSection } from './components/ResultSection';

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
  const { getAudioCtx, playHoverSound, playBassDrop, playCountdownBeep } = useSoundEffects();

  const handleRoast = useCallback(async () => {
    getAudioCtx(); // Initialize audio context on user interaction
    
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
    } catch (e) {
      console.error(e);
      setErrorMsg("System overload. Could not analyze inputs. Try again.");
      setLoading(false);
    }
  }, [songs, movies, foods, intensity, getAudioCtx]);

  // Handle countdown effect
  useEffect(() => {
    if (step === 'countdown') {
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
      
      return () => clearInterval(interval);
    }
  }, [step, playCountdownBeep, playBassDrop]);

  // Handle typing effect for roast
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

  const handleShare = useCallback(async () => {
    if (!resultRef.current) return;
    try {
      // Ensure rendering finishes before export
      await new Promise(r => setTimeout(r, 150));
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
        particleCount: 120,
        spread: 80,
        origin: { y: 0.8 },
        colors: ['#a855f7', '#ec4899', '#ef4444', '#ffffff']
      });
    } catch (e) {
      console.error("Export failed", e);
      setErrorMsg("Image export failed. You might need to screenshot instead.");
    }
  }, []);

  const resetTarget = useCallback(() => {
    setStep('input');
    setRoastData(null);
    setTypedRoast('');
    setErrorMsg(null);
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col pt-8 md:pt-16 pb-12 px-4 selection:bg-purple-500/30 relative">
      {/* Ambient glowing background */}
      <div 
        className="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/10 via-zinc-950/0 to-zinc-950/0 mix-blend-screen" 
        aria-hidden="true" 
      />
      
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
          <InputSection
            songs={songs} setSongs={setSongs}
            movies={movies} setMovies={setMovies}
            foods={foods} setFoods={setFoods}
            intensity={intensity} setIntensity={setIntensity}
            loading={loading}
            errorMsg={errorMsg} setErrorMsg={setErrorMsg}
            onRoast={handleRoast}
            onHoverSound={playHoverSound}
          />
        )}

        {step === 'countdown' && (
          <CountdownSection countdown={countdown} />
        )}

        {step === 'result' && roastData && (
          <ResultSection
            roastData={roastData}
            typedRoast={typedRoast}
            resultRef={resultRef}
            onShare={handleShare}
            onReset={resetTarget}
          />
        )}
      </main>
    </div>
  );
}
