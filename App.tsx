
import React, { useState, useEffect, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import { GameState, ShapeType } from './types';
import { BELT_Z_POSITIONS, SHAPE_TYPES, LIVES_START } from './constants';

const getRandomShape = () => SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)];

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    lives: LIVES_START,
    targetShape: getRandomShape(),
    targetCount: 0,
    playerZ: 0,
    gameOver: false,
    isPaused: false,
    gameStarted: false,
    flash: null,
  });

  const handleUpdate = useCallback((scoreChange: number, lifeChange: number, caught: boolean, type: ShapeType) => {
    setGameState(prev => {
      if (prev.gameOver) return prev;

      const newLives = prev.lives + lifeChange;
      const isGameOver = newLives <= 0;
      
      let flash: 'red' | 'green' | null = null;
      if (scoreChange > 0) flash = 'green';
      else if (lifeChange < 0) flash = 'red';

      const caughtTarget = caught && type === prev.targetShape;
      let newTargetCount = prev.targetCount + (caughtTarget ? 1 : 0);
      let newTargetShape = prev.targetShape;

      if (newTargetCount >= 3) {
        newTargetShape = getRandomShape();
        newTargetCount = 0;
      }

      return {
        ...prev,
        score: Math.max(0, prev.score + scoreChange),
        lives: newLives,
        gameOver: isGameOver,
        flash,
        targetShape: newTargetShape,
        targetCount: newTargetCount
      };
    });

    setTimeout(() => {
      setGameState(prev => ({ ...prev, flash: null }));
    }, 200);
  }, []);

  const handleStart = () => {
    setGameState(prev => ({ ...prev, gameStarted: true }));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Start game with Space or Enter
      if (!gameState.gameStarted) {
        if (e.code === 'Space' || e.code === 'Enter') {
          handleStart();
        }
        return;
      }

      // Toggle pause with Space
      if (e.code === 'Space' && !gameState.gameOver) {
        e.preventDefault();
        setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
        return;
      }

      if (gameState.gameOver || gameState.isPaused) return;

      let direction = 0;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        direction = -1;
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        direction = 1;
      }

      if (direction !== 0) {
        e.preventDefault(); 
        setGameState(prev => {
          const currentIndex = BELT_Z_POSITIONS.indexOf(prev.playerZ);
          const nextIndex = Math.max(0, Math.min(BELT_Z_POSITIONS.length - 1, currentIndex + direction));
          return { ...prev, playerZ: BELT_Z_POSITIONS[nextIndex] };
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.gameOver, gameState.isPaused, gameState.gameStarted]);

  const handleRestart = () => {
    setGameState({
      score: 0,
      lives: LIVES_START,
      targetShape: getRandomShape(),
      targetCount: 0,
      playerZ: 0,
      gameOver: false,
      isPaused: false,
      gameStarted: true, // Remain started on retry
      flash: null,
    });
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-[#020205] outline-none" tabIndex={0}>
      <GameCanvas onUpdate={handleUpdate} gameState={gameState} />
      <HUD 
        score={gameState.score} 
        lives={gameState.lives} 
        target={gameState.targetShape} 
        targetCount={gameState.targetCount}
        gameOver={gameState.gameOver}
        isPaused={gameState.isPaused}
        gameStarted={gameState.gameStarted}
        onStart={handleStart}
        onRestart={handleRestart}
        flash={gameState.flash}
      />
      <div className="scanlines" />
    </div>
  );
};

export default App;
