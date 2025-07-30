// src/lib/programmeSupabaseService.ts - OPTIMIZED VERSION

import { supabase } from './supabase';
import { ProgrammeData, SubPart, SUBPARTS_CONFIG, SubPartField } from './types/programme';
import { ModuleService } from './moduleService';
import { EvolutionUpdateService } from './services/evolutionUpdateService';

// 🔥 NOUVEAU : Types pour l'optimisation
interface OptimizedProgrammeData {
  programme: any;
  entries: any[];
  progress: any[];
}

export class ProgrammeSupabaseService {
  
  // 🔥 NOUVEAU : Cache pour les données du programme
  private static programmeCache = new Map<string, ProgrammeData>();
  private static cacheTimestamp = new Map<string, number>();
  private static readonly CACHE_DURATION = 10000; // 10 secondes

  /**
   * 🚀 OPTIMIZED : Récupération ultra-rapide avec une seule requête parallèle
   */
  async getProgramme(userId: string): Promise<ProgrammeData | null> {
    console.log(`🚀 Récupération optimisée du programme pour: ${userId}`);
    const startTime = performance.now();

    try {
      // Vérifier le cache d'abord
      const cachedProgramme = this.getCachedProgramme(userId);
      if (cachedProgramme) {
        console.log(`🎯 Cache hit pour le programme user ${userId}`);
        return cachedProgramme;
      }

      // 🔥 Requêtes parallèles pour maximum de performance
      const [programmeResult, entriesResult, progressResult] = await Promise.all([
        supabase.from('user_programmes').select('*').eq('user_id', userId).single(),
        supabase.from('programme_entries').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
        supabase.from('subpart_progress').select('*').eq('user_id', userId).order('subpart_id')
      ]);

      // Gestion d'erreur pour le programme principal
      if (programmeResult.error) {
        if (programmeResult.error.code === 'PGRST116') {
          console.log('🏗️ Programme non trouvé, initialisation...');
          return await this.initializeProgramme(userId);
        }
        throw programmeResult.error;
      }

      if (entriesResult.error) throw entriesResult.error;
      if (progressResult.error) throw progressResult.error;

      // 🔥 Construction optimisée du programme en mémoire
      const programme = this.buildProgrammeInMemory({
        programme: programmeResult.data,
        entries: entriesResult.data || [],
        progress: progressResult.data || []
      }, userId);

      // Mise en cache
      this.setCachedProgramme(userId, programme);

      const endTime = performance.now();
      console.log(`✅ Programme récupéré en ${Math.round(endTime - startTime)}ms`);

      return programme;

    } catch (error) {
      console.error('💥 Erreur récupération programme optimisée:', error);
      return null;
    }
  }

  /**
   * 🔥 NOUVEAU : Construction ultra-rapide du programme en mémoire
   */
  private buildProgrammeInMemory(data: OptimizedProgrammeData, userId: string): ProgrammeData {
    console.log('🧮 Construction du programme en mémoire...');

    // Grouper les entrées par subpart_id en une seule passe
    const entriesBySubpart = new Map<number, any[]>();
    data.entries.forEach(entry => {
      const subpartId = entry.subpart_id;
      if (!entriesBySubpart.has(subpartId)) {
        entriesBySubpart.set(subpartId, []);
      }
      entriesBySubpart.get(subpartId)!.push(entry);
    });

    // Créer un Map du progrès pour accès O(1)
    const progressMap = new Map<number, any>();
    data.progress.forEach(p => {
      progressMap.set(p.subpart_id, p);
    });

    // Construire les SubParts optimisé
    const subParts: SubPart[] = SUBPARTS_CONFIG.map(config => {
      const subpartEntries = entriesBySubpart.get(config.id) || [];
      const progressInfo = progressMap.get(config.id);

      const fields: SubPartField[] = subpartEntries.map(entry => ({
        id: entry.id,
        value: entry.value,
        createdAt: new Date(entry.created_at),
        updatedAt: entry.updated_at ? new Date(entry.updated_at) : undefined
      }));

      return {
        ...config,
        fields,
        completed: progressInfo?.completed || false,
        progress: progressInfo?.progress || 0
      };
    });

    return {
      userId,
      subParts,
      currentSubPart: data.programme.current_subpart,
      overallProgress: data.programme.overall_progress,
      lastUpdated: new Date(data.programme.last_updated),
      completedAt: data.programme.completed_at ? new Date(data.programme.completed_at) : undefined
    };
  }

