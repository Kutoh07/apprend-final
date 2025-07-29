// src/lib/services/retentionValidationService.ts

import { supabase } from '../supabase';
import type { RetentionValidationState } from '../types/retention';

export class RetentionValidationService {
  
  /**
   * Récupère ou crée l'état de validation pour un utilisateur
   */
  static async getOrCreateValidationState(userId: string): Promise<{ data: RetentionValidationState | null; error: any }> {
    try {
      console.log('🔍 Tentative de récupération de l\'état pour userId:', userId);
      
      // D'abord essayer de récupérer l'état existant
      const { data: existing, error: fetchError } = await supabase
        .from('retention_validation')
        .select('*')
        .eq('user_id', userId)
        .single();

      console.log('📊 Résultat de la récupération:', { existing, fetchError });

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = not found, autres erreurs sont problématiques
        console.error('❌ Erreur lors de la récupération:', {
          code: fetchError.code,
          message: fetchError.message,
          details: fetchError.details,
          hint: fetchError.hint
        });
        return { data: null, error: fetchError };
      }

      if (existing) {
        console.log('✅ État existant trouvé:', existing);
        return { 
          data: this.transformDbToState(existing), 
          error: null 
        };
      }

      console.log('💡 Aucun état trouvé, création d\'un nouveau...');
      
      // Si pas trouvé, créer un nouvel enregistrement
      const { data: created, error: createError } = await supabase
        .from('retention_validation')
        .insert({
          user_id: userId,
          current_step: 1,
          completed_steps: []
        })
        .select()
        .single();

      console.log('📊 Résultat de la création:', { created, createError });

      if (createError) {
        console.error('❌ Erreur lors de la création:', {
          code: createError.code,
          message: createError.message,
          details: createError.details,
          hint: createError.hint
        });
        
        // Si la table n'existe pas, donner des instructions
        if (createError.code === '42P01') {
          console.error('💡 SOLUTION: La table retention_validation n\'existe pas dans Supabase.');
          console.error('   Veuillez exécuter le fichier retention_validation_schema.sql dans Supabase SQL Editor');
        }
        
        return { data: null, error: createError };
      }

      console.log('✅ Nouvel état créé avec succès:', created);
      return { 
        data: this.transformDbToState(created), 
        error: null 
      };

    } catch (error) {
      console.error('❌ Erreur dans getOrCreateValidationState:', error);
      return { data: null, error };
    }
  }

  /**
   * Met à jour l'étape courante
   */
  static async updateCurrentStep(
    userId: string, 
    newStep: number
  ): Promise<{ data: RetentionValidationState | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('retention_validation')
        .update({ 
          current_step: newStep,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la mise à jour:', error);
        return { data: null, error };
      }

      return { 
        data: this.transformDbToState(data), 
        error: null 
      };
    } catch (error) {
      console.error('Erreur dans updateCurrentStep:', error);
      return { data: null, error };
    }
  }

  /**
   * Marque le processus comme terminé
   */
  static async markAsCompleted(userId: string): Promise<{ data: RetentionValidationState | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('retention_validation')
        .update({ 
          is_completed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Erreur lors du marquage comme terminé:', error);
        return { data: null, error };
      }

      return { 
        data: this.transformDbToState(data), 
        error: null 
      };
    } catch (error) {
      console.error('Erreur dans markAsCompleted:', error);
      return { data: null, error };
    }
  }

  /**
   * Réinitialise l'état de validation
   */
  static async resetValidation(userId: string): Promise<{ data: RetentionValidationState | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('retention_validation')
        .update({ 
          current_step: 1,
          completed_steps: [],
          is_completed: false,
          completed_at: null,
          step_1_completed_at: null,
          step_2_completed_at: null,
          step_3_completed_at: null,
          step_4_completed_at: null,
          step_5_completed_at: null,
          step_6_completed_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la réinitialisation:', error);
        return { data: null, error };
      }

      return { 
        data: this.transformDbToState(data), 
        error: null 
      };
    } catch (error) {
      console.error('Erreur dans resetValidation:', error);
      return { data: null, error };
    }
  }

  /**
   * Transforme les données de la DB en objet TypeScript
   */
  private static transformDbToState(dbRecord: any): RetentionValidationState {
    return {
      id: dbRecord.id,
      userId: dbRecord.user_id,
      currentStep: dbRecord.current_step,
      completedSteps: dbRecord.completed_steps || [],
      stepTimestamps: {
        step1: dbRecord.step_1_completed_at,
        step2: dbRecord.step_2_completed_at,
        step3: dbRecord.step_3_completed_at,
        step4: dbRecord.step_4_completed_at,
        step5: dbRecord.step_5_completed_at,
        step6: dbRecord.step_6_completed_at,
      },
      isCompleted: dbRecord.is_completed,
      completedAt: dbRecord.completed_at,
      startedAt: dbRecord.started_at,
      updatedAt: dbRecord.updated_at
    };
  }

  /**
   * Synchronise la progression de rétention avec le module principal
   */
  static syncRetentionProgressWithModule(userId: string, retentionProgress: number): void {
    try {
      if (typeof window === 'undefined') return;
      
      const programmeKey = `programme_data_${userId}`;
      const programmeData = JSON.parse(localStorage.getItem(programmeKey) || '{}');
      
      if (programmeData.subParts) {
        const retentionModule = programmeData.subParts.find((part: any) => part.id === 8);
        if (retentionModule) {
          const oldProgress = retentionModule.progress;
          retentionModule.progress = retentionProgress;
          retentionModule.completed = retentionProgress >= 100;
          
          // Recalculer la progression globale
          const totalProgress = programmeData.subParts.reduce((acc: number, part: any) => acc + part.progress, 0);
          programmeData.overallProgress = Math.round(totalProgress / programmeData.subParts.length);
          programmeData.lastUpdated = new Date();
          
          localStorage.setItem(programmeKey, JSON.stringify(programmeData));
          
          console.log(`🔄 Progression RETENTION synchronisée: ${oldProgress}% → ${retentionProgress}%`);
        }
      }
    } catch (error) {
      console.warn('Erreur lors de la synchronisation de progression:', error);
    }
  }

  /**
   * Obtient la progression actuelle de la rétention
   */
  static getRetentionProgress(userId: string): number {
    try {
      if (typeof window === 'undefined') return 0;
      
      const programmeKey = `programme_data_${userId}`;
      const programmeData = JSON.parse(localStorage.getItem(programmeKey) || '{}');
      
      if (programmeData.subParts) {
        const retentionModule = programmeData.subParts.find((part: any) => part.id === 8);
        return retentionModule?.progress || 0;
      }
      
      return 0;
    } catch (error) {
      console.warn('Erreur lors de la récupération de progression:', error);
      return 0;
    }
  }
  static async getValidationStats(userId: string): Promise<{
    totalSteps: number;
    completedSteps: number;
    currentStep: number;
    progressPercentage: number;
    isCompleted: boolean;
  }> {
    try {
      const { data } = await this.getOrCreateValidationState(userId);
      
      if (!data) {
        return {
          totalSteps: 6,
          completedSteps: 0,
          currentStep: 1,
          progressPercentage: 0,
          isCompleted: false
        };
      }

      const completedCount = data.completedSteps.length;
      const progressPercentage = Math.round((completedCount / 6) * 100);

      return {
        totalSteps: 6,
        completedSteps: completedCount,
        currentStep: data.currentStep,
        progressPercentage,
        isCompleted: data.isCompleted
      };
    } catch (error) {
      console.error('Erreur dans getValidationStats:', error);
      return {
        totalSteps: 6,
        completedSteps: 0,
        currentStep: 1,
        progressPercentage: 0,
        isCompleted: false
      };
    }
  }
}
