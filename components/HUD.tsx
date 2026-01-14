
import React from 'react';
import { ShapeType } from '../types';

interface HUDProps {
  score: number;
  lives: number;
  target: ShapeType;
  targetCount: number;
  gameOver: boolean;
  isPaused: boolean;
  gameStarted: boolean;
  onStart: () => void;
  onRestart: () => void;
  flash: 'red' | 'green' | null;
}

const HUD: React.FC<HUDProps> = ({ 
  score, 
  lives, 
  target, 
  targetCount, 
  gameOver, 
  isPaused, 
  gameStarted, 
  onStart, 
  onRestart, 
  flash 
}) => {
  const renderHearts = () => {
    const hearts = [];
    for (let i = 0; i < 5; i++) {
      hearts.push(
        <span key={i} className={`mr-1 ${i < lives ? 'text-cyan-400' : 'text-gray-700'}`}>
          {i < lives ? '♥' : '♡'}
        </span>
      );
    }
    return hearts;
  };

  return (
    <div className={`absolute inset-0 pointer-events-none transition-colors duration-200 ${
      flash === 'green' ? 'bg-green-500/10' : flash === 'red' ? 'bg-red-500/10' : ''
    }`}>
      {/* HUD Elements - Only show when game is started */}
      {gameStarted && (
        <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center text-white border-b-2 border-cyan-900/50 bg-black/40 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <span className="text-cyan-400 text-sm md:text-base">SCORE:</span>
            <span className="text-white text-sm md:text-base tabular-nums">{score}</span>
          </div>
          
          <div className="flex flex-col items-center">
            <span className="text-cyan-400 text-[10px] md:text-xs mb-1">TARGET (NEED 3)</span>
            <span className="text-green-400 text-sm md:text-base animate-pulse">
              {target} <span className="text-white ml-2">[{targetCount}/3]</span>
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-cyan-400 text-sm md:text-base">LIVES:</span>
            <div className="flex text-lg md:text-xl">
              {renderHearts()}
            </div>
          </div>
        </div>
      )}

      {/* Start Screen */}
      {!gameStarted && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 pointer-events-auto z-50 p-6 text-center">
          <div className="mb-10">
            <h1 className="text-4xl md:text-7xl text-cyan-400 mb-2 tracking-tighter drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]">
              SOLID SORTER
            </h1>
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
          </div>

          <div className="max-w-md bg-black/50 border-2 border-cyan-900 p-6 mb-12 backdrop-blur-md">
            <h2 className="text-cyan-400 text-xs mb-4 uppercase tracking-[0.2em]">Manual Override</h2>
            <ul className="text-white text-[10px] md:text-xs leading-relaxed text-left space-y-3 opacity-90">
              <li className="flex gap-3"><span className="text-green-400">01</span> CATCH THE FLASHING TARGET SHAPE.</li>
              <li className="flex gap-3"><span className="text-green-400">02</span> WRONG SHAPES OR MISSES LOSE LIVES.</li>
              <li className="flex gap-3"><span className="text-green-400">03</span> USE ARROW KEYS [↑/↓] TO SWITCH LANES.</li>
            </ul>
          </div>

          <button
            onClick={onStart}
            className="group relative px-12 py-6 bg-cyan-600/10 border-4 border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all duration-300 font-bold text-xl animate-pulse hover:animate-none"
          >
            START OPERATION
            <div className="absolute -inset-1 border-2 border-cyan-400 blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          
          <p className="mt-8 text-white/30 text-[8px] tracking-[0.3em]">VERSION 1.0.4 // CYBER-FACTORY_OS</p>
        </div>
      )}

      {/* Game Over Screen */}
      {gameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 pointer-events-auto z-50">
          <h1 className="text-4xl md:text-6xl text-red-600 mb-8 animate-pulse tracking-tighter">GAME OVER</h1>
          <p className="text-white text-xl mb-12">FINAL SCORE: {score}</p>
          <button
            onClick={onRestart}
            className="px-10 py-5 bg-transparent border-4 border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-black transition-all duration-300 font-bold text-lg"
          >
            RETRY?
          </button>
        </div>
      )}

      {/* Pause Screen */}
      {isPaused && !gameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 pointer-events-none z-40">
          <h1 className="text-4xl md:text-6xl text-cyan-400 mb-4 tracking-widest animate-pulse">PAUSED</h1>
          <p className="text-white text-sm opacity-60">PRESS [SPACE] TO RESUME</p>
        </div>
      )}

      {/* Control Hint */}
      {gameStarted && !gameOver && !isPaused && score === 0 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-[10px] text-cyan-500/60 uppercase tracking-widest animate-bounce">
          ↑ / ↓ TO SWITCH LANES | SPACE TO PAUSE
        </div>
      )}
    </div>
  );
};

export default HUD;
