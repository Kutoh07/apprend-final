// src/hooks/useEvolutionData.ts

import { useState, useEffect } from 'react';
import { EvolutionService } from '@/lib/services/evolutionService';
import type { EvolutionData } from '@/lib/types/evolution';

export function useEvolutionData(userId: string) {
  const [data, setData] = useState<EvolutionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const loadEvolutionData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const evolutionData = await EvolutionService.getEvolutionData(userId);
        setData(evolutionData);
        
      } catch (err) {
        console.error('Erreur lors du chargement des données d\'évolution:', err);
        setError('Impossible de charger les données d\'évolution');
      } finally {
        setLoading(false);
      }
    };

    loadEvolutionData();
  }, [userId]);

  const refresh = async () => {
    if (!userId) return;
    
    try {
      setError(null);
      const evolutionData = await EvolutionService.getEvolutionData(userId);
      setData(evolutionData);
    } catch (err) {
      console.error('Erreur lors du rafraîchissement:', err);
      setError('Impossible de rafraîchir les données');
    }
  };

  return {
    data,
    loading,
    error,
    refresh
  };
}
