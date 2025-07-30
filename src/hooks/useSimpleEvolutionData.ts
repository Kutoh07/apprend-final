// src/hooks/useSimpleEvolutionData.ts

'use client';

import { useState, useEffect } from 'react';
import { EvolutionService } from '@/lib/services/evolutionService';
import type { EvolutionData } from '@/lib/types/evolution';

// Adapter pour convertir les données complètes en format simple
const adaptEvolutionData = (data: EvolutionData) => {
  return {
    overallProgress: data.progressStats.overall.completionPercentage,
    completedModules: data.progressStats.overall.totalSubPartsCompleted,
    totalModules: data.progressStats.overall.totalSubParts,
    achievements: data.motivationStats.achievements,
    timeInvested: data.motivationStats.totalTimeInvested,
    currentStreak: data.motivationStats.streaks.currentStreak,
    moduleProgress: data.progressStats.programme.subPartProgress,
    timeSeriesData: data.timeSeriesData.daily,
    heatmapData: data.heatmapData
  };
};

export function useSimpleEvolutionData(userId: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Essayer d'abord le vrai service
      try {
        const evolutionData = await EvolutionService.getEvolutionData(userId);
        setData(adaptEvolutionData(evolutionData));
      } catch (realServiceError) {
        console.warn('Service réel échoué, utilisation des données mockées:', realServiceError);
        // Fallback vers les données mockées
        const mockData = await EvolutionService.getEvolutionDataMock(userId);
        setData(adaptEvolutionData(mockData));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données');
      console.error('Erreur useSimpleEvolutionData:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId]);

  const refresh = async () => {
    await loadData();
  };

  return {
    data,
    loading,
    error,
    refresh
  };
}
