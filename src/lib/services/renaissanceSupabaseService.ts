// Service Supabase dédié
// src/lib/services/renaissanceSupabaseService.ts

import { supabase } from '../supabase';
import type {
  RenaissanceAxe,
  RenaissancePhrase,
  UserAxeSelection,
  UserRenaissanceProgress,
  PhraseAttempt,
  RenaissanceStats
} from '../types/renaissance';
import { axeSupabaseService } from './axeSupabaseService';

// Types additionnels pour ce service
interface AxeStats {
  axeId: string;
  axeName: string;
  overallProgress: number;
  discoveryCompleted: boolean;
  discoveryAccuracy: number;
  level1Completed: boolean;
  level1Accuracy: number;
  level2Completed: boolean;
  level2Accuracy: number;
  level3Completed: boolean;
  level3Accuracy: number;
  totalAttempts: number;
  averageAccuracy: number;
  timeSpent: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  commonMistakes?: string[];
}

interface ExtendedRenaissanceStats extends RenaissanceStats {
  discoveryCompleted: number;
  encrageCompleted: number;
  bestAccuracy: number;
  worstAccuracy: number;
  axesStats: AxeStats[];
  masteryLevel: 'débutant' | 'intermédiaire' | 'avancé' | 'expert';
  improvementTips: string[];
}

/**
 * Service Supabase dédié à Renaissance
 * Gère toutes les opérations de base de données pour le module Renaissance
 */
export class RenaissanceSupabaseService {
  /**
   * Récupère tous les axes disponibles
   */
  async getAxes(): Promise<RenaissanceAxe[]> {
    try {
      const axesWithoutPhrases = await axeSupabaseService.getAxes();
      // Convertir AxeWithoutPhrases[] vers RenaissanceAxe[] en ajoutant phrases: []
      return axesWithoutPhrases.map(axe => ({
        ...axe,
        phrases: [] // Les phrases seront chargées séparément si nécessaire
      }));
    } catch (error) {
      console.error('Erreur getAxes:', error);
      throw error;
    }
  }

  /**
   * Récupère un axe avec ses phrases
   */
  async getAxeWithPhrases(axeId: string): Promise<RenaissanceAxe | null> {
    const { data, error } = await supabase
      .from('renaissance_axes')
      .select('*, renaissance_phrases(*)')
      .eq('id', axeId)
      .single();
    if (error) return null;
    if (!data) return null;
    return {
      ...data,
      phrases: data.renaissance_phrases || []
    };
  }

  /**
   * Récupère les sélections d'axes d'un utilisateur
   */
  async getUserSelections(userId: string): Promise<UserAxeSelection[]> {
    try {
      const { data, error } = await supabase
        .from('user_renaissance_selection')
        .select('*')
        .eq('user_id', userId)
        .order('selection_order');

      if (error) {
        console.error('Erreur récupération sélections:', error);
        throw error;
      }

      return data?.map(s => ({
        id: s.id,
        userId: s.user_id,
        axeId: s.axe_id,
        customName: s.custom_name,
        customPhrases: s.custom_phrases,
        selectionOrder: s.selection_order,
        isStarted: s.is_started,
        isCompleted: s.is_completed,
        selectedAt: new Date(s.selected_at),
        startedAt: s.started_at ? new Date(s.started_at) : undefined,
        completedAt: s.completed_at ? new Date(s.completed_at) : undefined
      })) || [];

    } catch (error) {
      console.error('Erreur getUserSelections:', error);
      return [];
    }
  }

  /**
   * Récupère une sélection spécifique
   */
  async getUserSelection(userId: string, axeId: string): Promise<UserAxeSelection | null> {
    try {
      const { data, error } = await supabase
        .from('user_renaissance_selection')
        .select('*')
        .eq('user_id', userId)
        .eq('axe_id', axeId)
        .single();

      if (error) {
        console.error('Sélection non trouvée:', error);
        return null;
      }

      return {
        id: data.id,
        userId: data.user_id,
        axeId: data.axe_id,
        customName: data.custom_name,
        customPhrases: data.custom_phrases,
        selectionOrder: data.selection_order,
        isStarted: data.is_started,
        isCompleted: data.is_completed,
        selectedAt: new Date(data.selected_at),
        startedAt: data.started_at ? new Date(data.started_at) : undefined,
        completedAt: data.completed_at ? new Date(data.completed_at) : undefined
      };

    } catch (error) {
      console.error('Erreur getUserSelection:', error);
      return null;
    }
  }

