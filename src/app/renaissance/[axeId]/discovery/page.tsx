// Étape découverte (flash 0.5s)
// src/app/renaissance/[axeId]/discovery/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Types temporaires en attendant la création des fichiers de types
interface GameSession {
  axeId: string;
  stage: string;
  phrases: Array<{ id: string; content: string; phraseNumber: number }>;
  currentPhraseIndex: number;
  flashDuration: number;
  attempts: Array<any>;
  isCompleted: boolean;
  accuracy: number;
}

interface PhraseAttempt {
  userInput: string;
  isCorrect: boolean;
  timestamp: Date;
  flashDuration: number;
  differences?: Array<any>;
}

// Composant FlashPhraseGame temporaire
const FlashPhraseGame = ({ 
  phrase, 
  userInput, 
  onInputChange, 
  onSubmit, 
  flashDuration, 
  showResult,
  isShowingPhrase,
  result 
}: {
  phrase: string;
  userInput: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  flashDuration: number;
  showResult: boolean;
  isShowingPhrase: boolean;
  result?: PhraseAttempt;
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
          {isShowingPhrase ? (
            <div>
              <h2 className="text-3xl font-bold text-purple-600 mb-8">Mémorisez cette phrase</h2>
              <div className="text-2xl font-medium text-gray-800 mb-8 p-6 bg-purple-50 rounded-xl">
                {phrase}
              </div>
              <div className="text-gray-500">
                Flash de {flashDuration}ms...
              </div>
            </div>
          ) : showResult ? (
            <div>
              <h2 className="text-2xl font-bold mb-6">
                {result?.isCorrect ? (
                  <span className="text-green-600">✅ Correct !</span>
                ) : (
                  <span className="text-red-600">❌ Pas tout à fait...</span>
                )}
              </h2>
              {!result?.isCorrect && (
                <div className="mb-6">
                  <div className="text-sm text-gray-600 mb-2">Phrase attendue :</div>
                  <div className="text-lg text-gray-800 mb-4 p-4 bg-green-50 rounded-lg">
                    {phrase}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">Votre réponse :</div>
                  <div className="text-lg text-gray-800 p-4 bg-red-50 rounded-lg">
                    {result?.userInput || userInput}
                  </div>
                </div>
              )}
              <button
                onClick={onSubmit}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors"
              >
                Phrase suivante
              </button>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-purple-600 mb-6">Retapez la phrase</h2>
              <textarea
                value={userInput}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder="Tapez la phrase que vous avez vue..."
                className="w-full h-32 p-4 border-2 border-purple-200 rounded-xl resize-none focus:border-purple-500 focus:outline-none text-lg"
                autoFocus
              />
              <button
                onClick={onSubmit}
                disabled={!userInput.trim()}
                className="mt-6 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-semibold py-3 px-8 rounded-xl transition-colors"
              >
                Valider
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function DiscoveryPage({ params }: { params: { axeId: string } }) {
  const router = useRouter();
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [currentPhrase, setCurrentPhrase] = useState<string>('');
  const [userInput, setUserInput] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [isShowingPhrase, setIsShowingPhrase] = useState(false);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [phrases, setPhrases] = useState<Array<{ id: string; content: string; phraseNumber: number }>>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<PhraseAttempt[]>([]);
  const [lastResult, setLastResult] = useState<PhraseAttempt | null>(null);

  // Chargement initial
  useEffect(() => {
    loadUserAndPhrases();
  }, []);

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
        .eq('renaissance_axes.id', params.axeId)
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
        phraseNumber: p.phrase_number
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
        // Fin de la découverte
        router.push(`/renaissance/${params.axeId}/encrage`);
      }
      return;
    }

    if (!gameSession && !userInput.trim()) return;
    
    // Vérifier la réponse
    const isCorrect = userInput.trim().toLowerCase() === currentPhrase.toLowerCase();
    
    const attempt: PhraseAttempt = {
      userInput: userInput.trim(),
      isCorrect,
      timestamp: new Date(),
      flashDuration: 500
    };

    setAttempts(prev => [...prev, attempt]);
    setLastResult(attempt);

    // Enregistrer la tentative en base de données
    if (userId) {
      try {
        await supabase
          .from('user_renaissance_progress')
          .upsert({
            user_id: userId,
            axe_id: params.axeId,
            stage: 'discovery',
            current_phrase: currentPhraseIndex + 1,
            attempts: { [currentPhraseIndex + 1]: [attempt] },
            last_attempt_at: new Date().toISOString()
          });
      } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
      }
    }

    setShowResult(true);
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
              Vous allez voir 10 phrases s'afficher pendant 0.5 seconde chacune.
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
      phrase={currentPhrase}
      userInput={userInput}
      onInputChange={setUserInput}
      onSubmit={handlePhraseSubmit}
      flashDuration={500}
      showResult={showResult}
      isShowingPhrase={isShowingPhrase}
      result={lastResult ?? undefined}
    />
  );
}