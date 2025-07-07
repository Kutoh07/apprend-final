// src/lib/moduleService.ts - FIXED VERSION
import { supabase } from './supabase';
import { SubPartField, SUBPARTS_CONFIG } from './types/programme';

export class ModuleService {
  
  // Mettre à jour une entrée existante - FIXED
  static async updateField(userId: string, fieldId: string, newValue: string): Promise<void> {
    console.log(`✏️ ModuleService - Mise à jour entrée ${fieldId} pour user ${userId}`);
    
    // ✅ Ensure userId is a UUID (no conversion needed if already UUID)
    const { error } = await supabase
      .from('programme_entries')
      .update({ 
        value: newValue.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', fieldId)
      .eq('user_id', userId); // ✅ Use UUID directly

    if (error) {
      console.error('❌ Erreur mise à jour entrée:', error);
      throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
    }

    console.log('✅ Entrée mise à jour avec succès');
  }

  // Supprimer une entrée et mettre à jour les progressions - FIXED
  static async deleteField(userId: string, fieldId: string, subPartId: number): Promise<void> {
    console.log(`🗑️ ModuleService - Suppression entrée ${fieldId} pour user ${userId}`);
    
    // ✅ Use UUID directly
    const { error } = await supabase
      .from('programme_entries')
      .delete()
      .eq('id', fieldId)
      .eq('user_id', userId); // ✅ Use UUID directly

    if (error) {
      console.error('❌ Erreur suppression entrée:', error);
      throw new Error(`Erreur lors de la suppression: ${error.message}`);
    }

    // Mettre à jour les progressions après suppression
    await this.updateProgressions(userId, subPartId);
    console.log('✅ Entrée supprimée et progressions mises à jour');
  }

  // Vérifier si un module peut être accessible - FIXED
  static async canAccessModule(userId: string, subPartId: number): Promise<boolean> {
    console.log(`🔐 ModuleService - Vérification accès module ${subPartId} pour user ${userId}`);
    
    if (subPartId === 1) {
      console.log('✅ Premier module toujours accessible');
      return true;
    }

    try {
      // ✅ Use UUID directly
      const { data: prevProgress, error } = await supabase
        .from('subpart_progress')
        .select('completed')
        .eq('user_id', userId) // ✅ Use UUID directly
        .eq('subpart_id', subPartId - 1)
        .single();

      if (error) {
        console.error(`❌ Erreur vérification accès module:`, error);
        
        // Si c'est une erreur "pas de ligne trouvée", initialiser le progrès
        if (error.code === 'PGRST116') {
          console.log('🏗️ Aucun progrès trouvé, initialisation...');
          await this.updateProgressions(userId, subPartId - 1);
          return false; // Bloquer l'accès jusqu'à ce que la partie précédente soit complétée
        }
        return false;
      }

      const canAccess = prevProgress?.completed || false;
      console.log(`🔐 Accès module ${subPartId}: ${canAccess}`);
      
      return canAccess;
    } catch (error) {
      console.error('💥 Exception vérification accès module:', error);
      return subPartId === 1; // Fallback : autoriser seulement le premier module
    }
  }

  // Bloquer les modules suivants si le module actuel devient invalide - FIXED
  static async lockFollowingModules(userId: string, fromSubPartId: number): Promise<void> {
    console.log(`🔒 ModuleService - Blocage modules suivants à partir de ${fromSubPartId} pour user ${userId}`);
    
    const config = SUBPARTS_CONFIG.find(c => c.id === fromSubPartId);
    if (!config) {
      console.log('❌ Configuration non trouvée pour module:', fromSubPartId);
      return;
    }

    try {
      // Compter les entrées actuelles - ✅ Use UUID directly
      const { count, error: countError } = await supabase
        .from('programme_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId) // ✅ Use UUID directly
        .eq('subpart_id', fromSubPartId);

      if (countError) {
        console.error('❌ Erreur comptage entrées:', countError);
        throw new Error(`Erreur comptage: ${countError.message}`);
      }

      const minRequired = config.minFields || 1;
      const isCurrentModuleValid = (count || 0) >= minRequired;

      console.log(`📊 Module ${fromSubPartId}: ${count}/${minRequired} entrées, valide: ${isCurrentModuleValid}`);

      if (!isCurrentModuleValid) {
        console.log(`🔒 Module ${fromSubPartId} invalide, blocage des modules suivants`);
        
        // Bloquer tous les modules suivants
        const followingModules = SUBPARTS_CONFIG
          .filter(c => c.id > fromSubPartId)
          .map(c => c.id);

        for (const moduleId of followingModules) {
          const { error: updateError } = await supabase
            .from('subpart_progress')
            .upsert({
              user_id: userId, // ✅ Use UUID directly
              subpart_id: moduleId,
              progress: 0,
              completed: false,
              completed_at: null,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id,subpart_id'
            });

          if (updateError) {
            console.error(`❌ Erreur blocage module ${moduleId}:`, updateError);
          }
        }

        console.log(`✅ ${followingModules.length} modules suivants bloqués`);
      } else {
        console.log(`✅ Module ${fromSubPartId} valide, pas de blocage nécessaire`);
      }
    } catch (error) {
      console.error('💥 Erreur lors du blocage des modules:', error);
    }
  }

  // Mettre à jour les progressions (module + global) - FIXED
  static async updateProgressions(userId: string, subPartId: number): Promise<void> {
    console.log(`📊 ModuleService - Mise à jour progressions pour module ${subPartId}, user ${userId}`);
    
    const config = SUBPARTS_CONFIG.find(c => c.id === subPartId);
    if (!config) {
      console.log('❌ Configuration non trouvée pour module:', subPartId);
      return;
    }

    try {
      // Compter les entrées actuelles - ✅ Use UUID directly
      const { count, error: countError } = await supabase
        .from('programme_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId) // ✅ Use UUID directly
        .eq('subpart_id', subPartId);

      if (countError) {
        console.error('❌ Erreur comptage entrées:', countError);
        throw new Error(`Erreur comptage: ${countError.message}`);
      }

      const currentCount = count || 0;
      const minRequired = config.minFields || 1;
      
      // Calculer le progrès du module
      const progress = Math.min(100, Math.round((currentCount / minRequired) * 100));
      const completed = progress >= 100;

      console.log(`📊 Module ${subPartId}: ${currentCount}/${minRequired} entrées = ${progress}% (${completed ? 'complété' : 'en cours'})`);

      // Mettre à jour le progrès du module (utiliser upsert pour éviter les doublons)
      const { error: updateError } = await supabase
        .from('subpart_progress')
        .upsert({
          user_id: userId, // ✅ Use UUID directly
          subpart_id: subPartId,
          progress,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,subpart_id'
        });

      if (updateError) {
        console.error('❌ Erreur mise à jour progrès:', updateError);
        throw new Error(`Erreur mise à jour progrès: ${updateError.message}`);
      }

      // Bloquer les modules suivants si nécessaire
      await this.lockFollowingModules(userId, subPartId);

      // Mettre à jour le progrès global
      await this.updateGlobalProgress(userId);
      
      console.log(`✅ Progressions mises à jour pour module ${subPartId}`);
    } catch (error) {
      console.error('💥 Erreur mise à jour progressions:', error);
      throw error;
    }
  }

  // Mettre à jour le progrès global - FIXED
  static async updateGlobalProgress(userId: string): Promise<void> {
    console.log(`🌍 ModuleService - Mise à jour progrès global pour user ${userId}`);
    
    try {
      // ✅ Use UUID directly
      const { data: allProgress, error: progressError } = await supabase
        .from('subpart_progress')
        .select('progress')
        .eq('user_id', userId); // ✅ Use UUID directly

      if (progressError) {
        console.error('❌ Erreur récupération progrès global:', progressError);
        throw new Error(`Erreur récupération progrès: ${progressError.message}`);
      }

      if (allProgress && allProgress.length > 0) {
        const totalProgress = allProgress.reduce((sum, p) => sum + p.progress, 0);
        const overallProgress = Math.round(totalProgress / allProgress.length);
        const isFullyCompleted = allProgress.every(p => p.progress >= 100);

        console.log(`🌍 Progrès global: ${overallProgress}%, complètement terminé: ${isFullyCompleted}`);

        const { error: updateError } = await supabase
          .from('user_programmes')
          .upsert({
            user_id: userId, // ✅ Use UUID directly
            overall_progress: overallProgress,
            completed_at: isFullyCompleted ? new Date().toISOString() : null,
            last_updated: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (updateError) {
          console.error('❌ Erreur mise à jour progrès global:', updateError);
          throw new Error(`Erreur update global: ${updateError.message}`);
        }

        console.log(`✅ Progrès global mis à jour: ${overallProgress}%`);
      } else {
        console.log('⚠️ Aucun progrès trouvé pour calculer le global');
      }
    } catch (error) {
      console.error('💥 Erreur mise à jour progrès global:', error);
      throw error;
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