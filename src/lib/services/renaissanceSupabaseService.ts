// Service Supabase dédié
// src/lib/services/renaissanceSupabaseService.ts

import { supabase } from '../supabase';
import type { 
  RenaissanceAxe,
  RenaissancePhrase,
  UserAxeSelection,
  UserRenaissanceProgress,
  PhraseAttempt,
  RenaissanceStats,
  AxeStats
} from './renaissanceService';

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
      const { data, error } = await supabase
        .from('renaissance_axes')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        console.error('Erreur lors du chargement des axes:', error);
        throw error;
      }

      return data.map(axe => ({
        id: axe.id,
        name: axe.name,
        icon: axe.icon,
        description: axe.description,
        sortOrder: axe.sort_order,
        isActive: axe.is_active,
        isCustomizable: axe.is_customizable
      }));

    } catch (error) {
      console.error('Erreur getAxes:', error);
      throw error;
    }
  }

  /**
   * Récupère un axe spécifique par ID
   */
  async getAxeById(axeId: string): Promise<RenaissanceAxe | null> {
    try {
      const { data, error } = await supabase
        .from('renaissance_axes')
        .select('*')
        .eq('id', axeId)
        .single();

      if (error) {
        console.error('Axe non trouvé:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        icon: data.icon,
        description: data.description,
        sortOrder: data.sort_order,
        isActive: data.is_active,
        isCustomizable: data.is_customizable
      };

    } catch (error) {
      console.error('Erreur getAxeById:', error);
      return null;
    }
  }

  /**
   * Récupère un axe avec ses phrases
   */
  async getAxeWithPhrases(axeId: string): Promise<RenaissanceAxe | null> {
    try {
      // Récupérer l'axe
      const axe = await this.getAxeById(axeId);
      if (!axe) {
        return null;
      }

      // Récupérer les phrases
      const { data: phrasesData, error: phrasesError } = await supabase
        .from('renaissance_phrases')
        .select('*')
        .eq('axe_id', axeId)
        .order('phrase_number');

      if (phrasesError) {
        console.error('Erreur phrases:', phrasesError);
        throw phrasesError;
      }

      const phrases: RenaissancePhrase[] = phrasesData?.map(p => ({
        id: p.id,
        axeId: p.axe_id,
        phraseNumber: p.phrase_number,
        content: p.content
      })) || [];

      return {
        ...axe,
        phrases
      };

    } catch (error) {
      console.error('Erreur getAxeWithPhrases:', error);
      return null;
    }
  }

  /**
   * Récupère les phrases d'un axe
   */
  async getPhrasesByAxeId(axeId: string): Promise<RenaissancePhrase[]> {
    try {
      const { data, error } = await supabase
        .from('renaissance_phrases')
        .select('*')
        .eq('axe_id', axeId)
        .order('phrase_number');

      if (error) {
        console.error('Erreur récupération phrases:', error);
        throw error;
      }

      return data.map(p => ({
        id: p.id,
        axeId: p.axe_id,
        phraseNumber: p.phrase_number,
        content: p.content
      }));

    } catch (error) {
      console.error('Erreur getPhrasesByAxeId:', error);
      return [];
    }
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
        console.error('Erreur sauvegarde sélection:', error);
        throw error;
      }

      console.log('✅ Sélection sauvegardée:', selections.length, 'axes');

    } catch (error) {
      console.error('Erreur saveUserSelection:', error);
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
  async getUserStats(userId: string): Promise<RenaissanceStats> {
    try {
      // Récupérer les sélections
      const selections = await this.getUserSelections(userId);
      
      // Récupérer les progrès
      const progress = await this.getUserProgress(userId);

      // Récupérer les axes pour les noms
      const axesData = await this.getAxes();
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
      const axesStats: AxeStats[] = selections.map(selection => {
        const axe = axesMap.get(selection.axeId);
        const axeProgress = progress.filter(p => p.axeId === selection.axeId);
        
        const discoveryStage = axeProgress.find(p => p.stage === 'discovery');
        const level1Stage = axeProgress.find(p => p.stage === 'level1');
        const level2Stage = axeProgress.find(p => p.stage === 'level2');
        const level3Stage = axeProgress.find(p => p.stage === 'level3');

        // Calculer progression globale (Découverte 30% + Encrage 70%)
        let overallProgress = 0;
        if (discoveryStage?.stageCompleted) overallProgress += 30;
        if (level1Stage?.stageCompleted) overallProgress += 23.33;
        if (level2Stage?.stageCompleted) overallProgress += 23.33;
        if (level3Stage?.stageCompleted) overallProgress += 23.34;

        // Calculer les précisions (à implémenter avec les vraies tentatives)
        const totalAttempts = axeProgress.reduce((sum, stage) => {
          if (stage.attempts) {
            return sum + Object.values(stage.attempts).flat().length;
          }
          return sum;
        }, 0);

        return {
          axeId: selection.axeId,
          axeName: selection.customName || axe?.name || 'Axe inconnu',
          overallProgress: Math.round(overallProgress),
          discoveryCompleted: discoveryStage?.stageCompleted || false,
          discoveryAccuracy: 85, // À calculer depuis les vraies tentatives
          level1Completed: level1Stage?.stageCompleted || false,
          level1Accuracy: 88,
          level2Completed: level2Stage?.stageCompleted || false,
          level2Accuracy: 92,
          level3Completed: level3Stage?.stageCompleted || false,
          level3Accuracy: 95,
          totalAttempts,
          averageAccuracy: 90,
          timeSpent: 45, // À calculer
          difficulty: this.calculateDifficulty(overallProgress, 90), // Ajouter la difficulté
          commonMistakes: this.extractCommonMistakes(totalAttempts) // Ajouter les erreurs communes
        };
      });

      // Calculer les moyennes globales
      const averageAccuracy = axesStats.length > 0 
        ? axesStats.reduce((sum, axe) => sum + axe.averageAccuracy, 0) / axesStats.length 
        : 0;

      const totalTimeSpent = axesStats.reduce((sum, axe) => sum + axe.timeSpent, 0);
      const totalAttempts = axesStats.reduce((sum, axe) => sum + axe.totalAttempts, 0);

      const stats: RenaissanceStats = {
        totalAxesSelected,
        axesCompleted,
        totalProgress: totalAxesSelected > 0 ? Math.round((axesCompleted / totalAxesSelected) * 100) : 0,
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
}

// Export de l'instance
export const renaissanceSupabaseService = new RenaissanceSupabaseService();