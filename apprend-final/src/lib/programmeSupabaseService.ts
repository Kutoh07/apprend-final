// src/lib/programmeSupabaseService.ts

import { supabase } from './supabase';
import { ProgrammeData, SubPart, SUBPARTS_CONFIG, SubPartField } from './types/programme';

class ProgrammeSupabaseService {
  
  // Initialiser le programme pour un nouvel utilisateur
  async initializeProgramme(userId: string): Promise<ProgrammeData> {
    console.log('🏗️ Initialisation du programme pour:', userId);
    
    // Créer l'entrée principale du programme
    const { data: programmeData, error: programmeError } = await supabase
      .from('user_programmes')
      .upsert({
        user_id: userId,
        current_subpart: 0,
        overall_progress: 0,
        last_updated: new Date().toISOString()
      })
      .select()
      .single();

    if (programmeError) {
      console.error('❌ Erreur lors de la création du programme:', programmeError);
      throw programmeError;
    }

    // Initialiser le progrès pour chaque sous-partie
    const subpartProgressData = SUBPARTS_CONFIG.map(config => ({
      user_id: userId,
      subpart_id: config.id,
      progress: 0,
      completed: false
    }));

    const { error: progressError } = await supabase
      .from('subpart_progress')
      .upsert(subpartProgressData);

    if (progressError) {
      console.error('❌ Erreur lors de l\'initialisation du progrès:', progressError);
      throw progressError;
    }

    console.log('✅ Programme initialisé avec succès');
    
    const programme = await this.getProgramme(userId);
    if (!programme) {
      throw new Error('Failed to initialize programme');
    }
    return programme;
  }

  // Récupérer le programme complet
  async getProgramme(userId: string): Promise<ProgrammeData | null> {
    try {
      console.log('📡 Récupération du programme pour:', userId);
      
      // Récupérer les données principales du programme
      const { data: programmeRow, error: programmeError } = await supabase
        .from('user_programmes')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (programmeError && programmeError.code !== 'PGRST116') {
        console.error('❌ Erreur programme row:', programmeError);
        throw programmeError;
      }

      if (!programmeRow) {
        console.log('🏗️ Pas de programme trouvé, initialisation...');
        return await this.initializeProgramme(userId);
      }

      console.log('📋 Programme trouvé:', programmeRow);

      // Récupérer toutes les entrées
      const { data: entries, error: entriesError } = await supabase
        .from('programme_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at');

      if (entriesError) {
        console.error('❌ Erreur entrées:', entriesError);
        throw entriesError;
      }

      console.log('📝 Entrées trouvées:', entries?.length || 0);

      // Récupérer le progrès par sous-partie
      const { data: progressData, error: progressError } = await supabase
        .from('subpart_progress')
        .select('*')
        .eq('user_id', userId);

      if (progressError) {
        console.error('❌ Erreur progrès:', progressError);
        throw progressError;
      }

      console.log('📊 Données de progrès:', progressData);

      // Construire les sous-parties avec leurs données
      const subParts: SubPart[] = SUBPARTS_CONFIG.map(config => {
        const subpartEntries = entries?.filter(entry => entry.subpart_id === config.id) || [];
        const progressInfo = progressData?.find(p => p.subpart_id === config.id);

        const fields: SubPartField[] = subpartEntries.map(entry => ({
          id: entry.id,
          value: entry.value,
          createdAt: new Date(entry.created_at)
        }));

        const subPart = {
          ...config,
          fields,
          completed: progressInfo?.completed || false,
          progress: progressInfo?.progress || 0
        };

        console.log(`📊 Sous-partie ${config.id} (${config.name}):`, {
          fields: fields.length,
          completed: subPart.completed,
          progress: subPart.progress
        });

        return subPart;
      });

      const programmeData = {
        userId,
        subParts,
        currentSubPart: programmeRow.current_subpart,
        overallProgress: programmeRow.overall_progress,
        lastUpdated: new Date(programmeRow.last_updated),
        completedAt: programmeRow.completed_at ? new Date(programmeRow.completed_at) : undefined
      };

      console.log('✅ Programme construit:', {
        overallProgress: programmeData.overallProgress,
        completedSubParts: subParts.filter(sp => sp.completed).length
      });

      return programmeData;

    } catch (error) {
      console.error('💥 Erreur lors de la récupération du programme:', error);
      return null;
    }
  }

