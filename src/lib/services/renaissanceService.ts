// Service principal Renaissance
// src/lib/services/renaissanceService.ts

import { supabase } from '../supabase';
import { programmeSupabaseService } from '../programmeSupabaseService';
import { renaissanceSupabaseService } from './renaissanceSupabaseService';
import type { 
  GameSession, 
  PhraseAttempt, 
  DetailedAttempt,
  RenaissanceAxe, 
  RenaissancePhrase,
  RenaissanceStats,
  TextDifference
} from '../types/renaissance';

// ===== TYPES POUR COMPATIBILITÉ =====
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

export interface GameResults {
  totalPhrases: number;
  correctAnswers: number;
  accuracy: number;
  attempts: PhraseAttempt[];
  timeSpent: number;
  averageResponseTime: number;
  stage: string;
  level?: string;
}

// Re-export des types principaux
export type { GameSession, PhraseAttempt, TextDifference, RenaissanceAxe, RenaissancePhrase };

// ===== SERVICE PRINCIPAL =====
export class RenaissanceService {
  /**
   * Récupérer les statistiques détaillées d'une session - ADAPTÉ À TA TABLE
   */
  async getSessionStats(sessionId: string): Promise<GameResults | null> {
    try {
      // 1. Récupérer la session
      const { data: session, error: sessionError } = await supabase
        .from('renaissance_game_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError || !session) {
        console.error('❌ Session non trouvée:', sessionError);
        return null;
      }

      // 2. Récupérer toutes les tentatives de cette session depuis TA table
      const { data: attempts, error: attemptsError } = await supabase
        .from('renaissance_attempts')  // ✅ Ta table existante
        .select('*')
        .eq('session_id', sessionId)
        .order('phrase_number');

      if (attemptsError) {
        console.error('❌ Erreur récupération tentatives:', attemptsError);
        return null;
      }

      // 3. Calculer les statistiques
      const totalPhrases = attempts?.length || 0;
      const correctAnswers = attempts?.filter(a => a.is_correct).length || 0;
      const accuracy = totalPhrases > 0 ? Math.round((correctAnswers / totalPhrases) * 100) : 0;
      
      const validResponseTimes = attempts?.map(a => a.response_time_ms).filter(t => t && t > 0) || [];
      const averageResponseTime = validResponseTimes.length > 0 
        ? validResponseTimes.reduce((sum, time) => sum + time, 0) / validResponseTimes.length 
        : 0;

      const sessionStartTime = new Date(session.started_at).getTime();
      const sessionEndTime = session.completed_at 
        ? new Date(session.completed_at).getTime() 
        : Date.now();
      const timeSpent = sessionEndTime - sessionStartTime;

      // 4. Mapper les tentatives au format attendu
      const mappedAttempts: PhraseAttempt[] = attempts?.map(attempt => ({
        userInput: attempt.user_input || '',
        isCorrect: attempt.is_correct || false,
        timestamp: new Date(attempt.submitted_at),
        flashDuration: 500, // À récupérer depuis la session si disponible
        responseTime: attempt.response_time_ms || 0,
        expectedText: attempt.expected_text || '',
        similarityScore: attempt.similarity_score || undefined,
        differences: attempt.error_analysis || undefined
      })) || [];

      return {
        totalPhrases,
        correctAnswers,
        accuracy,
        attempts: mappedAttempts,
        timeSpent,
        averageResponseTime,
        stage: session.stage,
        level: this.getStageLabel ? this.getStageLabel(session.stage) : session.stage
      };

    } catch (error) {
      console.error('❌ Erreur getSessionStats:', error);
      return null;
    }
  }
  private supabaseService = renaissanceSupabaseService;

  // ========== GESTION DES SESSIONS DE JEU ==========
  
