// Indicateur de niveau
// src/app/renaissance/components/LevelIndicator.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { renaissanceService } from '../../../lib/services/renaissanceService';

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

// Composant pour la navigation entre niveaux avec affichage du niveau actuel
interface LevelNavigationProps {
  currentStage: string;
  axeId: string;
  userId?: string;
  onPrevious?: () => void;
  onNext?: () => void;
  onLevelSelect?: (stage: string) => void;
  phraseNumber?: number;
  totalPhrases?: number;
  className?: string;
}

export function LevelNavigation({
  currentStage,
  axeId,
  userId,
  onPrevious,
  onNext,
  onLevelSelect,
  phraseNumber,
  totalPhrases,
  className = ''
}: LevelNavigationProps) {
  const [levels, setLevels] = useState<LevelInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Configuration des niveaux
  const LEVEL_CONFIG = {
    discovery: {
      name: 'Découverte',
      description: 'Mémorisation des phrases',
      flashDuration: 500,
      icon: '🧠',
      color: 'bg-blue-500'
    },
    level1: {
      name: 'Niveau 1',
      description: 'Flash 3 secondes',
      flashDuration: 3000,
      icon: '⚡',
      color: 'bg-green-500'
    },
    level2: {
      name: 'Niveau 2', 
      description: 'Flash 1.5 secondes',
      flashDuration: 1500,
      icon: '⚡⚡',
      color: 'bg-orange-500'
    },
    level3: {
      name: 'Niveau 3',
      description: 'Flash 0.5 seconde',
      flashDuration: 500,
      icon: '⚡⚡⚡',
      color: 'bg-red-500'
    }
  };

  useEffect(() => {
    loadLevelProgress();
  }, [axeId, userId, currentStage]);

  const loadLevelProgress = async () => {
    if (!userId || !axeId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Récupérer tous les progrès pour cet axe
      const { data: progressData } = await supabase
        .from('user_renaissance_progress')
        .select('stage, stage_completed, last_attempt_at')
        .eq('user_id', userId)
        .eq('axe_id', axeId);

      // Récupérer les sessions de jeu complétées pour calculer les progrès
      const { data: sessionsData } = await supabase
        .from('renaissance_game_sessions')
        .select('stage, session_accuracy, completed_at, is_completed')
        .eq('user_id', userId)
        .eq('axe_id', axeId);
        // ✅ CORRECTION: Enlever le filtre is_completed=true pour récupérer toutes les sessions

      // Construire les données des niveaux
      const levelData: LevelInfo[] = Object.entries(LEVEL_CONFIG).map(([stage, config]) => {
        const stageKey = stage as keyof typeof LEVEL_CONFIG;
        
        // Vérifier la complétion dans les deux sources de données
        const progressEntry = progressData?.find(p => p.stage === stage);
        const completedSession = sessionsData?.find(s => s.stage === stage && s.session_accuracy === 100 && s.is_completed);
        const isCompleted = !!(progressEntry?.stage_completed || completedSession);
        
        // Calculer la progression basée sur les sessions existantes
        const sessionProgress = sessionsData?.filter(s => s.stage === stage) || [];
        const bestAccuracy = sessionProgress.length > 0 
          ? Math.max(...sessionProgress.map(s => s.session_accuracy || 0)) 
          : 0;
        
        // Déterminer si le niveau est déverrouillé
        let isUnlocked = false;
        if (stage === 'discovery') {
          isUnlocked = true; // Discovery toujours déverrouillée
        } else if (stage === 'level1') {
          // ✅ CORRECTION: Level 1 se déverrouille dès que discovery est complétée OU qu'il y a des sessions discovery
          const discoveryCompleted = progressData?.some(p => p.stage === 'discovery' && p.stage_completed) ||
                                   sessionsData?.some(s => s.stage === 'discovery' && s.session_accuracy === 100) ||
                                   sessionsData?.some(s => s.stage === 'discovery'); // Juste avoir une session discovery suffit
          isUnlocked = !!discoveryCompleted;
        } else if (stage === 'level2') {
          const level1Completed = progressData?.some(p => p.stage === 'level1' && p.stage_completed) ||
                                 sessionsData?.some(s => s.stage === 'level1' && s.session_accuracy === 100);
          isUnlocked = !!level1Completed;
        } else if (stage === 'level3') {
          const level2Completed = progressData?.some(p => p.stage === 'level2' && p.stage_completed) ||
                                 sessionsData?.some(s => s.stage === 'level2' && s.session_accuracy === 100);
          isUnlocked = !!level2Completed;
        }

        return {
          stage: stageKey,
          name: config.name,
          description: config.description,
          flashDuration: config.flashDuration,
          icon: config.icon,
          color: config.color,
          progress: isCompleted ? 100 : bestAccuracy,
          isCompleted,
          isActive: stage === currentStage,
          isLocked: !isUnlocked
        };
      });

      setLevels(levelData);
      
      // Debug pour comprendre les problèmes de navigation
      console.log('🔍 Debug LevelNavigation:', {
        currentStage,
        levelData,
        progressData,
        sessionsData
      });
    } catch (error) {
      console.error('Erreur lors du chargement des niveaux:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-white rounded-2xl shadow-lg p-4 ${className}`}>
        <div className="text-gray-500">Chargement des niveaux...</div>
      </div>
    );
  }

  const currentIndex = levels.findIndex(level => level.stage === currentStage);
  const currentLevel = levels[currentIndex];

  return (
    <div className={`bg-white rounded-2xl shadow-lg p-6 ${className}`}>
      {/* Menu de sélection des niveaux avec informations complètes du niveau actuel - Horizontal */}
      <div className="flex items-center justify-between gap-6 mb-6">
        {/* Ronds de sélection des niveaux */}
        <div className="flex gap-3">
          {levels.map((level) => {
            const canAccess = !level.isLocked;
            const isCurrentLevel = level.stage === currentStage;
            const isCompleted = level.stage === 'discovery'
              ? level.progress > 0
              : level.isCompleted;
            const levelLabel = level.stage === 'discovery' ? 'D' : level.stage.slice(-1);

            return (
              <div key={level.stage} className="relative group">
                <button
                  onClick={() => {
                    console.log('🖱️ Clic sur niveau:', level.stage, 'canAccess:', canAccess);
                    if (canAccess && onLevelSelect) {
                      console.log('✅ Appel onLevelSelect pour:', level.stage);
                      onLevelSelect(level.stage);
                    } else {
                      console.log('❌ Clic ignoré - canAccess:', canAccess, 'onLevelSelect:', !!onLevelSelect);
                    }
                  }}
                  disabled={!canAccess}
                  className={`
                    w-10 h-10 rounded-full border-2 flex items-center justify-center text-base font-bold shadow transition-all duration-200
                    ${isCurrentLevel
                      ? 'bg-purple-600 border-purple-600 text-white ring-4 ring-purple-200 scale-110'
                      : isCompleted
                        ? 'bg-green-500 border-green-500 text-white hover:bg-green-600 hover:border-green-600'
                        : canAccess
                          ? 'bg-gray-300 border-gray-300 text-gray-700 hover:bg-gray-400 hover:border-gray-400'
                          : 'bg-gray-200 border-gray-200 text-gray-500 cursor-not-allowed opacity-60'
                    }
                    hover:scale-105
                  `}
                  title={level.name}
                >
                  {levelLabel}
                </button>
                
                {/* Tooltip avec informations détaillées */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 bg-gray-900 text-white text-xs rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none min-w-max">
                  <div className="font-semibold mb-1">{level.name}</div>
                  <div className="opacity-80 mb-1">{level.description}</div>
                  <div className="opacity-60 mb-1">
                    Flash: {level.flashDuration >= 1000 ? `${level.flashDuration / 1000}s` : `${level.flashDuration}ms`}
                  </div>
                  <div className="opacity-60">
                    {level.stage === 'discovery' && level.progress > 0
                      ? 'Historique présent (100%)'
                      : isCompleted
                        ? 'Complété à 100%'
                        : level.isLocked
                          ? 'Verrouillé - Complétez le niveau précédent'
                          : isCurrentLevel
                            ? `Niveau actuel (${Math.round(level.progress)}%)`
                            : `Disponible (${Math.round(level.progress)}%)`
                    }
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Informations compactes du niveau actuel */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <h3 className="text-lg font-bold text-gray-800">
              {currentLevel?.name || 'Niveau inconnu'}
            </h3>
            <div className="text-sm text-gray-500">
              {phraseNumber && totalPhrases && (
                <span>Phrase {phraseNumber}/{totalPhrases} • </span>
              )}
              Flash: {currentLevel && (currentLevel.flashDuration >= 1000 ? `${currentLevel.flashDuration / 1000}s` : `${currentLevel.flashDuration}ms`)}
            </div>
          </div>
          
          {/* Barre de progression compacte */}
          {currentLevel && (
            <div className="flex flex-col items-center">
              <div className="w-24 bg-gray-200 rounded-full h-2 overflow-hidden mb-1 shadow-inner">
                <div
                  className={`h-full transition-all duration-300 ${currentLevel.color}`}
                  style={{ width: `${currentLevel.progress}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 font-medium">
                {Math.round(currentLevel.progress)}%
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Icône du niveau - Maintenant en dessous 
      <div className="text-center">
        <div className="text-5xl mb-3 drop-shadow">{currentLevel?.icon}</div>
        <h2 className="text-2xl font-extrabold text-gray-800 mb-2">
          {currentLevel?.name || 'Niveau inconnu'}
        </h2>
        <div className="text-base text-gray-600 mb-3">{currentLevel?.description}</div>
      </div>*/}
    </div>
  );
}