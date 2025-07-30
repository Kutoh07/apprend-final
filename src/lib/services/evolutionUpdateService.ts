// src/lib/services/evolutionUpdateService.ts

import { supabase } from '../supabase';

export class EvolutionUpdateService {
  
  /**
   * Met à jour les statistiques d'évolution après une action utilisateur
   */
  static async updateUserActivity(userId: string, activityType: 'programme_entry' | 'renaissance_attempt', data: any) {
    console.log('🔄 Mise à jour de l\'activité utilisateur:', { userId, activityType, data });
    
    try {
      // Vérifier d'abord si les tables existent
      const tablesExist = await this.checkEvolutionTablesExist();
      if (!tablesExist) {
        console.warn('⚠️ Tables d\'évolution non disponibles, mise à jour ignorée');
        return;
      }

      // Mapper les types d'activité vers les valeurs autorisées par la contrainte DB
      // Selon le schéma: CHECK (activity_type IN ('programme', 'renaissance', 'global'))
      const activityTypeMapping = {
        'programme_entry': 'programme',     // Mapper vers 'programme'
        'renaissance_attempt': 'renaissance' // Mapper vers 'renaissance'
      };

      const mappedActivityType = activityTypeMapping[activityType] || 'global';

      // 1. Mettre à jour la timeline d'activité
      await this.updateActivityTimeline(userId, mappedActivityType, data);
      
      // 2. Mettre à jour la heatmap d'activité
      await this.updateActivityHeatmap(userId);
      
      // 3. Vérifier et débloquer de nouveaux achievements
      await this.checkAndUnlockAchievements(userId);
      
      // 4. Mettre à jour les statistiques de motivation
      await this.updateMotivationStats(userId);
      
      console.log('✅ Statistiques d\'évolution mises à jour avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour des statistiques:', error);
      // Ne pas faire échouer l'opération principale pour une erreur de stats
      console.warn('⚠️ Mise à jour des statistiques ignorée à cause de l\'erreur');
    }
  }

  /**
   * Vérifie si les tables d'évolution existent
   */
  private static async checkEvolutionTablesExist(): Promise<boolean> {
    try {
      // Tester une simple requête sur une table
      const { error } = await supabase
        .from('user_activity_timeline')
        .select('id')
        .limit(1);
      
      return !error || !error.message.includes('does not exist');
    } catch (err) {
      return false;
    }
  }

  /**
   * Met à jour la timeline d'activité
   */
  private static async updateActivityTimeline(userId: string, activityType: string, data: any) {
    try {
      // Adapter au vrai schéma de la table user_activity_timeline
      const timelineEntry = {
        user_id: userId,
        activity_type: activityType,
        date: new Date().toISOString().split('T')[0], // Format YYYY-MM-DD pour la contrainte NOT NULL
        created_at: new Date().toISOString()
        // Note: activity_data n'existe pas dans le vrai schéma, on l'enlève
      };

      const { error } = await supabase
        .from('user_activity_timeline')
        .insert(timelineEntry);

      if (error) {
        console.error('Erreur lors de la mise à jour de la timeline:', error);
        throw error;
      }
    } catch (err) {
      console.error('Erreur timeline:', err);
      throw err;
    }
  }

  /**
   * Met à jour la heatmap d'activité quotidienne
   */
  private static async updateActivityHeatmap(userId: string) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Compter les activités du jour
      const { count } = await supabase
        .from('user_activity_timeline')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', today);

      const activityCount = count || 0;
      
      // Déterminer le niveau d'activité
      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (activityCount > 0) level = 1;
      if (activityCount >= 3) level = 2;
      if (activityCount >= 5) level = 3;
      if (activityCount >= 10) level = 4;

      // Upsert dans la heatmap
      const { error } = await supabase
        .from('user_activity_heatmap')
        .upsert({
          user_id: userId,
          date: today,
          activity_count: activityCount,
          activity_level: level,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,date'
        });