  // Ajouter une nouvelle entrée
  async addField(userId: string, subPartId: number, value: string): Promise<SubPartField | null> {
    try {
      console.log(`📝 Ajout d'une entrée pour la sous-partie ${subPartId}:`, value.substring(0, 50) + '...');
      
      // Vérifier les limites avant d'ajouter
      const config = SUBPARTS_CONFIG.find(c => c.id === subPartId);
      if (!config) {
        console.error('❌ Configuration non trouvée pour la sous-partie:', subPartId);
        return null;
      }

      if (config.maxFields) {
        const { count, error: countError } = await supabase
          .from('programme_entries')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('subpart_id', subPartId);

        if (countError) {
          console.error('❌ Erreur lors du comptage:', countError);
          throw countError;
        }

        if (count && count >= config.maxFields) {
          throw new Error(`Maximum ${config.maxFields} entrées autorisées`);
        }
      }

      // Ajouter l'entrée
      const { data: newEntry, error: insertError } = await supabase
        .from('programme_entries')
        .insert({
          user_id: userId,
          subpart_id: subPartId,
          value: value.trim()
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erreur lors de l\'insertion:', insertError);
        throw insertError;
      }

      console.log('✅ Entrée ajoutée:', newEntry.id);

      if (newEntry) {
        // Mettre à jour le progrès
        await this.updateSubpartProgress(userId, subPartId);
        await this.updateOverallProgress(userId);

        return {
          id: newEntry.id,
          value: newEntry.value,
          createdAt: new Date(newEntry.created_at)
        };
      }

      return null;
    } catch (error) {
      console.error('💥 Erreur lors de l\'ajout:', error);
      throw error;
    }
  }

