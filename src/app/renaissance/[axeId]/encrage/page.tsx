// Étape encrage (niveaux 1-3)
// src/app/renaissance/[axeId]/encrage/page.tsx

'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import { renaissanceService } from '../../../../lib/services/renaissanceService';
import FlashPhraseGame from '../../components/FlashPhraseGame';
import ResultDisplay, { GameResults } from '../../components/ResultDisplay';
import { LevelNavigation, CurrentLevelDisplay } from '../../components/LevelIndicator';
import type {  
  PhraseAttempt, 
  RenaissancePhrase 
} from '../../../../lib/services/renaissanceService';

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
  currentPhraseIndex: number;
  userInput: string;
  isShowingPhrase: boolean;
  showResult: boolean;
  gameSession: any;
  attempts: PhraseAttempt[];
  lastResult: PhraseAttempt | null;
  showFinalResults: boolean;
  finalResults: GameResults | null;
  shuffledOrder: number[];
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
    currentPhraseIndex: 0,
    userInput: '',
    isShowingPhrase: false,
    showResult: false,
    gameSession: null,
    attempts: [],
    lastResult: null,
    showFinalResults: false,
    finalResults: null,
    shuffledOrder: [],
    sessionStartTime: Date.now()
  });

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [axeName, setAxeName] = useState('');
  const [allLevels, setAllLevels] = useState<EncrageLevel[]>([]);

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

      // Charger les progrès utilisateur
      const { data: progressData, error: progressError } = await supabase
        .from('user_renaissance_progress')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('axe_id', axeId);

      if (progressError) {
        console.error('Erreur chargement progrès:', progressError);
      }

      // Construire les niveaux avec leurs états
      const levels: EncrageLevel[] = Object.entries(ENCRAGE_LEVELS).map(([key, levelConfig]) => {
        const levelProgress = progressData?.find(p => p.stage === key);
        const isDiscoveryCompleted = progressData?.some(p => p.stage === 'discovery' && p.stage_completed);
        const isLevel1Completed = progressData?.some(p => p.stage === 'level1' && p.stage_completed);
        const isLevel2Completed = progressData?.some(p => p.stage === 'level2' && p.stage_completed);

        let isUnlocked = false;
        if (key === 'level1') isUnlocked = isDiscoveryCompleted || false;
        if (key === 'level2') isUnlocked = isLevel1Completed || false;
        if (key === 'level3') isUnlocked = isLevel2Completed || false;

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

      // Mélanger l'ordre des phrases pour ce niveau
      const shuffledOrder = shufflePhrases(phrasesToUse.length);

      setState(prev => ({
        ...prev,
        currentLevel,
        phrases: phrasesToUse,
        shuffledOrder,
        sessionStartTime: Date.now()
      }));

    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      router.push('/renaissance');
    } finally {
      setLoading(false);
    }
  };

  const shufflePhrases = (length: number): number[] => {
    const indices = Array.from({ length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  };

  const startGame = () => {
    if (state.phrases.length === 0 || !state.currentLevel) return;
    
    setState(prev => ({
      ...prev,
      currentPhraseIndex: 0,
      userInput: '',
      isShowingPhrase: true,
      showResult: false,
      attempts: [],
      lastResult: null,
      showFinalResults: false,
      sessionStartTime: Date.now()
    }));
  };

  const handlePhraseSubmit = async () => {
    if (state.showResult) {
      // Passer à la phrase suivante
      if (state.currentPhraseIndex < state.phrases.length - 1) {
        setState(prev => ({
          ...prev,
          currentPhraseIndex: prev.currentPhraseIndex + 1,
          userInput: '',
          showResult: false,
          lastResult: null,
          isShowingPhrase: true
        }));
      } else {
        // Toutes les phrases ont été tentées, vérifier les résultats
        await checkLevelCompletion();
      }
      return;
    }

    if (!state.userInput.trim() || !state.currentLevel) return;
    
    const currentPhrase = state.phrases[state.shuffledOrder[state.currentPhraseIndex]];
    
    // Vérifier la réponse
    const attempt = renaissanceService.checkAnswer(state.userInput.trim(), currentPhrase.content);
    
    const newAttempts = [...state.attempts, attempt];
    
    // Enregistrer la tentative en base
    if (userId) {
      try {
        await renaissanceService.recordAttempt(
          userId,
          axeId,
          state.currentLevel.stage,
          state.currentPhraseIndex + 1,
          attempt
        );
      } catch (error) {
        console.error('Erreur sauvegarde tentative:', error);
      }
    }

    setState(prev => ({
      ...prev,
      attempts: newAttempts,
      lastResult: attempt,
      showResult: true
    }));
  };

  const checkLevelCompletion = async () => {
    if (!state.currentLevel || !userId) return;

    const correctAnswers = state.attempts.filter(a => a.isCorrect).length;
    const accuracy = Math.round((correctAnswers / state.attempts.length) * 100);
    const totalTime = Date.now() - state.sessionStartTime;
    
    // Pour l'encrage, il faut 100% de réussite pour passer au niveau suivant
    const levelCompleted = correctAnswers === state.phrases.length;

    const results: GameResults = {
      totalPhrases: state.phrases.length,
      correctAnswers,
      accuracy,
      attempts: state.attempts,
      timeSpent: totalTime,
      averageResponseTime: state.attempts.reduce((sum, a) => sum + (a.responseTime || 0), 0) / state.attempts.length,
      stage: state.currentLevel.stage,
      level: state.currentLevel.name
    };

    if (levelCompleted) {
      // Marquer le niveau comme complété
      try {
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
      setState(prev => ({
        ...prev,
        showFinalResults: false,
        finalResults: null,
        currentPhraseIndex: 0,
        userInput: '',
        isShowingPhrase: false,
        showResult: false,
        attempts: [],
        lastResult: null,
        shuffledOrder: shufflePhrases(prev.phrases.length)
      }));
    }
  };

  const handleResultsRestart = () => {
    setState(prev => ({
      ...prev,
      showFinalResults: false,
      finalResults: null,
      currentPhraseIndex: 0,
      userInput: '',
      isShowingPhrase: false,
      showResult: false,
      attempts: [],
      lastResult: null,
      shuffledOrder: shufflePhrases(prev.phrases.length)
    }));
  };

  const handleBackToAxe = () => {
    router.push(`/renaissance/${axeId}`);
  };

  const handleLevelChange = (newLevel: string) => {
    router.push(`/renaissance/${axeId}/encrage?level=${newLevel}`);
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
              levels={allLevels.map(level => ({
                stage: level.stage,
                name: level.name,
                description: level.description,
                flashDuration: level.flashDuration,
                icon: level.icon,
                color: level.color,
                progress: level.progress,
                isCompleted: level.isCompleted,
                isActive: level.stage === state.currentLevel?.stage,
                isLocked: !level.isUnlocked
              }))}
              onLevelSelect={handleLevelChange}
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

  // Jeu en cours
  if (state.isShowingPhrase || state.showResult || state.currentPhraseIndex < state.phrases.length) {
    const currentPhrase = state.phrases[state.shuffledOrder[state.currentPhraseIndex]];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100">
        <FlashPhraseGame
          phrase={currentPhrase.content}
          phraseNumber={state.currentPhraseIndex + 1}
          totalPhrases={state.phrases.length}
          userInput={state.userInput}
          onInputChange={(value) => setState(prev => ({ ...prev, userInput: value }))}
          onSubmit={handlePhraseSubmit}
          flashDuration={state.currentLevel.flashDuration}
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
            levels={allLevels.map(level => ({
              stage: level.stage,
              name: level.name,
              description: level.description,
              flashDuration: level.flashDuration,
              icon: level.icon,
              color: level.color,
              progress: level.progress,
              isCompleted: level.isCompleted,
              isActive: level.stage === state.currentLevel?.stage,
              isLocked: !level.isUnlocked
            }))}
            onLevelSelect={handleLevelChange}
          />
        </div>

        {/* Écran d'accueil du niveau */}
        <div className="max-w-2xl mx-auto text-center">
          <CurrentLevelDisplay
            level={{
              stage: state.currentLevel.stage,
              name: state.currentLevel.name,
              description: state.currentLevel.description,
              flashDuration: state.currentLevel.flashDuration,
              icon: state.currentLevel.icon,
              color: state.currentLevel.color,
              progress: state.currentLevel.progress,
              isCompleted: state.currentLevel.isCompleted,
              isActive: true,
              isLocked: false
            }}
            totalPhrases={state.phrases.length}
            className="mb-8"
          />

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

            <button
              onClick={startGame}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-xl text-xl transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🚀 Commencer {state.currentLevel.name}
            </button>
          </div>

          {/* Navigation */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleBackToAxe}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              ← Retour à l'axe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}