// app/programme/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Check, RefreshCw, Settings } from 'lucide-react';
import { programmeSupabaseService } from '../../lib/programmeSupabaseService';
import { ProgrammeData, SubPart } from '../../lib/types/programme';
import { supabase } from '../../lib/supabase';

export default function ProgrammePage() {
  const router = useRouter();
  const [programmeData, setProgrammeData] = useState<ProgrammeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Fonction pour corriger les progrès
  const fixAllProgress = async () => {
    if (!userId) return;
    
    setFixing(true);
    try {
      console.log('🔧 Correction des progrès pour tous les modules...');
      
      // Pour chaque sous-partie, recalculer le progrès
      for (let subPartId = 1; subPartId <= 8; subPartId++) {
        await forceUpdateSubpartProgress(userId, subPartId);
      }
      
      // Recharger le programme
      await loadProgramme();
      
      console.log('✅ Correction terminée');
    } catch (error) {
      console.error('💥 Erreur lors de la correction:', error);
    } finally {
      setFixing(false);
    }
  };

  // Fonction pour forcer la mise à jour d'une sous-partie
  const forceUpdateSubpartProgress = async (userId: string, subPartId: number) => {
    try {
      console.log(`🔧 Correction du progrès pour la sous-partie ${subPartId}`);
      
      // Compter les entrées
      const { count, error: countError } = await supabase
        .from('programme_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('subpart_id', subPartId);

      if (countError) {
        console.error('❌ Erreur lors du comptage:', countError);
        return;
      }

      const currentCount = count || 0;
      // Récupérer la configuration
      const configs = [
        { id: 1, minFields: 1 }, // AMBITIONS
        { id: 2, minFields: 1 }, // CARACTÈRE  
        { id: 3, minFields: 1 }, // CROYANCES
        { id: 4, minFields: 1 }, // ÉMOTIONS
        { id: 5, minFields: 5 }, // PENSÉES
        { id: 6, minFields: 1 }, // TRAVAIL
        { id: 7, minFields: 1 }, // ENVIRONNEMENT
        { id: 8, minFields: 1 }  // RÉTENTION
      ];
      
      const config = configs.find(c => c.id === subPartId);
      const minRequired = config?.minFields || 1;
      
      // Calculer le progrès
      const progress = Math.min(100, Math.round((currentCount / minRequired) * 100));
      const completed = progress >= 100;

      console.log(`🔧 Sous-partie ${subPartId}: ${currentCount}/${minRequired} entrées = ${progress}% (complété: ${completed})`);

      // Mettre à jour dans la base
      const { error: updateError } = await supabase
        .from('subpart_progress')
        .update({
          progress,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('subpart_id', subPartId);

      if (updateError) {
        console.error('❌ Erreur lors de la mise à jour:', updateError);
      } else {
        console.log(`✅ Progrès corrigé: ${progress}%`);
      }
    } catch (error) {
      console.error(`💥 Erreur lors de la correction de la sous-partie ${subPartId}:`, error);
    }
  };

  const loadProgramme = async () => {
    try {
      console.log('🔄 Début du chargement du programme avec Supabase');
      
      // Vérification de l'authentification Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Erreur de session Supabase:', sessionError);
        router.push('/auth');
        return;
      }

      if (!session?.user) {
        console.log('❌ Pas de session Supabase, redirection vers auth');
        router.push('/auth');
        return;
      }

      const supabaseUserId = session.user.id; // UUID Supabase
      setUserId(supabaseUserId);
      
      console.log('👤 Utilisateur Supabase trouvé:', supabaseUserId);
      console.log('📧 Email:', session.user.email);

      // Charger le programme avec l'UUID Supabase
      console.log('📡 Chargement du programme depuis Supabase...');
      let programme = await programmeSupabaseService.getProgramme(supabaseUserId);
      
      if (!programme) {
        console.log('🏗️ Programme non trouvé, initialisation...');
        programme = await programmeSupabaseService.initializeProgramme(supabaseUserId);
      }
      
      console.log('✅ Programme chargé avec succès:', programme);
      setProgrammeData(programme);
      setError(null);

    } catch (error) {
      console.error('💥 Erreur lors du chargement du programme:', error);
      setError(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProgramme();
  }, [router]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    await loadProgramme();
  };

  const handleSubPartClick = async (subPartId: number, slug: string) => {
    if (!programmeData || !userId) return;
    
    try {
      const canAccess = await programmeSupabaseService.canAccessSubPart(userId, subPartId);
      if (canAccess) {
        router.push(`/programme/${slug}`);
      } else {
        alert('Cette section n\'est pas encore accessible. Complétez d\'abord la section précédente.');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification d\'accès:', error);
      // En cas d'erreur, permettre l'accès à la première section
      if (subPartId === 1) {
        router.push(`/programme/${slug}`);
      }
    }
  };

  // État de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-2">Chargement du programme...</p>
          <div className="text-xs text-gray-400">
            Connexion à Supabase...
          </div>
        </div>
      </div>
    );
  }

  // État d'erreur critique
  if (error || !programmeData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur de chargement</h1>
          <p className="text-gray-700 mb-6">
            {error || 'Impossible de charger le programme.'}
          </p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
            >
              {refreshing ? 'Rechargement...' : 'Réessayer'}
            </button>
            <button 
              onClick={() => router.push('/dashboard')}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
            >
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Indicateur de connexion Supabase */}
        <div className="bg-green-100 border border-green-300 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-green-600 mr-2">✅</span>
              <span className="text-green-800">Connecté à Supabase - Données synchronisées</span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={fixAllProgress}
                disabled={fixing}
                className="flex items-center gap-1 px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded text-sm disabled:opacity-50"
              >
                <Settings size={14} />
                {fixing ? 'Correction...' : 'Corriger progrès'}
              </button>
              <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className="text-green-600 hover:text-green-800 underline text-sm disabled:opacity-50"
              >
                {refreshing ? 'Actualisation...' : 'Actualiser'}
              </button>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-4xl font-bold text-center flex-1">
              <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                TON PROGRAMME
              </span>
            </h1>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
              title="Actualiser"
            >
              <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
          
          <p className="text-xl text-gray-700 text-center mb-6">
            C'est le moment d'intégrer ton parcours d'excellence mentale afin de l'enraciner
          </p>
          
          {/* Barre de progression globale */}
          <div className="bg-gray-200 rounded-full h-6 mb-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-1000 flex items-center justify-end pr-2"
              style={{ width: `${programmeData.overallProgress}%` }}
            >
              {programmeData.overallProgress > 0 && (
                <span className="text-white text-sm font-bold">{programmeData.overallProgress}%</span>
              )}
            </div>
          </div>
          <p className="text-center text-gray-600">Progression globale</p>

          {/* Statistiques */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-green-600">
                {programmeData.subParts.filter((sp: SubPart) => sp.completed).length}
              </p>
              <p className="text-sm text-gray-600">Parties complétées</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-blue-600">
                {programmeData.subParts.reduce((acc: number, sp: SubPart) => acc + sp.fields.length, 0)}
              </p>
              <p className="text-sm text-gray-600">Entrées totales</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-purple-600">
                {programmeData.overallProgress}%
              </p>
              <p className="text-sm text-gray-600">Progression</p>
            </div>
          </div>
        </div>

        {/* Grille des sous-parties */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {programmeData.subParts.map((subPart, index) => {
            const canAccess = index === 0 || programmeData.subParts[index - 1]?.completed;
            
            return (
              <div
                key={subPart.id}
                className={`bg-white rounded-2xl p-6 shadow-lg transform transition-all duration-300 ${
                  canAccess ? 'hover:scale-105 cursor-pointer hover:shadow-xl' : 'opacity-60 cursor-not-allowed'
                }`}
                onClick={() => canAccess && handleSubPartClick(subPart.id, subPart.slug)}
              >
                <div className="text-center">
                  {/* Icône et état */}
                  <div className="relative inline-block mb-4">
                    <div className={`text-6xl ${!canAccess ? 'opacity-50' : ''}`}>
                      {subPart.icon}
                    </div>
                    {!canAccess && index > 0 && (
                      <div className="absolute -top-2 -right-2 bg-gray-500 rounded-full p-1">
                        <Lock size={16} className="text-white" />
                      </div>
                    )}
                    {subPart.completed && (
                      <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                        <Check size={16} className="text-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Nom */}
                  <h3 className={`font-bold text-sm mb-3 bg-gradient-to-r ${subPart.color} bg-clip-text text-transparent`}>
                    {subPart.name}
                  </h3>
                  
                  {/* Barre de progression */}
                  <div className="bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className={`h-full bg-gradient-to-r ${subPart.color} rounded-full transition-all duration-500`}
                      style={{ width: `${subPart.progress}%` }}
                    />
                  </div>
                  
                  {/* Informations détaillées */}
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>{subPart.progress}% complété</p>
                    <p>{subPart.fields.length} / {subPart.minFields || 1} entrées</p>
                    <p className="font-medium">
                      {subPart.completed ? '✅ Complété' : canAccess ? '🔄 En cours' : '🔒 Verrouillé'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Message motivationnel */}
        <div className="mt-8 bg-white rounded-2xl p-6 shadow-lg text-center">
          <div className="mb-4">
            {programmeData.overallProgress === 0 && (
              <div>
                <span className="text-4xl mb-2 block">🌟</span>
                <p className="text-lg text-gray-700">
                  Commence ton parcours en cliquant sur <strong>AMBITIONS</strong>
                  <br />
                  <span className="text-sm text-orange-600">
                    💡 Si tu as déjà ajouté des entrées, clique sur "Corriger progrès" ci-dessus
                  </span>
                </p>
              </div>
            )}
            
            {programmeData.overallProgress > 0 && programmeData.overallProgress < 100 && (
              <div>
                <span className="text-4xl mb-2 block">💪</span>
                <p className="text-lg text-gray-700">
                  Continue comme ça, tu progresses bien ! 
                  <br />
                  <span className="text-purple-600 font-semibold">
                    {100 - programmeData.overallProgress}% restants pour terminer
                  </span>
                </p>
              </div>
            )}
            
            {programmeData.overallProgress === 100 && (
              <div>
                <span className="text-4xl mb-2 block">🎉</span>
                <p className="text-lg text-gray-700">
                  <strong>Félicitations !</strong> Tu as complété tout le programme !
                </p>
                {programmeData.completedAt && (
                  <p className="text-sm text-gray-500 mt-2">
                    Terminé le {programmeData.completedAt.toLocaleDateString('fr-FR')}
                  </p>
                )}
                <button
                  onClick={() => router.push('/programme/conclusion')}
                  className="mt-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-8 py-3 rounded-full font-semibold transition-all transform hover:scale-105"
                >
                  Voir la conclusion
                </button>
              </div>
            )}
          </div>
          
          {programmeData.lastUpdated && (
            <p className="text-xs text-gray-400 mt-4">
              Dernière mise à jour : {programmeData.lastUpdated.toLocaleDateString('fr-FR')} à {programmeData.lastUpdated.toLocaleTimeString('fr-FR')}
            </p>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full transition-colors"
          >
            Retour au dashboard
          </button>
          
          {programmeData.overallProgress === 100 && (
            <button
              onClick={() => {
                if (confirm('Êtes-vous sûr de vouloir recommencer le programme ? Toutes vos données seront supprimées.')) {
                  handleRefresh();
                }
              }}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
            >
              Recommencer
            </button>
          )}
        </div>

        {/* Informations de debug */}
        <div className="mt-6 bg-gray-100 rounded-lg p-4 text-xs">
          <p><strong>Debug Supabase:</strong></p>
          <p>User ID (UUID): {userId}</p>
          <p>Dernière mise à jour: {programmeData.lastUpdated.toISOString()}</p>
          <p>Entrées totales: {programmeData.subParts.reduce((acc: number, sp: SubPart) => acc + sp.fields.length, 0)}</p>
          <p>Progression calculée: {programmeData.subParts.map(sp => `${sp.name}: ${sp.progress}%`).join(', ')}</p>
        </div>
      </div>
    </div>
  );
}