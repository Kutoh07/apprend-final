// src/app/renaissance/[axeId]/components/AttemptHistory.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';

interface AttemptData {
  id: string;
  stage: string;
  is_completed: boolean;
  completed_at: string | null;
  started_at: string;
  total_attempts: number;
  correct_count: number;
  session_accuracy: number;
}

interface AttemptHistoryProps {
  axeId: string;
  userId: string | null;
  level: string;
  onDataLoaded?: (hasAttempts: boolean) => void; // ✅ AJOUT: Callback pour informer le parent
}

export default function AttemptHistory({ 
  axeId, 
  userId, 
  level,
  onDataLoaded 
}: AttemptHistoryProps) {
  const [attempts, setAttempts] = useState<AttemptData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAttempts() {
      if (!userId) {
        setLoading(false);
        onDataLoaded?.(false);
        return;
      }
      
      setLoading(true);
      
      try {
        // ✅ CORRECTION: Récupérer TOUTES les sessions (complétées ET non complétées)
        const { data, error } = await supabase
          .from('renaissance_game_sessions')
          .select('id, stage, is_completed, completed_at, total_attempts, correct_count, session_accuracy, started_at')
          .eq('user_id', userId)
          .eq('axe_id', axeId)
          .eq('stage', level)
          .gt('total_attempts', 0) // ✅ Seulement les sessions avec au moins une tentative
          .order('started_at', { ascending: false });
          
        if (!error && data) {
          setAttempts(data);
          onDataLoaded?.(data.length > 0); // ✅ Informer le parent s'il y a des données
        } else if (error) {
          console.error('Erreur chargement historique:', error);
          onDataLoaded?.(false);
        }
      } catch (error) {
        console.error('Erreur fetchAttempts:', error);
        onDataLoaded?.(false);
      } finally {
        setLoading(false);
      }
    }
    
    fetchAttempts();
  }, [axeId, userId, level, onDataLoaded]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Historique des tentatives</h3>
        <div className="text-gray-500 text-center py-4">Chargement de l'historique...</div>
      </div>
    );
  }
  
  if (attempts.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Historique des tentatives</h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📝</div>
          <p className="text-gray-500 text-lg mb-2">Aucune tentative enregistrée</p>
          <p className="text-gray-400 text-sm">
            Commencez une session pour voir votre historique ici
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Historique des tentatives</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-3 px-4 text-left font-semibold text-gray-700">Date</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700">Réussite</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700">Précision</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700">Statut</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((attempt) => {
              // ✅ Utiliser started_at si completed_at n'existe pas
              const date = attempt.completed_at || attempt.started_at
                ? new Date(attempt.completed_at || attempt.started_at).toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : '-';
              
              const success = `${attempt.correct_count}/${attempt.total_attempts}`;
              const accuracy = `${Math.round(attempt.session_accuracy || 0)}%`;
              const isSuccess = attempt.session_accuracy >= 100;
              const isCompleted = attempt.is_completed;
              
              return (
                <tr key={attempt.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-700">{date}</td>
                  <td className="py-3 px-4">
                    <span className={`font-medium ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
                      {success}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-medium ${isSuccess ? 'text-green-600' : 'text-orange-600'}`}>
                      {accuracy}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {isCompleted ? (
                      isSuccess ? (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          ✅ Réussi
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                          ❌ Échoué
                        </span>
                      )
                    ) : (
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                        ⏳ En cours
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}