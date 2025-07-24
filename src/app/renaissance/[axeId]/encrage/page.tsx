// Étape encrage (niveaux 1-3) - ERREURS TYPESCRIPT CORRIGÉES
// src/app/renaissance/[axeId]/encrage/page.tsx

'use client';

import React, { useState, useEffect, use } from 'react';
import AttemptHistory from '../components/AttemptHistory';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import { renaissanceService } from '../../../../lib/services/renaissanceService';
import FlashPhraseGame from '../../components/FlashPhraseGame';
import ResultDisplay, { GameResults } from '../../components/ResultDisplay';
import { LevelNavigation } from '../../components/LevelIndicator';
import type {  
  GameSession,
  PhraseAttempt, 
  RenaissancePhrase 
} from '../../../../lib/types/renaissance';

// Types pour la page d'encrage
interface EncrageLevel {
  stage: 'level1' | 'level2' | 'level3';
  name: string;
  description: string;
  flashDuration: number;
  icon: string;
  color: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  progress: number;
}

interface EncrageState {
  currentLevel: EncrageLevel | null;
  phrases: RenaissancePhrase[];
  gameSession: GameSession | null;
  userInput: string;
  isShowingPhrase: boolean;
  showResult: boolean;
  attempts: PhraseAttempt[];
  lastResult: PhraseAttempt | null;
  showFinalResults: boolean;
  finalResults: GameResults | null;
  sessionStartTime: number;
}

