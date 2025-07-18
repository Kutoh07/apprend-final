// Service Supabase pour la gestion des axes
// src/lib/services/axeSupabaseService.ts

import { supabase } from '../supabase';
import type { RenaissanceAxe, RenaissancePhrase } from './renaissanceService';

export class AxeSupabaseService {
  async getAxes(): Promise<RenaissanceAxe[]> {
    try {
      const { data, error } = await supabase
        .from('renaissance_axes')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        console.error('Erreur lors du chargement des axes:', error);
        throw error;
      }

      return data.map(axe => ({
        id: axe.id,
        name: axe.name,
        icon: axe.icon,
        description: axe.description,
        sortOrder: axe.sort_order,
        isActive: axe.is_active,
        isCustomizable: axe.is_customizable
      }));

    } catch (error) {
      console.error('Erreur getAxes:', error);
      throw error;
    }
  }

  async getAxeById(axeId: string): Promise<RenaissanceAxe | null> {
    try {
      const { data, error } = await supabase
        .from('renaissance_axes')
        .select('*')
        .eq('id', axeId)
        .single();

      if (error) {
        console.error('Axe non trouvé:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        icon: data.icon,
        description: data.description,
        sortOrder: data.sort_order,
        isActive: data.is_active,
        isCustomizable: data.is_customizable
      };

    } catch (error) {
      console.error('Erreur getAxeById:', error);
      return null;
    }
  }

  async getAxeWithPhrases(axeId: string): Promise<RenaissanceAxe | null> {
    try {
      const axe = await this.getAxeById(axeId);
      if (!axe) {
        return null;
      }

      const { data: phrasesData, error: phrasesError } = await supabase
        .from('renaissance_phrases')
        .select('*')
        .eq('axe_id', axeId)
        .order('phrase_number');

      if (phrasesError) {
        console.error('Erreur phrases:', phrasesError);
        throw phrasesError;
      }

      const phrases: RenaissancePhrase[] = phrasesData?.map(p => ({
        id: p.id,
        axeId: p.axe_id,
        phraseNumber: p.phrase_number,
        content: p.content
      })) || [];

      return {
        ...axe,
        phrases
      };

    } catch (error) {
      console.error('Erreur getAxeWithPhrases:', error);
      return null;
    }
  }

  async getPhrasesByAxeId(axeId: string): Promise<RenaissancePhrase[]> {
    try {
      const { data, error } = await supabase
        .from('renaissance_phrases')
        .select('*')
        .eq('axe_id', axeId)
        .order('phrase_number');

      if (error) {
        console.error('Erreur récupération phrases:', error);
        throw error;
      }

      return data.map(p => ({
        id: p.id,
        axeId: p.axe_id,
        phraseNumber: p.phrase_number,
        content: p.content
      }));

    } catch (error) {
      console.error('Erreur getPhrasesByAxeId:', error);
      return [];
    }
  }
}

export const axeSupabaseService = new AxeSupabaseService();