  // Supprimer une entrée
  async removeField(userId: string, fieldId: string, subPartId: number): Promise<void> {
    try {
      console.log(`🗑️ Suppression de l'entrée ${fieldId}`);
      
      const { error } = await supabase
        .from('programme_entries')
        .delete()
        .eq('id', fieldId)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Erreur lors de la suppression:', error);
        throw error;
      }

      // Mettre à jour le progrès
      await this.updateSubpartProgress(userId, subPartId);
      await this.updateOverallProgress(userId);
      
      console.log('✅ Entrée supprimée et progrès mis à jour');
    } catch (error) {
      console.error('💥 Erreur lors de la suppression:', error);
      throw error;
    }
  }

  // Mettre à jour le progrès d'une sous-partie
  private async updateSubpartProgress(userId: string, subPartId: number): Promise<void> {
    console.log(`📊 Mise à jour du progrès pour la sous-partie ${subPartId}`);
    
    const config = SUBPARTS_CONFIG.find(c => c.id === subPartId);
    if (!config) {
      console.error('❌ Configuration non trouvée pour:', subPartId);
      return;
    }

    // Compter les entrées actuelles
    const { count, error: countError } = await supabase
      .from('programme_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('subpart_id', subPartId);

    if (countError) {
      console.error('❌ Erreur lors du comptage des entrées:', countError);
      throw countError;
    }

    const currentCount = count || 0;
    const minRequired = config.minFields || 1;
    
    // Calculer le progrès
    const progress = Math.min(100, Math.round((currentCount / minRequired) * 100));
    const completed = progress >= 100;

    console.log(`📊 Sous-partie ${subPartId}: ${currentCount}/${minRequired} entrées, ${progress}% complété:${completed}`);

    // Mettre à jour dans la base
    const { error: updateError } = await supabase
      .from('subpart_progress')
      .upsert({
        user_id: userId,
        subpart_id: subPartId,
        progress,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      });

    if (updateError) {
      console.error('❌ Erreur lors de la mise à jour du progrès:', updateError);
      throw updateError;
    }

    console.log(`✅ Progrès mis à jour: ${progress}%, complété: ${completed}`);
  }

  // Mettre à jour le progrès global
  private async updateOverallProgress(userId: string): Promise<void> {
    console.log('🔄 Mise à jour du progrès global');
    
    const { data: allProgress, error: progressError } = await supabase
      .from('subpart_progress')
      .select('progress')
      .eq('user_id', userId);

    if (progressError) {
      console.error('❌ Erreur lors de la récupération du progrès global:', progressError);
      throw progressError;
    }

    if (allProgress && allProgress.length > 0) {
      const totalProgress = allProgress.reduce((sum, p) => sum + p.progress, 0);
      const overallProgress = Math.round(totalProgress / allProgress.length);
      
      // Vérifier si tout est complété
      const isFullyCompleted = allProgress.every(p => p.progress >= 100);

      console.log(`📊 Progrès global calculé: ${overallProgress}%, entièrement complété: ${isFullyCompleted}`);

      const { error: updateError } = await supabase
        .from('user_programmes')
        .update({
          overall_progress: overallProgress,
          completed_at: isFullyCompleted ? new Date().toISOString() : null,
          last_updated: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('❌ Erreur lors de la mise à jour du progrès global:', updateError);
        throw updateError;
      }

      console.log('✅ Progrès global mis à jour:', overallProgress + '%');
    }
  }

  // Vérifier si une sous-partie est accessible
  async canAccessSubPart(userId: string, subPartId: number): Promise<boolean> {
    console.log(`🔐 Vérification de l'accès à la sous-partie ${subPartId}`);
    
    if (subPartId === 1) {
      console.log('✅ Première sous-partie toujours accessible');
      return true; // La première est toujours accessible
    }

    const { data: previousProgress, error } = await supabase
      .from('subpart_progress')
      .select('completed')
      .eq('user_id', userId)
      .eq('subpart_id', subPartId - 1)
      .single();

    if (error) {
      console.error(`❌ Erreur lors de la vérification d'accès pour la sous-partie ${subPartId - 1}:`, error);
      // En cas d'erreur, retourner false par sécurité
      return false;
    }

    const canAccess = previousProgress?.completed || false;
    console.log(`🔐 Sous-partie ${subPartId - 1} complétée: ${previousProgress?.completed}, accès autorisé: ${canAccess}`);
    
    return canAccess;
  }

  // Réinitialiser une sous-partie
  async resetSubPart(userId: string, subPartId: number): Promise<void> {
    try {
      console.log(`🔄 Réinitialisation de la sous-partie ${subPartId}`);
      
      // Supprimer toutes les entrées
      const { error: deleteError } = await supabase
        .from('programme_entries')
        .delete()
        .eq('user_id', userId)
        .eq('subpart_id', subPartId);

      if (deleteError) {
        console.error('❌ Erreur lors de la suppression des entrées:', deleteError);
        throw deleteError;
      }

      // Réinitialiser le progrès de cette sous-partie et des suivantes
      const subpartsToReset = SUBPARTS_CONFIG
        .filter(c => c.id >= subPartId)
        .map(c => c.id);

      for (const id of subpartsToReset) {
        const { error: resetError } = await supabase
          .from('subpart_progress')
          .update({
            progress: 0,
            completed: false,
            completed_at: null,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('subpart_id', id);

        if (resetError) {
          console.error(`❌ Erreur lors de la réinitialisation de la sous-partie ${id}:`, resetError);
          throw resetError;
        }
      }

      // Mettre à jour le progrès global
      await this.updateOverallProgress(userId);
      
      console.log('✅ Réinitialisation terminée');
    } catch (error) {
      console.error('💥 Erreur lors de la réinitialisation:', error);
      throw error;
    }
  }

  // Sauvegarder le programme complet
  async saveProgramme(programme: ProgrammeData): Promise<void> {
    try {
      console.log('💾 Sauvegarde du programme');
      
      const { error } = await supabase
        .from('user_programmes')
        .upsert({
          user_id: programme.userId,
          overall_progress: programme.overallProgress,
          current_subpart: programme.currentSubPart,
          last_updated: new Date().toISOString(),
          completed_at: programme.completedAt ? programme.completedAt.toISOString() : null
        });

      if (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
        throw error;
      }

      console.log('✅ Programme sauvegardé');
    } catch (error) {
      console.error('💥 Erreur lors de la sauvegarde du programme:', error);
      throw error;
    }
  }
}

export const programmeSupabaseService = new ProgrammeSupabaseService();