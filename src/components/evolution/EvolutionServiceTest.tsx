// src/components/evolution/EvolutionServiceTest.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { EvolutionService } from '@/lib/services/evolutionService';
import { EvolutionUpdateService } from '@/lib/services/evolutionUpdateService';
import { EvolutionMigrationService } from '@/lib/services/evolutionMigrationService';
import { ModernCard } from '@/components/ui/ModernCard';
import { ModernButton } from '@/components/ui/ModernButton';
import { useAuth } from '@/hooks/useAuth';

export default function EvolutionServiceTest() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<any>(null);

  // Vérifier le statut des tables au chargement
  useEffect(() => {
    if (user?.id) {
      checkMigrationStatus();
    }
  }, [user]);

  const checkMigrationStatus = async () => {
    try {
      const status = await EvolutionMigrationService.getEvolutionDataStats();
      setMigrationStatus(status);
    } catch (err) {
      console.error('Erreur vérification migration:', err);
    }
  };

  const testRealService = async () => {
    if (!user?.id) {
      setError('Utilisateur non connecté');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('🧪 Test du service Evolution réel...');
      const data = await EvolutionService.getEvolutionData(user.id);
      setResults({
        type: 'real',
        data,
        timestamp: new Date().toISOString()
      });
      console.log('✅ Service réel testé avec succès:', data);
    } catch (err) {
      console.error('❌ Erreur service réel:', err);
      setError(`Erreur service réel: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  const testMockService = async () => {
    if (!user?.id) {
      setError('Utilisateur non connecté');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('🧪 Test du service Evolution mocké...');
      const data = await EvolutionService.getEvolutionDataMock(user.id);
      setResults({
        type: 'mock',
        data,
        timestamp: new Date().toISOString()
      });
      console.log('✅ Service mocké testé avec succès:', data);
    } catch (err) {
      console.error('❌ Erreur service mocké:', err);
      setError(`Erreur service mocké: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  const testUpdateService = async () => {
    if (!user?.id) {
      setError('Utilisateur non connecté');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('🧪 Test du service de mise à jour...');
      await EvolutionUpdateService.onProgrammeEntryCreated(
        user.id, 
        1, 
        'Test d\'entrée pour valider le service de mise à jour des statistiques',
        12
      );
      
      setResults({
        type: 'update',
        data: { message: 'Mise à jour effectuée avec succès' },
        timestamp: new Date().toISOString()
      });
      console.log('✅ Service de mise à jour testé avec succès');
    } catch (err) {
      console.error('❌ Erreur service mise à jour:', err);
      setError(`Erreur service mise à jour: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  const createTestData = async () => {
    if (!user?.id) {
      setError('Utilisateur non connecté');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('🧪 Création de données de test...');
      const success = await EvolutionMigrationService.createTestData(user.id);
      
      if (success) {
        setResults({
          type: 'test_data',
          data: { message: 'Données de test créées avec succès' },
          timestamp: new Date().toISOString()
        });
        // Rafraîchir le statut
        await checkMigrationStatus();
      } else {
        throw new Error('Échec de la création des données de test');
      }
    } catch (err) {
      console.error('❌ Erreur création données test:', err);
      setError(`Erreur données test: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <ModernCard className="p-6">
        <p className="text-center text-gray-600">Veuillez vous connecter pour tester le service Evolution</p>
      </ModernCard>
    );
  }

  return (
    <div className="space-y-6">
      <ModernCard className="p-6">
        <h2 className="text-2xl font-bold mb-6">🧪 Test Service Evolution</h2>
        
        {/* Statut des tables */}
        {migrationStatus && (
          <div className={`p-4 rounded-lg mb-6 ${
            migrationStatus.tablesExist 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <h3 className="font-semibold mb-2">
              {migrationStatus.tablesExist ? '✅ Tables Evolution' : '⚠️ Tables manquantes'}
            </h3>
            {migrationStatus.tablesExist ? (
              <div className="text-sm text-green-700">
                <p>• Achievements: {migrationStatus.stats?.achievements || 0} entrées</p>
                <p>• Timeline activité: {migrationStatus.stats?.activityTimeline || 0} entrées</p>
                <p>• Stats motivation: {migrationStatus.stats?.motivationStats || 0} entrées</p>
                <p>• Heatmap activité: {migrationStatus.stats?.activityHeatmap || 0} entrées</p>
              </div>
            ) : (
              <div className="text-sm text-yellow-700">
                <p>Tables manquantes: {migrationStatus.missing?.join(', ')}</p>
                <p className="mt-2">💡 Exécutez le fichier <code>supabase/evolution_tables_migration.sql</code> dans Supabase</p>
              </div>
            )}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <ModernButton
            variant="primary"
            onClick={testRealService}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Test...' : 'Service Réel'}
          </ModernButton>
          
          <ModernButton
            variant="outline"
            onClick={testMockService}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Test...' : 'Service Mocké'}
          </ModernButton>
          
          <ModernButton
            variant="secondary"
            onClick={testUpdateService}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Test...' : 'Mise à Jour'}
          </ModernButton>

          <ModernButton
            variant="outline"
            onClick={createTestData}
            disabled={loading || !migrationStatus?.tablesExist}
            className="w-full"
          >
            {loading ? 'Création...' : 'Données Test'}
          </ModernButton>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-red-800 mb-2">❌ Erreur</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {results && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">
              ✅ Résultats ({results.type === 'real' ? 'Service Réel' : results.type === 'mock' ? 'Service Mocké' : 'Mise à Jour'})
            </h3>
            <p className="text-sm text-green-600 mb-3">Testé le: {new Date(results.timestamp).toLocaleString()}</p>
            
            {results.type !== 'update' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Progression globale:</span>
                  <br />
                  {results.data.progressStats?.overall?.completionPercentage || 0}%
                </div>
                <div>
                  <span className="font-medium">Modules complétés:</span>
                  <br />
                  {results.data.progressStats?.overall?.totalSubPartsCompleted || 0}/8
                </div>
                <div>
                  <span className="font-medium">Achievements:</span>
                  <br />
                  {results.data.motivationStats?.achievements?.length || 0}
                </div>
                <div>
                  <span className="font-medium">Temps investi:</span>
                  <br />
                  {results.data.motivationStats?.totalTimeInvested || 0} min
                </div>
              </div>
            )}
            
            {results.type === 'update' && (
              <p className="text-green-700">{results.data.message}</p>
            )}
          </div>
        )}
      </ModernCard>
    </div>
  );
}
