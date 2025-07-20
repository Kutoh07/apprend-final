// Écran d'accueil d'un axe
// src/app/renaissance/[axeId]/page.tsx

'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

// Types temporaires
interface RenaissanceAxe {
  id: string;
  name: string;
  icon: string;
  description: string;
  isCustomizable: boolean;
}

interface UserAxeSelection {
  id: string;
  userId: string;
  axeId: string;
  customName?: string;
  customPhrases?: string[];
  selectionOrder: number;
  isStarted: boolean;
  isCompleted: boolean;
  selectedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

interface UserRenaissanceProgress {
  stage: 'discovery' | 'level1' | 'level2' | 'level3';
  stageCompleted: boolean;
  stageCompletedAt?: Date;
}

interface AxeStats {
  discoveryCompleted: boolean;
  discoveryAccuracy: number;
  level1Completed: boolean;
  level1Accuracy: number;
  level2Completed: boolean;
  level2Accuracy: number;
  level3Completed: boolean;
  level3Accuracy: number;
  overallProgress: number; // 0-100%
  totalAttempts: number;
  averageAccuracy: number;
  timeSpent: number; // en minutes
}

// Composant de progression circulaire
const CircularProgress = ({ 
  percentage, 
  size = 80, 
  strokeWidth = 8,
  color = 'purple' 
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colorClasses = {
    purple: 'stroke-purple-500',
    green: 'stroke-green-500',
    blue: 'stroke-blue-500',
    orange: 'stroke-orange-500'
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={colorClasses[color as keyof typeof colorClasses] || colorClasses.purple}
          style={{
            transition: 'stroke-dashoffset 0.5s ease-in-out',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-gray-700">{Math.round(percentage)}%</span>
      </div>
    </div>
  );
};

// Composant de carte d'étape
const StageCard = ({
  title,
  description,
  icon,
  isCompleted,
  isAvailable,
  accuracy,
  progress,
  onClick
}: {
  title: string;
  description: string;
  icon: string;
  isCompleted: boolean;
  isAvailable: boolean;
  accuracy?: number;
  progress: number;
  onClick: () => void;
}) => {
  return (
    <div
      onClick={isAvailable ? onClick : undefined}
      className={`
        relative p-6 rounded-2xl border-2 transition-all duration-200
        ${isCompleted 
          ? 'border-green-500 bg-green-50 shadow-lg' 
          : isAvailable 
            ? 'border-purple-300 bg-white hover:border-purple-500 hover:shadow-md cursor-pointer transform hover:scale-105'
            : 'border-gray-200 bg-gray-50 opacity-60'
        }
      `}
    >
      {/* Badge de statut */}
      <div className="absolute -top-2 -right-2">
        {isCompleted ? (
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm">✓</span>
          </div>
        ) : isAvailable ? (
          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm">▶</span>
          </div>
        ) : (
          <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
            <span className="text-white text-sm">🔒</span>
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="text-center">
        <div className="text-4xl mb-4">{icon}</div>
        <h3 className="font-bold text-lg text-gray-800 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">{description}</p>

        {/* Progression */}
        <div className="mb-4">
          <CircularProgress 
            percentage={progress} 
            size={60} 
            strokeWidth={6}
            color={isCompleted ? 'green' : 'purple'}
          />
        </div>

        {/* Précision si disponible */}
        {isCompleted && accuracy !== undefined && (
          <div className="text-sm text-green-600 font-medium">
            Précision: {Math.round(accuracy)}%
          </div>
        )}

        {/* Action */}
        <div className="mt-4">
          {isCompleted ? (
            <span className="text-green-600 font-medium">✅ Complété</span>
          ) : isAvailable ? (
            <span className="text-purple-600 font-medium">
              {progress > 0 ? '📖 Continuer' : '🚀 Commencer'}
            </span>
          ) : (
            <span className="text-gray-500">🔒 Verrouillé</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default function AxePage({ params }: { params: { axeId: string } | Promise<{ axeId: string }> }) {
  const router = useRouter();
  const { axeId } = use(params) as { axeId: string };
  const [axe, setAxe] = useState<RenaissanceAxe | null>(null);
  const [userSelection, setUserSelection] = useState<UserAxeSelection | null>(null);
  const [stats, setStats] = useState<AxeStats | null>(null);
  const [progress, setProgress] = useState<UserRenaissanceProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadAxeData();
  }, [axeId]);

  const loadAxeData = async () => {
    try {
      // Vérifier l'authentification
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        router.push('/auth');
        return;
      }

      setUserId(session.user.id);

      // Charger les informations de l'axe
      const { data: axeData, error: axeError } = await supabase
        .from('renaissance_axes')
        .select('*')
        .eq('id', axeId)
        .single();

      if (axeError || !axeData) {
        console.error('Erreur axe:', axeError);
        router.push('/renaissance');
        return;
      }

      // Charger la sélection utilisateur
      const { data: selectionData, error: selectionError } = await supabase
        .from('user_renaissance_selection')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('axe_id', axeId)
        .single();

      if (selectionError || !selectionData) {
        const msg = selectionError?.message || 'non sélectionné';
        console.error('Axe non sélectionné:', msg);
        router.push('/renaissance/selection');
        return;
      }

      // Charger les progrès
      const { data: progressData, error: progressError } = await supabase
        .from('user_renaissance_progress')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('axe_id', axeId);

      if (progressError) {
        console.error('Erreur progrès:', progressError);
      }

      // Construire les données
      setAxe({
        id: axeData.id,
        name: axeData.name,
        icon: axeData.icon,
        description: axeData.description,
        isCustomizable: axeData.is_customizable
      });

      setUserSelection({
        id: selectionData.id,
        userId: selectionData.user_id,
        axeId: selectionData.axe_id,
        customName: selectionData.custom_name,
        customPhrases: selectionData.custom_phrases,
        selectionOrder: selectionData.selection_order,
        isStarted: selectionData.is_started,
        isCompleted: selectionData.is_completed,
        selectedAt: new Date(selectionData.selected_at),
        startedAt: selectionData.started_at ? new Date(selectionData.started_at) : undefined,
        completedAt: selectionData.completed_at ? new Date(selectionData.completed_at) : undefined
      });

      if (progressData) {
        setProgress(progressData.map(p => ({
          stage: p.stage,
          stageCompleted: p.stage_completed,
          stageCompletedAt: p.stage_completed_at ? new Date(p.stage_completed_at) : undefined
        })));
      }

      // Calculer les statistiques
      calculateStats(progressData || []);

    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      router.push('/renaissance');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (progressData: any[]) => {
    const discoveryProgress = progressData.find(p => p.stage === 'discovery');
    const level1Progress = progressData.find(p => p.stage === 'level1');
    const level2Progress = progressData.find(p => p.stage === 'level2');
    const level3Progress = progressData.find(p => p.stage === 'level3');

    // Calculer progression globale (Découverte 30% + Encrage 70%)
    let overallProgress = 0;
    if (discoveryProgress?.stage_completed) overallProgress += 30;
    if (level1Progress?.stage_completed) overallProgress += 23.33; // 70/3
    if (level2Progress?.stage_completed) overallProgress += 23.33;
    if (level3Progress?.stage_completed) overallProgress += 23.34;

    const stats: AxeStats = {
      discoveryCompleted: discoveryProgress?.stage_completed || false,
      discoveryAccuracy: 85, // À calculer depuis les tentatives
      level1Completed: level1Progress?.stage_completed || false,
      level1Accuracy: 88,
      level2Completed: level2Progress?.stage_completed || false,
      level2Accuracy: 92,
      level3Completed: level3Progress?.stage_completed || false,
      level3Accuracy: 95,
      overallProgress: Math.round(overallProgress),
      totalAttempts: 0, // À calculer
      averageAccuracy: 90,
      timeSpent: 45 // À calculer
    };

    setStats(stats);
  };

  const handleStartAxe = async () => {
    if (!userId || !userSelection) return;

    try {
      // Marquer l'axe comme démarré
      await supabase
        .from('user_renaissance_selection')
        .update({
          is_started: true,
          started_at: new Date().toISOString()
        })
        .eq('id', userSelection.id);

      // Rediriger vers la découverte
      router.push(`/renaissance/${axeId}/discovery`);

    } catch (error) {
      console.error('Erreur lors du démarrage:', error);
    }
  };

  const handleStageClick = (stage: string) => {
    if (stage === 'discovery') {
      router.push(`/renaissance/${axeId}/discovery`);
    } else {
      router.push(`/renaissance/${axeId}/encrage?level=${stage}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔄</div>
          <div className="text-2xl text-purple-600">Chargement de l'axe...</div>
        </div>
      </div>
    );
  }

  if (!axe || !userSelection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-2xl text-red-600">Axe non trouvé</div>
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

  const discoveryProgress = progress.find(p => p.stage === 'discovery');
  const level1Progress = progress.find(p => p.stage === 'level1');
  const level2Progress = progress.find(p => p.stage === 'level2');
  const level3Progress = progress.find(p => p.stage === 'level3');

  const isDiscoveryAvailable = true;
  const isLevel1Available = discoveryProgress?.stageCompleted || false;
  const isLevel2Available = level1Progress?.stageCompleted || false;
  const isLevel3Available = level2Progress?.stageCompleted || false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => router.push('/renaissance')}
            className="mb-4 text-purple-600 hover:text-purple-800 font-medium"
          >
            ← Retour à Renaissance
          </button>
          
          <div className="text-6xl mb-4">{axe.icon}</div>
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              {userSelection.customName || axe.name}
            </span>
          </h1>
          <p className="text-lg text-gray-700 mb-6 max-w-2xl mx-auto">
            {axe.description}
          </p>

          {/* Progression globale */}
          {stats && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 inline-block">
              <div className="flex items-center gap-6">
                <CircularProgress 
                  percentage={stats.overallProgress} 
                  size={100} 
                  strokeWidth={10}
                />
                <div className="text-left">
                  <div className="text-2xl font-bold text-gray-800">{stats.overallProgress}%</div>
                  <div className="text-sm text-gray-600">Progression totale</div>
                  <div className="text-sm text-purple-600 mt-1">
                    Précision moyenne: {stats.averageAccuracy}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Première visite */}
        {!userSelection.isStarted && (
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 text-center">
            <div className="text-6xl mb-6">🚀</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Prêt à commencer votre transformation ?
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Cet axe comprend deux étapes : la Découverte (30%) et l'Encrage (70% en 3 niveaux).
              Vous devez compléter chaque étape dans l'ordre.
            </p>
            <button
              onClick={handleStartAxe}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-xl text-xl transition-colors"
            >
              Démarrer cet axe
            </button>
          </div>
        )}

        {/* Étapes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Découverte */}
          <StageCard
            title="Découverte"
            description="Mémorisez 10 phrases avec un flash de 0.5s"
            icon="🧠"
            isCompleted={discoveryProgress?.stageCompleted || false}
            isAvailable={isDiscoveryAvailable}
            accuracy={stats?.discoveryAccuracy}
            progress={discoveryProgress?.stageCompleted ? 100 : 0}
            onClick={() => handleStageClick('discovery')}
          />

          {/* Niveau 1 */}
          <StageCard
            title="Encrage Niveau 1"
            description="Flash de 3 secondes par phrase"
            icon="⚡"
            isCompleted={level1Progress?.stageCompleted || false}
            isAvailable={isLevel1Available}
            accuracy={stats?.level1Accuracy}
            progress={level1Progress?.stageCompleted ? 100 : 0}
            onClick={() => handleStageClick('level1')}
          />

          {/* Niveau 2 */}
          <StageCard
            title="Encrage Niveau 2"
            description="Flash de 1.5 secondes par phrase"
            icon="⚡⚡"
            isCompleted={level2Progress?.stageCompleted || false}
            isAvailable={isLevel2Available}
            accuracy={stats?.level2Accuracy}
            progress={level2Progress?.stageCompleted ? 100 : 0}
            onClick={() => handleStageClick('level2')}
          />

          {/* Niveau 3 */}
          <StageCard
            title="Encrage Niveau 3"
            description="Flash de 0.5 secondes par phrase"
            icon="⚡⚡⚡"
            isCompleted={level3Progress?.stageCompleted || false}
            isAvailable={isLevel3Available}
            accuracy={stats?.level3Accuracy}
            progress={level3Progress?.stageCompleted ? 100 : 0}
            onClick={() => handleStageClick('level3')}
          />
        </div>

        {/* Phrases personnalisées */}
        {userSelection.customPhrases && userSelection.customPhrases.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-bold text-purple-600 mb-4">
              Vos phrases personnalisées
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {userSelection.customPhrases.map((phrase, index) => (
                <div key={index} className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                  <span className="font-medium text-purple-700">{index + 1}.</span>
                  <span className="ml-2 text-gray-800">{phrase}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statistiques détaillées */}
        {stats && userSelection.isStarted && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Vos statistiques</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalAttempts}</div>
                <div className="text-sm text-gray-600">Tentatives totales</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.averageAccuracy}%</div>
                <div className="text-sm text-gray-600">Précision moyenne</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.timeSpent}min</div>
                <div className="text-sm text-gray-600">Temps passé</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {progress.filter(p => p.stageCompleted).length}/4
                </div>
                <div className="text-sm text-gray-600">Étapes complétées</div>
              </div>
            </div>
          </div>
        )}

        {/* Axe complété */}
        {userSelection.isCompleted && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl shadow-xl p-8 text-center mt-8">
            <div className="text-6xl mb-6">🎉</div>
            <h2 className="text-3xl font-bold text-green-700 mb-4">
              Félicitations ! Axe complété
            </h2>
            <p className="text-lg text-green-600 mb-6">
              Vous avez terminé cet axe avec succès. Vos nouvelles croyances sont maintenant ancrées !
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/renaissance')}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                Choisir un autre axe
              </button>
              <button
                onClick={() => router.push('/renaissance/stats')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                Voir mes statistiques
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}