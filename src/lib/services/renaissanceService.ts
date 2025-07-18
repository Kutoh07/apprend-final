// Service principal Renaissance
// src/lib/services/renaissanceService.ts

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