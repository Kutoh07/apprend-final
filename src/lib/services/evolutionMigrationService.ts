// src/lib/services/evolutionMigrationService.ts

import { supabase } from '../supabase';

export class EvolutionMigrationService {
  
  /**
   * Vérifie si les tables d'évolution existent et les crée si nécessaire
   */
  static async ensureEvolutionTablesExist(): Promise<boolean> {
    console.log('🔄 Vérification des tables d\'évolution...');
    
    try {
      const tablesStatus = await this.checkAllTables();
      
      if (tablesStatus.allExist) {
        console.log('✅ Toutes les tables d\'évolution existent');
        return true;
      }

      console.log('⚠️ Certaines tables manquent:', tablesStatus.missing);
      console.log('💡 Suggestion: Exécutez la migration SQL dans Supabase');
      console.log('📄 Fichier de migration: supabase/evolution_tables_migration.sql');
      
      return false;
      
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des tables:', error);
      return false;
    }
  }

  /**
   * Vérifie l'existence de toutes les tables nécessaires
   */
  private static async checkAllTables(): Promise<{allExist: boolean, missing: string[]}> {
    const requiredTables = [
      'user_achievements',
      'user_activity_timeline',
      'user_motivation_stats', 
      'user_activity_heatmap'
    ];

    const missing: string[] = [];
    
    for (const table of requiredTables) {
      const exists = await this.checkTableExists(table);
      if (!exists) {
        missing.push(table);
      }
    }

    return {
      allExist: missing.length === 0,
      missing
    };
  }

  /**
   * Vérifie si une table spécifique existe
   */
  private static async checkTableExists(tableName: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      // Si pas d'erreur ou erreur qui n'est pas "table doesn't exist"
      return !error || !error.message.toLowerCase().includes('does not exist');
    } catch (err) {
      return false;
    }
  }

  /**
   * Statistiques sur les données d'évolution existantes
   */
  static async getEvolutionDataStats(): Promise<any> {
    console.log('📊 Récupération des statistiques d\'évolution...');
    
    try {
      const tablesStatus = await this.checkAllTables();
      
      if (!tablesStatus.allExist) {
        return {
          tablesExist: false,
          missing: tablesStatus.missing,
          stats: null
        };
      }

      // Récupérer les stats de chaque table
      const [
        achievementsCount,
        timelineCount,
        motivationCount,
        heatmapCount
      ] = await Promise.all([
        this.getTableCount('user_achievements'),
        this.getTableCount('user_activity_timeline'),
        this.getTableCount('user_motivation_stats'),
        this.getTableCount('user_activity_heatmap')
      ]);

      return {
        tablesExist: true,
        missing: [],
        stats: {
          achievements: achievementsCount,
          activityTimeline: timelineCount,
          motivationStats: motivationCount,
          activityHeatmap: heatmapCount,
          totalRecords: achievementsCount + timelineCount + motivationCount + heatmapCount
        }
      };

    } catch (error) {
      console.error('❌ Erreur lors de la récupération des stats:', error);
      return {
        tablesExist: false,
        missing: ['Erreur de connexion'],
        stats: null,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Compte les enregistrements dans une table
   */
  private static async getTableCount(tableName: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.warn(`⚠️ Erreur comptage ${tableName}:`, error.message);
        return 0;
      }
      
      return count || 0;
    } catch (err) {
      console.warn(`⚠️ Erreur accès ${tableName}:`, err);
      return 0;
    }
  }

  /**
   * Crée des données de test pour l'évolution
   */
  static async createTestData(userId: string): Promise<boolean> {
    console.log('🧪 Création de données de test pour l\'évolution...');
    
    try {
      const tablesStatus = await this.checkAllTables();
      
      if (!tablesStatus.allExist) {
        console.error('❌ Impossible de créer des données de test: tables manquantes');
        return false;
      }

      // Créer une activité de test avec une valeur activity_type autorisée
      await supabase
        .from('user_activity_timeline')
        .insert({
          user_id: userId,
          activity_type: 'programme', // Utiliser une valeur RÉELLEMENT autorisée selon le schéma
          date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString()
        });

      // Créer une entrée heatmap pour aujourd'hui
      const today = new Date().toISOString().split('T')[0];
      await supabase
        .from('user_activity_heatmap')
        .upsert({
          user_id: userId,
          date: today,
          activity_count: 1,
          activity_level: 1
        }, { onConflict: 'user_id,date' });

      // Créer un achievement de test
      await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: 'test_achievement',
          achievement_title: 'Testeur Beta',
          achievement_description: 'Première utilisation du système d\'évolution',
          achievement_type: 'special',
          achievement_rarity: 1,
          unlocked_at: new Date().toISOString()
        });

      // Créer des stats de motivation
      await supabase
        .from('user_motivation_stats')
        .upsert({
          user_id: userId,
          current_streak: 1,
          longest_streak: 1,
          weekly_goal_progress: 20,
          accuracy_improvement: 0,
          speed_improvement: 0,
          consistency_score: 100
        }, { onConflict: 'user_id' });

      console.log('✅ Données de test créées avec succès');
      return true;

    } catch (error) {
      console.error('❌ Erreur lors de la création des données de test:', error);
      return false;
    }
  }
}
