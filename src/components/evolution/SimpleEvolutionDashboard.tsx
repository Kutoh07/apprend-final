// src/components/evolution/SimpleEvolutionDashboard.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Target, Clock, TrendingUp, Award, Flame, Trophy } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ModernCard, CardContent, CardHeader } from '@/components/ui/ModernCard';
import { useSimpleEvolutionData } from '@/hooks/useSimpleEvolutionData';
import { useAuth } from '@/hooks/useAuth';
import { UserProfileService } from '@/lib/userProfileService';
import { programmeSupabaseService } from '@/lib/programmeSupabaseService';
import { renaissanceService } from '@/lib/services/renaissanceService';
import { supabase } from '@/lib/supabase';
import type { RenaissanceStats } from '@/lib/types/renaissance';
import type { ProgrammeData } from '@/lib/types/programme';

// Fonction pour calculer le temps réel investi
const calculateRealTimeInvested = async (userId: string): Promise<{
  totalTimeMinutes: number;
  programmeTime: number;
  renaissanceTime: number;
}> => {
  try {
    let programmeTime = 0;
    let renaissanceTime = 0;

    // 1. Temps du programme depuis les entrées
    const { data: programmeEntries, error: programmeError } = await supabase
      .from('programme_entries')
      .select('created_at, word_count')
      .eq('user_id', userId);

    if (!programmeError && programmeEntries) {
      // Estimation : 1 minute pour 50 mots (vitesse moyenne de frappe)
      programmeTime = programmeEntries.reduce((total, entry) => {
        return total + Math.round((entry.word_count || 0) / 50);
      }, 0);
    }

    // 2. Temps Renaissance depuis les sessions de jeu
    try {
      if (renaissanceService && typeof renaissanceService.getUserStats === 'function') {
        const renaissanceStats = await renaissanceService.getUserStats(userId);
        renaissanceTime = renaissanceStats?.totalTimeSpent || 0;
      }
    } catch (error) {
      console.warn('⚠️ Erreur récupération temps Renaissance:', error);
    }

    const totalTimeMinutes = programmeTime + renaissanceTime;

    console.log('⏱️ Calcul temps réel investi (Simple):', {
      programme: `${programmeTime}min`,
      renaissance: `${renaissanceTime}min`,
      total: `${totalTimeMinutes}min (${Math.round(totalTimeMinutes / 60)}h${totalTimeMinutes % 60}min)`
    });

    return {
      totalTimeMinutes,
      programmeTime,
      renaissanceTime
    };
  } catch (error) {
    console.error('❌ Erreur calcul temps investi (Simple):', error);
    return {
      totalTimeMinutes: 0,
      programmeTime: 0,
      renaissanceTime: 0
    };
  }
};

