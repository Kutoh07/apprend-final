// src/lib/programmeSupabaseService.ts

import { supabase } from './supabase';
import { ProgrammeData, SubPart, SUBPARTS_CONFIG, SubPartField } from './types/programme';

export class ProgrammeSupabaseService {
  
  /**
   * Initialise un nouveau programme pour un utilisateur
   */
  async initializeProgramme(userId: string): Promise<ProgrammeData> {
    console.log('🏗️ Initialisation du programme pour:', userId);
    
    try {
      // Créer l'entrée principale du programme avec upsert
      const { data: programmeData, error: programmeError } = await supabase
        .from('user_programmes')
        .upsert({
          user_id: userId,
          current_subpart: 0,
          overall_progress: 0,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (programmeError) {
        console.error('❌ Erreur lors de la création du programme:', programmeError);
        throw new Error(`Erreur programme: ${programmeError.message}`);
      }

      // Initialiser le progrès pour chaque sous-partie
      const subpartProgressData = SUBPARTS_CONFIG.map(config => ({
        user_id: userId,
        subpart_id: config.id,
        progress: 0,
        completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error: progressError } = await supabase
        .from('subpart_progress')
        .upsert(subpartProgressData, {
          onConflict: 'user_id,subpart_id'
        });

      if (progressError) {
        console.error('❌ Erreur lors de l\'initialisation du progrès:', progressError);
        throw new Error(`Erreur progrès: ${progressError.message}`);
      }

      console.log('✅ Programme initialisé avec succès');
      
      // Retourner le programme fraîchement créé
      const programme = await this.getProgramme(userId);
      if (!programme) {
        throw new Error('Échec de l\'initialisation du programme');
      }
      
      return programme;
    } catch (error) {
      console.error('💥 Erreur lors de l\'initialisation:', error);
      throw error;
    }
  }

  /**
   * Récupère le programme complet d'un utilisateur
   */
  async getProgramme(userId: string): Promise<ProgrammeData | null> {
    try {
      console.log('📡 Récupération du programme pour:', userId);
      
      // Récupérer les données principales du programme
      const { data: programmeRow, error: programmeError } = await supabase
        .from('user_programmes')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (programmeError) {
        if (programmeError.code === 'PGRST116') {
          console.log('🏗️ Aucun programme trouvé, initialisation automatique...');
          return await this.initializeProgramme(userId);
        }
        console.error('❌ Erreur récupération programme:', programmeError);
        throw programmeError;
      }

      // Récupérer toutes les entrées de l'utilisateur
      const { data: entries, error: entriesError } = await supabase
        .from('programme_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (entriesError) {
        console.error('❌ Erreur récupération entrées:', entriesError);
        throw entriesError;
      }

      // Récupérer le progrès détaillé par sous-partie
      const { data: progressData, error: progressError } = await supabase
        .from('subpart_progress')
        .select('*')
        .eq('user_id', userId)
        .order('subpart_id');

      if (progressError) {
        console.error('❌ Erreur récupération progrès:', progressError);
        throw progressError;
      }

      // Construire la structure de données complète
      const subParts: SubPart[] = SUBPARTS_CONFIG.map(config => {
        const subpartEntries = entries?.filter(entry => entry.subpart_id === config.id) || [];
        const progressInfo = progressData?.find(p => p.subpart_id === config.id);

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

      const programmeData: ProgrammeData = {
        userId,
        subParts,
        currentSubPart: programmeRow.current_subpart,
        overallProgress: programmeRow.overall_progress,
        lastUpdated: new Date(programmeRow.last_updated),
        completedAt: programmeRow.completed_at ? new Date(programmeRow.completed_at) : undefined
      };

      console.log('✅ Programme récupéré:', {
        overallProgress: programmeData.overallProgress,
        completedSubParts: subParts.filter(sp => sp.completed).length,
        totalEntries: subParts.reduce((acc, sp) => acc + sp.fields.length, 0)
      });

      return programmeData;

    } catch (error) {
      console.error('💥 Erreur lors de la récupération du programme:', error);
      return null;
    }
  }

  /**
   * Ajoute une nouvelle entrée à une sous-partie
   */
  async addField(userId: string, subPartId: number, value: string): Promise<SubPartField | null> {
    try {
      console.log(`📝 Ajout entrée sous-partie ${subPartId}:`, value.substring(0, 50) + '...');
      
      // Vérifier la configuration de la sous-partie
      const config = SUBPARTS_CONFIG.find(c => c.id === subPartId);
      if (!config) {
        throw new Error(`Configuration non trouvée pour la sous-partie ${subPartId}`);
      }

      // Vérifier les limites maximales
      if (config.maxFields) {
        const { count, error: countError } = await supabase
          .from('programme_entries')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('subpart_id', subPartId);

        if (countError) {
          throw new Error(`Erreur comptage: ${countError.message}`);
        }

        if (count && count >= config.maxFields) {
          throw new Error(`Maximum ${config.maxFields} entrées autorisées pour ${config.name}`);
        }
      }

      // Insérer la nouvelle entrée
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

      if (insertError) {
        console.error('❌ Erreur insertion:', insertError);
        throw new Error(`Erreur ajout: ${insertError.message}`);
      }

      console.log('✅ Entrée ajoutée:', newEntry.id);

      // Mettre à jour les progressions
      await this.updateSubpartProgress(userId, subPartId);
      await this.updateOverallProgress(userId);

      return {
        id: newEntry.id,
        value: newEntry.value,
        createdAt: new Date(newEntry.created_at),
        updatedAt: newEntry.updated_at ? new Date(newEntry.updated_at) : undefined
      };

    } catch (error) {
      console.error('💥 Erreur lors de l\'ajout:', error);
      throw error;
    }
  }

  /**
   * Met à jour une entrée existante
   */
  async updateField(userId: string, fieldId: string, newValue: string): Promise<void> {
    try {
      console.log(`✏️ Mise à jour entrée ${fieldId}:`, newValue.substring(0, 50) + '...');
      
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

      console.log('✅ Entrée mise à jour');
    } catch (error) {
      console.error('💥 Erreur lors de la mise à jour:', error);
      throw error;
    }
  }

  /**
   * Supprime une entrée et met à jour les progressions
   */
  async removeField(userId: string, fieldId: string, subPartId: number): Promise<void> {
    try {
      console.log(`🗑️ Suppression entrée ${fieldId}`);
      
      const { error } = await supabase
        .from('programme_entries')
        .delete()
        .eq('id', fieldId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Erreur suppression: ${error.message}`);
      }

      // Mettre à jour les progressions après suppression
      await this.updateSubpartProgress(userId, subPartId);
      await this.lockFollowingModulesIfNeeded(userId, subPartId);
      await this.updateOverallProgress(userId);
      
      console.log('✅ Entrée supprimée et progressions mises à jour');
    } catch (error) {
      console.error('💥 Erreur lors de la suppression:', error);
      throw error;
    }
  }

  /**
   * Met à jour le progrès d'une sous-partie spécifique
   */
  private async updateSubpartProgress(userId: string, subPartId: number): Promise<void> {
    console.log(`📊 Mise à jour progrès sous-partie ${subPartId}`);
    
    const config = SUBPARTS_CONFIG.find(c => c.id === subPartId);
    if (!config) {
      console.error('❌ Configuration non trouvée pour:', subPartId);
      return;
    }

    try {
      // Compter les entrées actuelles
      const { count, error: countError } = await supabase
        .from('programme_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('subpart_id', subPartId);

      if (countError) {
        throw new Error(`Erreur comptage: ${countError.message}`);
      }

      const currentCount = count || 0;
      const minRequired = config.minFields || 1;
      
      // Calculer le nouveau progrès
      const progress = Math.min(100, Math.round((currentCount / minRequired) * 100));
      const completed = progress >= 100;

      console.log(`📊 Sous-partie ${subPartId}: ${currentCount}/${minRequired} entrées = ${progress}% (${completed ? 'complété' : 'en cours'})`);

      // Mettre à jour avec upsert pour éviter les conflits
      const { error: updateError } = await supabase
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

      if (updateError) {
        throw new Error(`Erreur update progrès: ${updateError.message}`);
      }

      console.log(`✅ Progrès sous-partie ${subPartId} mis à jour: ${progress}%`);
    } catch (error) {
      console.error('💥 Erreur mise à jour progrès sous-partie:', error);
      throw error;
    }
  }

  /**
   * Bloque les modules suivants si le module actuel devient invalide
   */
  private async lockFollowingModulesIfNeeded(userId: string, subPartId: number): Promise<void> {
    console.log(`🔒 Vérification blocage modules après sous-partie ${subPartId}`);
    
    const config = SUBPARTS_CONFIG.find(c => c.id === subPartId);
    if (!config) return;

    try {
      // Vérifier si le module actuel est encore valide
      const { count } = await supabase
        .from('programme_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('subpart_id', subPartId);

      const minRequired = config.minFields || 1;
      const isCurrentModuleValid = (count || 0) >= minRequired;

      if (!isCurrentModuleValid) {
        console.log(`🔒 Module ${subPartId} invalide, blocage des modules suivants`);
        
        // Bloquer tous les modules suivants
        const followingModules = SUBPARTS_CONFIG
          .filter(c => c.id > subPartId)
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
            }, {
              onConflict: 'user_id,subpart_id'
            });
        }

        console.log(`✅ ${followingModules.length} modules suivants bloqués`);
      } else {
        console.log(`✅ Module ${subPartId} valide, pas de blocage nécessaire`);
      }
    } catch (error) {
      console.error('💥 Erreur lors du blocage des modules:', error);
    }
  }

  /**
   * Met à jour le progrès global du programme
   */
  private async updateOverallProgress(userId: string): Promise<void> {
    console.log('🔄 Mise à jour progrès global');
    
    try {
      const { data: allProgress, error: progressError } = await supabase
        .from('subpart_progress')
        .select('progress')
        .eq('user_id', userId);

      if (progressError) {
        throw new Error(`Erreur récupération progrès: ${progressError.message}`);
      }

      if (allProgress && allProgress.length > 0) {
        const totalProgress = allProgress.reduce((sum, p) => sum + p.progress, 0);
        const overallProgress = Math.round(totalProgress / allProgress.length);
        const isFullyCompleted = allProgress.every(p => p.progress >= 100);

        console.log(`📊 Progrès global: ${overallProgress}%, complété: ${isFullyCompleted}`);

        const { error: updateError } = await supabase
          .from('user_programmes')
          .upsert({
            user_id: userId,
            overall_progress: overallProgress,
            completed_at: isFullyCompleted ? new Date().toISOString() : null,
            last_updated: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (updateError) {
          throw new Error(`Erreur update global: ${updateError.message}`);
        }

        console.log(`✅ Progrès global mis à jour: ${overallProgress}%`);
      }
    } catch (error) {
      console.error('💥 Erreur mise à jour progrès global:', error);
      throw error;
    }
  }

  /**
   * Vérifie si un utilisateur peut accéder à une sous-partie
   */
  async canAccessSubPart(userId: string, subPartId: number): Promise<boolean> {
    console.log(`🔐 Vérification accès sous-partie ${subPartId}`);
    
    if (subPartId === 1) {
      console.log('✅ Première sous-partie toujours accessible');
      return true;
    }

    try {
      const { data: previousProgress, error } = await supabase
        .from('subpart_progress')
        .select('completed')
        .eq('user_id', userId)
        .eq('subpart_id', subPartId - 1)
        .single();

      if (error) {
        console.error(`❌ Erreur vérification accès:`, error);
        // Si c'est une erreur "pas de ligne trouvée", initialiser le progrès
        if (error.code === 'PGRST116') {
          console.log('🏗️ Aucun progrès trouvé, initialisation...');
          await this.updateSubpartProgress(userId, subPartId - 1);
          return false; // Bloquer l'accès jusqu'à ce que la partie précédente soit complétée
        }
        return false;
      }

      const canAccess = previousProgress?.completed || false;
      console.log(`🔐 Accès sous-partie ${subPartId}: ${canAccess}`);
      
      return canAccess;
    } catch (error) {
      console.error('💥 Exception vérification accès:', error);
      return subPartId === 1; // Fallback : autoriser seulement la première section
    }
  }

  /**
   * Sauvegarde le programme complet
   */
  async saveProgramme(programme: ProgrammeData): Promise<void> {
    console.log('💾 Sauvegarde programme complet');
    
    try {
      const { error } = await supabase
        .from('user_programmes')
        .upsert({
          user_id: programme.userId,
          overall_progress: programme.overallProgress,
          current_subpart: programme.currentSubPart,
          last_updated: new Date().toISOString(),
          completed_at: programme.completedAt ? programme.completedAt.toISOString() : null
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        throw new Error(`Erreur sauvegarde: ${error.message}`);
      }

      console.log('✅ Programme sauvegardé');
    } catch (error) {
      console.error('💥 Erreur sauvegarde programme:', error);
      throw error;
    }
  }

  /**
   * Réinitialise complètement une sous-partie et bloque les suivantes
   */
  async resetSubPart(userId: string, subPartId: number): Promise<void> {
    console.log(`🔄 Réinitialisation sous-partie ${subPartId}`);
    
    try {
      // Supprimer toutes les entrées de cette sous-partie
      const { error: deleteError } = await supabase
        .from('programme_entries')
        .delete()
        .eq('user_id', userId)
        .eq('subpart_id', subPartId);

      if (deleteError) {
        throw new Error(`Erreur suppression entrées: ${deleteError.message}`);
      }

      // Réinitialiser le progrès de cette sous-partie et de toutes les suivantes
      const subpartsToReset = SUBPARTS_CONFIG
        .filter(c => c.id >= subPartId)
        .map(c => c.id);

      for (const id of subpartsToReset) {
        await supabase
          .from('subpart_progress')
          .upsert({
            user_id: userId,
            subpart_id: id,
            progress: 0,
            completed: false,
            completed_at: null,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,subpart_id'
          });
      }

      // Mettre à jour le progrès global
      await this.updateOverallProgress(userId);
      
      console.log(`✅ Sous-partie ${subPartId} et suivantes réinitialisées`);
    } catch (error) {
      console.error('💥 Erreur réinitialisation:', error);
      throw error;
    }
  }
}

// Instance singleton du service
export const programmeSupabaseService = new ProgrammeSupabaseService();