  /**
   * Créer une nouvelle session de jeu
   */
  async createGameSession(
    userId: string, 
    axeId: string, 
    stage: 'discovery' | 'level1' | 'level2' | 'level3',
    phrasesCount: number
  ): Promise<GameSession> {
    // Désactiver les sessions actives existantes
    await this.deactivateExistingSessions(userId, axeId, stage);
    
    const flashDurationMs = this.getFlashDuration(stage);
    const phrasesOrder = this.shuffleArray(Array.from({ length: phrasesCount }, (_, i) => i));
    const deviceInfo = this.getDeviceInfo();
    const browserInfo = this.getBrowserInfo();
    
    const { data, error } = await supabase
      .from('renaissance_game_sessions')
      .insert({
        user_id: userId,
        axe_id: axeId,
        stage,
        flash_duration_ms: flashDurationMs,
        phrases_order: phrasesOrder,
        current_phrase_index: 0,
        is_active: true,
        is_completed: false,
        correct_count: 0,
        total_attempts: 0,
        session_accuracy: 0,
        device_info: deviceInfo,
        browser_info: browserInfo
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapSessionFromDB(data);
  }

  /**
   * Récupérer une session active
   */
  async getActiveSession(userId: string, axeId: string, stage?: string): Promise<GameSession | null> {
    let query = supabase
      .from('renaissance_game_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('axe_id', axeId)
      .eq('is_active', true);

    if (stage) {
      query = query.eq('stage', stage);
    }

    const { data, error } = await query
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    
    return this.mapSessionFromDB(data);
  }

  /**
   * Mettre à jour la progression d'une session
   */
  async updateSessionProgress(
    sessionId: string, 
    phraseIndex: number, 
    isCorrect: boolean
  ): Promise<void> {
    try {
      // Récupérer les stats actuelles
      const { data: session, error: fetchError } = await supabase
        .from('renaissance_game_sessions')
        .select('correct_count, total_attempts')
        .eq('id', sessionId)
        .single();

      if (fetchError) {
        console.error('❌ Erreur fetch session stats:', fetchError);
        return;
      }

      const newTotalAttempts = session.total_attempts + 1;
      const newCorrectCount = session.correct_count + (isCorrect ? 1 : 0);
      const newAccuracy = (newCorrectCount / newTotalAttempts) * 100;

      // Mettre à jour
      const { error: updateError } = await supabase
        .from('renaissance_game_sessions')
        .update({
          current_phrase_index: phraseIndex,
          total_attempts: newTotalAttempts,
          correct_count: newCorrectCount,
          session_accuracy: newAccuracy,
          last_activity_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (updateError) {
        console.error('❌ Erreur update session progress:', updateError);
      } else {
        console.log('✅ Session progress mis à jour:', { 
          sessionId, 
          totalAttempts: newTotalAttempts, 
          correctCount: newCorrectCount, 
          accuracy: newAccuracy 
        });
      }

    } catch (error) {
      console.error('❌ Erreur updateSessionProgress:', error);
    }
  }

  /**
   * Compléter une session avec gestion des statistiques
   */
  async completeSession(sessionId: string): Promise<void> {
    try {
      console.log('🏁 Début completeSession:', sessionId);
      
      // 1. Marquer la session comme complétée
      const { error: updateError } = await supabase
        .from('renaissance_game_sessions')
        .update({
          is_completed: true,
          is_active: false,
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (updateError) {
        console.error('❌ Erreur mise à jour session:', updateError);
        throw updateError;
      }
      
      console.log('✅ Session marquée comme complétée');

      // 2. Récupérer les détails de la session pour mise à jour des stats
      const { data: session, error: fetchError } = await supabase
        .from('renaissance_game_sessions')
        .select('user_id, axe_id, stage, session_accuracy, total_attempts')
        .eq('id', sessionId)
        .single();

      if (fetchError) {
        console.error('❌ Erreur récupération session:', fetchError);
        return; // Ne pas bloquer si erreur de récupération
      }

      console.log('📊 Session data:', session);

      // 3. Mettre à jour les statistiques utilisateur (legacy) - avec protection
      try {
        await this.updateUserProgressLegacy(
          session.user_id, 
          session.axe_id, 
          session.stage, 
          session.session_accuracy >= 100
        );
      } catch (legacyError) {
        console.error('⚠️ Erreur legacy update (non bloquant):', legacyError);
        // Ne pas throw - ce n'est pas critique
      }

    } catch (error) {
      console.error('❌ Erreur dans completeSession:', error);
      throw error;
    }
  }

  /**
   * Mise à jour legacy des progrès utilisateur
   */
  async updateUserProgressLegacy(
    userId: string, 
    axeId: string, 
    stage: string, 
    isCompleted: boolean
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_renaissance_progress')
        .upsert({
          user_id: userId,
          axe_id: axeId,
          stage: stage,
          stage_completed: isCompleted,
          stage_completed_at: isCompleted ? new Date().toISOString() : null,
          last_attempt_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,axe_id,stage'
        });

      if (error) {
        console.error('❌ Erreur update progress legacy:', error);
      } else {
        console.log('✅ Progress legacy mis à jour:', { userId, axeId, stage, isCompleted });
      }
    } catch (error) {
      console.error('❌ Erreur updateUserProgressLegacy:', error);
    }
  }

  /**
   * Désactiver les sessions existantes
   */
  async deactivateExistingSessions(userId: string, axeId: string, stage: string): Promise<void> {
    const { error } = await supabase
      .from('renaissance_game_sessions')
      .update({ 
        is_active: false,
        last_activity_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('axe_id', axeId)
      .eq('stage', stage)
      .eq('is_active', true);

    if (error) throw error;
  }

  /**
 * Enregistrer une tentative - CORRIGÉ pour ta table existante
 */
async recordAttempt(
  sessionId: string,
  phraseId: string,
  phraseNumber: number,
  attempt: PhraseAttempt
): Promise<void> {
    try {
      // ✅ CORRECTION: Utiliser la bonne table renaissance_attempts (sans game_)
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
          error_type: attempt.isCorrect ? null : 'input_mismatch',
          shown_at: attempt.shownAt || new Date().toISOString(),
          submitted_at: new Date().toISOString()
        });

      if (attemptError) {
        console.error('❌ Erreur insertion tentative:', attemptError);
        throw attemptError;
      }

      // 2. Mettre à jour les stats de session (si le trigger ne le fait pas déjà)
      await this.updateSessionProgress(sessionId, phraseNumber - 1, attempt.isCorrect);
      
      console.log('✅ Tentative enregistrée:', { sessionId, phraseNumber, isCorrect: attempt.isCorrect });

    } catch (error) {
      console.error('❌ Erreur recordAttempt:', error);
      throw error;
    }
  }

  // ========== GESTION DES AXES ET PHRASES ==========
  
  async getAvailableAxes(): Promise<RenaissanceAxe[]> {
    try {
      const axesWithoutPhrases = await this.supabaseService.getAxes();
      // Convertir AxeWithoutPhrases[] vers RenaissanceAxe[] en ajoutant phrases: []
      return axesWithoutPhrases.map(axe => ({
        ...axe,
        phrases: [] // Les phrases seront chargées séparément si nécessaire
      }));
    } catch (error) {
      console.error('Erreur getAvailableAxes:', error);
      throw error;
    }
  }

  async getAxeWithPhrases(axeId: string): Promise<RenaissanceAxe | null> {
    return this.supabaseService.getAxeWithPhrases(axeId);
  }

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

  // ========== MÉTHODES DE COMPATIBILITÉ ==========
  
  /**
   * Démarrer une session (pour compatibilité avec ancien code)
   */
  async startGameSession(
    userId: string,
    axeId: string,
    stage: string,
    flashDuration: number,
    phrasesOrder: number[]
  ): Promise<any> {
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
  }

  /**
   * Enregistrer tentative (méthode legacy)
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
   * Marquer un stage complété
   */
  async completeStage(userId: string, axeId: string, stage: string): Promise<void> {
    return this.supabaseService.markStageCompleted(userId, axeId, stage);
  }

  // ========== VÉRIFICATION ET ANALYSE ==========
  
  checkAnswer(userInput: string, targetPhrase: string): PhraseAttempt {
    const normalizedInput = this.normalizeText(userInput);
    const normalizedTarget = this.normalizeText(targetPhrase);
    
    const isCorrect = normalizedInput === normalizedTarget;
    const differences = isCorrect ? undefined : this.findDifferences(userInput, targetPhrase);

    return {
      userInput,
      isCorrect,
      timestamp: new Date(),
      flashDuration: 500,
      differences,
      expectedText: targetPhrase
    };
  }

  // ========== STATISTIQUES ==========
  
  async getUserStats(userId: string): Promise<RenaissanceStats> {
    try {
      // Essayer le cache d'abord (gérer gracieusement si la table n'existe pas)
      const { data, error } = await supabase
        .from('renaissance_user_stats_cache')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Si la table n'existe pas (erreur 406) ou autre erreur de base, utiliser le fallback
      if (error && (error.code === 'PGRST116' || error.message?.includes('does not exist') || error.message?.includes('Not Acceptable'))) {
        console.log('Cache non disponible, utilisation du calcul direct');
        return await this.getUserStatsLegacy(userId);
      }
      
      if (error) {
        console.warn('Erreur cache, fallback vers legacy:', error);
        return await this.getUserStatsLegacy(userId);
      }
      
      if (data) {
        return {
          totalAxesSelected: data.total_axes_selected || 0,
          axesCompleted: data.total_axes_completed || 0,
          totalProgress: data.overall_progress_percentage || 0,
          averageAccuracy: data.global_accuracy || 0,
          totalTimeSpent: data.total_time_spent_minutes || 0,
          totalAttempts: data.total_attempts || 0,
          lastActivityDate: data.last_activity_at ? new Date(data.last_activity_at) : undefined
        };
      }

      // Fallback vers l'ancienne méthode
      return await this.getUserStatsLegacy(userId);
    } catch (error) {
      console.warn('Erreur getUserStats, utilisation du fallback:', error);
      return await this.getUserStatsLegacy(userId);
    }
  }

  async getUserStatsLegacy(userId: string): Promise<RenaissanceStats> {
    try {
      return await this.supabaseService.getUserStats(userId);
    } catch (error) {
      console.error('Erreur getUserStatsLegacy:', error);
      return {
        totalAxesSelected: 0,
        axesCompleted: 0,
        totalProgress: 0,
        averageAccuracy: 0,
        totalTimeSpent: 0,
        totalAttempts: 0
      };
    }
  }

  // ========== MÉTHODES UTILITAIRES ==========
    private getStageLabel(stage: string): string {
    switch (stage) {
      case 'discovery': return 'Découverte';
      case 'level1': return 'Niveau 1';
      case 'level2': return 'Niveau 2';
      case 'level3': return 'Niveau 3';
      default: return stage;
    }
  }
  private getFlashDuration(stage: string): number {
    switch (stage) {
      case 'discovery': return 500;
      case 'level1': return 3000;
      case 'level2': return 1500;
      case 'level3': return 500;
      default: return 500;
    }
  }

  private shuffleArray(array: number[]): number[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[''`]/g, "'")
      .replace(/[""]/g, '"');
  }

  private findDifferences(input: string, target: string): TextDifference[] {
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

  private getDeviceInfo(): any {
    if (typeof window === 'undefined') return null;
    
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenWidth: screen.width,
      screenHeight: screen.height,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
  }

  private getBrowserInfo(): any {
    if (typeof window === 'undefined') return null;
    
    return {
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: new Date().toISOString()
    };
  }

  private mapSessionFromDB(data: any): GameSession {
    return {
      id: data.id,
      userId: data.user_id,
      axeId: data.axe_id,
      stage: data.stage,
      flashDurationMs: data.flash_duration_ms,
      phrasesOrder: data.phrases_order,
      currentPhraseIndex: data.current_phrase_index,
      isActive: data.is_active,
      isCompleted: data.is_completed,
      correctCount: data.correct_count,
      totalAttempts: data.total_attempts,
      sessionAccuracy: data.session_accuracy,
      startedAt: new Date(data.started_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      lastActivityAt: new Date(data.last_activity_at),
      deviceInfo: data.device_info,
      browserInfo: data.browser_info
    };
  }
}

// Export de l'instance principale
export const renaissanceService = new RenaissanceService();