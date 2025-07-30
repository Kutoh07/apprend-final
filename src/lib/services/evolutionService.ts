// src/lib/services/evolutionService.ts

import { supabase } from '../supabase';
import type { 
  EvolutionData, 
  ProgressStats, 
  MotivationStats, 
  TimeSeriesData, 
  HeatmapData,
  Achievement,
  SubPartProgressData,
  AxisProgressData,
  ModuleTimeData
} from '../types/evolution';

export class EvolutionService {
  
  /**
   * Version simplifiée avec données mockées pour développement
   */
  static async getEvolutionDataMock(userId: string): Promise<EvolutionData> {
    console.log('🔄 Récupération des données d\'évolution (mode mock) pour:', userId);
    
    // Simuler un délai de chargement
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Données mockées pour développement
    const mockData: EvolutionData = {
      progressStats: {
        overall: {
          completionPercentage: 65,
          totalSubPartsCompleted: 4,
          totalSubParts: 8,
          dailyProgress: 2,
          weeklyProgress: 12,
          monthlyProgress: 35
        },
        programme: {
          subPartProgress: [
            { id: 1, name: 'Personalisation', icon: '🎯', color: '#3B82F6', progress: 100, entriesCount: 15, wordsCount: 250, timeSpent: 45 },
            { id: 2, name: 'Ambitions', icon: '🚀', color: '#10B981', progress: 100, entriesCount: 12, wordsCount: 180, timeSpent: 35 },
            { id: 3, name: 'Croyances', icon: '💭', color: '#8B5CF6', progress: 85, entriesCount: 8, wordsCount: 120, timeSpent: 25 },
            { id: 4, name: 'Émotions', icon: '❤️', color: '#F59E0B', progress: 70, entriesCount: 6, wordsCount: 95, timeSpent: 20 },
            { id: 5, name: 'Pensées', icon: '🧠', color: '#EF4444', progress: 40, entriesCount: 3, wordsCount: 45, timeSpent: 12 },
            { id: 6, name: 'Environnement', icon: '🌍', color: '#06B6D4', progress: 20, entriesCount: 1, wordsCount: 15, timeSpent: 5 },
            { id: 7, name: 'Travail', icon: '💼', color: '#84CC16', progress: 0, entriesCount: 0, wordsCount: 0, timeSpent: 0 },
            { id: 8, name: 'Caractère', icon: '⭐', color: '#F97316', progress: 0, entriesCount: 0, wordsCount: 0, timeSpent: 0 }
          ],
          totalEntries: 45,
          totalWords: 705,
          timeSpentByModule: []
        },
        renaissance: {
          averageAccuracy: 87.5,
          progressByAxis: [],
          currentStreak: 5,
          totalTimePlayed: 120
        }
      },
      motivationStats: {
        proximityToGoal: {
          remainingSubParts: 4,
          remainingPercentage: 35,
          estimatedTimeToComplete: 120
        },
        achievements: [
          { id: 'first_module', title: 'Premier pas', description: 'Complétez votre premier module', icon: 'trophy', color: 'gold', type: 'completion', unlocked: true, unlockedAt: '2025-07-25T10:30:00Z', progress: 100, rarity: 1, requirement: '1 module complété' },
          { id: 'streak_7_days', title: 'Une semaine forte', description: 'Connectez-vous 7 jours consécutifs', icon: 'flame', color: 'orange', type: 'streak', unlocked: true, unlockedAt: '2025-07-28T09:15:00Z', progress: 100, rarity: 2, requirement: '7 jours consécutifs' },
          { id: 'half_programme', title: 'À mi-chemin', description: 'Complétez 50% du programme', icon: 'trophy', color: 'gold', type: 'completion', unlocked: true, unlockedAt: '2025-07-29T14:45:00Z', progress: 100, rarity: 3, requirement: '50% du programme' },
          { id: 'perfectionist', title: 'Perfectionniste', description: 'Atteignez 95% de précision moyenne', icon: 'award', color: 'green', type: 'special', unlocked: false, progress: 87, rarity: 4, requirement: '95% de précision' },
          { id: 'time_master', title: 'Maître du temps', description: 'Investissez 10 heures dans votre développement', icon: 'clock', color: 'blue', type: 'time_based', unlocked: false, progress: 75, rarity: 3, requirement: '10 heures investies' },
          { id: 'programme_complete', title: 'Maître du programme', description: 'Complétez 100% du programme', icon: 'trophy', color: 'gold', type: 'completion', unlocked: false, progress: 65, rarity: 5, requirement: '100% du programme' }
        ],
        improvements: {
          accuracyImprovement: 12.5,
          speedImprovement: 8.3,
          consistencyScore: 85.7
        },
        streaks: {
          currentStreak: 5,
          longestStreak: 12,
          weeklyGoalProgress: 78
        },
        totalTimeInvested: 450 // en minutes
      },
      timeSeriesData: {
        daily: this.generateMockTimeSeriesData('daily'),
        weekly: this.generateMockTimeSeriesData('weekly'),
        monthly: this.generateMockTimeSeriesData('monthly')
      },
      heatmapData: this.generateMockHeatmapData(),
      lastUpdated: new Date().toISOString()
    };
    
    return mockData;
  }

