/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Music, Terminal, Skull, Zap } from 'lucide-react';

// --- CONSTANTS ---
const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const TICK_RATE = 150;

const TRACKS = [
  {
    id: 1,
    title: "NEURAL_STATIC_01",
    artist: "CYBER_CORE",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // Realistic placeholder
    duration: "03:45"
  },
  {
    id: 2,
    title: "VIRTUAL_VOID",
    artist: "MACHINE_MIND",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    duration: "04:12"
  },
  {
    id: 3,
    title: "GLITCH_IN_THE_SHELL",
    artist: "PROTOCOL_X",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    duration: "02:58"
  }
];

// --- COMPONENTS ---

export default function App() {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  
  // Music State
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | null>(null);

  // --- GAME LOGIC ---

  const generateFood = useCallback((currentSnake: {x: number, y: number}[]) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // eslint-disable-next-line no-loop-func
      if (!currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setGameOver(false);
    setScore(0);
    setFood(generateFood(INITIAL_SNAKE));
    setIsPaused(false);
  };

  const moveSnake = useCallback(() => {
    if (gameOver || isPaused) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = {
        x: (head.x + direction.x + GRID_SIZE) % GRID_SIZE,
        y: (head.y + direction.y + GRID_SIZE) % GRID_SIZE,
      };

      // Collision check
      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameOver(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Food check
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, gameOver, isPaused, generateFood]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': if (direction.y === 0) setDirection({ x: 0, y: -1 }); break;
        case 'ArrowDown': if (direction.y === 0) setDirection({ x: 0, y: 1 }); break;
        case 'ArrowLeft': if (direction.x === 0) setDirection({ x: -1, y: 0 }); break;
        case 'ArrowRight': if (direction.x === 0) setDirection({ x: 1, y: 0 }); break;
        case ' ': setIsPaused(p => !p); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  useEffect(() => {
    if (!gameOver && !isPaused) {
      gameLoopRef.current = window.setInterval(moveSnake, TICK_RATE);
    } else {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [moveSnake, gameOver, isPaused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width / GRID_SIZE;

    // Clear
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Food
    ctx.fillStyle = '#ff00ff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ff00ff';
    ctx.fillRect(food.x * size + 2, food.y * size + 2, size - 4, size - 4);

    // Draw Snake
    snake.forEach((segment, i) => {
      ctx.fillStyle = i === 0 ? '#00ffff' : 'rgba(0, 255, 255, 0.5)';
      ctx.shadowBlur = i === 0 ? 15 : 5;
      ctx.shadowColor = '#00ffff';
      ctx.fillRect(segment.x * size + 1, segment.y * size + 1, size - 2, size - 2);
    });
  }, [snake, food]);

  // --- MUSIC LOGIC ---

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const skipTrack = (dir: 'next' | 'prev') => {
    const nextIndex = dir === 'next' 
      ? (currentTrackIndex + 1) % TRACKS.length
      : (currentTrackIndex - 1 + TRACKS.length) % TRACKS.length;
    setCurrentTrackIndex(nextIndex);
  };

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play();
    }
  }, [currentTrackIndex, isPlaying]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glitch Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="w-full h-full animate-pulse bg-gradient-to-tr from-cyan/20 to-magenta/20" />
      </div>

      {/* Header */}
      <header className="mb-8 text-center z-10 w-full max-w-4xl flex items-center justify-between border-b border-cyan/30 pb-4">
        <div className="flex items-center gap-4">
          <Terminal className="text-magenta" />
          <h1 className="text-2xl font-black tracking-tighter glitch" data-text="HYPER-GLITCH // SNAKE">
            HYPER-GLITCH // SNAKE
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-[10px] block opacity-50">SCORE_ARRAY</span>
            <span className="text-xl font-bold tracking-widest text-magenta">{score.toString().padStart(6, '0')}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] block opacity-50">SYSTEM_STATUS</span>
            <span className={`text-sm ${gameOver ? 'text-red-500' : 'text-green-400'}`}>
              {gameOver ? 'SYSTEM_FAIL' : isPaused ? 'HALTED' : 'STANDBY'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Game Segment */}
      <main className="flex flex-col lg:flex-row gap-8 items-start justify-center z-10 w-full max-w-6xl">
        
        {/* Game Window */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan to-magenta rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative bg-neon-bg border-4 border-cyan/20 rounded-lg overflow-hidden flex flex-col p-2">
            <canvas 
              ref={canvasRef} 
              width={400} 
              height={400} 
              className={`w-full max-w-[400px] aspect-square transition-all duration-300 ${gameOver ? 'grayscale contrast-125' : ''}`}
            />
            
            <AnimatePresence>
              {gameOver && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm"
                >
                  <Skull className="w-16 h-16 text-magenta mb-4 animate-bounce" />
                  <h2 className="text-4xl font-black mb-2 text-magenta">CRITICAL_ERROR</h2>
                  <p className="text-sm opacity-70 mb-6">INTEGRITY_COMPROMISED. REBOOT_REQUIRED.</p>
                  <button 
                    onClick={resetGame}
                    className="px-8 py-3 bg-cyan text-black font-black hover:bg-magenta hover:text-white transition-all active:scale-95 border-b-4 border-cyan-800"
                  >
                    /REBOOT_CORE
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {isPaused && !gameOver && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                <div className="text-2xl font-black animate-pulse text-cyan">SYSTEM_HALTED</div>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex gap-4 text-[10px] opacity-40 uppercase tracking-[0.2em]">
            <span>[ ARROWS ] TO STEER</span>
            <span>[ SPACE ] TO HALT</span>
            <span className="ml-auto text-magenta italic">ENV_VERSION: 1.0.42-glitch</span>
          </div>
        </div>

        {/* Music Player Segment */}
        <div className="flex-1 w-full flex flex-col gap-6">
          <section className="bg-cyan/5 border border-cyan/20 p-6 rounded-lg relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan to-transparent opacity-50" />
            
            <div className="flex items-center gap-4 mb-8">
              <div className={`p-3 rounded-full bg-cyan/10 ring-2 ring-cyan/20 ${isPlaying ? 'animate-spin-slow' : ''}`}>
                <Music className="text-cyan w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold opacity-40 tracking-widest uppercase">Now_Processing</h3>
                <div className="text-xl font-black text-cyan truncate max-w-[200px]">
                  {TRACKS[currentTrackIndex].title}
                </div>
              </div>
            </div>

            {/* Visualizer Mockup */}
            <div className="flex items-end gap-1 h-12 mb-8 px-2 overflow-hidden">
              {[...Array(24)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ height: isPlaying ? [10, 40, 20, 48, 15] : 10 }}
                  transition={{ 
                    duration: 0.5 + Math.random(), 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="flex-1 bg-gradient-to-t from-cyan to-magenta/40 opacity-50"
                  style={{ height: '10%' }}
                />
              ))}
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center text-[10px] font-bold opacity-40">
                <span>00:42</span>
                <div className="flex-1 mx-4 h-[2px] bg-cyan/20 relative">
                  <div className="absolute top-0 left-0 h-full w-[35%] bg-magenta" />
                </div>
                <span>{TRACKS[currentTrackIndex].duration}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={() => skipTrack('prev')} className="p-2 hover:text-magenta transition-colors">
                    <SkipBack size={20} />
                  </button>
                  <button 
                    onClick={togglePlay}
                    className="w-14 h-14 rounded-full bg-cyan text-black flex items-center justify-center hover:bg-magenta hover:text-white transition-all shadow-[0_0_20px_rgba(0,255,255,0.4)] hover:shadow-[0_0_20px_rgba(255,0,255,0.4)]"
                  >
                    {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
                  </button>
                  <button onClick={() => skipTrack('next')} className="p-2 hover:text-magenta transition-colors">
                    <SkipForward size={20} />
                  </button>
                </div>
                <div className="flex items-center gap-2 opacity-50">
                  <Volume2 size={16} />
                  <div className="w-16 h-1 bg-cyan/20 rounded-full overflow-hidden">
                    <div className="w-3/4 h-full bg-cyan" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Tracklist */}
          <section className="space-y-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
            {TRACKS.map((track, idx) => (
              <button 
                key={track.id}
                onClick={() => {
                  setCurrentTrackIndex(idx);
                  setIsPlaying(true);
                }}
                className={`w-full flex items-center justify-between p-3 rounded border transition-all ${
                  idx === currentTrackIndex 
                  ? 'bg-magenta/20 border-magenta text-magenta shadow-[inset_0_0_10px_rgba(255,0,255,0.2)]' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10 text-cyan opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="text-[10px] font-mono opacity-40">0{idx + 1}</span>
                  <div className="truncate text-left">
                    <div className="font-bold text-sm truncate">{track.title}</div>
                    <div className="text-[10px] opacity-50">{track.artist}</div>
                  </div>
                </div>
                {idx === currentTrackIndex && isPlaying && (
                  <div className="flex gap-[2px]">
                    <div className="w-1 h-3 bg-magenta animate-music-bar-1" />
                    <div className="w-1 h-3 bg-magenta animate-music-bar-2" />
                    <div className="w-1 h-3 bg-magenta animate-music-bar-3" />
                  </div>
                )}
                {! (idx === currentTrackIndex && isPlaying) && (
                  <span className="text-[10px] font-mono opacity-30">{track.duration}</span>
                )}
              </button>
            ))}
          </section>

          <footer className="mt-auto p-4 border border-magenta/20 rounded bg-magenta/5">
            <div className="flex items-center gap-3">
              <Zap className="text-magenta shrink-0" size={20} />
              <p className="text-[9px] uppercase leading-tight tracking-wider opacity-60">
                Machine learning resonance detected. Audio feed synchronized with neural grid. 
                Keep snake operational to prevent data decay.
              </p>
            </div>
          </footer>
        </div>
      </main>

      <audio 
        ref={audioRef} 
        src={TRACKS[currentTrackIndex].url}
        onEnded={() => skipTrack('next')}
      />

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        @keyframes music-bar {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
        .animate-music-bar-1 { animation: music-bar 0.5s infinite; }
        .animate-music-bar-2 { animation: music-bar 0.8s infinite; }
        .animate-music-bar-3 { animation: music-bar 0.6s infinite; }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 255, 255, 0.2);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 255, 255, 0.4);
        }
      `}</style>
    </div>
  );
}