  /**
   * Sauvegarde la sélection d'axes d'un utilisateur
   */
  async saveUserSelection(
    userId: string,
    selectedAxes: Array<{
      axeId: string;
      customName?: string;
      customPhrases?: string[];
    }>
  ): Promise<void> {
    try {
      // Supprimer les anciennes sélections
      await supabase
        .from('user_renaissance_selection')
        .delete()
        .eq('user_id', userId);

      // Créer les nouvelles sélections
      const selections = selectedAxes.map((selection, index) => ({
        user_id: userId,
        axe_id: selection.axeId,
        selection_order: index + 1,
        custom_name: selection.customName || null,
        custom_phrases: selection.customPhrases || null,
        is_started: false,
        is_completed: false,
        selected_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('user_renaissance_selection')
        .insert(selections);

      if (error) {
        console.error('Erreur sauvegarde sélection:', error.message || error);
        throw error;
      }

      console.log('✅ Sélection sauvegardée:', selections.length, 'axes');

    } catch (error) {
      console.error('Erreur saveUserSelection:', error instanceof Error ? error.message : error);
      throw error;
    }
  }

  /**
   * Marque un axe comme démarré
   */
  async markAxeAsStarted(userId: string, axeId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_renaissance_selection')
        .update({
          is_started: true,
          started_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('axe_id', axeId);

      if (error) {
        console.error('Erreur markAxeAsStarted:', error);
        throw error;
      }

      console.log('✅ Axe marqué comme démarré:', axeId);

    } catch (error) {
      console.error('Erreur markAxeAsStarted:', error);
      throw error;
    }
  }

  /**
   * Marque un axe comme complété
   */
  async markAxeAsCompleted(userId: string, axeId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_renaissance_selection')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('axe_id', axeId);

      if (error) {
        console.error('Erreur markAxeAsCompleted:', error);
        throw error;
      }

      console.log('✅ Axe marqué comme complété:', axeId);

    } catch (error) {
      console.error('Erreur markAxeAsCompleted:', error);
      throw error;
    }
  }

  /**
   * Récupère les progrès d'un utilisateur
   */
  async getUserProgress(userId: string, axeId?: string): Promise<UserRenaissanceProgress[]> {
    try {
      let query = supabase
        .from('user_renaissance_progress')
        .select('*')
        .eq('user_id', userId);

      if (axeId) {
        query = query.eq('axe_id', axeId);
      }

      const { data, error } = await query.order('last_attempt_at', { ascending: false });

      if (error) {
        console.error('Erreur récupération progrès:', error);
        throw error;
      }

      return data?.map(p => ({
        id: p.id,
        userId: p.user_id,
        axeId: p.axe_id,
        stage: p.stage,
        currentPhrase: p.current_phrase,
        attempts: p.attempts || {},
        stageCompleted: p.stage_completed,
        stageCompletedAt: p.stage_completed_at ? new Date(p.stage_completed_at) : undefined,
        lastAttemptAt: new Date(p.last_attempt_at)
      })) || [];

    } catch (error) {
      console.error('Erreur getUserProgress:', error);
      return [];
    }
  }

  /**
   * Sauvegarde une tentative
   */
  async saveAttempt(
    userId: string,
    axeId: string,
    stage: string,
    phraseNumber: number,
    attempt: PhraseAttempt
  ): Promise<void> {
    try {
      // Récupérer ou créer le progrès pour cette étape
      const { data: existingProgress, error: selectError } = await supabase
        .from('user_renaissance_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('axe_id', axeId)
        .eq('stage', stage)
        .single();

      let attempts: Record<number, PhraseAttempt[]> = {};
      
      if (existingProgress) {
        attempts = existingProgress.attempts || {};
      }

      // Ajouter la nouvelle tentative
      if (!attempts[phraseNumber]) {
        attempts[phraseNumber] = [];
      }
      attempts[phraseNumber].push({
        ...attempt,
        timestamp: attempt.timestamp.toISOString()
      } as any);

      // Upsert le progrès
      const { error: upsertError } = await supabase
        .from('user_renaissance_progress')
        .upsert({
          user_id: userId,
          axe_id: axeId,
          stage,
          current_phrase: phraseNumber,
          attempts,
          last_attempt_at: new Date().toISOString()
        });

      if (upsertError) {
        console.error('Erreur saveAttempt:', upsertError);
        throw upsertError;
      }

      console.log('✅ Tentative sauvegardée:', { userId, axeId, stage, phraseNumber });

    } catch (error) {
      console.error('Erreur saveAttempt:', error);
      throw error;
    }
  }

  /**
   * Marque une étape comme complétée
   */
  async markStageCompleted(
    userId: string,
    axeId: string,
    stage: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_renaissance_progress')
        .upsert({
          user_id: userId,
          axe_id: axeId,
          stage,
          stage_completed: true,
          stage_completed_at: new Date().toISOString(),
          last_attempt_at: new Date().toISOString()
        });

      if (error) {
        console.error('Erreur markStageCompleted:', error);
        throw error;
      }

      console.log('✅ Étape marquée comme complétée:', { userId, axeId, stage });

      // Vérifier si toutes les étapes sont complétées pour marquer l'axe comme complété
      await this.checkAndCompleteAxe(userId, axeId);

    } catch (error) {
      console.error('Erreur markStageCompleted:', error);
      throw error;
    }
  }

  /**
   * Vérifie et marque un axe comme complété si toutes les étapes sont finies
   */
  private async checkAndCompleteAxe(userId: string, axeId: string): Promise<void> {
    try {
      const { data: progressData, error } = await supabase
        .from('user_renaissance_progress')
        .select('stage, stage_completed')
        .eq('user_id', userId)
        .eq('axe_id', axeId);

      if (error) {
        console.error('Erreur checkAndCompleteAxe:', error);
        return;
      }

      const requiredStages = ['discovery', 'level1', 'level2', 'level3'];
      const completedStages = progressData
        ?.filter(p => p.stage_completed)
        .map(p => p.stage) || [];

      const allCompleted = requiredStages.every(stage => 
        completedStages.includes(stage)
      );

      if (allCompleted) {
        await this.markAxeAsCompleted(userId, axeId);
        console.log('✅ Axe complètement terminé:', axeId);
      }

    } catch (error) {
      console.error('Erreur checkAndCompleteAxe:', error);
    }
  }

  /**
   * Récupère les statistiques détaillées d'un utilisateur
   */
  async getUserStats(userId: string): Promise<ExtendedRenaissanceStats> {
    try {
      // Récupérer les sélections
      const selections = await this.getUserSelections(userId);
      
      // Récupérer les progrès
      const progress = await this.getUserProgress(userId);

      // Récupérer les axes pour les noms
      const axesData = await axeSupabaseService.getAxes();
      const axesMap = new Map(axesData.map(axe => [axe.id, axe]));

      const totalAxesSelected = selections.length;
      const axesCompleted = selections.filter(s => s.isCompleted).length;
      const discoveryCompleted = progress.filter(p => 
        p.stage === 'discovery' && p.stageCompleted
      ).length;
      const encrageCompleted = progress.filter(p => 
        p.stage === 'level3' && p.stageCompleted
      ).length;

      // Calculer les statistiques par axe
      const axesStats: AxeStats[] = await Promise.all(selections.map(async (selection) => {
        const axe = axesMap.get(selection.axeId);
        const axeProgress = progress.filter(p => p.axeId === selection.axeId);
        
        // ✅ CORRECTION: Récupérer AUSSI les sessions de jeu pour cet axe
        const { data: sessionsData } = await supabase
          .from('renaissance_game_sessions')
          .select('stage, session_accuracy, is_completed, total_attempts')
          .eq('user_id', userId)
          .eq('axe_id', selection.axeId);

        const sessions = sessionsData || [];
        const completedSessions = sessions.filter((s: any) => s.is_completed);

        // ✅ CORRECTION: Utiliser la même logique que dans [axeId]/page.tsx
        const discoveryCompleted = completedSessions.some((s: any) => s.stage === 'discovery') || 
                                 axeProgress.some(p => p.stage === 'discovery' && p.stageCompleted);
        const level1Completed = completedSessions.some((s: any) => s.stage === 'level1') || 
                               axeProgress.some(p => p.stage === 'level1' && p.stageCompleted);
        const level2Completed = completedSessions.some((s: any) => s.stage === 'level2') || 
                               axeProgress.some(p => p.stage === 'level2' && p.stageCompleted);
        const level3Completed = completedSessions.some((s: any) => s.stage === 'level3') || 
                               axeProgress.some(p => p.stage === 'level3' && p.stageCompleted);

        // Calculer progression globale (Découverte 30% + Encrage 70%)
        let overallProgress = 0;
        if (discoveryCompleted) overallProgress += 30;
        if (level1Completed) overallProgress += 23.33;
        if (level2Completed) overallProgress += 23.33;
        if (level3Completed) overallProgress += 23.34;

        // Calculer les précisions et tentatives depuis les sessions
        const totalAttempts = sessions.reduce((sum: number, s: any) => sum + (s.total_attempts || 0), 0);
        const averageAccuracy = completedSessions.length > 0 
          ? completedSessions.reduce((sum: number, s: any) => sum + (s.session_accuracy || 0), 0) / completedSessions.length
          : 0;

        return {
          axeId: selection.axeId,
          axeName: selection.customName || axe?.name || 'Axe inconnu',
          overallProgress: Math.round(overallProgress),
          discoveryCompleted,
          discoveryAccuracy: 85, // À calculer précisément si nécessaire
          level1Completed,
          level1Accuracy: 88,
          level2Completed,
          level2Accuracy: 92,
          level3Completed,
          level3Accuracy: 95,
          totalAttempts,
          averageAccuracy: Math.round(averageAccuracy),
          timeSpent: 45, // À calculer
          difficulty: this.calculateDifficulty(overallProgress, averageAccuracy), // Utiliser la vraie précision
          commonMistakes: this.extractCommonMistakes(totalAttempts)
        };
      }));

      // Calculer les moyennes globales
      const averageAccuracy = axesStats.length > 0 
        ? axesStats.reduce((sum, axe) => sum + axe.averageAccuracy, 0) / axesStats.length 
        : 0;

      // ✅ CORRECTION: Calculer la progression totale comme moyenne de tous les axes sélectionnés
      const totalProgress = axesStats.length > 0 
        ? Math.round(axesStats.reduce((sum, axe) => sum + axe.overallProgress, 0) / axesStats.length)
        : 0;

      const totalTimeSpent = axesStats.reduce((sum, axe) => sum + axe.timeSpent, 0);
      const totalAttempts = axesStats.reduce((sum, axe) => sum + axe.totalAttempts, 0);

      const stats: ExtendedRenaissanceStats = {
        totalAxesSelected,
        axesCompleted,
        totalProgress, // ✅ Utiliser la moyenne calculée
        discoveryCompleted,
        encrageCompleted,
        averageAccuracy: Math.round(averageAccuracy),
        totalTimeSpent,
        totalAttempts,
        bestAccuracy: Math.max(...axesStats.map(a => a.averageAccuracy), 0),
        worstAccuracy: Math.min(...axesStats.map(a => a.averageAccuracy), 100),
        axesStats,
        masteryLevel: this.calculateMasteryLevel(Math.round(averageAccuracy)), // Ajouter masteryLevel
        improvementTips: this.generateImprovementTips(Math.round(averageAccuracy), totalAxesSelected, axesCompleted) // Ajouter improvementTips
      };

      return stats;

    } catch (error) {
      console.error('Erreur getUserStats:', error);
      throw error;
    }
  }

  /**
   * Supprime toutes les données Renaissance d'un utilisateur
   */
  async deleteUserData(userId: string): Promise<void> {
    try {
      // Supprimer les progrès
      await supabase
        .from('user_renaissance_progress')
        .delete()
        .eq('user_id', userId);

      // Supprimer les sélections
      await supabase
        .from('user_renaissance_selection')
        .delete()
        .eq('user_id', userId);

      console.log('✅ Données Renaissance supprimées pour:', userId);

    } catch (error) {
      console.error('Erreur deleteUserData:', error);
      throw error;
    }
  }

  /**
   * Réinitialiser le progrès d'un axe
   */
  async resetAxeProgress(userId: string, axeId: string): Promise<void> {
    try {
      // Supprimer les progrès de cet axe
      await supabase
        .from('user_renaissance_progress')
        .delete()
        .eq('user_id', userId)
        .eq('axe_id', axeId);

      // Réinitialiser les flags de la sélection
      await supabase
        .from('user_renaissance_selection')
        .update({
          is_started: false,
          is_completed: false,
          started_at: null,
          completed_at: null
        })
        .eq('user_id', userId)
        .eq('axe_id', axeId);

      console.log('✅ Progrès de l\'axe réinitialisé:', { userId, axeId });

    } catch (error) {
      console.error('Erreur resetAxeProgress:', error);
      throw error;
    }
  }

  // ===== MÉTHODES UTILITAIRES =====

  /**
   * Calculer la difficulté d'un axe basée sur les métriques
   */
  private calculateDifficulty(
    overallProgress: number, 
    averageAccuracy: number
  ): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    if (overallProgress === 100 && averageAccuracy >= 95) return 'expert';
    if (overallProgress >= 70 && averageAccuracy >= 85) return 'advanced';
    if (overallProgress >= 30 && averageAccuracy >= 70) return 'intermediate';
    return 'beginner';
  }

  /**
   * Extraire les erreurs communes basées sur le nombre de tentatives
   */
  private extractCommonMistakes(totalAttempts: number): string[] {
    // Placeholder - à implémenter avec l'analyse des vraies tentatives
    const commonMistakes = [
      'Oubli de mots de liaison',
      'Erreurs de conjugaison', 
      'Ordre des mots incorrect',
      'Fautes d\'orthographe',
      'Mots manquants'
    ];

    // Retourner un nombre d'erreurs proportionnel aux tentatives
    const numMistakes = Math.min(Math.floor(totalAttempts / 10) + 1, commonMistakes.length);
    return commonMistakes.slice(0, numMistakes);
  }

  /**
   * Calculer le niveau de maîtrise basé sur la précision
   */
  private calculateMasteryLevel(accuracy: number): 'débutant' | 'intermédiaire' | 'avancé' | 'expert' {
    if (accuracy >= 95) return 'expert';
    if (accuracy >= 85) return 'avancé';
    if (accuracy >= 70) return 'intermédiaire';
    return 'débutant';
  }

  /**
   * Générer des conseils d'amélioration personnalisés
   */
  private generateImprovementTips(
    averageAccuracy: number, 
    totalAxesSelected: number, 
    axesCompleted: number
  ): string[] {
    const tips: string[] = [];

    if (averageAccuracy < 70) {
      tips.push('💡 Prenez plus de temps pour mémoriser chaque phrase avant de répondre');
      tips.push('📚 Relisez les phrases plusieurs fois pour mieux les ancrer');
      tips.push('🎯 Concentrez-vous sur les mots-clés de chaque phrase');
    }

    if (totalAxesSelected > 0 && axesCompleted === 0) {
      tips.push('🎯 Concentrez-vous sur un axe à la fois pour de meilleurs résultats');
      tips.push('⏰ Pratiquez régulièrement, même 10 minutes par jour');
    }

    if (axesCompleted > 0 && averageAccuracy >= 85) {
      tips.push('🌟 Excellent travail ! Continuez sur cette lancée');
      tips.push('🚀 Vous pouvez maintenant vous challenger avec des niveaux plus difficiles');
    }

    if (averageAccuracy >= 90 && axesCompleted < totalAxesSelected) {
      tips.push('🎓 Votre maîtrise est excellente, explorez de nouveaux axes');
      tips.push('🌱 Diversifiez vos axes pour une transformation complète');
    }

    if (tips.length === 0) {
      tips.push('📈 Continuez vos efforts, vous progressez bien !');
      tips.push('🔄 La répétition est la clé de la maîtrise');
    }

    return tips;
  }
}

// Export de l'instance
export const renaissanceSupabaseService = new RenaissanceSupabaseService();