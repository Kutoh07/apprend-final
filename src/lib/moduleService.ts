// src/lib/moduleService.ts - OPTIMIZED VERSION

import { supabase } from './supabase';
import { SubPartField, SUBPARTS_CONFIG } from './types/programme';

// 🔥 NOUVEAU : Types pour l'optimisation
interface ModuleProgressData {
  subpart_id: number;
  entry_count: number;
  current_progress: number;
  is_completed: boolean;
}

interface BatchUpdateOperation {
  user_id: string;
  subpart_id: number;
  progress: number;
  completed: boolean;
  completed_at: string | null;
  updated_at: string;
}

export class ModuleService {
  
  // 🔥 NOUVEAU : Cache pour éviter les recalculs inutiles
  private static progressCache = new Map<string, ModuleProgressData[]>();
  private static cacheTimestamp = new Map<string, number>();
  private static readonly CACHE_DURATION = 5000; // 5 secondes

  /**
   * 🚀 OPTIMIZED : Recalcul global ultra-rapide avec batch processing
   */
  static async recalculateAllModulesProgress(userId: string): Promise<void> {
    console.log(`🚀 ModuleService - Recalcul global optimisé pour user ${userId}`);
    const startTime = performance.now();
    
    try {
      // 1. 🔥 Single query pour récupérer TOUTES les données nécessaires
      const moduleData = await this.fetchAllModuleDataInOneQuery(userId);
      
      // 2. 🔥 Calcul en mémoire (ultra-rapide)
      const { progressUpdates, globalProgress } = this.calculateAllProgressInMemory(moduleData);
      
      // 3. 🔥 Batch update de tous les modules en une seule transaction
      await this.batchUpdateAllModules(userId, progressUpdates, globalProgress);
      
      // 4. 🔥 Mise à jour du cache
      this.updateProgressCache(userId, moduleData);
      
      const endTime = performance.now();
      console.log(`✅ Recalcul global terminé en ${Math.round(endTime - startTime)}ms`);
      
    } catch (error) {
      console.error('💥 Erreur lors du recalcul global optimisé:', error);
      throw error;
    }
  }

