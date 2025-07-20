// Service principal Renaissance
// src/lib/services/renaissanceService.ts

import { supabase } from '../supabase';
import { programmeSupabaseService } from '../programmeSupabaseService';
import { renaissanceSupabaseService } from './renaissanceSupabaseService';

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
  responseTime?: number;
  expectedText?: string;
  similarityScore?: number;
  shownAt?: Date;
}

export interface TextDifference {
  type: 'correct' | 'incorrect' | 'missing' | 'extra';
  text: string;
  position: number;
}

export interface GameSession {
  id?: string;
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
  masteryLevel: 'débutant' | 'intermédiaire' | 'avancé' | 'expert';
  improvementTips: string[];
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
export class RenaissanceService {
  private supabaseService = renaissanceSupabaseService;

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
   * Démarrer une session de jeu (nouvelle approche avec tables dédiées)
   */
  async startGameSession(
    userId: string,
    axeId: string,
    stage: string,
    flashDuration: number,
    phrasesOrder: number[]
  ): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('renaissance_game_sessions')
        .insert({
          user_id: userId,
          axe_id: axeId,
          stage,
          flash_duration_ms: flashDuration,
          phrases_order: phrasesOrder,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur startGameSession:', error);
      throw error;
    }
  }

  /**
   * Enregistrer une tentative (nouvelle approche)
   */
  async recordAttempt(
    sessionId: string,
    phraseId: string,
    phraseNumber: number,
    attempt: PhraseAttempt
  ): Promise<void> {
    try {
      // Insérer dans la table dédiée
      const { error: attemptError } = await supabase
        .from('renaissance_attempts')
        .insert({
          session_id: sessionId,
          phrase_id: phraseId,
          phrase_number: phraseNumber,
          user_input: attempt.userInput,
          expected_text: attempt.expectedText || '',
          is_correct: attempt.isCorrect,
          response_time_ms: attempt.responseTime || null,
          similarity_score: attempt.similarityScore || null,
          error_analysis: attempt.differences || null,
          shown_at: attempt.shownAt || new Date().toISOString(),
          submitted_at: new Date().toISOString()
        });

      if (attemptError) throw attemptError;

      // Mettre à jour la session
      await this.updateSessionStats(sessionId, attempt.isCorrect);
    } catch (error) {
      console.error('Erreur recordAttempt:', error);
      throw error;
    }
  }

  /**
   * Mise à jour des stats de session
   */
  private async updateSessionStats(sessionId: string, isCorrect: boolean): Promise<void> {
    try {
      // Utiliser une fonction RPC si elle existe, sinon fallback sur update direct
      const { error } = await supabase.rpc('update_session_stats', {
        p_session_id: sessionId,
        p_is_correct: isCorrect
      });
      
      if (error) {
        // Fallback: mise à jour manuelle
        console.warn('RPC update_session_stats non disponible, utilisation du fallback');
        await this.updateSessionStatsManual(sessionId, isCorrect);
      }
    } catch (error) {
      console.error('Erreur updateSessionStats:', error);
      // Fallback silencieux
      await this.updateSessionStatsManual(sessionId, isCorrect);
    }
  }

  /**
   * Fallback pour mise à jour manuelle des stats
   */
  private async updateSessionStatsManual(sessionId: string, isCorrect: boolean): Promise<void> {
    try {
      // Récupérer les stats actuelles
      const { data: session, error: fetchError } = await supabase
        .from('renaissance_game_sessions')
        .select('correct_count, total_attempts')
        .eq('id', sessionId)
        .single();

      if (fetchError) throw fetchError;

      const newTotalAttempts = (session.total_attempts || 0) + 1;
      const newCorrectCount = (session.correct_count || 0) + (isCorrect ? 1 : 0);
      const newAccuracy = (newCorrectCount / newTotalAttempts) * 100;

      // Mettre à jour
      const { error: updateError } = await supabase
        .from('renaissance_game_sessions')
        .update({
          total_attempts: newTotalAttempts,
          correct_count: newCorrectCount,
          session_accuracy: newAccuracy,
          last_activity_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Erreur updateSessionStatsManual:', error);
    }
  }

  /**
   * Récupérer une session active
   */
  async getActiveSession(userId: string, axeId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('renaissance_game_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('axe_id', axeId)
        .eq('is_active', true)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Erreur getActiveSession:', error);
      return null;
    }
  }

  /**
   * Compléter une session
   */
  async completeSession(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('renaissance_game_sessions')
        .update({
          is_completed: true,
          is_active: false,
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur completeSession:', error);
      throw error;
    }
  }

  /**
   * Enregistrer une tentative (ancienne méthode - garde pour compatibilité)
   */
  async recordAttemptLegacy(
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
   * Obtenir les statistiques utilisateur (nouvelle approche avec cache)
   */
  async getUserStats(userId: string): Promise<RenaissanceStats> {
    try {
      const { data, error } = await supabase
        .from('renaissance_user_stats_cache')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      // Si pas de cache, utiliser l'ancienne méthode
      if (!data) {
        return this.getUserStatsLegacy(userId);
      }

      return {
        totalAxesSelected: data.total_axes_selected || 0,
        axesCompleted: data.total_axes_completed || 0,
        totalProgress: data.overall_progress_percentage || 0,
        discoveryCompleted: 0, // À calculer si nécessaire
        encrageCompleted: 0, // À calculer si nécessaire
        averageAccuracy: data.global_accuracy || 0,
        totalTimeSpent: data.total_time_spent_minutes || 0,
        totalAttempts: data.total_attempts || 0,
        bestAccuracy: 0, // À calculer si nécessaire
        worstAccuracy: 0, // À calculer si nécessaire
        axesStats: [], // À implémenter si nécessaire
        masteryLevel: 'débutant',
        improvementTips: []
      };
    } catch (error) {
      console.error('Erreur getUserStats:', error);
      return this.getUserStatsLegacy(userId);
    }
  }

  /**
   * Obtenir les statistiques utilisateur (ancienne méthode - fallback)
   */
  async getUserStatsLegacy(userId: string): Promise<RenaissanceStats> {
    try {
      return await this.supabaseService.getUserStats(userId);
    } catch (error) {
      console.error('Erreur getUserStatsLegacy:', error);
      // Retourner des stats vides par défaut
      return {
        totalAxesSelected: 0,
        axesCompleted: 0,
        totalProgress: 0,
        discoveryCompleted: 0,
        encrageCompleted: 0,
        averageAccuracy: 0,
        totalTimeSpent: 0,
        totalAttempts: 0,
        bestAccuracy: 0,
        worstAccuracy: 0,
        axesStats: [],
        masteryLevel: 'débutant',
        improvementTips: []
      };
    }
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
      differences,
      expectedText: targetPhrase
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