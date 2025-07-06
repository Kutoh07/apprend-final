// app/programme/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Check, RefreshCw } from 'lucide-react';
import { programmeSupabaseService } from '@/lib/programmeSupabaseService';
import { ProgrammeData } from '@/lib/types/programme';

export default function ProgrammePage() {
  const router = useRouter();
  const [programmeData, setProgrammeData] = useState<ProgrammeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProgramme = async () => {
    try {
      const user = localStorage.getItem('user');
      if (!user) {
        router.push('/auth');
        return;
      }

      const userData = JSON.parse(user);
      const userEmail = userData.email || userData.id;
      
      let programme = await programmeSupabaseService.getProgramme(userEmail);
      
      if (!programme) {
        programme = await programmeSupabaseService.initializeProgramme(userEmail);
      }
      
      setProgrammeData(programme);
    } catch (error) {
      console.error('Erreur lors du chargement du programme:', error);
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
    await loadProgramme();
  };

  const handleSubPartClick = async (subPartId: number, slug: string) => {
    if (!programmeData) return;
    
    const canAccess = await programmeSupabaseService.canAccessSubPart(programmeData.userId, subPartId);
    if (canAccess) {
      router.push(`/programme/${slug}`);
    }
  };

  if (loading || !programmeData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du programme...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 p-4">
      <div className="max-w-6xl mx-auto">
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
                {programmeData.subParts.filter(sp => sp.completed).length}
              </p>
              <p className="text-sm text-gray-600">Parties complétées</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-blue-600">
                {programmeData.subParts.reduce((acc, sp) => acc + sp.fields.length, 0)}
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
                  // Logique de réinitialisation ici
                  handleRefresh();
                }
              }}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
            >
              Recommencer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}