  /**
   * 🚀 OPTIMIZED : Récupération de toutes les données en une seule requête
   */
  private static async fetchAllModuleDataInOneQuery(userId: string): Promise<ModuleProgressData[]> {
    console.log('📊 Récupération optimisée des données...');
    
    // Single query avec COUNT et JOIN pour tout récupérer d'un coup
    const { data: entryCounts, error } = await supabase
      .from('programme_entries')
      .select('subpart_id')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Erreur récupération données: ${error.message}`);
    }

    // Compter les entrées par module en mémoire (ultra-rapide)
    const entryCountMap = new Map<number, number>();
    entryCounts?.forEach(entry => {
      const count = entryCountMap.get(entry.subpart_id) || 0;
      entryCountMap.set(entry.subpart_id, count + 1);
    });

    // Construire les données pour tous les modules
    return SUBPARTS_CONFIG.map(config => {
      const entryCount = entryCountMap.get(config.id) || 0;
      const minRequired = config.minFields || 1;
      const progress = Math.min(100, Math.round((entryCount / minRequired) * 100));
      const isCompleted = progress >= 100;

      return {
        subpart_id: config.id,
        entry_count: entryCount,
        current_progress: progress,
        is_completed: isCompleted
      };
    });
  }

  /**
   * 🚀 OPTIMIZED : Calcul de toutes les progressions en mémoire
   */
  private static calculateAllProgressInMemory(moduleData: ModuleProgressData[]): {
    progressUpdates: BatchUpdateOperation[];
    globalProgress: number;
  } {
    console.log('🧮 Calcul des progressions en mémoire...');
    
    const now = new Date().toISOString();
    const progressUpdates: BatchUpdateOperation[] = [];
    
    // 🔥 NOUVEAU : Logique de blocage en cascade COMPLÈTE
    let firstInvalidModuleIndex = -1;
    
    // Identifier le premier module invalide
    for (let i = 0; i < moduleData.length; i++) {
      const module = moduleData[i];
      if (!module.is_completed && firstInvalidModuleIndex === -1) {
        firstInvalidModuleIndex = i;
        break;
      }
    }

    // Construire les mises à jour pour chaque module
    moduleData.forEach((module, index) => {
      let finalProgress = module.current_progress;
      let finalCompleted = module.is_completed;
      let finalCompletedAt: string | null = module.is_completed ? now : null;

      // 🔥 CORRECTION : Bloquer TOUS les modules après le premier invalide
      if (firstInvalidModuleIndex !== -1 && index > firstInvalidModuleIndex) {
        finalProgress = 0;
        finalCompleted = false;
        finalCompletedAt = null;
        console.log(`🔒 Module ${module.subpart_id} bloqué (après module invalide ${firstInvalidModuleIndex + 1})`);
      }

      progressUpdates.push({
        user_id: '', // Sera rempli dans batchUpdate
        subpart_id: module.subpart_id,
        progress: finalProgress,
        completed: finalCompleted,
        completed_at: finalCompletedAt,
        updated_at: now
      });
    });

    // Calcul de la progression globale
    const totalProgress = progressUpdates.reduce((sum, update) => sum + update.progress, 0);
    const globalProgress = Math.round(totalProgress / progressUpdates.length);

    console.log(`🧮 Progressions calculées: global ${globalProgress}%, ${progressUpdates.filter(u => u.completed).length} modules complétés`);
    
    return { progressUpdates, globalProgress };
  }

  /**
   * 🚀 OPTIMIZED : Mise à jour en batch ultra-rapide
   */
  private static async batchUpdateAllModules(
    userId: string, 
    progressUpdates: BatchUpdateOperation[], 
    globalProgress: number
  ): Promise<void> {
    console.log('⚡ Mise à jour batch de tous les modules...');
    
    try {
      // Préparer les données pour l'upsert batch
      const upsertData = progressUpdates.map(update => ({
        ...update,
        user_id: userId
      }));

      // 🔥 Single batch upsert pour tous les modules
      const { error: batchError } = await supabase
        .from('subpart_progress')
        .upsert(upsertData, {
          onConflict: 'user_id,subpart_id'
        });

      if (batchError) {
        throw new Error(`Erreur batch update modules: ${batchError.message}`);
      }

      // 🔥 Mise à jour du programme global en parallèle
      const { error: globalError } = await supabase
        .from('user_programmes')
        .upsert({
          user_id: userId,
          overall_progress: globalProgress,
          completed_at: globalProgress >= 100 ? new Date().toISOString() : null,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (globalError) {
        throw new Error(`Erreur update global: ${globalError.message}`);
      }

      console.log(`⚡ Batch update terminé: ${progressUpdates.length} modules + global`);
      
    } catch (error) {
      console.error('💥 Erreur batch update:', error);
      throw error;
    }
  }

  /**
   * 🔥 NOUVEAU : Gestion du cache intelligent
   */
  private static updateProgressCache(userId: string, data: ModuleProgressData[]): void {
    this.progressCache.set(userId, data);
    this.cacheTimestamp.set(userId, Date.now());
  }

  private static getCachedProgress(userId: string): ModuleProgressData[] | null {
    const timestamp = this.cacheTimestamp.get(userId);
    if (!timestamp || Date.now() - timestamp > this.CACHE_DURATION) {
      return null;
    }
    return this.progressCache.get(userId) || null;
  }

  /**
   * 🚀 OPTIMIZED : Mise à jour d'une entrée avec cache
   */
  static async updateField(userId: string, fieldId: string, newValue: string): Promise<void> {
    console.log(`✏️ ModuleService - Mise à jour entrée optimisée ${fieldId}`);
    
    const { error } = await supabase
      .from('programme_entries')
      .update({ 
        value: newValue.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', fieldId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Erreur mise à jour: ${error.message}`);
    }

    // Invalider le cache et recalculer
    this.invalidateCache(userId);
    await this.recalculateAllModulesProgress(userId);
  }

  /**
   * 🚀 OPTIMIZED : Suppression d'une entrée avec recalcul optimisé
   */
  static async deleteField(userId: string, fieldId: string, subPartId: number): Promise<void> {
    console.log(`🗑️ ModuleService - Suppression entrée optimisée ${fieldId}`);
    
    const { error } = await supabase
      .from('programme_entries')
      .delete()
      .eq('id', fieldId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Erreur suppression: ${error.message}`);
    }

    // Invalider le cache et recalculer
    this.invalidateCache(userId);
    await this.recalculateAllModulesProgress(userId);
  }

  /**
   * 🚀 OPTIMIZED : Vérification d'accès avec cache
   */
  static async canAccessModule(userId: string, subPartId: number): Promise<boolean> {
    console.log(`🔐 ModuleService - Vérification accès optimisée module ${subPartId}`);
    
    if (subPartId === 1) return true;

    try {
      // Essayer le cache d'abord
      const cachedData = this.getCachedProgress(userId);
      if (cachedData) {
        const prevModule = cachedData.find(m => m.subpart_id === subPartId - 1);
        if (prevModule) {
          console.log(`🎯 Cache hit pour module ${subPartId - 1}`);
          return prevModule.is_completed;
        }
      }

      // Fallback vers DB si pas de cache
      const { data: prevProgress, error } = await supabase
        .from('subpart_progress')
        .select('completed')
        .eq('user_id', userId)
        .eq('subpart_id', subPartId - 1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          await this.recalculateAllModulesProgress(userId);
          return false;
        }
        return false;
      }

      return prevProgress?.completed || false;
      
    } catch (error) {
      console.error('💥 Erreur vérification accès:', error);
      return subPartId === 1;
    }
  }

  /**
   * 🔥 NOUVEAU : Invalidation du cache
   */
  private static invalidateCache(userId: string): void {
    this.progressCache.delete(userId);
    this.cacheTimestamp.delete(userId);
    console.log(`🗑️ Cache invalidé pour user ${userId}`);
  }

  /**
   * 🔥 NOUVEAU : Méthode utilitaire pour obtenir la progression actuelle
   */
  static async getCurrentProgress(userId: string): Promise<ModuleProgressData[]> {
    const cachedData = this.getCachedProgress(userId);
    if (cachedData) {
      console.log('🎯 Utilisation du cache pour getCurrentProgress');
      return cachedData;
    }

    return await this.fetchAllModuleDataInOneQuery(userId);
  }

  /**
   * 🔥 NOUVEAU : Nettoyage du cache (à appeler périodiquement)
   */
  static cleanupCache(): void {
    const now = Date.now();
    const expiredUsers: string[] = [];

    this.cacheTimestamp.forEach((timestamp, userId) => {
      if (now - timestamp > this.CACHE_DURATION) {
        expiredUsers.push(userId);
      }
    });

    expiredUsers.forEach(userId => {
      this.progressCache.delete(userId);
      this.cacheTimestamp.delete(userId);
    });

    if (expiredUsers.length > 0) {
      console.log(`🧹 Cache nettoyé: ${expiredUsers.length} utilisateurs expirés`);
    }
  }

  // Méthodes utilitaires conservées
  static getPreviousModule(currentSubPartId: number) {
    const currentIndex = SUBPARTS_CONFIG.findIndex(c => c.id === currentSubPartId);
    return currentIndex > 0 ? SUBPARTS_CONFIG[currentIndex - 1] : null;
  }

  static getNextModule(currentSubPartId: number) {
    const currentIndex = SUBPARTS_CONFIG.findIndex(c => c.id === currentSubPartId);
    return currentIndex < SUBPARTS_CONFIG.length - 1 ? SUBPARTS_CONFIG[currentIndex + 1] : null;
  }
}