// Fonction pour calculer l'amélioration de vitesse réelle
const calculateRealSpeedImprovement = async (userId: string): Promise<number> => {
  try {
    // Récupérer les entrées des 60 derniers jours
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const { data: entries, error } = await supabase
      .from('programme_entries')
      .select('created_at, word_count')
      .eq('user_id', userId)
      .gte('created_at', sixtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (error || !entries || entries.length < 10) {
      console.log('📊 Pas assez de données pour calculer l\'amélioration de vitesse (Simple)');
      return 0;
    }

    // Diviser en deux périodes : premiers 30 jours vs derniers 30 jours
    const midpoint = Math.floor(entries.length / 2);
    const firstHalf = entries.slice(0, midpoint);
    const secondHalf = entries.slice(midpoint);

    // Calculer la vitesse moyenne (mots par minute) pour chaque période
    const calculateAvgSpeed = (entriesGroup: any[]) => {
      if (entriesGroup.length === 0) return 0;
      
      const totalWords = entriesGroup.reduce((sum, entry) => sum + (entry.word_count || 0), 0);
      const totalSessions = entriesGroup.length;
      
      // Estimation : 1 session = 10 minutes en moyenne
      const estimatedTotalMinutes = totalSessions * 10;
      
      return estimatedTotalMinutes > 0 ? totalWords / estimatedTotalMinutes : 0;
    };

    const firstHalfSpeed = calculateAvgSpeed(firstHalf);
    const secondHalfSpeed = calculateAvgSpeed(secondHalf);

    // Calculer l'amélioration en pourcentage
    let improvement = 0;
    if (firstHalfSpeed > 0) {
      improvement = Math.round(((secondHalfSpeed - firstHalfSpeed) / firstHalfSpeed) * 100);
    }

    console.log('📈 Calcul amélioration vitesse (Simple):', {
      premiere_periode: `${firstHalfSpeed.toFixed(1)} mots/min`,
      seconde_periode: `${secondHalfSpeed.toFixed(1)} mots/min`,
      amelioration: `${improvement}%`
    });

    return Math.max(0, improvement);
  } catch (error) {
    console.error('❌ Erreur calcul amélioration vitesse (Simple):', error);
    return 0;
  }
};

// Fonction pour calculer la progression de personnalisation
const calculatePersonnalisationProgress = async (): Promise<number> => {
  try {
    const { data: userProfile, error } = await UserProfileService.getUserProfile();
    
    if (error || !userProfile) {
      console.log('📊 Aucun profil trouvé, progression personnalisation: 0%');
      return 0;
    }
    
    // Vérifier les champs obligatoires: name, birthYear, profession
    const requiredFields = [
      userProfile.name,
      userProfile.birthYear,
      userProfile.profession
    ];
    
    const completedFields = requiredFields.filter(field => 
      field !== null && field !== undefined && field !== ''
    ).length;
    
    const progress = Math.round((completedFields / requiredFields.length) * 100);
    
    console.log('📊 Progression personnalisation:', {
      name: userProfile.name ? '✅' : '❌',
      birthYear: userProfile.birthYear ? '✅' : '❌',
      profession: userProfile.profession ? '✅' : '❌',
      progression: `${progress}%`
    });
    
    return progress;
  } catch (error) {
    console.error('❌ Erreur calcul progression personnalisation:', error);
    return 0;
  }
};

// Fonction pour calculer la progression globale réelle avec détails
const calculateGlobalProgressWithDetails = async (userId: string): Promise<{
  globalProgress: number;
  personnalisation: { progress: number; completedThematics: number; totalThematics: number };
  programme: { progress: number; completedModules: number; totalModules: number };
  renaissance: { progress: number; completedAxes: number; totalAxes: number };
  trend: number;
}> => {
  try {
    // Progression Personnalisation (calculée dynamiquement)
    const personnalisationProgress = await calculatePersonnalisationProgress();
    
    // Pour la personnalisation, on considère 3 thématiques : profil, objectifs, préférences
    const completedPersonnalisationThematics = Math.round((personnalisationProgress / 100) * 3);
    
    // Progression Programme (depuis les données Supabase)
    const programmeData = await programmeSupabaseService.getProgramme(userId);
    const programmeProgress = programmeData?.overallProgress || 0;
    const completedProgrammeModules = programmeData?.subParts?.filter(sp => sp.progress === 100).length || 0;
    const totalProgrammeModules = programmeData?.subParts?.length || 8;
    
    // Progression Renaissance (depuis les stats Renaissance)
    let renaissanceProgress = 0;
    let completedRenaissanceAxes = 0;
    let totalRenaissanceAxes = 3; // Par défaut 3 axes
    
    try {
      if (renaissanceService && typeof renaissanceService.getUserStats === 'function') {
        const renaissanceStats = await renaissanceService.getUserStats(userId);
        renaissanceProgress = renaissanceStats?.totalProgress || 0;
        
        // Récupérer les axes pour compter les complétés
        const { data: axesData } = await supabase
          .from('user_axe_selections')
          .select('overall_progress')
          .eq('user_id', userId);
        
        if (axesData && axesData.length > 0) {
          totalRenaissanceAxes = axesData.length;
          completedRenaissanceAxes = axesData.filter((axe: any) => axe.overall_progress === 100).length;
        }
      }
    } catch (error) {
      console.warn('⚠️ Erreur récupération stats Renaissance:', error);
      renaissanceProgress = 0;
    }
    
    // Moyenne des trois étapes
    const globalProgress = Math.round((personnalisationProgress + programmeProgress + renaissanceProgress) / 3);
    
    // Calculer une tendance basée sur la progression récente (simulation pour l'instant)
    const trend = Math.round(Math.random() * 20 + 5); // 5-25% de tendance positive
    
    console.log('📊 Calcul progression globale Evolution avec détails:', {
      personnalisation: `${personnalisationProgress}% (${completedPersonnalisationThematics}/3 thématiques)`,
      programme: `${programmeProgress}% (${completedProgrammeModules}/${totalProgrammeModules} modules)`,
      renaissance: `${renaissanceProgress}% (${completedRenaissanceAxes}/${totalRenaissanceAxes} axes)`,
      moyenne: globalProgress,
      tendance: `+${trend}%`
    });
    
    return {
      globalProgress,
      personnalisation: {
        progress: personnalisationProgress,
        completedThematics: completedPersonnalisationThematics,
        totalThematics: 3
      },
      programme: {
        progress: programmeProgress,
        completedModules: completedProgrammeModules,
        totalModules: totalProgrammeModules
      },
      renaissance: {
        progress: renaissanceProgress,
        completedAxes: completedRenaissanceAxes,
        totalAxes: totalRenaissanceAxes
      },
      trend
    };
  } catch (error) {
    console.error('❌ Erreur calcul progression globale avec détails:', error);
    return {
      globalProgress: 0,
      personnalisation: { progress: 0, completedThematics: 0, totalThematics: 3 },
      programme: { progress: 0, completedModules: 0, totalModules: 8 },
      renaissance: { progress: 0, completedAxes: 0, totalAxes: 3 },
      trend: 0
    };
  }
};

const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color = 'bg-gradient-to-r from-blue-500 to-purple-600',
  trend 
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: string;
  trend?: { value: number; positive: boolean; label: string };
}) => (
  <ModernCard variant="glass" className="hover:scale-105 transition-transform duration-300">
    <CardContent spacing="md">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white shadow-lg`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            trend.positive ? 'text-green-600' : 'text-red-600'
          }`}>
            <span>{trend.positive ? '+' : ''}{trend.value}%</span>
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-500">{subtitle}</p>
        )}
        {trend && (
          <p className="text-xs text-gray-500">{trend.label}</p>
        )}
      </div>
    </CardContent>
  </ModernCard>
);