  /**
   * Génère des données de séries temporelles mockées
   */
  private static generateMockTimeSeriesData(period: 'daily' | 'weekly' | 'monthly'): TimeSeriesData[] {
    const data: TimeSeriesData[] = [];
    const days = period === 'daily' ? 30 : period === 'weekly' ? 12 : 6;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      if (period === 'daily') {
        date.setDate(date.getDate() - i);
      } else if (period === 'weekly') {
        date.setDate(date.getDate() - (i * 7));
      } else {
        date.setMonth(date.getMonth() - i);
      }
      
      // Génération de progression réaliste avec tendance croissante
      const baseProgress = Math.max(0, 65 - (i * 2));
      const variation = (Math.random() - 0.5) * 10;
      const progress = Math.min(100, Math.max(0, baseProgress + variation));
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.round(progress),
        label: period === 'daily' ? date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) 
                : period === 'weekly' ? `Sem. ${52 - i}`
                : date.toLocaleDateString('fr-FR', { month: 'short' })
      });
    }
    
    return data;
  }

  /**
   * Génère des données de heatmap mockées
   */
  private static generateMockHeatmapData(): HeatmapData[] {
    const data: HeatmapData[] = [];
    const today = new Date();
    
    // Générer 90 jours de données
    for (let i = 90; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Simuler plus d'activité en semaine qu'en weekend
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const baseActivity = isWeekend ? 1 : 3;
      const variation = Math.random() * 2;
      const activity = Math.round(baseActivity + variation);
      
      data.push({
        date: date.toISOString().split('T')[0],
        activity: activity,
        level: Math.min(4, activity) as 0 | 1 | 2 | 3 | 4
      });
    }
    
    return data;
  }

  /**
   * Récupère toutes les données d'évolution pour un utilisateur
   */
  static async getEvolutionData(userId: string): Promise<EvolutionData> {
    console.log('🔄 Récupération des données d\'évolution pour:', userId);
    
    try {
      // Récupérer les données en parallèle pour optimiser les performances
      const [
        progressStats,
        motivationStats,
        timeSeriesData,
        heatmapData
      ] = await Promise.all([
        this.getProgressStats(userId),
        this.getMotivationStats(userId),
        this.getTimeSeriesData(userId),
        this.getHeatmapData(userId)
      ]);

      return {
        progressStats,
        motivationStats,
        timeSeriesData,
        heatmapData,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des données d\'évolution:', error);
      throw error;
    }
  }

  /**
   * Calcule les statistiques de progression
   */
  private static async getProgressStats(userId: string): Promise<ProgressStats> {
    // Progression globale
    const { data: subpartProgress } = await supabase
      .from('subpart_progress')
      .select('*')
      .eq('user_id', userId);

    const { data: programmeEntries } = await supabase
      .from('programme_entries')
      .select('subpart_id, content, word_count, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    // Données Renaissance
    const { data: renaissanceStats } = await supabase
      .from('renaissance_dashboard_data')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Calculer la progression globale
    const totalSubParts = 8; // ACCEPTER a 8 modules
    const completedSubParts = subpartProgress?.filter(sp => sp.completed).length || 0;
    const overallCompletion = Math.round((completedSubParts / totalSubParts) * 100);

    // Progression par sous-partie
    const subPartProgressData: SubPartProgressData[] = subpartProgress?.map(sp => {
      const moduleEntries = programmeEntries?.filter(e => e.subpart_id === sp.subpart_id) || [];
      const wordsCount = moduleEntries.reduce((acc, entry) => acc + (entry.word_count || 0), 0);
      
      return {
        id: sp.subpart_id,
        name: this.getModuleName(sp.subpart_id),
        icon: this.getModuleIcon(sp.subpart_id),
        color: this.getModuleColor(sp.subpart_id),
        progress: sp.progress || 0,
        entriesCount: moduleEntries.length,
        wordsCount,
        timeSpent: this.calculateTimeSpent(moduleEntries)
      };
    }) || [];

    // Progression Renaissance
    const { data: axesData } = await supabase
      .from('user_axe_selections')
      .select('axe_id, axe_name, overall_progress, discovery_completed, level1_completed, level2_completed, level3_completed')
      .eq('user_id', userId);

    const renaissanceProgress: AxisProgressData[] = axesData?.map(axis => ({
      axisId: axis.axe_id,
      axisName: axis.axe_name,
      progress: axis.overall_progress || 0,
      accuracy: renaissanceStats?.average_accuracy || 0,
      timePlayed: 0, // À calculer depuis renaissance_attempts
      levelsCompleted: [axis.discovery_completed, axis.level1_completed, axis.level2_completed, axis.level3_completed].filter(Boolean).length
    })) || [];

    return {
      overall: {
        completionPercentage: overallCompletion,
        totalSubPartsCompleted: completedSubParts,
        totalSubParts,
        dailyProgress: await this.getDailyProgress(userId),
        weeklyProgress: await this.getWeeklyProgress(userId),
        monthlyProgress: await this.getMonthlyProgress(userId)
      },
      programme: {
        subPartProgress: subPartProgressData,
        totalEntries: programmeEntries?.length || 0,
        totalWords: programmeEntries?.reduce((acc, entry) => acc + (entry.word_count || 0), 0) || 0,
        timeSpentByModule: this.calculateTimeByModule(programmeEntries || [])
      },
      renaissance: {
        averageAccuracy: renaissanceStats?.average_accuracy || 0,
        progressByAxis: renaissanceProgress,
        currentStreak: renaissanceStats?.current_streak_days || 0,
        totalTimePlayed: renaissanceStats?.total_time_spent || 0
      }
    };
  }

  /**
   * Calcule les statistiques de motivation
   */
  private static async getMotivationStats(userId: string): Promise<MotivationStats> {
    const progressStats = await this.getProgressStats(userId);
    
    // Proximité de l'objectif
    const remainingSubParts = progressStats.overall.totalSubParts - progressStats.overall.totalSubPartsCompleted;
    const remainingPercentage = 100 - progressStats.overall.completionPercentage;
    
    // Achievements
    const achievements = await this.calculateAchievements(userId, progressStats);
    
    // Améliorations au fil du temps
    const improvements = await this.calculateImprovements(userId);
    
    // Streaks
    const streaks = await this.calculateStreaks(userId);
    
    // Temps total investi
    const totalTimeInvested = progressStats.programme.timeSpentByModule.reduce((acc, module) => acc + module.timeSpent, 0) + 
                             progressStats.renaissance.totalTimePlayed;

    return {
      proximityToGoal: {
        remainingSubParts,
        remainingPercentage,
        estimatedTimeToComplete: remainingSubParts * 30 // Estimation: 30 min par module
      },
      achievements,
      improvements,
      streaks,
      totalTimeInvested
    };
  }

  /**
   * Récupère les données de série temporelle
   */
  private static async getTimeSeriesData(userId: string): Promise<{daily: TimeSeriesData[], weekly: TimeSeriesData[], monthly: TimeSeriesData[]}> {
    const { data: entries } = await supabase
      .from('programme_entries')
      .select('created_at, word_count')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    const daily = this.groupByDay(entries || []);
    const weekly = this.groupByWeek(entries || []);
    const monthly = this.groupByMonth(entries || []);

    return { daily, weekly, monthly };
  }

  /**
   * Récupère les données de heatmap d'activité
   */
  private static async getHeatmapData(userId: string): Promise<HeatmapData[]> {
    const { data: entries } = await supabase
      .from('programme_entries')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());

    const { data: renaissanceAttempts } = await supabase
      .from('renaissance_attempts')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());

    return this.createHeatmapData([...(entries || []), ...(renaissanceAttempts || [])]);
  }

  // Méthodes utilitaires
  private static getModuleName(id: number): string {
    const names = {
      1: 'AMBITIONS', 2: 'CARACTÈRE', 3: 'CROYANCES', 4: 'ÉMOTIONS',
      5: 'PENSÉES', 6: 'TRAVAIL', 7: 'ENVIRONNEMENT', 8: 'RÉTENTION'
    };
    return names[id as keyof typeof names] || 'Module';
  }

  private static getModuleIcon(id: number): string {
    const icons = {
      1: '🎯', 2: '🚀', 3: '📣', 4: '🔥',
      5: '💭', 6: '📅', 7: '🌍', 8: '💡'
    };
    return icons[id as keyof typeof icons] || '📝';
  }

  private static getModuleColor(id: number): string {
    const colors = {
      1: 'from-pink-400 to-pink-600',
      2: 'from-purple-400 to-purple-600',
      3: 'from-orange-400 to-orange-600',
      4: 'from-red-400 to-red-600',
      5: 'from-gray-400 to-gray-600',
      6: 'from-blue-400 to-blue-600',
      7: 'from-green-400 to-green-600',
      8: 'from-yellow-400 to-yellow-600'
    };
    return colors[id as keyof typeof colors] || 'from-gray-400 to-gray-600';
  }

  private static calculateTimeSpent(entries: any[]): number {
    if (entries.length === 0) return 0;
    
    // Estimation basée sur le nombre d'entrées et leur longueur
    return entries.reduce((acc, entry) => {
      const wordCount = entry.word_count || 0;
      const estimatedTime = Math.max(5, wordCount / 50); // 50 mots par minute minimum 5 min
      return acc + estimatedTime;
    }, 0);
  }

  private static calculateTimeByModule(entries: any[]): ModuleTimeData[] {
    const moduleTime = entries.reduce((acc, entry) => {
      const moduleId = entry.subpart_id;
      const wordCount = entry.word_count || 0;
      const estimatedTime = Math.max(5, wordCount / 50);
      
      if (!acc[moduleId]) {
        acc[moduleId] = {
          moduleId,
          moduleName: this.getModuleName(moduleId),
          timeSpent: 0,
          lastActivity: entry.updated_at || entry.created_at
        };
      }
      
      acc[moduleId].timeSpent += estimatedTime;
      if (entry.updated_at > acc[moduleId].lastActivity) {
        acc[moduleId].lastActivity = entry.updated_at;
      }
      
      return acc;
    }, {} as Record<number, ModuleTimeData>);

    return Object.values(moduleTime);
  }

  private static async getDailyProgress(userId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('programme_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', today);
    
    return count || 0;
  }

  private static async getWeeklyProgress(userId: string): Promise<number> {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('programme_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', weekAgo);
    
    return count || 0;
  }

  private static async getMonthlyProgress(userId: string): Promise<number> {
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('programme_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', monthAgo);
    
    return count || 0;
  }

  private static async calculateAchievements(userId: string, progressStats: ProgressStats): Promise<Achievement[]> {
    const achievements: Achievement[] = [];

    // Achievement: Premier module complété
    if (progressStats.overall.totalSubPartsCompleted >= 1) {
      achievements.push({
        id: 'first_module',
        title: 'Premier pas',
        description: 'Premier module complété',
        icon: '🎯',
        color: 'from-green-400 to-green-600',
        type: 'completion',
        unlocked: true,
        unlockedAt: new Date().toISOString(),
        progress: 100,
        rarity: 1,
        requirement: '1 module complété'
      });
    }

    // Achievement: 1000 mots écrits
    if (progressStats.programme.totalWords >= 1000) {
      achievements.push({
        id: 'wordsmith',
        title: 'Écrivain en herbe',
        description: 'Plus de 1000 mots écrits',
        icon: '✍️',
        color: 'from-blue-400 to-blue-600',
        type: 'milestone',
        unlocked: true,
        unlockedAt: new Date().toISOString(),
        progress: 100,
        rarity: 2,
        requirement: '1000 mots écrits'
      });
    }

    // Achievement: Streak de 7 jours
    if (progressStats.renaissance.currentStreak >= 7) {
      achievements.push({
        id: 'week_streak',
        title: 'Régularité exemplaire',
        description: '7 jours consécutifs d\'activité',
        icon: '🔥',
        color: 'from-orange-400 to-orange-600',
        type: 'streak',
        unlocked: true,
        unlockedAt: new Date().toISOString(),
        progress: 100,
        rarity: 3,
        requirement: '7 jours consécutifs'
      });
    }

    return achievements;
  }

  private static async calculateImprovements(userId: string) {
    // Calculs d'amélioration basés sur les données historiques
    return {
      accuracyImprovement: 15, // À calculer depuis renaissance_attempts
      speedImprovement: 20,
      consistencyScore: 85
    };
  }

  private static async calculateStreaks(userId: string) {
    // Calculs de streaks
    return {
      currentStreak: 5,
      longestStreak: 12,
      weeklyGoalProgress: 75
    };
  }

  private static groupByDay(entries: any[]): TimeSeriesData[] {
    const groups = entries.reduce((acc, entry) => {
      const date = entry.created_at.split('T')[0];
      if (!acc[date]) acc[date] = { count: 0, words: 0 };
      acc[date].count++;
      acc[date].words += entry.word_count || 0;
      return acc;
    }, {} as Record<string, { count: number; words: number }>);

    return Object.entries(groups).map(([date, data]) => ({
      date,
      value: (data as { count: number; words: number }).count,
      label: `${(data as { count: number; words: number }).count} entrées, ${(data as { count: number; words: number }).words} mots`
    }));
  }

  private static groupByWeek(entries: any[]): TimeSeriesData[] {
    // Groupement par semaine
    const groups = entries.reduce((acc, entry) => {
      const date = new Date(entry.created_at);
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!acc[weekKey]) acc[weekKey] = { count: 0, words: 0 };
      acc[weekKey].count++;
      acc[weekKey].words += entry.word_count || 0;
      return acc;
    }, {} as Record<string, { count: number; words: number }>);

    return Object.entries(groups).map(([date, data]) => ({
      date,
      value: (data as { count: number; words: number }).count,
      label: `Semaine: ${(data as { count: number; words: number }).count} entrées`
    }));
  }

  private static groupByMonth(entries: any[]): TimeSeriesData[] {
    // Groupement par mois
    const groups = entries.reduce((acc, entry) => {
      const date = entry.created_at.substring(0, 7); // YYYY-MM
      if (!acc[date]) acc[date] = { count: 0, words: 0 };
      acc[date].count++;
      acc[date].words += entry.word_count || 0;
      return acc;
    }, {} as Record<string, { count: number; words: number }>);

    return Object.entries(groups).map(([date, data]) => ({
      date,
      value: (data as { count: number; words: number }).count,
      label: `${(data as { count: number; words: number }).count} entrées ce mois`
    }));
  }

  private static createHeatmapData(activities: any[]): HeatmapData[] {
    const today = new Date();
    const startDate = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
    const heatmapData: HeatmapData[] = [];

    // Créer une entrée pour chaque jour de l'année
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayActivities = activities.filter(a => a.created_at.startsWith(dateStr));
      const activityCount = dayActivities.length;
      
      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (activityCount > 0) level = 1;
      if (activityCount >= 3) level = 2;
      if (activityCount >= 5) level = 3;
      if (activityCount >= 10) level = 4;

      heatmapData.push({
        date: dateStr,
        activity: activityCount,
        level
      });
    }

    return heatmapData;
  }
}
