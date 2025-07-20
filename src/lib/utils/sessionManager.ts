// src/lib/utils/sessionManager.ts

import type { GameSession, RenaissancePhrase } from '@/lib/types/renaissance';
import { renaissanceService } from '@/lib/services/renaissanceService';


export class SessionManager {
  static async resumeOrCreateSession(
    userId: string,
    axeId: string,
    stage: string,
    flashDuration: number,
    phrases: RenaissancePhrase[]
  ): Promise<{ session: GameSession; shouldResume: boolean }> {
    // Vérifier session active
    const activeSession = await renaissanceService.getActiveSession(userId, axeId);
    
    if (activeSession && activeSession.stage === stage) {
      return { session: activeSession, shouldResume: true };
    }
    
    // Créer nouvelle session
    const phrasesOrder = this.shufflePhrases(phrases.length);
    const newSession = await renaissanceService.startGameSession(
      userId,
      axeId,
      stage,    
      flashDuration,
      phrasesOrder
    );
    
    return { session: newSession, shouldResume: false };
  }

  private static shufflePhrases(length: number): number[] {
    const indices = Array.from({ length }, (_, i) => i);
    
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    return indices;
  }
}