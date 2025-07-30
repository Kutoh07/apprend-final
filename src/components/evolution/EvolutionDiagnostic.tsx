// src/components/evolution/EvolutionDiagnostic.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ModernCard } from '@/components/ui/ModernCard';
import { ModernButton } from '@/components/ui/ModernButton';
import { useAuth } from '@/hooks/useAuth';

export default function EvolutionDiagnostic() {
  const { user } = useAuth();
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostic = async () => {
    if (!user?.id) {
      alert('Veuillez vous connecter');
      return;
    }

    setLoading(true);
    const results: any = {
      timestamp: new Date().toISOString(),
      userId: user.id,
      tests: []
    };

    try {
      // Test 1: Vérifier la connexion Supabase
      console.log('🔍 Test 1: Connexion Supabase...');
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        results.tests.push({
          name: 'Connexion Supabase',
          status: authError ? 'ERREUR' : 'OK',
          details: authError ? authError.message : `Utilisateur authentifié: ${authUser?.id}`,
          error: authError
        });
      } catch (err) {
        results.tests.push({
          name: 'Connexion Supabase',
          status: 'ERREUR',
          details: 'Erreur de connexion',
          error: err
        });
      }

      // Test 2: Accès aux tables d'évolution
      console.log('🔍 Test 2: Accès aux tables d\'évolution...');

      // Vérifier la structure des tables d'évolution
      const evolutionTables = ['user_achievements', 'user_activity_timeline', 'user_motivation_stats', 'user_activity_heatmap'];
      
      for (const table of evolutionTables) {
        console.log(`🔍 Test table: ${table}`);
        try {
          // D'abord, essayer de récupérer une ligne pour voir la structure
          const { data: sampleData, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);

          if (error) {
            results.tests.push({
              name: `Table ${table}`,
              status: 'ERREUR',
              details: error.message,
              error: error
            });
          } else {
            // Analyser la structure si on a des données, sinon juste confirmer l'accès
            const structure = sampleData && sampleData.length > 0 
              ? Object.keys(sampleData[0]).join(', ')
              : 'Table vide - colonnes non visibles';
            
            results.tests.push({
              name: `Table ${table}`,
              status: 'OK',
              details: `Accessible. Structure: ${structure}`,
              error: null
            });
          }
        } catch (err) {
          results.tests.push({
            name: `Table ${table}`,
            status: 'ERREUR',
            details: 'Erreur accès table',
            error: err
          });
        }
      }

      // Test 3: Test d'insertion avec valeurs activity_type autorisées
      console.log('🔍 Test 3: Insertion timeline (test valeurs activity_type)...');
      
      // Liste des valeurs EXACTES autorisées selon le schéma DB (trouvé dans evolution_tables_migration.sql)
      const possibleActivityTypes = [
        'programme',    // Pour les activités liées au programme
        'renaissance',  // Pour les activités de renaissance
        'global'        // Pour les activités globales/générales
      ];
      
      let insertionSuccess = false;
      let workingActivityType = null;
      
      for (const activityType of possibleActivityTypes) {
        try {
          const testInsert = {
            user_id: user.id,
            activity_type: activityType,
            date: new Date().toISOString().split('T')[0],
            created_at: new Date().toISOString()
          };

          const { data, error } = await supabase
            .from('user_activity_timeline')
            .insert(testInsert)
            .select();

          if (!error) {
            insertionSuccess = true;
            workingActivityType = activityType;
            console.log(`✅ Valeur activity_type qui fonctionne: ${activityType}`);
            break;
          }
        } catch (err) {
          // Continuer avec la valeur suivante
        }
      }
      
      if (insertionSuccess) {
        results.tests.push({
          name: 'Insertion timeline',
          status: 'OK',
          details: `Insertion réussie avec activity_type: "${workingActivityType}"`,
          error: null
        });
      } else {
        // Si aucune valeur ne fonctionne, essayer d'obtenir plus d'infos sur la contrainte
        results.tests.push({
          name: 'Insertion timeline',
          status: 'ERREUR',
          details: `Aucune des valeurs testées (${possibleActivityTypes.join(', ')}) n'est acceptée par la contrainte`,
          error: { message: 'Contrainte activity_type trop restrictive' }
        });
      }

      // Test 4: Test d'upsert dans user_activity_heatmap
      console.log('🔍 Test 4: Upsert heatmap...');
      try {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('user_activity_heatmap')
          .upsert({
            user_id: user.id,
            date: today,
            activity_count: 1,
            activity_level: 1
          }, { onConflict: 'user_id,date' })
          .select();

        results.tests.push({
          name: 'Upsert heatmap',
          status: error ? 'ERREUR' : 'OK',
          details: error ? error.message : 'Upsert réussi',
          error: error
        });
      } catch (err) {
        results.tests.push({
          name: 'Upsert heatmap',
          status: 'ERREUR',
          details: 'Erreur upsert',
          error: err
        });
      }

      // Test 5: Vérifier les données existantes
      console.log('🔍 Test 5: Données existantes...');
      try {
        const [
          { count: programmeCount },
          { count: progressCount },
          { count: entriesCount }
        ] = await Promise.all([
          supabase.from('user_programmes').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('subpart_progress').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('programme_entries').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
        ]);

        results.tests.push({
          name: 'Données utilisateur',
          status: 'INFO',
          details: `Programme: ${programmeCount}, Progrès: ${progressCount}, Entrées: ${entriesCount}`,
          error: null
        });
      } catch (err) {
        results.tests.push({
          name: 'Données utilisateur',
          status: 'ERREUR',
          details: 'Erreur récupération données',
          error: err
        });
      }

      // Test 6: Test du service Evolution complet
      console.log('🔍 Test 6: Service Evolution...');
      try {
        const { EvolutionService } = await import('@/lib/services/evolutionService');
        const evolutionData = await EvolutionService.getEvolutionData(user.id);
        
        results.tests.push({
          name: 'Service Evolution',
          status: 'OK',
          details: `Données récupérées: ${evolutionData.progressStats.overall.completionPercentage}% progression`,
          error: null
        });
      } catch (err) {
        results.tests.push({
          name: 'Service Evolution',
          status: 'ERREUR',
          details: 'Erreur service Evolution',
          error: err
        });
      }

      console.log('✅ Diagnostic terminé:', results);
      setDiagnosticResults(results);

    } catch (globalError) {
      console.error('💥 Erreur globale diagnostic:', globalError);
      results.tests.push({
        name: 'Erreur globale',
        status: 'ERREUR',
        details: 'Erreur critique durant le diagnostic',
        error: globalError
      });
      setDiagnosticResults(results);
    } finally {
      setLoading(false);
    }
  };

  const showTableStructure = async () => {
    if (!user?.id) return;

    try {
      console.log('🔍 Récupération structure des tables...');
      
      // Essayer de voir la structure en récupérant une ligne de chaque table
      const tables = ['user_achievements', 'user_activity_timeline', 'user_motivation_stats', 'user_activity_heatmap'];
      const structures: any = {};
      
      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);
          
          if (!error && data && data.length > 0) {
            structures[table] = Object.keys(data[0]);
          } else if (!error) {
            structures[table] = 'Table vide - impossible de déterminer la structure';
          } else {
            structures[table] = `Erreur: ${error.message}`;
          }
        } catch (err) {
          structures[table] = `Exception: ${err}`;
        }
      }
      
      console.log('📋 Structures des tables:', structures);
      alert(`Structures des tables (voir console pour détails):\n\n${JSON.stringify(structures, null, 2)}`);
      
    } catch (err) {
      console.error('Erreur récupération structure:', err);
    }
  };

  const clearTestData = async () => {
    if (!user?.id) return;

    try {
      // Supprimer les données de test créées avec les activity_type corrects
      const validTypes = ['programme', 'renaissance', 'global'];
      
      for (const activityType of validTypes) {
        await supabase
          .from('user_activity_timeline')
          .delete()
          .eq('user_id', user.id)
          .eq('activity_type', activityType);
      }

      alert('Données de test supprimées');
    } catch (err) {
      console.error('Erreur suppression:', err);
    }
  };

  if (!user) {
    return (
      <ModernCard className="p-6">
        <p className="text-center text-gray-600">Veuillez vous connecter pour exécuter le diagnostic</p>
      </ModernCard>
    );
  }

  return (
    <div className="space-y-6">
      <ModernCard className="p-6">
        <h2 className="text-2xl font-bold mb-6">🔍 Diagnostic Système Evolution</h2>
        
        <div className="flex gap-4 mb-6">
          <ModernButton
            variant="primary"
            onClick={runDiagnostic}
            disabled={loading}
          >
            {loading ? 'Diagnostic en cours...' : 'Lancer Diagnostic'}
          </ModernButton>
          
          <ModernButton
            variant="secondary"
            onClick={showTableStructure}
            disabled={loading}
          >
            Voir Structure Tables
          </ModernButton>
          
          {diagnosticResults && (
            <ModernButton
              variant="outline"
              onClick={clearTestData}
            >
              Nettoyer données test
            </ModernButton>
          )}
        </div>

        {diagnosticResults && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">📊 Résultats du diagnostic</h3>
              <p className="text-sm text-gray-600">
                Exécuté le: {new Date(diagnosticResults.timestamp).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                Utilisateur: {diagnosticResults.userId}
              </p>
            </div>

            <div className="space-y-2">
              {diagnosticResults.tests.map((test: any, index: number) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    test.status === 'OK' ? 'bg-green-50 border-green-200' :
                    test.status === 'ERREUR' ? 'bg-red-50 border-red-200' :
                    'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">
                        {test.status === 'OK' ? '✅' : test.status === 'ERREUR' ? '❌' : 'ℹ️'} {test.name}
                      </h4>
                      <p className="text-sm text-gray-600">{test.details}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      test.status === 'OK' ? 'bg-green-100 text-green-800' :
                      test.status === 'ERREUR' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {test.status}
                    </span>
                  </div>
                  
                  {test.error && test.status === 'ERREUR' && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer">Détails erreur</summary>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(test.error, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </ModernCard>
    </div>
  );
}
