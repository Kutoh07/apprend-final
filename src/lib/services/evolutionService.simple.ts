// src/lib/services/evolutionService.simple.ts

import { supabase } from '../supabase';

export interface SimpleEvolutionData {
  overallProgress: number;
  completedModules: number;
  totalModules: number;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    unlocked: boolean;
    unlockedAt?: string;
    type: 'streak' | 'completion' | 'milestone';
    rarity: number;
  }>;
  timeInvested: number;
  currentStreak: number;
  moduleProgress: Array<{
    id: number;
    name: string;
    icon: string;
    color: string;
    progress: number;
    entriesCount: number;
  }>;
  timeSeriesData: Array<{
    date: string;
    value: number;
  }>;
  heatmapData: Array<{
    date: string;
    activity: number;
    level: 0 | 1 | 2 | 3 | 4;
  }>;
}

export class SimpleEvolutionService {
  
  static async getEvolutionData(userId: string): Promise<SimpleEvolutionData> {
    console.log('🔄 Récupération des données d\'évolution simplifiées pour:', userId);
    
    // Simuler un délai de chargement
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Données mockées réalistes
    return {
      overallProgress: 65,
      completedModules: 4,
      totalModules: 8,
      timeInvested: 450, // en minutes
      currentStreak: 5,
      
      achievements: [
        {
          id: 'first_module',
          title: 'Premier pas',
          description: 'Complétez votre premier module',
          unlocked: true,
          unlockedAt: '2025-07-25T10:30:00Z',
          type: 'completion',
          rarity: 1
        },
        {
          id: 'streak_7_days',
          title: 'Une semaine forte',
          description: 'Connectez-vous 7 jours consécutifs',
          unlocked: true,
          unlockedAt: '2025-07-28T09:15:00Z',
          type: 'streak',
          rarity: 2
        },
        {
          id: 'half_programme',
          title: 'À mi-chemin',
          description: 'Complétez 50% du programme',
          unlocked: true,
          unlockedAt: '2025-07-29T14:45:00Z',
          type: 'completion',
          rarity: 3
        },
        {
          id: 'perfectionist',
          title: 'Perfectionniste',
          description: 'Atteignez 95% de précision moyenne',
          unlocked: false,
          type: 'milestone',
          rarity: 4
        },
        {
          id: 'programme_complete',
          title: 'Maître du programme',
          description: 'Complétez 100% du programme',
          unlocked: false,
          type: 'completion',
          rarity: 5
        }
      ],
      
      moduleProgress: [
        { id: 1, name: 'Personalisation', icon: '🎯', color: '#3B82F6', progress: 100, entriesCount: 15 },
        { id: 2, name: 'Ambitions', icon: '🚀', color: '#10B981', progress: 100, entriesCount: 12 },
        { id: 3, name: 'Croyances', icon: '💭', color: '#8B5CF6', progress: 85, entriesCount: 8 },
        { id: 4, name: 'Émotions', icon: '❤️', color: '#F59E0B', progress: 70, entriesCount: 6 },
        { id: 5, name: 'Pensées', icon: '🧠', color: '#EF4444', progress: 40, entriesCount: 3 },
        { id: 6, name: 'Environnement', icon: '🌍', color: '#06B6D4', progress: 20, entriesCount: 1 },
        { id: 7, name: 'Travail', icon: '💼', color: '#84CC16', progress: 0, entriesCount: 0 },
        { id: 8, name: 'Caractère', icon: '⭐', color: '#F97316', progress: 0, entriesCount: 0 }
      ],
      
      timeSeriesData: this.generateTimeSeriesData(),
      heatmapData: this.generateHeatmapData()
    };
  }
  
  private static generateTimeSeriesData() {
    const data = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Progression croissante avec variation
      const baseProgress = Math.max(0, 65 - (i * 2));
      const variation = (Math.random() - 0.5) * 10;
      const progress = Math.min(100, Math.max(0, baseProgress + variation));
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.round(progress)
      });
    }
    return data;
  }
  
  private static generateHeatmapData() {
    const data = [];
    const today = new Date();
    
    for (let i = 90; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Plus d'activité en semaine
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const baseActivity = isWeekend ? 1 : 3;
      const variation = Math.random() * 2;
      const activity = Math.round(baseActivity + variation);
      
      data.push({
        date: date.toISOString().split('T')[0],
        activity: activity,
        level: Math.min(4, activity) as 0 | 1 | 2 | 3 | 4
      });
    }
    
    return data;
  }
}
