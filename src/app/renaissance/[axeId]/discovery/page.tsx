// Étape découverte (flash 0.5s) - ERREURS CORRIGÉES
// src/app/renaissance/[axeId]/discovery/page.tsx

'use client';

import React, { useState, useEffect, use } from 'react';
import AttemptHistory from '../components/AttemptHistory';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import FlashPhraseGame from '../../components/FlashPhraseGame';
import { quickCompare } from '@/lib/utils/stringComparison';
import type { GameSession, PhraseAttempt, RenaissancePhrase } from '@/lib/types/renaissance';
import { renaissanceService } from '@/lib/services/renaissanceService';

interface DiscoveryState {
  gameSession: GameSession | null;
  phrases: RenaissancePhrase[];
  userInput: string;
  isShowingPhrase: boolean;
  showResult: boolean;
  lastResult: PhraseAttempt | null;
  isLoading: boolean;
}

export default function DiscoveryPage({ params }: { params: Promise<{ axeId: string }> }) {
  const router = useRouter();
  const { axeId } = use(params);
  
  const [state, setState] = useState<DiscoveryState>({
    gameSession: null,
    phrases: [],
    userInput: '',
    isShowingPhrase: false,
    showResult: false,
    lastResult: null,
    isLoading: true
  });

  const [userId, setUserId] = useState<string | null>(null);
  const [axeName, setAxeName] = useState('');
  // ✅ AJOUT: Variables pour tracker le temps
  const [phraseStartTime, setPhraseStartTime] = useState<number>(0);
  // ✅ CORRECTION: Ajout de la variable manquante hasStartedPlaying
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  // ✅ AJOUT: État de progression pour déterminer le prochain niveau
  const [isDiscoveryCompleted, setIsDiscoveryCompleted] = useState(false);
  const [nextEncrageLevel, setNextEncrageLevel] = useState<string>('level1');

  useEffect(() => {
    initializeDiscovery();
  }, [axeId]);

  // ✅ AJOUT: Effet pour vérifier périodiquement la progression
  useEffect(() => {
    if (userId) {
      const checkInterval = setInterval(() => {
        checkProgressionStatus(userId);
      }, 5000); // Vérifier toutes les 5 secondes

      return () => clearInterval(checkInterval);
    }
  }, [userId, axeId]);

  const initializeDiscovery = async () => {
    try {
      // Vérifier l'authentification
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        router.push('/auth');
        return;
      }

      setUserId(session.user.id);

      // Charger l'axe avec ses phrases
      const axeData = await renaissanceService.getAxeWithPhrases(axeId);
      if (!axeData) {
        router.push('/renaissance');
        return;
      }

      setAxeName(axeData.name);

      // Vérifier la sélection utilisateur
      const { data: selectionData, error: selectionError } = await supabase
        .from('user_renaissance_selection')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('axe_id', axeId)
        .single();

      if (selectionError || !selectionData) {
        router.push('/renaissance/selection');
        return;
      }

      // Préparer les phrases (personnalisées ou par défaut)
      const phrasesToUse = selectionData.custom_phrases && selectionData.custom_phrases.length > 0
        ? selectionData.custom_phrases.map((phrase: string, index: number) => ({
            id: `custom_${index}`,
            axeId: axeId,
            phraseNumber: index + 1,
            content: phrase
          }))
        : axeData.phrases || [];

      if (phrasesToUse.length === 0) {
        console.error('Aucune phrase trouvée');
        return;
      }

      // Chercher une session active existante ou en créer une nouvelle
      let gameSession = await renaissanceService.getActiveSession(session.user.id, axeId, 'discovery');
      
      if (!gameSession) {
        gameSession = await renaissanceService.createGameSession(
          session.user.id,
          axeId,
          'discovery',
          phrasesToUse.length
        );
      }

      setState(prev => ({
        ...prev,
        gameSession,
        phrases: phrasesToUse,
        isLoading: false
      }));

      // ✅ AJOUT: Vérifier la progression de la découverte et de l'encrage
      await checkProgressionStatus(session.user.id);

    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // ✅ AJOUT: Fonction pour vérifier la progression et déterminer le prochain niveau
  const checkProgressionStatus = async (currentUserId: string) => {
    try {
      // Vérifier si la découverte est complétée
      const { data: progressData } = await supabase
        .from('user_renaissance_progress')
        .select('stage, stage_completed')
        .eq('user_id', currentUserId)
        .eq('axe_id', axeId);

      // Vérifier aussi les sessions complétées
      const { data: sessionsData } = await supabase
        .from('renaissance_game_sessions')
        .select('stage, session_accuracy, is_completed')
        .eq('user_id', currentUserId)
        .eq('axe_id', axeId);

      // ✅ CORRECTION: Vérifier si discovery est complétée OU s'il y a un historique de tentatives
      const discoveryCompleted = progressData?.some(p => p.stage === 'discovery' && p.stage_completed) ||
                                sessionsData?.some(s => s.stage === 'discovery' && s.session_accuracy === 100) ||
                                sessionsData?.some(s => s.stage === 'discovery' && s.is_completed);

      console.log('🔍 Discovery completion check:', {
        progressData,
        sessionsData,
        discoveryCompleted
      });

      setIsDiscoveryCompleted(discoveryCompleted || false);

      // Déterminer le prochain niveau d'encrage
      let nextLevel = 'level1'; // Par défaut

      if (discoveryCompleted) {
        // Vérifier quels niveaux d'encrage sont complétés
        const level1Completed = progressData?.some(p => p.stage === 'level1' && p.stage_completed) ||
                               sessionsData?.some(s => s.stage === 'level1' && s.session_accuracy === 100);
        const level2Completed = progressData?.some(p => p.stage === 'level2' && p.stage_completed) ||
                               sessionsData?.some(s => s.stage === 'level2' && s.session_accuracy === 100);
        const level3Completed = progressData?.some(p => p.stage === 'level3' && p.stage_completed) ||
                               sessionsData?.some(s => s.stage === 'level3' && s.session_accuracy === 100);

        // Déterminer le prochain niveau à faire
        if (level3Completed) {
          nextLevel = 'level3'; // Dernier niveau, rester là
        } else if (level2Completed) {
          nextLevel = 'level3'; // Aller au niveau 3
        } else if (level1Completed) {
          nextLevel = 'level2'; // Aller au niveau 2
        } else {
          nextLevel = 'level1'; // Commencer par le niveau 1
        }
      }

      setNextEncrageLevel(nextLevel);
    } catch (error) {
      console.error('Erreur lors de la vérification de progression:', error);
    }
  };

  const handleGoToEncrage = () => {
    router.push(`/renaissance/${axeId}/encrage?level=${nextEncrageLevel}`);
  };

  // ✅ CORRECTION: Fonction séparée pour démarrer le flash
  const startFlashSequence = () => {
    setHasStartedPlaying(true); // ✅ Marquer qu'on a commencé à jouer
    setPhraseStartTime(Date.now()); // ✅ Commencer le timer pour cette phrase
    setState(prev => ({
      ...prev,
      userInput: '',
      isShowingPhrase: true,
      showResult: false,
      lastResult: null
    }));
    
    // ✅ CORRECTION: Timer pour masquer la phrase SEULEMENT (pas de retour à l'accueil)
    const totalFlashTime = 3000 + 500; // 3s countdown + 500ms flash
    setTimeout(() => {
      setState(prev => ({ 
        ...prev, 
        isShowingPhrase: false 
        // ✅ On ne remet PAS à l'état initial, juste on cache la phrase
      }));
    }, totalFlashTime);
  };

  const startGame = () => {
    if (!state.gameSession || state.phrases.length === 0) return;
    startFlashSequence();
  };

  const handlePhraseSubmit = async () => {
    if (!state.gameSession) return;

    if (state.showResult) {
      // Passer à la phrase suivante ou terminer
      const nextIndex = state.gameSession.currentPhraseIndex + 1;
      
      if (nextIndex < state.phrases.length) {
        // Mettre à jour l'index et redémarrer la séquence
        setState(prev => ({
          ...prev,
          gameSession: prev.gameSession ? {
            ...prev.gameSession,
            currentPhraseIndex: nextIndex
          } : null
        }));
        
        // ✅ CORRECTION: Redémarrer la séquence flash après une petite pause
        setTimeout(() => {
          startFlashSequence();
        }, 500);
      } else {
        // Fin de la découverte - compléter la session
        await completeDiscovery();
      }
      return;
    }

    if (!state.userInput.trim()) return;
    
    // Obtenir la phrase actuelle selon l'ordre de la session
    const phraseIndex = state.gameSession.phrasesOrder[state.gameSession.currentPhraseIndex];
    const currentPhrase = state.phrases[phraseIndex];
    
    // Vérifier la réponse
    const comparison = quickCompare(state.userInput.trim(), currentPhrase.content);
    const responseTime = phraseStartTime > 0 ? Date.now() - phraseStartTime : 0;
    
    const attempt: PhraseAttempt = {
      userInput: state.userInput.trim(),
      isCorrect: comparison.isCorrect,
      timestamp: new Date(),
      flashDuration: state.gameSession.flashDurationMs,
      differences: comparison.differences,
      expectedText: currentPhrase.content, // ✅ AJOUT: Phrase attendue pour affichage
      responseTime // ✅ AJOUT: Temps de réponse calculé
    };

    try {
      // Enregistrer la tentative avec la nouvelle méthode
      await renaissanceService.recordAttempt(
        state.gameSession.id,
        currentPhrase.id,
        state.gameSession.currentPhraseIndex + 1,
        attempt
      );

      // ✅ AJOUT: Mettre à jour les stats de session immédiatement
      await renaissanceService.updateSessionProgress(
        state.gameSession.id,
        state.gameSession.currentPhraseIndex + 1,
        attempt.isCorrect
      );

      setState(prev => ({
        ...prev,
        lastResult: attempt,
        showResult: true
      }));

    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      // Continuer quand même pour ne pas bloquer l'utilisateur
      setState(prev => ({
        ...prev,
        lastResult: attempt,
        showResult: true
      }));
    }
  };

  const completeDiscovery = async () => {
    if (!state.gameSession || !userId) return;

    try {
      console.log('🏁 Début completion découverte');
      
      // 1. Marquer la session comme complétée
      await renaissanceService.completeSession(state.gameSession.id);
      console.log('✅ Session marquée complétée');
      
      // 2. ✅ CORRECTION: Utiliser updateUserProgressLegacy directement
      try {
        await supabase
          .from('user_renaissance_progress')
          .upsert({
            user_id: userId,
            axe_id: axeId,
            stage: 'discovery',
            stage_completed: true,
            stage_completed_at: new Date().toISOString(),
            last_attempt_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,axe_id,stage'
          });
        console.log('✅ Stage discovery marqué complété (direct)');
      } catch (progressError) {
        console.error('⚠️ Erreur mise à jour progress (non bloquant):', progressError);
      }
      
      // 3. Marquer l'axe comme démarré si pas déjà fait
      try {
        await supabase
          .from('user_renaissance_selection')
          .update({
            is_started: true,
            started_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('axe_id', axeId);
        console.log('✅ Axe marqué comme démarré');
      } catch (selectionError) {
        console.error('⚠️ Erreur mise à jour sélection (non bloquant):', selectionError);
      }
      
      // 4. Attendre un peu pour que les triggers se déclenchent
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // ✅ AJOUT: Reverifier la progression pour mettre à jour le bouton
      await checkProgressionStatus(userId);
      
      // 5. Rediriger vers l'encrage niveau 1
      console.log('🚀 Redirection vers encrage niveau 1');
      router.push(`/renaissance/${axeId}/encrage?level=level1`);
      
    } catch (error) {
      console.error('❌ Erreur lors de la completion:', error);
      // En cas d'erreur, rediriger quand même vers l'axe
      router.push(`/renaissance/${axeId}`);
    }
  };

  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔄</div>
          <div className="text-xl text-purple-600">Préparation de la découverte...</div>
        </div>
      </div>
    );
  }

  if (!state.gameSession || state.phrases.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <div className="text-xl text-red-600">Impossible de charger la session</div>
          <button
            onClick={() => router.push(`/renaissance/${axeId}`)}
            className="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-xl transition-colors"
          >
            Retour à l'axe
          </button>
        </div>
      </div>
    );
  }

  // ✅ CORRECTION: Condition pour l'écran d'accueil plus précise
  const shouldShowWelcome = !hasStartedPlaying && 
                           !state.isShowingPhrase && 
                           !state.showResult;

  // Écran d'accueil si pas encore commencé
  if (shouldShowWelcome) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="max-w-2xl w-full text-center">
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <div className="text-6xl mb-6">🧠</div>
            <h1 className="text-3xl font-bold text-purple-600 mb-4">
              {axeName} - Découverte
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Vous allez voir {state.phrases.length} phrases s'afficher pendant 0.5 seconde chacune.
              Votre objectif est de les retaper le plus fidèlement possible.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-3">
                <div className="text-2xl">💡</div>
                <div className="text-left">
                  <h3 className="font-bold text-blue-800 mb-2">Session de découverte</h3>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• Flash de {state.gameSession.flashDurationMs}ms par phrase</li>
                    <li>• Ordre mélangé pour optimiser l'apprentissage</li>
                    <li>• Progression sauvegardée automatiquement</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="font-semibold text-purple-800">Phrases</div>
                <div className="text-purple-600">{state.phrases.length}</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="font-semibold text-blue-800">Flash</div>
                <div className="text-blue-600">{state.gameSession.flashDurationMs}ms</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="font-semibold text-green-800">Progrès</div>
                <div className="text-green-600">{state.gameSession.currentPhraseIndex + 1}/{state.phrases.length}</div>
              </div>
            </div>
            <div className="flex flex-row gap-4 justify-center items-center">
              <button
                onClick={startGame}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-8 rounded-xl text-xs transition-colors"
              >
                {state.gameSession.totalAttempts > 0 ? 'Continuer la découverte' : 'Commencer la découverte'}
              </button>
              
              {/* ✅ AJOUT: Bouton pour aller à l'encrage si découverte complétée */}
              {isDiscoveryCompleted && (
                <button
                  onClick={handleGoToEncrage}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-8 rounded-xl text-xs transition-colors flex items-center gap-2"
                >
                  <span>⚡</span>
                  <span>Aller à l'encrage</span>
                </button>
              )}
              
              <button
                onClick={() => router.push(`/renaissance/${axeId}`)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-4 px-8 rounded-xl text-xs transition-colors flex items-center gap-2 border border-gray-300"
              >
                <span>🏃‍♂️</span>
                <span>Retour à l'axe</span>
              </button>
            </div>
            
              {/* Historique des tentatives - affiché comme dans encrage/page.tsx */}
              <div className="mt-8">
                <AttemptHistory 
                  axeId={axeId} 
                  userId={userId} 
                  level="discovery"
                />
              </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ JEU EN COURS: FlashPhraseGame gère maintenant tout correctement
  const phraseIndex = state.gameSession.phrasesOrder[state.gameSession.currentPhraseIndex];
  const currentPhrase = state.phrases[phraseIndex];

  return (
    <FlashPhraseGame
      phrase={currentPhrase.content}
      userInput={state.userInput}
      onInputChange={(value) => setState(prev => ({ ...prev, userInput: value }))}
      onSubmit={handlePhraseSubmit}
      flashDuration={state.gameSession.flashDurationMs}
      showResult={state.showResult}
      isShowingPhrase={state.isShowingPhrase}
      result={state.lastResult ?? undefined}
      phraseNumber={state.gameSession.currentPhraseIndex + 1}
      totalPhrases={state.phrases.length}
      stage="discovery"
      isLoading={false}
    />
  );
}