// Service principal Renaissance
// src/lib/services/renaissanceService.ts

import { supabase } from '../supabase';
import { programmeSupabaseService } from '../programmeSupabaseService';

// Types temporaires (à déplacer vers src/lib/types/renaissance.ts plus tard)
export interface RenaissanceAxe {
  id: string;
  name: string;
  icon: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  isCustomizable: boolean;
  phrases?: RenaissancePhrase[];
}

export interface RenaissancePhrase {
  id: string;
  axeId: string;
  phraseNumber: number;
  content: string;
}

export interface UserAxeSelection {
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

export interface UserRenaissanceProgress {
  id: string;
  userId: string;
  axeId: string;
  stage: 'discovery' | 'level1' | 'level2' | 'level3';
  currentPhrase: number;
  attempts: Record<number, PhraseAttempt[]>;
  stageCompleted: boolean;
  stageCompletedAt?: Date;
  lastAttemptAt: Date;
}

export interface PhraseAttempt {
  userInput: string;
  isCorrect: boolean;
  timestamp: Date;
  flashDuration: number;
  differences?: TextDifference[];
}

export interface TextDifference {
  type: 'correct' | 'incorrect' | 'missing' | 'extra';
  text: string;
  position: number;
}

export interface GameSession {
  axeId: string;
  stage: string;
  phrases: RenaissancePhrase[];
  currentPhraseIndex: number;
  flashDuration: number;
  attempts: PhraseAttempt[];
  isCompleted: boolean;
  accuracy: number;
  shuffledOrder: number[];
}

export interface RenaissanceStats {
  totalAxesSelected: number;
  axesCompleted: number;
  totalProgress: number; // 0-100%
  discoveryCompleted: number;
  encrageCompleted: number;
  averageAccuracy: number;
  totalTimeSpent: number; // en minutes
  totalAttempts: number;
  bestAccuracy: number;
  worstAccuracy: number;
  axesStats: AxeStats[];
}

export interface AxeStats {
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
}

// Service Supabase dédié à Renaissance
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
   * Récupère un axe avec ses phrases
   */
  async getAxeWithPhrases(axeId: string): Promise<RenaissanceAxe | null> {
    try {
      // Récupérer l'axe
      const { data: axeData, error: axeError } = await supabase
        .from('renaissance_axes')
        .select('*')
        .eq('id', axeId)
        .single();

      if (axeError || !axeData) {
        console.error('Axe non trouvé:', axeError);
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
        id: axeData.id,
        name: axeData.name,
        icon: axeData.icon,
        description: axeData.description,
        sortOrder: axeData.sort_order,
        isActive: axeData.is_active,
        isCustomizable: axeData.is_customizable,
        phrases
      };

    } catch (error) {
      console.error('Erreur getAxeWithPhrases:', error);
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

    } catch (error) {
      console.error('Erreur markAxeAsStarted:', error);
      throw error;
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
      attempts[phraseNumber].push(attempt);

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
        await supabase
          .from('user_renaissance_selection')
          .update({
            is_completed: true,
            completed_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('axe_id', axeId);

        console.log('✅ Axe complété:', axeId);
      }

    } catch (error) {
      console.error('Erreur checkAndCompleteAxe:', error);
    }
  }

  /**
   * Récupère les statistiques utilisateur
   */
  async getUserStats(userId: string): Promise<RenaissanceStats> {
    try {
      // Récupérer les sélections
      const { data: selections, error: selectionsError } = await supabase
        .from('user_renaissance_selection')
        .select('*')
        .eq('user_id', userId);

      if (selectionsError) {
        throw selectionsError;
      }

      // Récupérer les progrès
      const { data: progress, error: progressError } = await supabase
        .from('user_renaissance_progress')
        .select('*')
        .eq('user_id', userId);

      if (progressError) {
        throw progressError;
      }

      const totalAxesSelected = selections?.length || 0;
      const axesCompleted = selections?.filter(s => s.is_completed).length || 0;
      const discoveryCompleted = progress?.filter(p => 
        p.stage === 'discovery' && p.stage_completed
      ).length || 0;
      const encrageCompleted = progress?.filter(p => 
        p.stage === 'level3' && p.stage_completed
      ).length || 0;

      // Calculer les précisions moyennes (à implémenter plus tard avec les vraies tentatives)
      const averageAccuracy = 85;
      const totalTimeSpent = 120;
      const totalAttempts = 0;

      const stats: RenaissanceStats = {
        totalAxesSelected,
        axesCompleted,
        totalProgress: totalAxesSelected > 0 ? Math.round((axesCompleted / totalAxesSelected) * 100) : 0,
        discoveryCompleted,
        encrageCompleted,
        averageAccuracy,
        totalTimeSpent,
        totalAttempts,
        bestAccuracy: 95,
        worstAccuracy: 75,
        axesStats: [] // À implémenter
      };

      return stats;

    } catch (error) {
      console.error('Erreur getUserStats:', error);
      throw error;
    }
  }
}

// Service principal Renaissance
export class RenaissanceService {
  private supabaseService = new RenaissanceSupabaseService();

