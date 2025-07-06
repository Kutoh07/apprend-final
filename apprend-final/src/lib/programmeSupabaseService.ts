import { supabase } from './supabase';
import { ProgrammeData, SubPart, SUBPARTS_CONFIG, SubPartField } from './types/programme';

class ProgrammeSupabaseService {
  
  // Initialiser le programme pour un nouvel utilisateur
  async initializeProgramme(userId: string): Promise<ProgrammeData> {
    // Créer l'entrée principale du programme
    const { data: programmeData } = await supabase
      .from('user_programmes')
      .upsert({
        user_id: userId,
        current_subpart: 0,
        overall_progress: 0,
        last_updated: new Date().toISOString()
      })
      .select()
      .single();

    // Initialiser le progrès pour chaque sous-partie
    const subpartProgressData = SUBPARTS_CONFIG.map(config => ({
      user_id: userId,
      subpart_id: config.id,
      progress: 0,
      completed: false
    }));

    await supabase
      .from('subpart_progress')
      .upsert(subpartProgressData);

    const programme = await this.getProgramme(userId);
    if (!programme) {
      throw new Error('Failed to initialize programme');
    }
    return programme;
  }

  // Récupérer le programme complet
  async getProgramme(userId: string): Promise<ProgrammeData | null> {
    try {
      // Récupérer les données principales du programme
      const { data: programmeRow } = await supabase
        .from('user_programmes')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!programmeRow) {
        // Si pas de programme, l'initialiser
        return await this.initializeProgramme(userId);
      }

      // Récupérer toutes les entrées
      const { data: entries } = await supabase
        .from('programme_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at');

      // Récupérer le progrès par sous-partie
      const { data: progressData } = await supabase
        .from('subpart_progress')
        .select('*')
        .eq('user_id', userId);

      // Construire les sous-parties avec leurs données
      const subParts: SubPart[] = SUBPARTS_CONFIG.map(config => {
        const subpartEntries = entries?.filter(entry => entry.subpart_id === config.id) || [];
        const progressInfo = progressData?.find(p => p.subpart_id === config.id);

        const fields: SubPartField[] = subpartEntries.map(entry => ({
          id: entry.id,
          value: entry.value,
          createdAt: new Date(entry.created_at)
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
        currentSubPart: programmeRow.current_subpart,
        overallProgress: programmeRow.overall_progress,
        lastUpdated: new Date(programmeRow.last_updated),
        completedAt: programmeRow.completed_at ? new Date(programmeRow.completed_at) : undefined
      };

    } catch (error) {
      console.error('Erreur lors de la récupération du programme:', error);
      return null;
    }
  }

  // Ajouter une nouvelle entrée
  async addField(userId: string, subPartId: number, value: string): Promise<SubPartField | null> {
    try {
      // Vérifier les limites avant d'ajouter
      const config = SUBPARTS_CONFIG.find(c => c.id === subPartId);
      if (!config) return null;

      if (config.maxFields) {
        const { count } = await supabase
          .from('programme_entries')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('subpart_id', subPartId);

        if (count && count >= config.maxFields) {
          throw new Error(`Maximum ${config.maxFields} entrées autorisées`);
        }
      }

      // Ajouter l'entrée
      const { data: newEntry } = await supabase
        .from('programme_entries')
        .insert({
          user_id: userId,
          subpart_id: subPartId,
          value: value.trim()
        })
        .select()
        .single();

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
      console.error('Erreur lors de l\'ajout:', error);
      throw error;
    }
  }

  // Supprimer une entrée
  async removeField(userId: string, fieldId: string, subPartId: number): Promise<void> {
    try {
      await supabase
        .from('programme_entries')
        .delete()
        .eq('id', fieldId)
        .eq('user_id', userId);

      // Mettre à jour le progrès
      await this.updateSubpartProgress(userId, subPartId);
      await this.updateOverallProgress(userId);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw error;
    }
  }

  // Mettre à jour le progrès d'une sous-partie
  private async updateSubpartProgress(userId: string, subPartId: number): Promise<void> {
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
    
    // Calculer le progrès
    const progress = Math.min(100, Math.round((currentCount / minRequired) * 100));
    const completed = progress >= 100;

    // Mettre à jour dans la base
    await supabase
      .from('subpart_progress')
      .upsert({
        user_id: userId,
        subpart_id: subPartId,
        progress,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      });
  }

  // Mettre à jour le progrès global
  private async updateOverallProgress(userId: string): Promise<void> {
    const { data: allProgress } = await supabase
      .from('subpart_progress')
      .select('progress')
      .eq('user_id', userId);

    if (allProgress && allProgress.length > 0) {
      const totalProgress = allProgress.reduce((sum, p) => sum + p.progress, 0);
      const overallProgress = Math.round(totalProgress / allProgress.length);
      
      // Vérifier si tout est complété
      const isFullyCompleted = allProgress.every(p => p.progress >= 100);

      await supabase
        .from('user_programmes')
        .update({
          overall_progress: overallProgress,
          completed_at: isFullyCompleted ? new Date().toISOString() : null,
          last_updated: new Date().toISOString()
        })
        .eq('user_id', userId);
    }
  }

  // Vérifier si une sous-partie est accessible
  async canAccessSubPart(userId: string, subPartId: number): Promise<boolean> {
    if (subPartId === 1) return true; // La première est toujours accessible

    const { data: previousProgress } = await supabase
      .from('subpart_progress')
      .select('completed')
      .eq('user_id', userId)
      .eq('subpart_id', subPartId - 1)
      .single();

    return previousProgress?.completed || false;
  }

  // Réinitialiser une sous-partie
  async resetSubPart(userId: string, subPartId: number): Promise<void> {
    try {
      // Supprimer toutes les entrées
      await supabase
        .from('programme_entries')
        .delete()
        .eq('user_id', userId)
        .eq('subpart_id', subPartId);

      // Réinitialiser le progrès de cette sous-partie et des suivantes
      const subpartsToReset = SUBPARTS_CONFIG
        .filter(c => c.id >= subPartId)
        .map(c => c.id);

      for (const id of subpartsToReset) {
        await supabase
          .from('subpart_progress')
          .update({
            progress: 0,
            completed: false,
            completed_at: null,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('subpart_id', id);
      }

      // Mettre à jour le progrès global
      await this.updateOverallProgress(userId);
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
      throw error;
    }
  }

  // Sauvegarder le programme complet
async saveProgramme(programme: ProgrammeData): Promise<void> {
  try {
    await supabase
      .from('user_programmes')
      .upsert({
        user_id: programme.userId,
        overall_progress: programme.overallProgress,
        current_subpart: programme.currentSubPart,
        last_updated: new Date().toISOString(),
        completed_at: programme.completedAt ? programme.completedAt.toISOString() : null
      });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du programme:', error);
    throw error;
  }
}
}

export const programmeSupabaseService = new ProgrammeSupabaseService();