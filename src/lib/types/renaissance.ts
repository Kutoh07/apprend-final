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
}

export interface RenaissanceStats {
  totalAxesSelected: number;
  axesCompleted: number;
  totalProgress: number; // 0-100%
  discoveryCompleted: number;
  encrageCompleted: number;
  averageAccuracy: number;
  totalTimeSpent: number; // en minutes
}