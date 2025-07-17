// Indicateur de niveau
// src/app/renaissance/components/LevelIndicator.tsx

'use client';

import React from 'react';

export interface LevelInfo {
  stage: 'discovery' | 'level1' | 'level2' | 'level3';
  name: string;
  description: string;
  flashDuration: number;
  icon: string;
  color: string;
  progress: number; // 0-100
  isCompleted: boolean;
  isActive: boolean;
  isLocked: boolean;
}

interface LevelIndicatorProps {
  levels: LevelInfo[];
  currentLevel?: string;
  onLevelClick?: (stage: string) => void;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  className?: string;
}

export default function LevelIndicator({
  levels,
  currentLevel,
  onLevelClick,
  orientation = 'horizontal',
  size = 'md',
  showProgress = true,
  className = ''
}: LevelIndicatorProps) {
  const isHorizontal = orientation === 'horizontal';

  const sizeClasses = {
    sm: {
      container: 'p-3',
      icon: 'text-2xl',
      title: 'text-sm',
      description: 'text-xs',
      progress: 'h-1'
    },
    md: {
      container: 'p-4',
      icon: 'text-3xl',
      title: 'text-base',
      description: 'text-sm',
      progress: 'h-2'
    },
    lg: {
      container: 'p-6',
      icon: 'text-4xl',
      title: 'text-lg',
      description: 'text-base',
      progress: 'h-3'
    }
  };

  const classes = sizeClasses[size];

  return (
    <div className={`${className}`}>
      <div className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} ${isHorizontal ? 'gap-4' : 'gap-6'}`}>
        {levels.map((level, index) => (
          <div key={level.stage} className={`${isHorizontal ? 'flex-1' : 'w-full'} relative`}>
            {/* Ligne de connexion */}
            {index < levels.length - 1 && (
              <div
                className={`
                  absolute z-0
                  ${isHorizontal 
                    ? 'top-1/2 left-full w-4 h-0.5 -translate-y-1/2' 
                    : 'left-1/2 top-full h-6 w-0.5 -translate-x-1/2'
                  }
                  ${level.isCompleted ? level.color.replace('bg-', 'bg-') : 'bg-gray-200'}
                `}
              />
            )}

            {/* Carte de niveau */}
            <div
              onClick={() => !level.isLocked && onLevelClick?.(level.stage)}
              className={`
                relative z-10 rounded-2xl border-2 transition-all duration-200 transform
                ${classes.container}
                ${level.isCompleted
                  ? `${level.color} border-transparent shadow-lg text-white`
                  : level.isActive
                    ? 'bg-white border-purple-400 shadow-md hover:shadow-lg'
                    : level.isLocked
                      ? 'bg-gray-100 border-gray-200 opacity-60'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                }
                ${!level.isLocked && onLevelClick ? 'cursor-pointer hover:scale-105' : ''}
                ${level.isLocked ? 'cursor-not-allowed' : ''}
              `}
            >
              {/* Badge de statut */}
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                {level.isCompleted ? (
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white">
                    ✓
                  </div>
                ) : level.isActive ? (
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white">
                    ▶
                  </div>
                ) : level.isLocked ? (
                  <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white">
                    🔒
                  </div>
                ) : null}
              </div>

              {/* Contenu */}
              <div className="text-center">
                {/* Icône */}
                <div className={`${classes.icon} mb-2`}>
                  {level.icon}
                </div>

                {/* Titre */}
                <h3 className={`${classes.title} font-bold mb-1 ${level.isCompleted ? 'text-white' : level.isLocked ? 'text-gray-500' : 'text-gray-800'}`}>
                  {level.name}
                </h3>

                {/* Description */}
                <p className={`${classes.description} ${level.isCompleted ? 'text-white/80' : level.isLocked ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                  {level.description}
                </p>

                {/* Flash duration */}
                <div className={`text-xs ${level.isCompleted ? 'text-white/70' : level.isLocked ? 'text-gray-400' : 'text-gray-500'} mb-3`}>
                  Flash: {level.flashDuration >= 1000 ? `${level.flashDuration / 1000}s` : `${level.flashDuration}ms`}
                </div>

                {/* Barre de progression */}
                {showProgress && (
                  <div className="w-full">
                    <div className={`w-full ${classes.progress} bg-gray-200 rounded-full overflow-hidden`}>
                      <div
                        className={`h-full transition-all duration-300 ${level.isCompleted ? 'bg-white/30' : level.color}`}
                        style={{ width: `${level.progress}%` }}
                      />
                    </div>
                    <div className={`text-xs mt-1 ${level.isCompleted ? 'text-white/70' : level.isLocked ? 'text-gray-400' : 'text-gray-500'}`}>
                      {Math.round(level.progress)}%
                    </div>
                  </div>
                )}

                {/* Statut */}
                <div className="mt-3">
                  {level.isCompleted ? (
                    <span className="text-xs text-white/80 font-medium">✅ Complété</span>
                  ) : level.isActive ? (
                    <span className="text-xs text-purple-600 font-medium">
                      {level.progress > 0 ? '📖 En cours' : '🚀 Démarrer'}
                    </span>
                  ) : level.isLocked ? (
                    <span className="text-xs text-gray-500">🔒 Verrouillé</span>
                  ) : (
                    <span className="text-xs text-gray-500">⏳ En attente</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Composant simplifié pour l'affichage du niveau actuel
interface CurrentLevelDisplayProps {
  level: LevelInfo;
  phraseNumber?: number;
  totalPhrases?: number;
  className?: string;
}

export function CurrentLevelDisplay({
  level,
  phraseNumber,
  totalPhrases,
  className = ''
}: CurrentLevelDisplayProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-lg p-6 text-center ${className}`}>
      <div className="text-4xl mb-3">{level.icon}</div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">{level.name}</h2>
      <p className="text-gray-600 text-sm mb-3">{level.description}</p>
      
      <div className="flex justify-center items-center gap-4 text-sm text-gray-500 mb-4">
        <span>Flash: {level.flashDuration >= 1000 ? `${level.flashDuration / 1000}s` : `${level.flashDuration}ms`}</span>
        {phraseNumber && totalPhrases && (
          <>
            <span>•</span>
            <span>Phrase {phraseNumber}/{totalPhrases}</span>
          </>
        )}
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${level.color}`}
          style={{ width: `${level.progress}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 mt-1">
        Progression: {Math.round(level.progress)}%
      </div>
    </div>
  );
}

// Composant pour la navigation entre niveaux
interface LevelNavigationProps {
  currentStage: string;
  levels: LevelInfo[];
  onPrevious?: () => void;
  onNext?: () => void;
  onLevelSelect?: (stage: string) => void;
  className?: string;
}

export function LevelNavigation({
  currentStage,
  levels,
  onPrevious,
  onNext,
  onLevelSelect,
  className = ''
}: LevelNavigationProps) {
  const currentIndex = levels.findIndex(level => level.stage === currentStage);
  const currentLevel = levels[currentIndex];
  const previousLevel = currentIndex > 0 ? levels[currentIndex - 1] : null;
  const nextLevel = currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;

  const canGoPrevious = previousLevel && onPrevious;
  const canGoNext = nextLevel && !nextLevel.isLocked && onNext;

  return (
    <div className={`flex items-center justify-between bg-white rounded-2xl shadow-lg p-4 ${className}`}>
      {/* Niveau précédent */}
      <button
        onClick={onPrevious}
        disabled={!canGoPrevious}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-xl transition-colors
          ${canGoPrevious 
            ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-800' 
            : 'text-gray-300 cursor-not-allowed'
          }
        `}
      >
        <span>←</span>
        {previousLevel && (
          <div className="text-left">
            <div className="text-xs">{previousLevel.name}</div>
          </div>
        )}
      </button>

      {/* Niveau actuel */}
      <div className="flex-1 text-center">
        <div className="text-lg font-bold text-gray-800">{currentLevel?.name}</div>
        <div className="text-sm text-gray-500">
          Flash: {currentLevel && (currentLevel.flashDuration >= 1000 ? `${currentLevel.flashDuration / 1000}s` : `${currentLevel.flashDuration}ms`)}
        </div>
      </div>

      {/* Niveau suivant */}
      <button
        onClick={onNext}
        disabled={!canGoNext}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-xl transition-colors
          ${canGoNext 
            ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-800' 
            : 'text-gray-300 cursor-not-allowed'
          }
        `}
      >
        {nextLevel && (
          <div className="text-right">
            <div className="text-xs">{nextLevel.name}</div>
          </div>
        )}
        <span>→</span>
      </button>
    </div>
  );
}