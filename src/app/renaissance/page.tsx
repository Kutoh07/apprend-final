// Écran d'accueil principal
// src/app/renaissance/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { programmeSupabaseService } from '../../lib/programmeSupabaseService';
import { renaissanceService } from '../../lib/services/renaissanceService';
import type { RenaissanceStats } from '@/lib/types/renaissance';
import { Home } from 'lucide-react';

// Composant pour les utilisateurs non éligibles
const NotEligibleMessage = () => {
  const router = useRouter();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Accès non autorisé
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Pour accéder à Renaissance, vous devez d'abord compléter 100% du programme principal.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/programme')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Continuer le programme
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Retour au dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant d'accueil Renaissance
const RenaissanceWelcome = ({ stats }: { stats: RenaissanceStats | null }) => {
  const router = useRouter();
  
  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Navigation et header */}
      <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <button
              onClick={() => router.push('/dashboard')}
              className="hover:text-purple-600 transition-colors"
            >
              Dashboard
            </button>
            <span>→</span>
            <span className="text-purple-600 font-medium">Renaissance</span>
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-teal-100 hover:bg-teal-200 text-teal-700 rounded-lg transition-colors"
          >
            <Home size={16} />
            <span>Retour Dashboard</span>
          </button>
        </div>
      </div>

      {/* Header avec papillon */}
      <div className="text-center mb-12">
        <div className="mb-8">
          <div className="text-8xl mb-4">🦋</div>
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              RENAISSANCE
            </span>
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Voici tes axes de renaissance personnalisés. Ils transformeront tes croyances et tes pensées, 
            tout en t'aidant à mieux gérer tes émotions.
          </p>
        </div>
      </div>

      {/* Statistiques si disponibles */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-purple-600">{stats.totalAxesSelected}</div>
            <div className="text-sm text-gray-600">Axes sélectionnés</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-600">{stats.axesCompleted}</div>
            <div className="text-sm text-gray-600">Axes complétés</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.totalProgress}%</div>
            <div className="text-sm text-gray-600">Progression totale</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-orange-600">{Math.round(stats.averageAccuracy)}%</div>
            <div className="text-sm text-gray-600">Précision moyenne</div>
          </div>
        </div>
      )}

      {/* Actions principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center hover:shadow-2xl transition-shadow">
          <div className="text-6xl mb-6">⚡</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {stats?.totalAxesSelected ? 'Continuer Renaissance' : 'Commencer Renaissance'}
          </h2>
          <p className="text-gray-600 mb-6">
            {stats?.totalAxesSelected 
              ? 'Poursuivez votre parcours de transformation personnelle'
              : 'Sélectionnez vos axes de renaissance et commencez votre transformation'
            }
          </p>
          <button
            onClick={() => router.push(stats?.totalAxesSelected ? '/renaissance/selection' : '/renaissance/selection')}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-8 rounded-xl text-lg transition-colors w-full"
          >
            {stats?.totalAxesSelected ? 'Continuer' : 'Mes axes de renaissance ici'}
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 text-center hover:shadow-2xl transition-shadow">
          <div className="text-6xl mb-6">📊</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Voir mes progrès</h2>
          <p className="text-gray-600 mb-6">
            Analysez votre évolution et vos performances dans chaque axe de renaissance
          </p>
          <button
            onClick={() => router.push('/renaissance/stats')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl text-lg transition-colors w-full"
            disabled={!stats?.totalAxesSelected}
          >
            {stats?.totalAxesSelected ? 'Voir les statistiques' : 'Pas encore de données'}
          </button>
        </div>
      </div>

      {/* Guide rapide */}
      <div className="mt-12 bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-8">
        <h3 className="text-2xl font-bold text-center text-gray-800 mb-6">Comment fonctionne Renaissance ?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h4 className="font-semibold text-lg mb-2">1. Sélection</h4>
            <p className="text-gray-600 text-sm">
              Choisissez 3 à 6 axes parmi les 16 disponibles selon vos besoins
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">🧠</div>
            <h4 className="font-semibold text-lg mb-2">2. Découverte</h4>
            <p className="text-gray-600 text-sm">
              Mémorisez 10 phrases avec un flash de 0.5 seconde (30% progression)
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">⚡</div>
            <h4 className="font-semibold text-lg mb-2">3. Encrage</h4>
            <p className="text-gray-600 text-sm">
              Maîtrisez les phrases en 3 niveaux : 3s → 1.5s → 0.5s (70% progression)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function RenaissancePage() {
  const router = useRouter();
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [userStats, setUserStats] = useState<RenaissanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      if (isActive) {
        await checkUserEligibility();
      }
    };

    load();

    return () => {
      isActive = false;
    };
  }, [router]);
    
  const checkUserEligibility = async () => {
    try {
      // Vérifier l'authentification
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        router.push('/auth');
        return;
      }

      const userId = session.user.id;

      // Vérifier si l'utilisateur a complété le programme à 100%
      const programmeData = await programmeSupabaseService.getProgramme(userId);
      
      if (!programmeData || programmeData.overallProgress < 100) {
        setIsEligible(false);
        setLoading(false);
        return;
      }

      setIsEligible(true);

      // Charger les statistiques Renaissance si l'utilisateur est éligible
      await loadUserStats(userId);
      
    } catch (error) {
      console.error('Erreur lors de la vérification d\'éligibilité:', error);
      setIsEligible(false);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async (userId: string) => {
    try {
      const stats = await renaissanceService.getUserStats(userId);
      setUserStats(stats);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🦋</div>
          <div className="text-2xl text-purple-600 font-semibold">Chargement de Renaissance...</div>
        </div>
      </div>
    );
  }

  if (isEligible === false) {
    return <NotEligibleMessage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100">
      <RenaissanceWelcome stats={userStats} />
    </div>
  );
}