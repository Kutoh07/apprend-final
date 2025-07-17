// Affichage des résultats
// src/app/renaissance/components/ResultDisplay.tsx

'use client';

import React from 'react';
import { CircularProgress } from './ProgressBar';

export interface GameResults {
  totalPhrases: number;
  correctAnswers: number;
  accuracy: number;
  attempts: PhraseAttempt[];
  timeSpent: number; // en millisecondes
  averageResponseTime: number;
  stage: string;
  level?: string;
}

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

interface ResultDisplayProps {
  results: GameResults;
  onContinue: () => void;
  onRestart?: () => void;
  onBackToAxe?: () => void;
  showDetailedAnalysis?: boolean;
  isLoading?: boolean;
}

export default function ResultDisplay({
  results,
  onContinue,
  onRestart,
  onBackToAxe,
  showDetailedAnalysis = true,
  isLoading = false
}: ResultDisplayProps) {
  const getStageLabel = () => {
    switch (results.stage) {
      case 'discovery': return 'Découverte';
      case 'level1': return 'Encrage Niveau 1';
      case 'level2': return 'Encrage Niveau 2';
      case 'level3': return 'Encrage Niveau 3';
      default: return 'Entraînement';
    }
  };

  const getPerformanceMessage = () => {
    if (results.accuracy >= 90) {
      return {
        emoji: '🌟',
        title: 'Performance exceptionnelle !',
        message: 'Vous maîtrisez parfaitement cet exercice.',
        color: 'text-green-600'
      };
    } else if (results.accuracy >= 70) {
      return {
        emoji: '👏',
        title: 'Très bon travail !',
        message: 'Vous progressez bien, continuez ainsi.',
        color: 'text-blue-600'
      };
    } else if (results.accuracy >= 50) {
      return {
        emoji: '💪',
        title: 'Bon effort !',
        message: 'Vous êtes sur la bonne voie, persévérez.',
        color: 'text-orange-600'
      };
    } else {
      return {
        emoji: '🎯',
        title: 'Continuez à vous entraîner !',
        message: 'La pratique rend parfait, ne vous découragez pas.',
        color: 'text-purple-600'
      };
    }
  };

  const performance = getPerformanceMessage();
  const timeInSeconds = Math.round(results.timeSpent / 1000);
  const avgResponseTime = Math.round(results.averageResponseTime / 1000 * 10) / 10;

  const incorrectAttempts = results.attempts.filter(a => !a.isCorrect);
  const fastestResponse = Math.min(...results.attempts.map(a => a.responseTime || 0).filter(t => t > 0));
  const slowestResponse = Math.max(...results.attempts.map(a => a.responseTime || 0));

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Header avec résultats principaux */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-8 text-center">
            <div className="text-6xl mb-4">{performance.emoji}</div>
            <h1 className="text-3xl font-bold mb-2">{performance.title}</h1>
            <p className="text-purple-100 text-lg mb-4">{performance.message}</p>
            <div className="text-sm text-purple-200">
              {getStageLabel()} • {results.totalPhrases} phrases
            </div>
          </div>

          {/* Statistiques principales */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Précision */}
              <div className="text-center">
                <div className="mb-4">
                  <CircularProgress
                    progress={results.accuracy}
                    size={100}
                    strokeWidth={10}
                    color={results.accuracy >= 70 ? 'green' : results.accuracy >= 50 ? 'orange' : 'red'}
                  />
                </div>
                <h3 className="font-semibold text-gray-800 text-lg">Précision</h3>
                <p className="text-gray-600">{results.correctAnswers}/{results.totalPhrases} phrases correctes</p>
              </div>

              {/* Temps total */}
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {timeInSeconds}s
                </div>
                <h3 className="font-semibold text-gray-800 text-lg">Temps total</h3>
                <p className="text-gray-600">Session complète</p>
              </div>

              {/* Temps moyen */}
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-600 mb-2">
                  {avgResponseTime}s
                </div>
                <h3 className="font-semibold text-gray-800 text-lg">Temps moyen</h3>
                <p className="text-gray-600">Par phrase</p>
              </div>
            </div>

            {/* Analyse détaillée */}
            {showDetailedAnalysis && (
              <div className="space-y-6 mb-8">
                {/* Répartition des résultats */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Analyse des résultats</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{results.correctAnswers}</div>
                      <div className="text-sm text-green-700">Correctes</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">{incorrectAttempts.length}</div>
                      <div className="text-sm text-red-700">Incorrectes</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{(fastestResponse / 1000).toFixed(1)}s</div>
                      <div className="text-sm text-blue-700">Plus rapide</div>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600">{(slowestResponse / 1000).toFixed(1)}s</div>
                      <div className="text-sm text-orange-700">Plus lente</div>
                    </div>
                  </div>
                </div>

                {/* Liste des erreurs */}
                {incorrectAttempts.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">❌ Phrases à retravailler</h3>
                    <div className="space-y-3">
                      {incorrectAttempts.map((attempt, index) => (
                        <div key={index} className="bg-red-50 border border-red-200 rounded-xl p-4">
                          <div className="mb-2">
                            <span className="text-sm font-medium text-red-700">
                              Phrase {results.attempts.indexOf(attempt) + 1} :
                            </span>
                          </div>
                          <div className="text-sm text-red-800 mb-1">
                            <strong>Votre réponse :</strong> "{attempt.userInput}"
                          </div>
                          {attempt.differences && attempt.differences.length > 0 && (
                            <div className="text-xs text-red-600">
                              <strong>Erreurs :</strong> {attempt.differences.map(diff => {
                                switch (diff.type) {
                                  case 'missing': return `Mot manquant: "${diff.text}"`;
                                  case 'extra': return `Mot en trop: "${diff.text}"`;
                                  case 'incorrect': return `Mot incorrect: "${diff.text}"`;
                                  default: return '';
                                }
                              }).join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conseils d'amélioration */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3">💡 Conseils pour progresser</h3>
                  <div className="space-y-2 text-sm text-blue-700">
                    {results.accuracy < 50 && (
                      <p>• Concentrez-vous sur les mots-clés de chaque phrase</p>
                    )}
                    {avgResponseTime > 30 && (
                      <p>• Essayez de répondre plus rapidement pour améliorer la fluidité</p>
                    )}
                    {incorrectAttempts.length > results.totalPhrases / 2 && (
                      <p>• Relisez attentivement les phrases avant de recommencer</p>
                    )}
                    {results.accuracy >= 70 && (
                      <p>• Excellente performance ! Vous pouvez passer au niveau suivant</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              {onRestart && (
                <button
                  onClick={onRestart}
                  disabled={isLoading}
                  className="flex-1 py-3 px-6 border-2 border-purple-300 text-purple-700 rounded-xl hover:bg-purple-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span>🔄</span>
                  <span>Recommencer</span>
                </button>
              )}

              {onBackToAxe && (
                <button
                  onClick={onBackToAxe}
                  disabled={isLoading}
                  className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span>↩️</span>
                  <span>Retour à l'axe</span>
                </button>
              )}

              <button
                onClick={onContinue}
                disabled={isLoading}
                className="flex-2 py-4 px-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Chargement...</span>
                  </>
                ) : results.stage === 'level3' ? (
                  <>
                    <span>🎉</span>
                    <span>Axe terminé !</span>
                  </>
                ) : (
                  <>
                    <span>➡️</span>
                    <span>Continuer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}