      if (error) {
        console.error('Erreur lors de la mise à jour de la heatmap:', error);
        throw error;
      }
    } catch (err) {
      console.error('Erreur heatmap:', err);
      throw err;
    }
  }

  /**
   * Vérifie et débloque de nouveaux achievements
   */
  private static async checkAndUnlockAchievements(userId: string) {
    // Récupérer les statistiques actuelles
    const { data: progressData } = await supabase
      .from('subpart_progress')
      .select('*')
      .eq('user_id', userId);

    const { data: programmeEntries } = await supabase
      .from('programme_entries')
      .select('*')
      .eq('user_id', userId);

    const { data: existingAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId);

    const unlockedIds = existingAchievements?.map(a => a.achievement_id) || [];

    // Définir les achievements disponibles
    const achievements = this.getAvailableAchievements(progressData || [], programmeEntries || []);
    
    // Débloquer les nouveaux achievements
    for (const achievement of achievements) {
      if (!unlockedIds.includes(achievement.id) && achievement.unlocked) {
        await supabase
          .from('user_achievements')
          .insert({
            user_id: userId,
            achievement_id: achievement.id,
            achievement_title: achievement.title,
            achievement_description: achievement.description,
            achievement_type: achievement.type,
            achievement_rarity: achievement.rarity,
            unlocked_at: new Date().toISOString()
          });
        
        console.log(`🏆 Nouvel achievement débloqué: ${achievement.title}`);
      }
    }
  }

  /**
   * Calcule les achievements disponibles
   */
  private static getAvailableAchievements(progressData: any[], programmeEntries: any[]) {
    const completedModules = progressData.filter(p => p.completed).length;
    const totalWords = programmeEntries.reduce((acc, entry) => acc + (entry.word_count || 0), 0);
    const totalEntries = programmeEntries.length;

    const achievements = [];

    // Achievement: Premier module
    if (completedModules >= 1) {
      achievements.push({
        id: 'first_module',
        title: 'Premier pas',
        description: 'Premier module complété',
        type: 'completion',
        rarity: 1,
        unlocked: true
      });
    }

    // Achievement: 500 mots
    if (totalWords >= 500) {
      achievements.push({
        id: 'wordsmith_500',
        title: 'Écrivain débutant',
        description: '500 mots écrits',
        type: 'milestone',
        rarity: 1,
        unlocked: true
      });
    }

    // Achievement: 1000 mots
    if (totalWords >= 1000) {
      achievements.push({
        id: 'wordsmith_1000',
        title: 'Écrivain confirmé',
        description: '1000 mots écrits',
        type: 'milestone',
        rarity: 2,
        unlocked: true
      });
    }

    // Achievement: 50% du programme
    if (completedModules >= 4) {
      achievements.push({
        id: 'half_programme',
        title: 'À mi-chemin',
        description: '50% du programme complété',
        type: 'completion',
        rarity: 3,
        unlocked: true
      });
    }

    // Achievement: Programme complet
    if (completedModules >= 8) {
      achievements.push({
        id: 'programme_complete',
        title: 'Maître du programme',
        description: 'Programme 100% complété',
        type: 'completion',
        rarity: 5,
        unlocked: true
      });
    }

    // Achievement: Productivité
    if (totalEntries >= 50) {
      achievements.push({
        id: 'productive_writer',
        title: 'Écrivain productif',
        description: '50 entrées réalisées',
        type: 'milestone',
        rarity: 3,
        unlocked: true
      });
    }

    return achievements;
  }

  /**
   * Met à jour les statistiques de motivation
   */
  private static async updateMotivationStats(userId: string) {
    // Calculer les streaks
    const streak = await this.calculateCurrentStreak(userId);
    
    // Calculer les améliorations
    const improvements = await this.calculateImprovements(userId);
    
    // Upsert les statistiques
    const { error } = await supabase
      .from('user_motivation_stats')
      .upsert({
        user_id: userId,
        current_streak: streak.current,
        longest_streak: streak.longest,
        weekly_goal_progress: streak.weeklyProgress,
        accuracy_improvement: improvements.accuracy,
        speed_improvement: improvements.speed,
        consistency_score: improvements.consistency,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Erreur lors de la mise à jour des stats de motivation:', error);
      throw error;
    }
  }

  /**
   * Calcule le streak actuel
   */
  private static async calculateCurrentStreak(userId: string): Promise<{current: number, longest: number, weeklyProgress: number}> {
    const { data: activities } = await supabase
      .from('user_activity_heatmap')
      .select('date, activity_count')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(365);

    if (!activities || activities.length === 0) {
      return { current: 0, longest: 0, weeklyProgress: 0 };
    }

    // Calculer le streak actuel
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < activities.length; i++) {
      const activityDate = new Date(activities[i].date);
      const hasActivity = activities[i].activity_count > 0;
      
      if (hasActivity) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
        
        if (i === 0) { // Activité aujourd'hui ou hier
          currentStreak = tempStreak;
        }
      } else {
        if (i === 0) { // Pas d'activité aujourd'hui
          currentStreak = 0;
        }
        tempStreak = 0;
      }
    }

    // Calculer le progrès hebdomadaire (objectif: 5 jours par semaine)
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    
    const weekActivities = activities.filter(a => {
      const activityDate = new Date(a.date);
      return activityDate >= weekStart && a.activity_count > 0;
    });
    
    const weeklyProgress = Math.min(100, (weekActivities.length / 5) * 100);

    return { current: currentStreak, longest: longestStreak, weeklyProgress };
  }

  /**
   * Calcule les améliorations
   */
  private static async calculateImprovements(userId: string): Promise<{accuracy: number, speed: number, consistency: number}> {
    // Pour l'instant, retourner des valeurs par défaut
    // À implémenter avec les données réelles au fil du temps
    return {
      accuracy: 0,
      speed: 0,
      consistency: 85
    };
  }

  /**
   * Fonction utilitaire pour appeler depuis les composants
   */
  static async onProgrammeEntryCreated(userId: string, subpartId: number, content: string, wordCount: number) {
    await this.updateUserActivity(userId, 'programme_entry', {
      subpart_id: subpartId,
      content_length: content.length,
      word_count: wordCount
    });
  }

  /**
   * Fonction utilitaire pour les tentatives Renaissance
   */
  static async onRenaissanceAttemptCompleted(userId: string, axeId: string, score: number, timeSpent: number) {
    await this.updateUserActivity(userId, 'renaissance_attempt', {
      axe_id: axeId,
      score,
      time_spent: timeSpent
    });
  }
}
