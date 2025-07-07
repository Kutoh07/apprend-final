// src/lib/moduleService.ts
import { supabase } from './supabase';
import { SubPartField, SUBPARTS_CONFIG } from './types/programme';

export class ModuleService {
  
  // Mettre à jour une entrée existante
  static async updateField(userId: string, fieldId: string, newValue: string): Promise<void> {
    const { error } = await supabase
      .from('programme_entries')
      .update({ 
        value: newValue.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', fieldId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
    }
  }

  // Supprimer une entrée et mettre à jour les progressions
  static async deleteField(userId: string, fieldId: string, subPartId: number): Promise<void> {
    const { error } = await supabase
      .from('programme_entries')
      .delete()
      .eq('id', fieldId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Erreur lors de la suppression: ${error.message}`);
    }

    // Mettre à jour les progressions après suppression
    await this.updateProgressions(userId, subPartId);
  }

  // Vérifier si un module peut être accessible
  static async canAccessModule(userId: string, subPartId: number): Promise<boolean> {
    if (subPartId === 1) return true;

    // Vérifier que le module précédent est complété
    const { data: prevProgress } = await supabase
      .from('subpart_progress')
      .select('completed')
      .eq('user_id', userId)
      .eq('subpart_id', subPartId - 1)
      .single();

    return prevProgress?.completed || false;
  }

  // Bloquer les modules suivants si le module actuel devient invalide
  static async lockFollowingModules(userId: string, fromSubPartId: number): Promise<void> {
    const config = SUBPARTS_CONFIG.find(c => c.id === fromSubPartId);
    if (!config) return;

    // Compter les entrées actuelles
    const { count } = await supabase
      .from('programme_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('subpart_id', fromSubPartId);

    const minRequired = config.minFields || 1;
    const isCurrentModuleValid = (count || 0) >= minRequired;

    if (!isCurrentModuleValid) {
      // Bloquer tous les modules suivants
      const followingModules = SUBPARTS_CONFIG
        .filter(c => c.id > fromSubPartId)
        .map(c => c.id);

      for (const moduleId of followingModules) {
        await supabase
          .from('subpart_progress')
          .upsert({
            user_id: userId,
            subpart_id: moduleId,
            progress: 0,
            completed: false,
            completed_at: null,
            updated_at: new Date().toISOString()
          });
      }
    }
  }

  // Mettre à jour les progressions (module + global)
  static async updateProgressions(userId: string, subPartId: number): Promise<void> {
    const config = SUBPARTS_CONFIG.find(c => c.id === subPartId);
    if (!config) return;

    // Compter les entrées actuelles
    const { count } = await supabase
      .from('programme_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('subpart_id', subPartId);

    const currentCount = count || 0;
    const minRequired = config.minFields || 1;
    
    // Calculer le progrès du module
    const progress = Math.min(100, Math.round((currentCount / minRequired) * 100));
    const completed = progress >= 100;

    // Mettre à jour le progrès du module (utiliser upsert pour éviter les doublons)
    await supabase
      .from('subpart_progress')
      .upsert({
        user_id: userId,
        subpart_id: subPartId,
        progress,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,subpart_id'
      });

    // Bloquer les modules suivants si nécessaire
    await this.lockFollowingModules(userId, subPartId);

    // Mettre à jour le progrès global
    await this.updateGlobalProgress(userId);
  }

  // Mettre à jour le progrès global
  static async updateGlobalProgress(userId: string): Promise<void> {
    const { data: allProgress } = await supabase
      .from('subpart_progress')
      .select('progress')
      .eq('user_id', userId);

    if (allProgress && allProgress.length > 0) {
      const totalProgress = allProgress.reduce((sum, p) => sum + p.progress, 0);
      const overallProgress = Math.round(totalProgress / allProgress.length);
      
      const isFullyCompleted = allProgress.every(p => p.progress >= 100);

      await supabase
        .from('user_programmes')
        .upsert({
          user_id: userId,
          overall_progress: overallProgress,
          completed_at: isFullyCompleted ? new Date().toISOString() : null,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
    }
  }

  // Obtenir les informations du module précédent
  static getPreviousModule(currentSubPartId: number) {
    const currentIndex = SUBPARTS_CONFIG.findIndex(c => c.id === currentSubPartId);
    if (currentIndex > 0) {
      return SUBPARTS_CONFIG[currentIndex - 1];
    }
    return null;
  }

  // Obtenir les informations du module suivant
  static getNextModule(currentSubPartId: number) {
    const currentIndex = SUBPARTS_CONFIG.findIndex(c => c.id === currentSubPartId);
    if (currentIndex < SUBPARTS_CONFIG.length - 1) {
      return SUBPARTS_CONFIG[currentIndex + 1];
    }
    return null;
  }
}