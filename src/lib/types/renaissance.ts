// Types TypeScript
// src/lib/types/renaissance.ts

export interface RenaissanceAxe {
  id: string;
  name: string;
  icon: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  isCustomizable: boolean;
  phrases: RenaissancePhrase[];
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
  shownAt?: string; // ✅ CHANGÉ: Date → string (pour compatibilité ISO string)
}

export interface TextDifference {
  type: 'correct' | 'incorrect' | 'missing' | 'extra';
  text: string;
  position: number;
  expectedText?: string; // ✅ AJOUTÉ: Pour les mots incorrects
}

// ✅ NOUVEAU: Interface pour les sessions de jeu avec table dédiée
export interface GameSession {
  id: string;
  userId: string;
  axeId: string;
  stage: 'discovery' | 'level1' | 'level2' | 'level3';
  flashDurationMs: number;
  phrasesOrder: number[];
  currentPhraseIndex: number;
  isActive: boolean;
  isCompleted: boolean;
  correctCount: number;
  totalAttempts: number;
  sessionAccuracy: number;
  startedAt: Date;
  completedAt?: Date;
  lastActivityAt: Date;
  deviceInfo?: any;
  browserInfo?: any;
}

// ✅ NOUVEAU: Interface pour les tentatives détaillées
export interface DetailedAttempt extends PhraseAttempt {
  sessionId: string;
  phraseId: string;
  phraseNumber: number;
  similarityScore?: number;
  errorAnalysis?: any;
  shownAt: string; // ✅ COHÉRENT: string au lieu de Date
  submittedAt: Date;
}

export interface RenaissanceStats {
  totalAxesSelected: number;
  axesCompleted: number;
  totalProgress: number;
  averageAccuracy: number;
  totalTimeSpent: number; // en minutes
  totalAttempts: number;
  lastActivityDate?: Date;
}