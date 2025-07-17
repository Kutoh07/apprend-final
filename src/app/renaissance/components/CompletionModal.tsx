// Modale de félicitations
// src/app/renaissance/components/CompletionModal.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { CircularProgress } from './ProgressBar';

export interface CompletionData {
  type: 'stage' | 'axe' | 'allAxes';
  title: string;
  subtitle?: string;
  stats: {
    accuracy: number;
    timeSpent: number; // en secondes
    attemptsCount: number;
    streakCount?: number;
  };
  achievements?: Achievement[];
  nextAction?: {
    label: string;
    action: () => void;
  };
  secondaryAction?: {
    label: string;
    action: () => void;
  };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: Date;
}

interface CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: CompletionData;
  autoCloseDelay?: number; // en millisecondes, 0 = pas d'auto-close
  showConfetti?: boolean;
}

export default function CompletionModal({
  isOpen,
  onClose,
  data,
  autoCloseDelay = 0,
  showConfetti = true
}: CompletionModalProps) {
  const [showAchievements, setShowAchievements] = useState(false);
  const [currentAchievementIndex, setCurrentAchievementIndex] = useState(0);

  // Auto-close après délai
  useEffect(() => {
    if (isOpen && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoCloseDelay, onClose]);

  // Animation des achievements
  useEffect(() => {
    if (isOpen && data.achievements && data.achievements.length > 0) {
      const timer = setTimeout(() => {
        setShowAchievements(true);
      }, 1500); // Attendre 1.5s avant de montrer les achievements

      return () => clearTimeout(timer);
    }
  }, [isOpen, data.achievements]);

  // Cycle des achievements
  useEffect(() => {
    if (showAchievements && data.achievements && data.achievements.length > 1) {
      const interval = setInterval(() => {
        setCurrentAchievementIndex(prev => 
          prev < data.achievements!.length - 1 ? prev + 1 : 0
        );
      }, 3000); // Changer toutes les 3 secondes

      return () => clearInterval(interval);
    }
  }, [showAchievements, data.achievements]);

  // Fermer avec Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getEmoji = () => {
    switch (data.type) {
      case 'stage': return '🎯';
      case 'axe': return '🏆';
      case 'allAxes': return '👑';
      default: return '🎉';
    }
  };

  const getGradient = () => {
    switch (data.type) {
      case 'stage': return 'from-blue-500 to-purple-500';
      case 'axe': return 'from-purple-500 to-pink-500';
      case 'allAxes': return 'from-yellow-400 via-pink-500 to-purple-600';
      default: return 'from-green-500 to-blue-500';
    }
  };

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'from-gray-400 to-gray-600';
      case 'rare': return 'from-blue-400 to-blue-600';
      case 'epic': return 'from-purple-400 to-purple-600';
      case 'legendary': return 'from-yellow-400 to-orange-500';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      {/* Effet confetti */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 50 }, (_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10px`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              {['🎉', '🎊', '✨', '🌟', '💫'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-pulse-slow">
        {/* Header avec gradient */}
        <div className={`bg-gradient-to-r ${getGradient()} p-8 text-white text-center relative overflow-hidden`}>
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <div className="text-8xl mb-4 animate-bounce">{getEmoji()}</div>
            <h1 className="text-3xl font-bold mb-2">{data.title}</h1>
            {data.subtitle && (
              <p className="text-xl opacity-90">{data.subtitle}</p>
            )}
          </div>

          {/* Bouton fermer */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl leading-none z-20"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        {/* Contenu principal */}
        <div className="p-8">
          {/* Statistiques */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="text-center">
              <div className="mb-3">
                <CircularProgress
                  progress={data.stats.accuracy}
                  size={80}
                  strokeWidth={8}
                  color={data.stats.accuracy >= 90 ? 'green' : data.stats.accuracy >= 70 ? 'blue' : 'orange'}
                />
              </div>
              <div className="text-sm font-semibold text-gray-700">Précision</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {formatTime(data.stats.timeSpent)}
              </div>
              <div className="text-sm font-semibold text-gray-700">Temps total</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {data.stats.attemptsCount}
              </div>
              <div className="text-sm font-semibold text-gray-700">Tentatives</div>
            </div>

            {data.stats.streakCount !== undefined && (
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {data.stats.streakCount}
                </div>
                <div className="text-sm font-semibold text-gray-700">Série</div>
              </div>
            )}
          </div>

          {/* Achievements */}
          {showAchievements && data.achievements && data.achievements.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">
                🏅 Nouveaux succès débloqués !
              </h3>
              
              <div className="relative">
                {data.achievements.map((achievement, index) => (
                  <div
                    key={achievement.id}
                    className={`
                      transition-all duration-500 transform
                      ${index === currentAchievementIndex 
                        ? 'opacity-100 scale-100 translate-y-0' 
                        : 'opacity-0 scale-95 translate-y-4 absolute inset-0'
                      }
                    `}
                  >
                    <div className={`bg-gradient-to-r ${getRarityColor(achievement.rarity)} rounded-2xl p-6 text-white`}>
                      <div className="flex items-center gap-4">
                        <div className="text-4xl">{achievement.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-bold text-lg mb-1">{achievement.title}</h4>
                          <p className="text-sm opacity-90">{achievement.description}</p>
                          <div className="text-xs opacity-75 mt-2 capitalize">
                            {achievement.rarity} • {achievement.unlockedAt.toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Indicateurs de pagination */}
                {data.achievements.length > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    {data.achievements.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentAchievementIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentAchievementIndex ? 'bg-purple-500' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Messages motivationnels selon le type */}
          <div className="text-center mb-8">
            {data.type === 'stage' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="text-blue-800">
                  <p className="font-semibold mb-2">Étape franchie avec succès !</p>
                  <p className="text-sm">Votre persévérance porte ses fruits. Continuez sur cette lancée !</p>
                </div>
              </div>
            )}

            {data.type === 'axe' && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                <div className="text-purple-800">
                  <p className="font-semibold mb-2">Axe de renaissance maîtrisé !</p>
                  <p className="text-sm">Vos nouvelles croyances sont maintenant bien ancrées. Vous avez fait un grand pas vers votre transformation !</p>
                </div>
              </div>
            )}

            {data.type === 'allAxes' && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-orange-200 rounded-xl p-6">
                <div className="text-orange-800">
                  <p className="font-semibold mb-2">🎊 Parcours Renaissance terminé ! 🎊</p>
                  <p className="text-sm">Félicitations ! Vous avez complété votre transformation personnelle. Vous êtes maintenant équipé(e) des outils mentaux pour réussir vos ambitions !</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            {data.secondaryAction && (
              <button
                onClick={data.secondaryAction.action}
                className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                {data.secondaryAction.label}
              </button>
            )}

            {data.nextAction && (
              <button
                onClick={data.nextAction.action}
                className={`flex-2 py-4 px-8 bg-gradient-to-r ${getGradient()} text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-xl`}
              >
                {data.nextAction.label}
              </button>
            )}

            {!data.nextAction && (
              <button
                onClick={onClose}
                className={`w-full py-4 px-8 bg-gradient-to-r ${getGradient()} text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-xl`}
              >
                Continuer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook pour gérer les achievements
export function useAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  const checkAchievements = (stats: CompletionData['stats'], type: CompletionData['type']) => {
    const newAchievements: Achievement[] = [];

    // Achievements basés sur la précision
    if (stats.accuracy === 100 && type === 'stage') {
      newAchievements.push({
        id: 'perfect_stage',
        title: 'Perfection',
        description: 'Réussite parfaite sur une étape',
        icon: '💎',
        rarity: 'rare',
        unlockedAt: new Date()
      });
    }

    if (stats.accuracy === 100 && type === 'axe') {
      newAchievements.push({
        id: 'perfect_axe',
        title: 'Maître de l\'axe',
        description: 'Axe complété avec une précision parfaite',
        icon: '🏆',
        rarity: 'epic',
        unlockedAt: new Date()
      });
    }

    // Achievements basés sur la vitesse
    if (stats.timeSpent < 60 && type === 'stage') {
      newAchievements.push({
        id: 'speed_demon',
        title: 'Éclair',
        description: 'Étape complétée en moins d\'une minute',
        icon: '⚡',
        rarity: 'rare',
        unlockedAt: new Date()
      });
    }

    // Achievements basés sur la persévérance
    if (stats.attemptsCount === 1 && stats.accuracy === 100) {
      newAchievements.push({
        id: 'first_try',
        title: 'Premier essai',
        description: 'Réussite parfaite du premier coup',
        icon: '🎯',
        rarity: 'epic',
        unlockedAt: new Date()
      });
    }

    // Achievement spécial pour la completion totale
    if (type === 'allAxes') {
      newAchievements.push({
        id: 'renaissance_master',
        title: 'Maître Renaissance',
        description: 'Tous les axes de renaissance maîtrisés',
        icon: '👑',
        rarity: 'legendary',
        unlockedAt: new Date()
      });
    }

    setAchievements(newAchievements);
    return newAchievements;
  };

  return { achievements, checkAchievements };
}

// Composant simplifié pour les mini-célébrations
interface MiniCompletionProps {
  message: string;
  emoji: string;
  onClose: () => void;
  duration?: number;
}

export function MiniCompletion({ 
  message, 
  emoji, 
  onClose, 
  duration = 2000 
}: MiniCompletionProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className="bg-white border-2 border-green-200 rounded-2xl shadow-lg p-4 flex items-center gap-3">
        <div className="text-2xl">{emoji}</div>
        <div className="text-green-800 font-medium">{message}</div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 ml-2"
        >
          ×
        </button>
      </div>
    </div>
  );
}