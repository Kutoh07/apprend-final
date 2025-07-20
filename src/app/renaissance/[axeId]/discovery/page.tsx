// Étape découverte (flash 0.5s)
// src/app/renaissance/[axeId]/discovery/page.tsx

'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import FlashPhraseGame from '../../components/FlashPhraseGame';
import { quickCompare } from '@/lib/utils/stringComparison';
import type { GameSession, PhraseAttempt, RenaissancePhrase } from '@/lib/types/renaissance';
import { renaissanceService } from '@/lib/services/renaissanceService';

export default function DiscoveryPage({ params }: { params: Promise<{ axeId: string }> }) {
  const router = useRouter();
  const { axeId } = use(params);
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [currentPhrase, setCurrentPhrase] = useState<string>('');
  const [userInput, setUserInput] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [isShowingPhrase, setIsShowingPhrase] = useState(false);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [phrases, setPhrases] = useState<RenaissancePhrase[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<PhraseAttempt[]>([]);
  const [lastResult, setLastResult] = useState<PhraseAttempt | null>(null);

  // Chargement initial
  useEffect(() => {
    loadUserAndPhrases();
  }, [axeId]);

  // Initialiser la session quand les phrases sont chargées
  useEffect(() => {
    if (userId && phrases.length > 0) {
      initializeGameSession();
    }
  }, [userId, phrases]);

  const shufflePhrases = (length: number): number[] => {
    const indices = Array.from({ length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  };

  const initializeGameSession = async () => {
    if (!userId) return;

    try {
      // Vérifier s'il y a une session active
      let session = await renaissanceService.getActiveSession(userId, axeId);
      
      if (!session) {
        // Créer nouvelle session
        const phrasesOrder = shufflePhrases(phrases.length);
        session = await renaissanceService.startGameSession(
          userId,
          axeId,
          'discovery',
          500, // 0.5s pour discovery
          phrasesOrder
        );
      }
      
      setGameSession(session);
      // Reprendre où on en était
      if (session.current_phrase_index !== undefined) {
        setCurrentPhraseIndex(session.current_phrase_index);
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la session:', error);
    }
  };

  const loadUserAndPhrases = async () => {
    try {
      // Récupérer l'utilisateur connecté
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        router.push('/auth');
        return;
      }

      setUserId(session.user.id);

      // Récupérer les phrases de l'axe
      const { data: phrasesData, error: phrasesError } = await supabase
        .from('renaissance_phrases')
        .select(`
          id,
          content,
          phrase_number,
          renaissance_axes!inner(id)
        `)
        .eq('renaissance_axes.id', axeId)
        .order('phrase_number');

      if (phrasesError) {
        console.error('Erreur lors du chargement des phrases:', phrasesError);
        return;
      }

      if (!phrasesData || phrasesData.length === 0) {
        console.error('Aucune phrase trouvée pour cet axe');
        return;
      }

      setPhrases(phrasesData.map(p => ({
        id: p.id,
        content: p.content,
        phraseNumber: p.phrase_number,
        axeId: axeId
      })));

      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setLoading(false);
    }
  };

  const startGame = () => {
    if (phrases.length === 0) return;
    
    setCurrentPhraseIndex(0);
    setCurrentPhrase(phrases[0].content);
    setUserInput('');
    setShowResult(false);
    showCurrentPhrase();
  };

  const showCurrentPhrase = () => {
    setIsShowingPhrase(true);
    setShowResult(false);
    
    // Afficher la phrase pendant 500ms (découverte)
    setTimeout(() => {
      setIsShowingPhrase(false);
    }, 500);
  };

  const createAttemptObject = (userInput: string, currentPhrase: string): PhraseAttempt => {
    const comparison = quickCompare(userInput.trim(), currentPhrase);
    
    return {
      userInput: userInput.trim(),
      isCorrect: comparison.isCorrect,
      timestamp: new Date(),
      flashDuration: 500,
      differences: comparison.differences
    };
  };

  const handlePhraseSubmit = async () => {
    if (showResult) {
      // Passer à la phrase suivante
      if (currentPhraseIndex < phrases.length - 1) {
        const nextIndex = currentPhraseIndex + 1;
        setCurrentPhraseIndex(nextIndex);
        setCurrentPhrase(phrases[nextIndex].content);
        setUserInput('');
        setShowResult(false);
        setLastResult(null);
        showCurrentPhrase();
      } else {
        // Fin de la découverte - compléter la session si elle existe
        if (gameSession && 'id' in gameSession && gameSession.id) {
          try {
            await renaissanceService.completeSession(gameSession.id);
          } catch (error) {
            console.error('Erreur lors de la completion de session:', error);
          }
        }
        router.push(`/renaissance/${axeId}/encrage`);
      }
      return;
    }

    if (!userInput.trim()) return;
    
    // Créer l'objet attempt
    const attempt = createAttemptObject(userInput, currentPhrase);
    setAttempts(prev => [...prev, attempt]);
    setLastResult(attempt);

    // Enregistrer la tentative
    if (gameSession && 'id' in gameSession && gameSession.id) {
      try {
        // Nouvelle méthode avec session
        const currentPhraseObj = phrases[currentPhraseIndex];
        await renaissanceService.recordAttempt(
          gameSession.id,
          currentPhraseObj.id,
          currentPhraseIndex + 1,
          attempt
        );
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement avec session:', error);
        // Fallback vers l'ancienne méthode
        if (userId) {
          await fallbackSaveAttempt(attempt);
        }
      }
    } else if (userId) {
      // Fallback vers l'ancienne méthode si pas de session
      await fallbackSaveAttempt(attempt);
    }

    setShowResult(true);
  };

  const fallbackSaveAttempt = async (attempt: PhraseAttempt) => {
    try {
      await supabase
        .from('user_renaissance_progress')
        .upsert({
          user_id: userId,
          axe_id: axeId,
          stage: 'discovery',
          current_phrase: currentPhraseIndex + 1,
          attempts: { [currentPhraseIndex + 1]: [attempt] },
          last_attempt_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde fallback:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔄</div>
          <div className="text-xl text-purple-600">Chargement...</div>
        </div>
      </div>
    );
  }

  if (phrases.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <div className="text-xl text-red-600">Aucune phrase trouvée pour cet axe</div>
          <button
            onClick={() => router.push('/renaissance')}
            className="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-xl transition-colors"
          >
            Retour à Renaissance
          </button>
        </div>
      </div>
    );
  }

  if (currentPhrase === '') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="max-w-2xl w-full text-center">
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <div className="text-6xl mb-6">🧠</div>
            <h1 className="text-3xl font-bold text-purple-600 mb-4">
              Découverte - Flash 0.5s
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Vous allez voir {phrases.length} phrases s'afficher pendant 0.5 seconde chacune.
              Votre objectif est de les retaper le plus fidèlement possible.
            </p>
            <button
              onClick={startGame}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-8 rounded-xl text-xl transition-colors"
            >
              Commencer la découverte
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <FlashPhraseGame
      key={currentPhraseIndex}
      phrase={currentPhrase}
      userInput={userInput}
      onInputChange={setUserInput}
      onSubmit={handlePhraseSubmit}
      flashDuration={500}
      showResult={showResult}
      isShowingPhrase={isShowingPhrase}
      result={lastResult ?? undefined}
      phraseNumber={currentPhraseIndex + 1}
      totalPhrases={phrases.length}
    />
  );
}