  /**
   * 🚀 OPTIMIZED : Ajout d'entrée avec invalidation de cache intelligente
   */
  async addField(userId: string, subPartId: number, value: string): Promise<SubPartField | null> {
    console.log(`📝 Ajout optimisé pour sous-partie ${subPartId}`);
    const startTime = performance.now();

    try {
      const config = SUBPARTS_CONFIG.find(c => c.id === subPartId);
      if (!config) {
        throw new Error(`Configuration non trouvée pour la sous-partie ${subPartId}`);
      }

      // Vérification des limites en parallèle si nécessaire
      if (config.maxFields) {
        const { count, error: countError } = await supabase
          .from('programme_entries')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('subpart_id', subPartId);

        if (countError) throw new Error(`Erreur comptage: ${countError.message}`);
        if (count && count >= config.maxFields) {
          throw new Error(`Maximum ${config.maxFields} entrées autorisées pour ${config.name}`);
        }
      }

      // Insertion de la nouvelle entrée
      const { data: newEntry, error: insertError } = await supabase
        .from('programme_entries')
        .insert({
          user_id: userId,
          subpart_id: subPartId,
          value: value.trim(),
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) throw new Error(`Erreur ajout: ${insertError.message}`);

      // 🔥 Invalidation de cache et recalcul optimisé
      this.invalidateCache(userId);
      await ModuleService.recalculateAllModulesProgress(userId);

      // 🎯 NOUVEAU : Mise à jour des statistiques d'évolution
      try {
        const wordCount = value.trim().split(/\s+/).length;
        await EvolutionUpdateService.onProgrammeEntryCreated(userId, subPartId, value, wordCount);
      } catch (evolutionError) {
        console.warn('⚠️ Erreur mise à jour statistiques évolution:', evolutionError);
        // Ne pas faire échouer l'ajout pour une erreur de stats
      }

      const endTime = performance.now();
      console.log(`✅ Entrée ajoutée en ${Math.round(endTime - startTime)}ms`);

      return {
        id: newEntry.id,
        value: newEntry.value,
        createdAt: new Date(newEntry.created_at),
        updatedAt: newEntry.updated_at ? new Date(newEntry.updated_at) : undefined
      };

    } catch (error) {
      console.error('💥 Erreur ajout optimisé:', error);
      throw error;
    }
  }

  /**
   * 🚀 OPTIMIZED : Mise à jour d'entrée avec cache intelligent
   */
  async updateField(userId: string, fieldId: string, newValue: string): Promise<void> {
    console.log(`✏️ Mise à jour optimisée entrée ${fieldId}`);
    const startTime = performance.now();

    try {
      const { error } = await supabase
        .from('programme_entries')
        .update({ 
          value: newValue.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', fieldId)
        .eq('user_id', userId);

      if (error) throw new Error(`Erreur mise à jour: ${error.message}`);

      // 🔥 Invalidation de cache et recalcul optimisé
      this.invalidateCache(userId);
      await ModuleService.recalculateAllModulesProgress(userId);

      const endTime = performance.now();
      console.log(`✅ Entrée mise à jour en ${Math.round(endTime - startTime)}ms`);

    } catch (error) {
      console.error('💥 Erreur mise à jour optimisée:', error);
      throw error;
    }
  }

  /**
   * 🚀 OPTIMIZED : Suppression d'entrée avec recalcul optimisé
   */
  async removeField(userId: string, fieldId: string, subPartId: number): Promise<void> {
    console.log(`🗑️ Suppression optimisée entrée ${fieldId}`);
    const startTime = performance.now();

    try {
      const { error } = await supabase
        .from('programme_entries')
        .delete()
        .eq('id', fieldId)
        .eq('user_id', userId);

      if (error) throw new Error(`Erreur suppression: ${error.message}`);

      // 🔥 Invalidation de cache et recalcul optimisé
      this.invalidateCache(userId);
      await ModuleService.recalculateAllModulesProgress(userId);

      const endTime = performance.now();
      console.log(`✅ Entrée supprimée en ${Math.round(endTime - startTime)}ms`);

    } catch (error) {
      console.error('💥 Erreur suppression optimisée:', error);
      throw error;
    }
  }

  /**
   * 🚀 OPTIMIZED : Sauvegarde avec cache intelligent
   */
  async saveProgramme(programme: ProgrammeData): Promise<void> {
    console.log(`💾 Sauvegarde optimisée pour: ${programme.userId}`);
    const startTime = performance.now();

    try {
      const { error } = await supabase
        .from('user_programmes')
        .update({
          current_subpart: programme.currentSubPart,
          overall_progress: programme.overallProgress,
          completed_at: programme.completedAt ? programme.completedAt.toISOString() : null,
          last_updated: new Date().toISOString()
        })
        .eq('user_id', programme.userId);

      if (error) throw new Error(`Erreur sauvegarde: ${error.message}`);

      // 🔥 Mise à jour du cache local
      this.setCachedProgramme(programme.userId, programme);
      await ModuleService.recalculateAllModulesProgress(programme.userId);

      const endTime = performance.now();
      console.log(`✅ Programme sauvegardé en ${Math.round(endTime - startTime)}ms`);

    } catch (error) {
      console.error('💥 Erreur sauvegarde optimisée:', error);
      throw error;
    }
  }

  /**
   * 🚀 OPTIMIZED : Initialisation avec batch processing
   */
  async initializeProgramme(userId: string): Promise<ProgrammeData> {
    console.log(`🏗️ Initialisation optimisée pour: ${userId}`);
    const startTime = performance.now();

    try {
      // Vérifier existence
      const { data: existingProgramme } = await supabase
        .from('user_programmes')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existingProgramme) {
        const programme = await this.getProgramme(userId);
        if (programme) return programme;
      }

      // 🔥 Batch insert optimisé
      const [programmeResult, progressResult] = await Promise.all([
        supabase.from('user_programmes').insert({
          user_id: userId,
          current_subpart: 0,
          overall_progress: 0,
          last_updated: new Date().toISOString()
        }).select().single(),
        
        supabase.from('subpart_progress').insert(
          SUBPARTS_CONFIG.map(config => ({
            user_id: userId,
            subpart_id: config.id,
            progress: 0,
            completed: false,
            updated_at: new Date().toISOString()
          }))
        )
      ]);

      if (programmeResult.error) throw new Error(`Erreur programme: ${programmeResult.error.message}`);
      if (progressResult.error) throw new Error(`Erreur progrès: ${progressResult.error.message}`);

      const programme = await this.getProgramme(userId);
      if (!programme) throw new Error('Échec de la création du programme');

      const endTime = performance.now();
      console.log(`✅ Programme initialisé en ${Math.round(endTime - startTime)}ms`);

      return programme;

    } catch (error) {
      console.error('💥 Erreur initialisation optimisée:', error);
      throw error;
    }
  }

  /**
   * 🚀 OPTIMIZED : Vérification d'accès avec cache
   */
  async canAccessSubPart(userId: string, subPartId: number): Promise<boolean> {
    if (subPartId === 1) return true;

    try {
      // Utiliser le cache du ModuleService si disponible
      const progressData = await ModuleService.getCurrentProgress(userId);
      const prevModule = progressData.find(m => m.subpart_id === subPartId - 1);
      
      if (prevModule) {
        return prevModule.is_completed;
      }

      // Fallback vers DB
      const { data, error } = await supabase
        .from('subpart_progress')
        .select('completed')
        .eq('user_id', userId)
        .eq('subpart_id', subPartId - 1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          await this.initializeProgramme(userId);
          return subPartId === 1;
        }
        throw error;
      }

      return data.completed;

    } catch (error) {
      console.error(`💥 Erreur vérification accès optimisée:`, error);
      return false;
    }
  }

  /**
   * 🔥 NOUVEAU : Gestion du cache du programme
   */
  private getCachedProgramme(userId: string): ProgrammeData | null {
    const timestamp = ProgrammeSupabaseService.cacheTimestamp.get(userId);
    if (!timestamp || Date.now() - timestamp > ProgrammeSupabaseService.CACHE_DURATION) {
      return null;
    }
    return ProgrammeSupabaseService.programmeCache.get(userId) || null;
  }

  private setCachedProgramme(userId: string, programme: ProgrammeData): void {
    ProgrammeSupabaseService.programmeCache.set(userId, programme);
    ProgrammeSupabaseService.cacheTimestamp.set(userId, Date.now());
  }

  private invalidateCache(userId: string): void {
    ProgrammeSupabaseService.programmeCache.delete(userId);
    ProgrammeSupabaseService.cacheTimestamp.delete(userId);
    console.log(`🗑️ Cache programme invalidé pour user ${userId}`);
  }

  /**
   * 🔥 NOUVEAU : Remise à zéro optimisée avec batch processing
   */
  async resetSubPart(userId: string, subPartId: number): Promise<void> {
    console.log(`🔄 Remise à zéro optimisée sous-partie ${subPartId} et suivantes`);
    const startTime = performance.now();

    try {
      // 🔥 Batch operations en parallèle
      const subpartsToReset = SUBPARTS_CONFIG.filter(c => c.id >= subPartId).map(c => c.id);
      
      const [deleteResult, resetResult] = await Promise.all([
        // Suppression des entrées
        supabase
          .from('programme_entries')
          .delete()
          .eq('user_id', userId)
          .gte('subpart_id', subPartId),
        
        // Reset du progrès en batch
        supabase
          .from('subpart_progress')
          .upsert(
            subpartsToReset.map(id => ({
              user_id: userId,
              subpart_id: id,
              progress: 0,
              completed: false,
              completed_at: null,
              updated_at: new Date().toISOString()
            })),
            { onConflict: 'user_id,subpart_id' }
          )
      ]);

      if (deleteResult.error) throw new Error(`Erreur suppression: ${deleteResult.error.message}`);
      if (resetResult.error) throw new Error(`Erreur reset: ${resetResult.error.message}`);

      // Invalidation et recalcul
      this.invalidateCache(userId);
      await ModuleService.recalculateAllModulesProgress(userId);

      const endTime = performance.now();
      console.log(`✅ Remise à zéro optimisée terminée en ${Math.round(endTime - startTime)}ms`);

    } catch (error) {
      console.error('💥 Erreur remise à zéro optimisée:', error);
      throw error;
    }
  }

  /**
   * 🔥 NOUVEAU : Nettoyage périodique du cache
   */
  static cleanupCache(): void {
    const now = Date.now();
    const expiredUsers: string[] = [];

    ProgrammeSupabaseService.cacheTimestamp.forEach((timestamp, userId) => {
      if (now - timestamp > ProgrammeSupabaseService.CACHE_DURATION) {
        expiredUsers.push(userId);
      }
    });

    expiredUsers.forEach(userId => {
      ProgrammeSupabaseService.programmeCache.delete(userId);
      ProgrammeSupabaseService.cacheTimestamp.delete(userId);
    });

    if (expiredUsers.length > 0) {
      console.log(`🧹 Cache programme nettoyé: ${expiredUsers.length} utilisateurs expirés`);
    }

    // Nettoyer aussi le cache du ModuleService
    ModuleService.cleanupCache();
  }

  /**
   * 🔥 NOUVEAU : Préchargement intelligent du cache
   */
  async preloadCache(userId: string): Promise<void> {
    console.log(`🚀 Préchargement du cache pour user ${userId}`);
    
    try {
      // Précharger le programme et les progressions en parallèle
      await Promise.all([
        this.getProgramme(userId),
        ModuleService.getCurrentProgress(userId)
      ]);
      
      console.log(`✅ Cache préchargé pour user ${userId}`);
    } catch (error) {
      console.error('💥 Erreur préchargement cache:', error);
    }
  }

  /**
   * 🔥 NOUVEAU : Statistiques de performance du cache
   */
  static getCacheStats(): {
    programmeCache: { size: number; hitRate: number };
    moduleCache: { size: number };
  } {
    return {
      programmeCache: {
        size: ProgrammeSupabaseService.programmeCache.size,
        hitRate: 0 // Peut être implémenté avec des compteurs
      },
      moduleCache: {
        size: 0 // Accès via ModuleService
      }
    };
  }
}

// Instance singleton optimisée
export const programmeSupabaseService = new ProgrammeSupabaseService();

// 🔥 NOUVEAU : Nettoyage automatique du cache toutes les 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    ProgrammeSupabaseService.cleanupCache();
  }, 5 * 60 * 1000); // 5 minutes
}