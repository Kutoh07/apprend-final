// Moteur du jeu flash
// src/lib/utils/flashGameEngine.ts

// Import des types depuis le service Renaissance
import type { 
  RenaissancePhrase, 
  PhraseAttempt, 
  TextDifference 
} from '../services/renaissanceService';

// Types spécifiques au moteur de jeu
export interface FlashGameConfig {
  phrases: RenaissancePhrase[];
  flashDuration: number;
  onPhraseDisplay: (phrase: string, index: number) => void;
  onPhraseHide: () => void;
  onUserInput: (input: string, phrase: RenaissancePhrase, attempt: PhraseAttempt) => void;
  onGameComplete: (results: GameResults) => void;
}

export interface GameResults {
  totalPhrases: number;
  correctAnswers: number;
  accuracy: number;
  attempts: PhraseAttempt[];
  timeSpent: number; // en millisecondes
  averageResponseTime: number;
}

export interface GameState {
  currentPhraseIndex: number;
  isShowingPhrase: boolean;
  isWaitingForInput: boolean;
  isComplete: boolean;
  startTime: number;
  attempts: PhraseAttempt[];
  shuffledOrder: number[];
}

export class FlashGameEngine {
  private phrases: RenaissancePhrase[];
  private flashDuration: number;
  private onPhraseDisplay: (phrase: string, index: number) => void;
  private onPhraseHide: () => void;
  private onUserInput: (input: string, phrase: RenaissancePhrase, attempt: PhraseAttempt) => void;
  private onGameComplete: (results: GameResults) => void;
  
  private state: GameState;
  private currentTimeout?: NodeJS.Timeout;
  private phraseStartTime: number = 0;

  constructor(config: FlashGameConfig) {
    this.phrases = config.phrases;
    this.flashDuration = config.flashDuration;
    this.onPhraseDisplay = config.onPhraseDisplay;
    this.onPhraseHide = config.onPhraseHide;
    this.onUserInput = config.onUserInput;
    this.onGameComplete = config.onGameComplete;

    // Initialiser l'état du jeu
    this.state = {
      currentPhraseIndex: 0,
      isShowingPhrase: false,
      isWaitingForInput: false,
      isComplete: false,
      startTime: Date.now(),
      attempts: [],
      shuffledOrder: this.shufflePhrases(this.phrases.length)
    };
  }

  /**
   * Démarrer le jeu
   */
  start(): void {
    if (this.phrases.length === 0) {
      console.error('Aucune phrase à afficher');
      return;
    }

    this.state.startTime = Date.now();
    this.state.currentPhraseIndex = 0;
    this.state.attempts = [];
    this.displayNextPhrase();
  }