export default function EncragePage({ params }: { params: Promise<{ axeId: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { axeId } = use(params);
  const level = searchParams.get('level') as 'level1' | 'level2' | 'level3' || 'level1';

  const [state, setState] = useState<EncrageState>({
    currentLevel: null,
    phrases: [],
    gameSession: null,
    userInput: '',
    isShowingPhrase: false,
    showResult: false,
    attempts: [],
    lastResult: null,
    showFinalResults: false,
    finalResults: null,
    sessionStartTime: Date.now()
  });

  // State pour l'affichage conditionnel de l'historique des tentatives
  const [showAttemptHistory, setShowAttemptHistory] = useState(true);

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [axeName, setAxeName] = useState('');
  const [allLevels, setAllLevels] = useState<EncrageLevel[]>([]);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const [phraseStartTime, setPhraseStartTime] = useState<number>(0); // ✅ AJOUT: Timer pour temps de réponse

  // Configuration des niveaux d'encrage
  const ENCRAGE_LEVELS: Record<string, Omit<EncrageLevel, 'isUnlocked' | 'isCompleted' | 'progress'>> = {
    level1: {
      stage: 'level1',
      name: 'Niveau 1',
      description: 'Flash de 3 secondes par phrase',
      flashDuration: 3000,
      icon: '⚡',
      color: 'bg-blue-500'
    },
    level2: {
      stage: 'level2',
      name: 'Niveau 2', 
      description: 'Flash de 1.5 secondes par phrase',
      flashDuration: 1500,
      icon: '⚡⚡',
      color: 'bg-orange-500'
    },
    level3: {
      stage: 'level3',
      name: 'Niveau 3',
      description: 'Flash de 0.5 secondes par phrase',
      flashDuration: 500,
      icon: '⚡⚡⚡',
      color: 'bg-red-500'
    }
  };

  useEffect(() => {
    loadEncrageData();
  }, [axeId, level]);

  const loadEncrageData = async () => {
    try {
      setLoading(true);

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

      // Vérifier si l'utilisateur a sélectionné cet axe
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

      // Utiliser les phrases personnalisées si disponibles
      const phrasesToUse = selectionData.custom_phrases && selectionData.custom_phrases.length > 0
        ? selectionData.custom_phrases.map((phrase: string, index: number) => ({
            id: `custom_${index}`,
            axeId: axeId,
            phraseNumber: index + 1,
            content: phrase
          }))
        : axeData.phrases || [];


      // ✅ CORRECTION: Charger les progrès depuis les SESSIONS ET legacy
      const [sessionsResult, progressResult] = await Promise.allSettled([
        // Sessions modernes
        supabase
          .from('renaissance_game_sessions')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('axe_id', axeId),
        // Progress legacy
        supabase
          .from('user_renaissance_progress')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('axe_id', axeId)
      ]);

      // Typage explicite pour éviter any[]
      type SessionProgress = {
        stage: string;
        is_completed?: boolean;
        completed_at?: string;
      };
      type LegacyProgress = {
        stage: string;
        stage_completed?: boolean;
        stage_completed_at?: string;
      };
      let sessionsData: SessionProgress[] = [];
      let progressData: LegacyProgress[] = [];

      if (sessionsResult.status === 'fulfilled') {
        sessionsData = sessionsResult.value.data || [];
      }

      if (progressResult.status === 'fulfilled') {
        progressData = progressResult.value.data || [];
      }

      // ✅ CORRECTION: Combiner les progrès des sessions ET legacy
      const combinedProgress = ['discovery', 'level1', 'level2', 'level3'].map(stage => {
        // Vérifier dans les sessions modernes
        const completedSession = sessionsData.find(s => 
          s.stage === stage && s.is_completed === true
        );
        // Vérifier dans legacy
        const legacyStage = progressData.find(p => 
          p.stage === stage && p.stage_completed === true
        );
        const isCompleted = !!(completedSession || legacyStage);
        return {
          stage,
          stage_completed: isCompleted,
          stage_completed_at: completedSession?.completed_at || legacyStage?.stage_completed_at
        };
      });

      console.log('🔍 Progrès combinés:', combinedProgress);

      // Utiliser les progrès combinés
      progressData = combinedProgress;

      // ✅ CORRECTION: Construire les niveaux avec leurs états - VERSION HYBRIDE
      const levels: EncrageLevel[] = Object.entries(ENCRAGE_LEVELS).map(([key, levelConfig]) => {
        const levelProgress = progressData?.find(p => p.stage === key);
        // ✅ CORRECTION: Vérifier la découverte dans les sessions ET dans legacy
        const isDiscoveryCompleted = progressData?.some(p => p.stage === 'discovery' && p.stage_completed) || false;
        const isLevel1Completed = progressData?.some(p => p.stage === 'level1' && p.stage_completed) || false;
        const isLevel2Completed = progressData?.some(p => p.stage === 'level2' && p.stage_completed) || false;

        // ✅ AJOUT: Log pour déboguer
        console.log(`🔍 Vérification niveaux pour ${key}:`, {
          isDiscoveryCompleted,
          isLevel1Completed,
          isLevel2Completed,
          progressData: progressData?.map(p => ({ stage: p.stage, completed: p.stage_completed }))
        });

        let isUnlocked = false;
        if (key === 'level1') {
          isUnlocked = isDiscoveryCompleted;
          console.log(`🔓 Level1 unlock check: discovery=${isDiscoveryCompleted} → unlocked=${isUnlocked}`);
        }
        if (key === 'level2') {
          isUnlocked = isLevel1Completed;
          console.log(`🔓 Level2 unlock check: level1=${isLevel1Completed} → unlocked=${isUnlocked}`);
        }
        if (key === 'level3') {
          isUnlocked = isLevel2Completed;
          console.log(`🔓 Level3 unlock check: level2=${isLevel2Completed} → unlocked=${isUnlocked}`);
        }

        return {
          ...levelConfig,
          isUnlocked,
          isCompleted: levelProgress?.stage_completed || false,
          progress: levelProgress?.stage_completed ? 100 : 0
        };
      });

      setAllLevels(levels);

      // Vérifier que le niveau demandé est débloqué
      const currentLevel = levels.find(l => l.stage === level);
      if (!currentLevel?.isUnlocked) {
        router.push(`/renaissance/${axeId}`);
        return;
      }

      // Chercher une session active ou en créer une nouvelle
      let gameSession = await renaissanceService.getActiveSession(session.user.id, axeId, level);
      
      if (!gameSession) {
        gameSession = await renaissanceService.createGameSession(
          session.user.id,
          axeId,
          level,
          phrasesToUse.length
        );
      }

      setState(prev => ({
        ...prev,
        currentLevel,
        phrases: phrasesToUse,
        gameSession,
        sessionStartTime: Date.now()
      }));

      // ✅ AJOUT: Vérifier s'il y a des tentatives précédentes pour ce niveau
      await checkForExistingAttempts(session.user.id, currentLevel.stage);

    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      router.push('/renaissance');
    } finally {
      setLoading(false);
    }
  };

  // ✅ AJOUT: Fonction pour vérifier les tentatives existantes
  const checkForExistingAttempts = async (userId: string, currentStage: string) => {
    try {
      const { data: existingSessions } = await supabase
        .from('renaissance_game_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('axe_id', axeId)
        .eq('stage', currentStage)
        .limit(1);

      // Si des sessions existent, forcer l'affichage de l'historique
      if (existingSessions && existingSessions.length > 0) {
        console.log('🔍 Tentatives existantes détectées pour', currentStage, '- affichage de l\'historique');
        setShowAttemptHistory(true);
      } else {
        console.log('📝 Aucune tentative existante pour', currentStage);
        setShowAttemptHistory(false);
      }
    } catch (error) {
      console.error('Erreur vérification tentatives existantes:', error);
      setShowAttemptHistory(false);
    }
  };

  // ✅ AJOUT: Fonctions de navigation manquantes
  const handleLevelChange = async (newStage: string) => {
    console.log('🔄 Navigation demandée vers:', newStage);

    // ✅ CORRECTION: Pour la découverte, aller directement sans vérifier allLevels
    if (newStage === 'discovery') {
      console.log('🧠 Redirection vers découverte');
      router.push(`/renaissance/${axeId}/discovery`);
      return;
    }

    // Pour les niveaux d'encrage, vérifier qu'ils sont déverrouillés
    const targetLevel = allLevels.find(l => l.stage === newStage);
    if (!targetLevel?.isUnlocked) {
      console.log('🔒 Niveau verrouillé:', newStage);
      return;
    }

    // Pour les niveaux d'encrage, toujours forcer l'affichage de l'historique s'il existe
    if (userId) {
      try {
        const { data: existingSessions } = await supabase
          .from('renaissance_game_sessions')
          .select('id, session_accuracy, is_completed')
          .eq('user_id', userId)
          .eq('axe_id', axeId)
          .eq('stage', newStage)
          .order('created_at', { ascending: false })
          .limit(1);

        // Si des sessions existent ET que le niveau est complété (100%), 
        // forcer l'affichage de l'historique en rechargeant la page
        if (existingSessions && existingSessions.length > 0) {
          console.log('🔍 Sessions existantes trouvées pour', newStage, ':', existingSessions);
          
          // Forcer le rechargement de la page pour afficher l'historique
          if (newStage === level) {
            // Même niveau : forcer le rechargement pour afficher l'historique
            window.location.reload();
          } else {
            // Niveau différent : naviguer vers le niveau
            router.push(`/renaissance/${axeId}/encrage?level=${newStage}`);
          }
          return;
        }
      } catch (error) {
        console.error('Erreur vérification sessions:', error);
      }
    }

    // Sinon, naviguer normalement
    router.push(`/renaissance/${axeId}/encrage?level=${newStage}`);
  };

  const handlePreviousLevel = () => {
    const currentIndex = allLevels.findIndex(l => l.stage === level);
    if (currentIndex > 0) {
      const previousLevel = allLevels[currentIndex - 1];
      if (previousLevel.isUnlocked) {
        handleLevelChange(previousLevel.stage);
      }
    } else {
      // Retour à la découverte
      router.push(`/renaissance/${axeId}/discovery`);
    }
  };

  const handleNextLevel = () => {
    const currentIndex = allLevels.findIndex(l => l.stage === level);
    if (currentIndex < allLevels.length - 1) {
      const nextLevel = allLevels[currentIndex + 1];
      if (nextLevel.isUnlocked) {
        handleLevelChange(nextLevel.stage);
      }
    }
  };

  // ✅ CORRECTION: Fonction séparée pour démarrer le flash
  const startFlashSequence = () => {
    if (!state.currentLevel) return;
    
    setHasStartedPlaying(true); // ✅ Marquer qu'on a commencé à jouer
    setPhraseStartTime(Date.now()); // ✅ AJOUT: Commencer le timer pour cette phrase
    setState(prev => ({
      ...prev,
      userInput: '',
      isShowingPhrase: true,
      showResult: false,
      lastResult: null
    }));
    
    // ✅ CORRECTION: Timer pour masquer la phrase seulement
    const totalDuration = 3000 + state.currentLevel.flashDuration;
    setTimeout(() => {
      setState(prev => ({ 
        ...prev, 
        isShowingPhrase: false 
      }));
    }, totalDuration);
  };

  const startGame = () => {
    if (!state.currentLevel || !state.gameSession) return;
    
    const startTime = Date.now(); // ✅ CORRECTION: Capturer le temps de début
    setState(prev => ({
      ...prev,
      attempts: [],
      sessionStartTime: startTime
    }));
    
    startFlashSequence();
  };

  const handlePhraseSubmit = async () => {
    if (!state.gameSession) return;

    if (state.showResult) {
      // Passer à la phrase suivante
      const nextIndex = state.gameSession.currentPhraseIndex + 1;
      
      if (nextIndex < state.phrases.length) {
        // ✅ CORRECTION: Mise à jour immédiate de l'état avec le nouvel index
        const updatedGameSession = {
          ...state.gameSession,
          currentPhraseIndex: nextIndex
        };
        
        setState(prev => ({
          ...prev,
          userInput: '',
          showResult: false,
          lastResult: null,
          gameSession: updatedGameSession
        }));
        
        // ✅ CORRECTION: Délai plus court pour éviter le flash de l'écran de saisie
        setTimeout(() => {
          startFlashSequence();
        }, 100);
      } else {
        // Toutes les phrases ont été tentées, vérifier les résultats
        await checkLevelCompletion();
      }
      return;
    }

    if (!state.userInput.trim() || !state.currentLevel) return;
    
    // Obtenir la phrase actuelle selon l'ordre de la session
    const phraseIndex = state.gameSession.phrasesOrder[state.gameSession.currentPhraseIndex];
    const currentPhrase = state.phrases[phraseIndex];
    
    // ✅ CORRECTION: Calcul du temps de réponse correct
    const responseTime = phraseStartTime > 0 ? Date.now() - phraseStartTime : 0;
    
    // Vérifier la réponse
    const attempt = renaissanceService.checkAnswer(state.userInput.trim(), currentPhrase.content);
    attempt.flashDuration = state.gameSession.flashDurationMs;
    attempt.expectedText = currentPhrase.content; // ✅ AJOUT: Phrase attendue
    attempt.responseTime = responseTime; // ✅ AJOUT: Temps de réponse calculé
    
    const newAttempts = [...state.attempts, attempt];
    
    // Enregistrer la tentative avec la nouvelle méthode
    try {
      await renaissanceService.recordAttempt(
        state.gameSession.id,
        currentPhrase.id,
        state.gameSession.currentPhraseIndex + 1,
        attempt
      );
    } catch (error) {
      console.error('Erreur sauvegarde tentative:', error);
      // Fallback vers l'ancienne méthode
      if (userId) {
        try {
          await renaissanceService.recordAttemptLegacy(
            userId,
            axeId,
            state.currentLevel.stage,
            state.gameSession.currentPhraseIndex + 1,
            attempt
          );
        } catch (fallbackError) {
          console.error('Erreur sauvegarde fallback:', fallbackError);
        }
      }
    }

    setState(prev => ({
      ...prev,
      attempts: newAttempts,
      lastResult: attempt,
      showResult: true
    }));
  };

  // ✅ CORRECTION: Fonctions utilitaires pour les temps avec gestion des undefined
  const formatTime = (milliseconds: number): string => {
    if (milliseconds < 1000) return `${Math.round(milliseconds)}ms`;
    if (milliseconds < 60000) return `${(milliseconds / 1000).toFixed(1)}s`;
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.round((milliseconds % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const getTimeStats = () => {
    const validTimes = state.attempts
      .map(a => a.responseTime)
      .filter((t): t is number => t !== undefined && t > 0 && t < 300000);
    
    if (validTimes.length === 0) {
      return {
        fastest: 0,
        slowest: 0,
        average: 0
      };
    }
    
    return {
      fastest: Math.min(...validTimes),
      slowest: Math.max(...validTimes),
      average: validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length
    };
  };

  const checkLevelCompletion = async () => {
    if (!state.currentLevel || !userId || !state.gameSession) return;

    const correctAnswers = state.attempts.filter(a => a.isCorrect).length;
    const accuracy = Math.round((correctAnswers / state.attempts.length) * 100);
    const totalTime = Date.now() - state.sessionStartTime;
    
    // Pour l'encrage, il faut 100% de réussite pour passer au niveau suivant
    const levelCompleted = correctAnswers === state.phrases.length;

    // ✅ CORRECTION: Calcul des temps de réponse correct avec gestion des undefined
    const validResponseTimes = state.attempts
      .map(a => a.responseTime)
      .filter((t): t is number => t !== undefined && t > 0 && t < 300000); // Filtrer les temps valides (< 5 minutes)
    
    const averageResponseTime = validResponseTimes.length > 0 
      ? validResponseTimes.reduce((sum, time) => sum + time, 0) / validResponseTimes.length 
      : 0;

    const results: GameResults = {
      totalPhrases: state.phrases.length,
      correctAnswers,
      accuracy,
      attempts: state.attempts,
      timeSpent: totalTime,
      averageResponseTime,
      stage: state.currentLevel.stage,
      level: state.currentLevel.name
    };

    if (levelCompleted) {
      // Marquer la session comme complétée
      try {
        await renaissanceService.completeSession(state.gameSession.id);
        
        // Marquer le stage comme complété (legacy)
        await renaissanceService.completeStage(userId, axeId, state.currentLevel.stage);
        console.log('✅ Niveau complété:', state.currentLevel.stage);
      } catch (error) {
        console.error('Erreur completion niveau:', error);
      }
    }

    setState(prev => ({
      ...prev,
      showFinalResults: true,
      finalResults: results
    }));
  };

  const handleResultsContinue = () => {
    if (!state.finalResults || !state.currentLevel) return;

    const levelCompleted = state.finalResults.correctAnswers === state.phrases.length;

    if (levelCompleted) {
      // Aller au niveau suivant ou retourner à l'axe si c'est le dernier niveau
      if (state.currentLevel.stage === 'level3') {
        // Dernier niveau complété, retourner à l'axe
        router.push(`/renaissance/${axeId}`);
      } else {
        // Aller au niveau suivant
        const nextLevel = state.currentLevel.stage === 'level1' ? 'level2' : 'level3';
        router.push(`/renaissance/${axeId}/encrage?level=${nextLevel}`);
      }
    } else {
      // Recommencer le niveau actuel
      restartLevel();
    }
  };

  const restartLevel = async () => {
    if (!userId || !state.currentLevel) return;

    try {
      // Créer une nouvelle session pour recommencer
      const newSession = await renaissanceService.createGameSession(
        userId,
        axeId,
        state.currentLevel.stage,
        state.phrases.length
      );

      setState(prev => ({
        ...prev,
        gameSession: newSession,
        showFinalResults: false,
        finalResults: null,
        userInput: '',
        isShowingPhrase: false,
        showResult: false,
        attempts: [],
        lastResult: null,
        sessionStartTime: Date.now()
      }));
      setHasStartedPlaying(false); // ✅ AJOUT: Reset pour permettre de recommencer
    } catch (error) {
      console.error('Erreur lors du restart:', error);
    }
  };

  const handleResultsRestart = () => {
    restartLevel();
  };

  const handleBackToAxe = () => {
    router.push(`/renaissance/${axeId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔄</div>
          <div className="text-2xl text-purple-600">Chargement du niveau...</div>
        </div>
      </div>
    );
  }

  if (!state.currentLevel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <div className="text-2xl text-red-600">Niveau non accessible</div>
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

  // Affichage des résultats finaux
  if (state.showFinalResults && state.finalResults) {
    const levelCompleted = state.finalResults.correctAnswers === state.phrases.length;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100">
        <div className="max-w-4xl mx-auto p-4">
          {/* Navigation des niveaux */}
          <div className="mb-6">
            <LevelNavigation
              currentStage={state.currentLevel.stage}
              axeId={axeId}
              userId={userId || undefined}
              onPrevious={handlePreviousLevel}
              onNext={handleNextLevel}
              onLevelSelect={(stage) => {
                console.log('🎯 LevelNavigation (résultats) - onLevelSelect appelé avec:', stage);
                handleLevelChange(stage);
              }}
            />
          </div>

          {/* Message spécifique encrage */}
          {!levelCompleted && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mb-6 text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-lg font-bold text-orange-800 mb-2">
                Encrage requis : 100% de réussite
              </h3>
              <p className="text-orange-700">
                Pour l'encrage, vous devez obtenir toutes les phrases correctes pour passer au niveau suivant. 
                Recommencez jusqu'à la maîtrise complète !
              </p>
            </div>
          )}

          <ResultDisplay
            results={state.finalResults}
            onContinue={handleResultsContinue}
            onRestart={handleResultsRestart}
            onBackToAxe={handleBackToAxe}
            showDetailedAnalysis={true}
          />
        </div>
      </div>
    );
  }

  // ✅ CORRECTION: Jeu en cours - condition plus précise
  const shouldShowGame = hasStartedPlaying && 
                         (state.isShowingPhrase || state.showResult || 
                          (state.gameSession && state.gameSession.currentPhraseIndex < state.phrases.length));

  if (shouldShowGame) {
    if (!state.gameSession) return null;
    
    const phraseIndex = state.gameSession.phrasesOrder[state.gameSession.currentPhraseIndex];
    const currentPhrase = state.phrases[phraseIndex];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100">
        <FlashPhraseGame
          phrase={currentPhrase.content}
          phraseNumber={state.gameSession.currentPhraseIndex + 1}
          totalPhrases={state.phrases.length}
          userInput={state.userInput}
          onInputChange={(value) => setState(prev => ({ ...prev, userInput: value }))}
          onSubmit={handlePhraseSubmit}
          flashDuration={state.gameSession.flashDurationMs}
          showResult={state.showResult}
          isShowingPhrase={state.isShowingPhrase}
          result={state.lastResult ?? undefined}
          stage={state.currentLevel.stage}
        />
      </div>
    );
  }

  // Écran d'accueil du niveau
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100">
      <div className="max-w-4xl mx-auto p-4">
        {/* Navigation des niveaux */}
        <div className="mb-8">
          <LevelNavigation
            currentStage={state.currentLevel.stage}
            axeId={axeId}
            userId={userId || undefined}
            onPrevious={handlePreviousLevel}
            onNext={handleNextLevel}
            onLevelSelect={(stage) => {
              console.log('🎯 LevelNavigation (écran accueil) - onLevelSelect appelé avec:', stage);
              handleLevelChange(stage);
            }}
          />
        </div>

        {/* Écran d'accueil du niveau */}
        <div className="max-w-2xl mx-auto text-center">

          {/* Informations sur l'encrage */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="text-5xl mb-6">{state.currentLevel.icon}</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              {axeName} - {state.currentLevel.name}
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              {state.currentLevel.description}
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-3">
                <div className="text-2xl">⚠️</div>
                <div className="text-left">
                  <h3 className="font-bold text-yellow-800 mb-2">Objectif d'encrage</h3>
                  <p className="text-yellow-700 text-sm">
                    Vous devez obtenir <strong>100% de réussite</strong> pour valider ce niveau et passer au suivant. 
                    L'ordre des phrases sera mélangé à chaque tentative pour renforcer votre mémorisation.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-sm">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="font-semibold text-blue-800">Phrases</div>
                <div className="text-blue-600">{state.phrases.length} à mémoriser</div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="font-semibold text-purple-800">Flash</div>
                <div className="text-purple-600">
                  {state.currentLevel.flashDuration >= 1000 
                    ? `${state.currentLevel.flashDuration / 1000}s` 
                    : `${state.currentLevel.flashDuration}ms`
                  }
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="font-semibold text-green-800">Objectif</div>
                <div className="text-green-600">100% réussite</div>
              </div>
            </div>

            <div className="flex flex-row gap-4 justify-center items-center mt-4">
              <button
                onClick={startGame}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-xl text-xs transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                🚀 Commencer {state.currentLevel.name}
              </button>
              <button
                onClick={handleBackToAxe}
                className="px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-xs font-bold flex items-center gap-2"
              >
                <span>🏃‍♂️</span>
                <span>Retour à l'axe</span>
              </button>
            </div>
          </div>

          {/* ✅ MODIFICATION: Historique des tentatives - Toujours affiché */}
          <div className="mt-8">
            <AttemptHistory 
              axeId={axeId} 
              userId={userId} 
              level={state.currentLevel.stage}
              onDataLoaded={(hasAttempts) => {
                console.log('📊 Historique chargé, tentatives trouvées:', hasAttempts);
                // Ne plus cacher automatiquement l'historique
                // setShowAttemptHistory(hasAttempts);
              }}
            />
          </div>

          {/* Navigation */}
          {/* (Bouton déplacé à côté de Commencer niveau) */}

          {/* ✅ AJOUT: Historique toujours présent mais conditionnel
          <div className="mt-8">
            <AttemptHistory 
              axeId={axeId} 
              userId={userId} 
              level={state.currentLevel.stage}
              onDataLoaded={(hasAttempts) => setShowAttemptHistory(hasAttempts)}
            />
          </div>  */}
        </div>
      </div>
    </div>
  );
}