  /**
   * Vérifier l'éligibilité à Renaissance
   */
  async checkEligibility(userId: string): Promise<boolean> {
    try {
      const programmeData = await programmeSupabaseService.getProgramme(userId);
      return programmeData?.overallProgress === 100;
    } catch (error) {
      console.error('Erreur checkEligibility:', error);
      return false;
    }
  }

  /**
   * Récupérer tous les axes disponibles
   */
  async getAvailableAxes(): Promise<RenaissanceAxe[]> {
    return this.supabaseService.getAxes();
  }

  /**
   * Récupérer un axe avec ses phrases
   */
  async getAxeWithPhrases(axeId: string): Promise<RenaissanceAxe | null> {
    return this.supabaseService.getAxeWithPhrases(axeId);
  }

  /**
   * Sauvegarder la sélection d'axes
   */
  async saveAxeSelection(
    userId: string, 
    selectedAxes: Array<{
      axeId: string;
      customName?: string;
      customPhrases?: string[];
    }>
  ): Promise<void> {
    return this.supabaseService.saveUserSelection(userId, selectedAxes);
  }

  /**
   * Démarrer un axe
   */
  async startAxe(userId: string, axeId: string): Promise<void> {
    return this.supabaseService.markAxeAsStarted(userId, axeId);
  }

  /**
   * Créer une session de jeu flash
   */
  async createFlashSession(
    userId: string,
    axeId: string,
    stage: string
  ): Promise<GameSession | null> {
    try {
      // Récupérer l'axe avec ses phrases
      const axe = await this.supabaseService.getAxeWithPhrases(axeId);
      if (!axe || !axe.phrases) {
        return null;
      }

      // Déterminer la durée du flash selon l'étape
      let flashDuration = 500; // Par défaut discovery
      switch (stage) {
        case 'level1':
          flashDuration = 3000;
          break;
        case 'level2':
          flashDuration = 1500;
          break;
        case 'level3':
          flashDuration = 500;
          break;
      }

      // Mélanger l'ordre des phrases
      const shuffledOrder = this.shuffleArray([...Array(axe.phrases.length).keys()]);

      const gameSession: GameSession = {
        axeId,
        stage,
        phrases: axe.phrases,
        currentPhraseIndex: 0,
        flashDuration,
        attempts: [],
        isCompleted: false,
        accuracy: 0,
        shuffledOrder
      };

      return gameSession;

    } catch (error) {
      console.error('Erreur createFlashSession:', error);
      return null;
    }
  }

  /**
   * Enregistrer une tentative
   */
  async recordAttempt(
    userId: string,
    axeId: string,
    stage: string,
    phraseNumber: number,
    attempt: PhraseAttempt
  ): Promise<void> {
    return this.supabaseService.saveAttempt(userId, axeId, stage, phraseNumber, attempt);
  }

  /**
   * Marquer un niveau comme complété
   */
  async completeStage(
    userId: string,
    axeId: string,
    stage: string
  ): Promise<void> {
    return this.supabaseService.markStageCompleted(userId, axeId, stage);
  }

  /**
   * Obtenir les statistiques utilisateur
   */
  async getUserStats(userId: string): Promise<RenaissanceStats> {
    return this.supabaseService.getUserStats(userId);
  }

  /**
   * Vérifier une réponse utilisateur
   */
  checkAnswer(userInput: string, targetPhrase: string): PhraseAttempt {
    const normalizedInput = this.normalizeText(userInput);
    const normalizedTarget = this.normalizeText(targetPhrase);
    
    const isCorrect = normalizedInput === normalizedTarget;
    const differences = isCorrect ? undefined : this.findDifferences(userInput, targetPhrase);

    return {
      userInput,
      isCorrect,
      timestamp: new Date(),
      flashDuration: 500, // À adapter selon le contexte
      differences
    };
  }

  /**
   * Normaliser le texte pour la comparaison
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ') // Remplacer les espaces multiples par un seul
      .replace(/[''`]/g, "'") // Normaliser les apostrophes
      .replace(/[""]/g, '"'); // Normaliser les guillemets
  }

  /**
   * Trouver les différences entre deux textes
   */
  private findDifferences(input: string, target: string): TextDifference[] {
    // Implémentation simple - à améliorer plus tard
    const differences: TextDifference[] = [];
    
    if (input.length !== target.length) {
      differences.push({
        type: input.length > target.length ? 'extra' : 'missing',
        text: input.length > target.length ? 
          input.slice(target.length) : 
          target.slice(input.length),
        position: Math.min(input.length, target.length)
      });
    }

    return differences;
  }

  /**
   * Mélanger un tableau
   */
  private shuffleArray(array: number[]): number[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

// Export de l'instance principale
export const renaissanceService = new RenaissanceService();