  /**
   * Arrêter le jeu
   */
  stop(): void {
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = undefined;
    }
    this.state.isComplete = true;
  }

  /**
   * Redémarrer le jeu
   */
  restart(): void {
    this.stop();
    this.state = {
      currentPhraseIndex: 0,
      isShowingPhrase: false,
      isWaitingForInput: false,
      isComplete: false,
      startTime: Date.now(),
      attempts: [],
      shuffledOrder: this.shufflePhrases(this.phrases.length)
    };
    this.start();
  }

  /**
   * Afficher la phrase suivante
   */
  private displayNextPhrase(): void {
    if (this.state.currentPhraseIndex >= this.phrases.length) {
      this.completeGame();
      return;
    }

    const shuffledIndex = this.state.shuffledOrder[this.state.currentPhraseIndex];
    const phrase = this.phrases[shuffledIndex];
    
    this.state.isShowingPhrase = true;
    this.state.isWaitingForInput = false;
    this.phraseStartTime = Date.now();

    // Afficher la phrase
    this.onPhraseDisplay(phrase.content, this.state.currentPhraseIndex + 1);

    // Programmer le masquage de la phrase
    this.currentTimeout = setTimeout(() => {
      this.hidePhraseAndWaitForInput();
    }, this.flashDuration);
  }

  /**
   * Masquer la phrase et attendre la saisie utilisateur
   */
  private hidePhraseAndWaitForInput(): void {
    this.state.isShowingPhrase = false;
    this.state.isWaitingForInput = true;
    this.onPhraseHide();
  }

  /**
   * Traiter la saisie utilisateur
   */
  processUserInput(userInput: string): void {
    if (!this.state.isWaitingForInput || this.state.isComplete) {
      return;
    }

    const shuffledIndex = this.state.shuffledOrder[this.state.currentPhraseIndex];
    const currentPhrase = this.phrases[shuffledIndex];
    const responseTime = Date.now() - this.phraseStartTime;

    // Vérifier la réponse
    const attempt = this.checkAnswer(userInput, currentPhrase.content, responseTime);
    this.state.attempts.push(attempt);

    // Notifier le callback
    this.onUserInput(userInput, currentPhrase, attempt);

    // Passer à la phrase suivante
    this.state.currentPhraseIndex++;
    this.state.isWaitingForInput = false;

    // Petit délai avant la phrase suivante pour permettre le feedback
    this.currentTimeout = setTimeout(() => {
      this.displayNextPhrase();
    }, 1500); // 1.5 secondes de délai
  }

  /**
   * Vérifier la réponse utilisateur
   */
  private checkAnswer(userInput: string, targetPhrase: string, responseTime: number): PhraseAttempt {
    const normalizedInput = this.normalizeText(userInput);
    const normalizedTarget = this.normalizeText(targetPhrase);
    
    const isCorrect = normalizedInput === normalizedTarget;
    const differences = isCorrect ? undefined : this.findDifferences(userInput, targetPhrase);

    return {
      userInput: userInput.trim(),
      isCorrect,
      timestamp: new Date(),
      flashDuration: this.flashDuration,
      differences,
      responseTime
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
      .replace(/[""]/g, '"') // Normaliser les guillemets
      .replace(/[.,;:!?]/g, '') // Ignorer la ponctuation pour la comparaison
      .replace(/[^\w\s']/g, ''); // Garder seulement lettres, chiffres, espaces et apostrophes
  }

  /**
   * Trouver les différences entre deux textes
   */
  private findDifferences(input: string, target: string): TextDifference[] {
    const differences: TextDifference[] = [];
    
    // Comparaison simple mot par mot
    const inputWords = input.toLowerCase().trim().split(/\s+/);
    const targetWords = target.toLowerCase().trim().split(/\s+/);
    
    const maxLength = Math.max(inputWords.length, targetWords.length);
    
    for (let i = 0; i < maxLength; i++) {
      const inputWord = inputWords[i] || '';
      const targetWord = targetWords[i] || '';
      
      if (inputWord !== targetWord) {
        if (!inputWord && targetWord) {
          // Mot manquant
          differences.push({
            type: 'missing',
            text: targetWord,
            position: i
          });
        } else if (inputWord && !targetWord) {
          // Mot en trop
          differences.push({
            type: 'extra',
            text: inputWord,
            position: i
          });
        } else {
          // Mot incorrect
          differences.push({
            type: 'incorrect',
            text: inputWord,
            position: i
          });
        }
      }
    }

    return differences;
  }

  /**
   * Mélanger l'ordre des phrases
   */
  private shufflePhrases(length: number): number[] {
    const indices = Array.from({ length }, (_, i) => i);
    
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    return indices;
  }

  /**
   * Terminer le jeu et calculer les résultats
   */
  private completeGame(): void {
    this.state.isComplete = true;
    this.stop();

    const totalTime = Date.now() - this.state.startTime;
    const correctAnswers = this.state.attempts.filter(a => a.isCorrect).length;
    const accuracy = this.state.attempts.length > 0 
      ? Math.round((correctAnswers / this.state.attempts.length) * 100) 
      : 0;

    const responseTimes = this.state.attempts
      .map(a => a.responseTime || 0)
      .filter(t => t > 0);
    
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

    const results: GameResults = {
      totalPhrases: this.phrases.length,
      correctAnswers,
      accuracy,
      attempts: this.state.attempts,
      timeSpent: totalTime,
      averageResponseTime
    };

    this.onGameComplete(results);
  }

  /**
   * Obtenir l'état actuel du jeu
   */
  getState(): Readonly<GameState> {
    return { ...this.state };
  }

  /**
   * Obtenir la phrase actuelle
   */
  getCurrentPhrase(): RenaissancePhrase | null {
    if (this.state.currentPhraseIndex >= this.phrases.length) {
      return null;
    }
    
    const shuffledIndex = this.state.shuffledOrder[this.state.currentPhraseIndex];
    return this.phrases[shuffledIndex];
  }

  /**
   * Obtenir les résultats partiels
   */
  getPartialResults(): Partial<GameResults> {
    const correctAnswers = this.state.attempts.filter(a => a.isCorrect).length;
    const accuracy = this.state.attempts.length > 0 
      ? Math.round((correctAnswers / this.state.attempts.length) * 100) 
      : 0;

    return {
      totalPhrases: this.phrases.length,
      correctAnswers,
      accuracy,
      attempts: this.state.attempts
    };
  }

  /**
   * Vérifier si le jeu est terminé
   */
  isComplete(): boolean {
    return this.state.isComplete;
  }

  /**
   * Vérifier si une phrase est en cours d'affichage
   */
  isShowingPhrase(): boolean {
    return this.state.isShowingPhrase;
  }

  /**
   * Vérifier si le jeu attend une saisie utilisateur
   */
  isWaitingForInput(): boolean {
    return this.state.isWaitingForInput;
  }
}

// Étendre le type PhraseAttempt avec responseTime
declare module '../services/renaissanceService' {
  interface PhraseAttempt {
    responseTime?: number;
  }
}