const AchievementCard = ({ achievement, size = 'sm' }: {
  achievement: any;
  size?: 'sm' | 'md';
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'streak': return <Flame className="w-5 h-5" />;
      case 'completion': return <Trophy className="w-5 h-5" />;
      case 'milestone': return <Award className="w-5 h-5" />;
      default: return <Target className="w-5 h-5" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'streak': return 'from-orange-500 to-red-500';
      case 'completion': return 'from-yellow-500 to-orange-500';
      case 'milestone': return 'from-purple-500 to-pink-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <ModernCard variant="glass" className={`${achievement.unlocked ? 'ring-2 ring-yellow-300' : ''}`}>
      <CardContent spacing="sm">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${getColor(achievement.type)} 
                          flex items-center justify-center text-white
                          ${!achievement.unlocked ? 'grayscale opacity-50' : ''}`}>
            {getIcon(achievement.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={`text-sm font-semibold ${achievement.unlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                {achievement.title}
              </h4>
              {achievement.unlocked && (
                <div className="flex">
                  {[...Array(achievement.rarity)].map((_, i) => (
                    <div key={i} className="w-3 h-3 text-yellow-400">⭐</div>
                  ))}
                </div>
              )}
            </div>
            
            <p className={`text-xs ${achievement.unlocked ? 'text-gray-600' : 'text-gray-400'}`}>
              {achievement.description}
            </p>
            
            {achievement.unlockedAt && (
              <p className="text-xs text-gray-400 mt-1">
                Débloqué le {new Date(achievement.unlockedAt).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </ModernCard>
  );
};

const ActivityHeatmap = ({ data }: { data: any[] }) => {
  const getActivityColor = (level: number): string => {
    const colors = [
      'bg-gray-100', // Niveau 0
      'bg-blue-200', // Niveau 1
      'bg-blue-400', // Niveau 2
      'bg-blue-600', // Niveau 3
      'bg-blue-800'  // Niveau 4
    ];
    return colors[Math.min(level, 4)];
  };

  // Organiser en semaines
  const weeks: any[][] = [];
  let currentWeek: any[] = [];
  
  data.forEach((day, index) => {
    const dayOfWeek = new Date(day.date).getDay();
    
    if (dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
    
    currentWeek.push(day);
    
    if (index === data.length - 1) {
      weeks.push(currentWeek);
    }
  });

  return (
    <ModernCard variant="glass">
      <CardContent spacing="lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Activité des derniers mois</h3>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>Moins</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((level) => (
                <div key={level} className={`w-3 h-3 rounded-sm ${getActivityColor(level)}`} />
              ))}
            </div>
            <span>Plus</span>
          </div>
        </div>

        <div className="space-y-1">
          {weeks.slice(-12).map((week, weekIndex) => (
            <div key={weekIndex} className="flex gap-1">
              {week.map((day) => (
                <div
                  key={day.date}
                  className={`w-4 h-4 rounded-sm ${getActivityColor(day.level)} 
                            hover:ring-2 hover:ring-blue-300 transition-all duration-200 cursor-pointer`}
                  title={`${new Date(day.date).toLocaleDateString('fr-FR')} - ${day.activity} actions`}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {data.reduce((sum, day) => sum + day.activity, 0)}
              </p>
              <p className="text-sm text-gray-600">Actions totales</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {data.filter(day => day.activity > 0).length}
              </p>
              <p className="text-sm text-gray-600">Jours actifs</p>
            </div>
          </div>
        </div>
      </CardContent>
    </ModernCard>
  );
};

export default function SimpleEvolutionDashboard() {
  const { user } = useAuth();
  const { data, loading, error, refresh } = useSimpleEvolutionData(user?.id || '');
  const [globalProgressData, setGlobalProgressData] = useState<{
    globalProgress: number;
    personnalisation: { progress: number; completedThematics: number; totalThematics: number };
    programme: { progress: number; completedModules: number; totalModules: number };
    renaissance: { progress: number; completedAxes: number; totalAxes: number };
    trend: number;
  }>({
    globalProgress: 0,
    personnalisation: { progress: 0, completedThematics: 0, totalThematics: 3 },
    programme: { progress: 0, completedModules: 0, totalModules: 8 },
    renaissance: { progress: 0, completedAxes: 0, totalAxes: 3 },
    trend: 0
  });
  const [globalProgressLoading, setGlobalProgressLoading] = useState(true);
  
  // États pour les vraies données
  const [realTimeData, setRealTimeData] = useState<{
    totalTimeMinutes: number;
    programmeTime: number;
    renaissanceTime: number;
  }>({
    totalTimeMinutes: 0,
    programmeTime: 0,
    renaissanceTime: 0
  });
  const [speedImprovement, setSpeedImprovement] = useState<number>(0);
  const [realDataLoading, setRealDataLoading] = useState(true);

  // Calculer la progression globale réelle
  useEffect(() => {
    const loadGlobalProgress = async () => {
      if (user?.id) {
        setGlobalProgressLoading(true);
        try {
          const progressData = await calculateGlobalProgressWithDetails(user.id);
          setGlobalProgressData(progressData);
        } catch (error) {
          console.error('Erreur chargement progression globale:', error);
        } finally {
          setGlobalProgressLoading(false);
        }
      }
    };

    loadGlobalProgress();
  }, [user?.id]);

  // Charger les vraies données de temps et amélioration
  useEffect(() => {
    const loadRealData = async () => {
      if (user?.id) {
        setRealDataLoading(true);
        try {
          // Charger en parallèle le temps investi et l'amélioration de vitesse
          const [timeData, speedData] = await Promise.all([
            calculateRealTimeInvested(user.id),
            calculateRealSpeedImprovement(user.id)
          ]);
          
          setRealTimeData(timeData);
          setSpeedImprovement(speedData);
          
          console.log('✅ Données réelles chargées (Simple):', {
            temps: `${timeData.totalTimeMinutes}min`,
            amelioration: `${speedData}%`
          });
        } catch (error) {
          console.error('❌ Erreur chargement données réelles (Simple):', error);
        } finally {
          setRealDataLoading(false);
        }
      }
    };

    loadRealData();
  }, [user?.id]);

  // Si l'utilisateur n'est pas connecté
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ModernCard className="p-8 text-center">
          <p className="text-gray-600">Veuillez vous connecter pour voir vos statistiques d'évolution</p>
        </ModernCard>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-500 text-xl">❌</div>
          <h2 className="text-xl font-semibold text-gray-900">Erreur de chargement</h2>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={refresh}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const recentAchievements = data.achievements
    .filter((a: any) => a.unlocked)
    .sort((a: any, b: any) => (b.unlockedAt || '').localeCompare(a.unlockedAt || ''))
    .slice(0, 6);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-6 sm:space-y-8 py-6 sm:py-8">
        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Progression globale"
            value={globalProgressLoading ? "..." : `${globalProgressData.globalProgress}%`}
            subtitle={globalProgressLoading ? "..." : 
              `${globalProgressData.personnalisation.completedThematics}/3 thématiques • ${globalProgressData.programme.completedModules}/${globalProgressData.programme.totalModules} modules • ${globalProgressData.renaissance.completedAxes}/${globalProgressData.renaissance.totalAxes} axes`}
            icon={<Target className="w-6 h-6" />}
            color="bg-gradient-to-r from-blue-500 to-purple-600"
            trend={{
              value: globalProgressData.trend,
              positive: true,
              label: "Parcours intégral"
            }}
          />

          <MetricCard
            title="Temps investi"
            value={realDataLoading ? "..." : `${Math.round(realTimeData.totalTimeMinutes / 60)}h`}
            subtitle={realDataLoading ? "Calcul en cours..." : 
              `${realTimeData.totalTimeMinutes % 60}min • Programme: ${realTimeData.programmeTime}min • Renaissance: ${realTimeData.renaissanceTime}min`}
            icon={<Clock className="w-6 h-6" />}
            color="bg-gradient-to-r from-green-500 to-emerald-600"
            trend={realDataLoading ? undefined : {
              value: speedImprovement,
              positive: speedImprovement > 0,
              label: speedImprovement > 0 ? "efficacité en hausse" : "maintien du rythme"
            }}
          />

          <MetricCard
            title="Série actuelle"
            value={`${data.currentStreak} jours`}
            subtitle="Continuez comme ça !"
            icon={<Activity className="w-6 h-6" />}
            color="bg-gradient-to-r from-orange-500 to-red-600"
            trend={{
              value: 78,
              positive: true,
              label: "objectif hebdomadaire"
            }}
          />

          <MetricCard
            title="Récompenses"
            value={data.achievements.filter((a: any) => a.unlocked).length}
            subtitle={`sur ${data.achievements.length} disponibles`}
            icon={<Award className="w-6 h-6" />}
            color="bg-gradient-to-r from-yellow-500 to-orange-600"
          />
        </div>

        {/* Heatmap d'activité et récompenses récentes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ActivityHeatmap data={data.heatmapData} />
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Award className="w-5 h-5" />
              Récompenses récentes
            </h3>
            <div className="space-y-3">
              {recentAchievements.map((achievement: any) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  size="sm"
                />
              ))}
              {recentAchievements.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune récompense débloquée pour le moment</p>
                  <p className="text-sm">Continuez votre progression !</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section des compétences développées */}
        <div className="space-y-6">
          <ModernCard variant="glass">
            <CardHeader>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                Tes Compétences Développées
              </h2>
              <p className="text-gray-600">Progression dans les domaines clés de ton développement</p>
            </CardHeader>
            <CardContent spacing="lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { 
                    name: "CONFIANCE", 
                    value: 85,
                    color: "bg-gradient-to-r from-yellow-400 to-orange-500",
                    description: "Croire en ses capacités",
                    icon: "💪"
                  },
                  { 
                    name: "DISCIPLINE", 
                    value: 70,
                    color: "bg-gradient-to-r from-red-400 to-pink-500",
                    description: "Constance dans l'action",
                    icon: "🎯"
                  },
                  { 
                    name: "ACTION", 
                    value: 95,
                    color: "bg-gradient-to-r from-purple-400 to-indigo-500",
                    description: "Passage à l'acte",
                    icon: "🚀"
                  }
                ].map((skill, index) => (
                  <div key={skill.name} className="relative group">
                    {/* Carte de compétence avec effet hover */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      {/* Header de la compétence */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{skill.icon}</div>
                          <div>
                            <h3 className="font-bold text-gray-800 text-sm">{skill.name}</h3>
                            <p className="text-xs text-gray-500">{skill.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-800">{skill.value}%</div>
                        </div>
                      </div>
                      
                      {/* Barre de progression élégante */}
                      <div className="relative">
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${skill.color} transition-all duration-1000 ease-out relative rounded-full`}
                            style={{ width: `${skill.value}%` }}
                          >
                            {/* Effet de brillance */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                          </div>
                        </div>
                        
                        {/* Points de palier */}
                        <div className="absolute top-0 left-0 right-0 flex justify-between items-center h-3">
                          {[25, 50, 75].map((threshold) => (
                            <div 
                              key={threshold}
                              className={`w-1 h-3 rounded-full ${
                                skill.value >= threshold ? 'bg-white shadow-sm' : 'bg-gray-300'
                              }`}
                              style={{ marginLeft: `${threshold}%` }}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {/* Badge de niveau */}
                      <div className="mt-3 flex justify-between items-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          skill.value >= 80 ? 'bg-green-100 text-green-800' :
                          skill.value >= 60 ? 'bg-blue-100 text-blue-800' :
                          skill.value >= 40 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {skill.value >= 80 ? 'Expert' :
                           skill.value >= 60 ? 'Avancé' :
                           skill.value >= 40 ? 'Intermédiaire' :
                           'Débutant'}
                        </span>
                        
                        {/* Flèche de tendance */}
                        <div className="flex items-center gap-1 text-green-600">
                          <TrendingUp className="w-3 h-3" />
                          <span className="text-xs font-medium">+{Math.floor(Math.random() * 10 + 5)}%</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Effet de particules au hover */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </ModernCard>
        </div>

        {/* Détails par module */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-gray-900">Progression par module</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.moduleProgress.map((module: any) => (
              <MetricCard
                key={module.id}
                title={module.name}
                value={`${module.progress}%`}
                subtitle={`${module.entriesCount} entrées`}
                icon={<TrendingUp className="w-6 h-6" />}
                color={module.progress === 100 
                  ? "bg-gradient-to-r from-green-500 to-emerald-600"
                  : module.color
                }
              />
            ))}
          </div>
        </div>

        {/* Bouton de rafraîchissement */}
        <div className="text-center pt-8">
          <button
            onClick={refresh}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white 
                     rounded-lg font-medium hover:shadow-lg transition-all duration-300 
                     hover:scale-105 flex items-center gap-2 mx-auto"
          >
            <Activity className="w-5 h-5" />
            Actualiser les données
          </button>
        </div>
      </div>
    </div>
  );
}
