// Composant de jeu flash
// src/app/renaissance/components/FlashPhraseGame.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CircularProgress } from './ProgressBar';

export interface PhraseAttempt {
  userInput: string;
  isCorrect: boolean;
  timestamp: Date;
  flashDuration: number;
  differences?: TextDifference[];
  responseTime?: number;
}

export interface TextDifference {
  type: 'correct' | 'incorrect' | 'missing' | 'extra';
  text: string;
  position: number;
}

interface FlashPhraseGameProps {
  phrase: string;
  phraseNumber: number;
  totalPhrases: number;
  userInput: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  flashDuration: number;
  showResult: boolean;
  isShowingPhrase: boolean;
  result?: PhraseAttempt;
  stage?: string;
  isLoading?: boolean;
}

export default function FlashPhraseGame({
  phrase,
  phraseNumber,
  totalPhrases,
  userInput,
  onInputChange,
  onSubmit,
  flashDuration,
  showResult,
  isShowingPhrase,
  result,
  stage = 'discovery',
  isLoading = false
}: FlashPhraseGameProps) {
  const [countdown, setCountdown] = useState(3);
  const [showCountdown, setShowCountdown] = useState(false);
  const [flashTimeLeft, setFlashTimeLeft] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Démarrer le countdown avant d'afficher la phrase
  useEffect(() => {
    if (isShowingPhrase) {
      setShowCountdown(true);
      setCountdown(3);
      
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            setShowCountdown(false);
            startFlashTimer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [isShowingPhrase]);

  const startFlashTimer = () => {
    setFlashTimeLeft(flashDuration);
    
    const interval = setInterval(() => {
      setFlashTimeLeft(prev => {
        if (prev <= 100) {
          clearInterval(interval);
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  };

  // Focus automatique sur l'input quand on attend la saisie
  useEffect(() => {
    if (!isShowingPhrase && !showResult && !showCountdown && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isShowingPhrase, showResult, showCountdown]);

  // Gestion des raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.ctrlKey && !isShowingPhrase && !showCountdown) {
        e.preventDefault();
        onSubmit();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isShowingPhrase, showCountdown, onSubmit]);

  const getStageLabel = () => {
    switch (stage) {
      case 'discovery': return 'Découverte';
      case 'level1': return 'Encrage Niveau 1';
      case 'level2': return 'Encrage Niveau 2';
      case 'level3': return 'Encrage Niveau 3';
      default: return 'Entraînement';
    }
  };

  const getFlashDurationLabel = () => {
    if (flashDuration >= 1000) {
      return `${flashDuration / 1000}s`;
    }
    return `${flashDuration}ms`;
  };

  // Rendu du countdown
  if (showCountdown) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center">
          <div className="bg-white rounded-3xl shadow-xl p-12">
            <div className="text-6xl mb-8">⚡</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {getStageLabel()}
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Phrase {phraseNumber}/{totalPhrases} • Flash {getFlashDurationLabel()}
            </p>
            <div className="text-8xl font-bold text-purple-600 mb-4">
              {countdown}
            </div>
            <p className="text-gray-500">Préparez-vous...</p>
          </div>
        </div>
      </div>
    );
  }

  // Rendu de l'affichage de la phrase
  if (isShowingPhrase) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full text-center">
          <div className="bg-white rounded-3xl shadow-xl p-12">
            {/* Timer circulaire */}
            <div className="mb-8 flex justify-center">
              <CircularProgress
                progress={(flashTimeLeft / flashDuration) * 100}
                size={80}
                color="purple"
                showPercentage={false}
              >
                <div className="text-sm font-bold text-purple-600">
                  {Math.ceil(flashTimeLeft / 1000)}s
                </div>
              </CircularProgress>
            </div>

            <h2 className="text-2xl font-bold text-purple-600 mb-8">
              Mémorisez cette phrase
            </h2>
            
            {/* Phrase à mémoriser */}
            <div className="text-3xl font-medium text-gray-800 mb-8 p-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200 leading-relaxed">
              {phrase}
            </div>

            {/* Progression */}
            <div className="flex justify-center items-center gap-4 text-gray-500">
              <span className="text-sm">Phrase {phraseNumber}/{totalPhrases}</span>
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <span className="text-sm">{getStageLabel()}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Rendu des résultats
  if (showResult && result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center p-4">
        <div className="max-w-3xl w-full">
          <div className="bg-white rounded-3xl shadow-xl p-8">
            {/* Header résultat */}
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">
                {result.isCorrect ? '✅' : '❌'}
              </div>
              <h2 className="text-3xl font-bold mb-2">
                {result.isCorrect ? (
                  <span className="text-green-600">Excellent !</span>
                ) : (
                  <span className="text-red-600">Pas tout à fait...</span>
                )}
              </h2>
              <p className="text-gray-600">
                Phrase {phraseNumber}/{totalPhrases} • {getStageLabel()}
              </p>
            </div>

            {/* Comparaison des réponses */}
            <div className="space-y-6 mb-8">
              {/* Phrase attendue */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phrase attendue :
                </label>
                <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                  <div className="text-lg text-green-800 font-medium">{phrase}</div>
                </div>
              </div>

              {/* Votre réponse */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Votre réponse :
                </label>
                <div className={`p-4 rounded-xl border-2 ${result.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className={`text-lg font-medium ${result.isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                    {result.userInput || '(Aucune réponse)'}
                  </div>
                </div>
              </div>

              {/* Analyse des différences */}
              {!result.isCorrect && result.differences && result.differences.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Analyse des erreurs :
                  </label>
                  <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                    <div className="space-y-2">
                      {result.differences.map((diff, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <span className="flex-shrink-0">
                            {diff.type === 'missing' && '➕'}
                            {diff.type === 'extra' && '➖'}
                            {diff.type === 'incorrect' && '🔄'}
                          </span>
                          <span className="text-yellow-800">
                            {diff.type === 'missing' && `Mot manquant: "${diff.text}"`}
                            {diff.type === 'extra' && `Mot en trop: "${diff.text}"`}
                            {diff.type === 'incorrect' && `Mot incorrect: "${diff.text}"`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Temps de réponse */}
              {result.responseTime && (
                <div className="text-center">
                  <span className="text-sm text-gray-500">
                    Temps de réponse: {(result.responseTime / 1000).toFixed(1)}s
                  </span>
                </div>
              )}
            </div>

            {/* Action */}
            <div className="text-center">
              <button
                onClick={onSubmit}
                disabled={isLoading}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-4 px-8 rounded-xl transition-colors text-lg inline-flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Chargement...</span>
                  </>
                ) : phraseNumber < totalPhrases ? (
                  <>
                    <span>➡️</span>
                    <span>Phrase suivante</span>
                  </>
                ) : (
                  <>
                    <span>🎉</span>
                    <span>Terminer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Rendu de la saisie utilisateur
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">💭</div>
            <h2 className="text-2xl font-bold text-purple-600 mb-2">
              Retapez la phrase
            </h2>
            <p className="text-gray-600">
              Phrase {phraseNumber}/{totalPhrases} • {getStageLabel()}
            </p>
          </div>

          {/* Zone de saisie */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Tapez la phrase que vous avez vue :
            </label>
            <textarea
              ref={inputRef}
              value={userInput}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder="Commencez à taper ici..."
              className="w-full h-32 p-4 text-lg border-2 border-purple-200 rounded-xl resize-none focus:border-purple-500 focus:outline-none transition-colors"
              disabled={isLoading}
            />
            
            {/* Conseils */}
            <div className="mt-3 text-sm text-gray-500">
              💡 <strong>Conseil :</strong> Prenez votre temps et tapez ce dont vous vous souvenez. 
              Utilisez Ctrl+Entrée pour valider rapidement.
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={() => onInputChange('')}
              disabled={!userInput || isLoading}
              className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🗑️ Effacer
            </button>
            <button
              onClick={onSubmit}
              disabled={!userInput.trim() || isLoading}
              className="flex-2 py-3 px-8 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold rounded-xl transition-colors inline-flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Validation...</span>
                </>
              ) : (
                <>
                  <span>✅</span>
                  <span>Valider ma réponse</span>
                </>
              )}
            </button>
          </div>

          {/* Raccourci clavier */}
          <div className="mt-4 text-center text-xs text-gray-400">
            Raccourci: Ctrl + Entrée pour valider
          </div>
        </div>
      </div>
    </div>
  );
}