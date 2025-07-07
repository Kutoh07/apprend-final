// src/app/programme/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Check, RefreshCw, Play, Users, BookOpen, TrendingUp } from 'lucide-react';
import { programmeSupabaseService } from '../../lib/programmeSupabaseService';
import { ProgrammeData, SubPart } from '../../lib/types/programme';
import { supabase } from '../../lib/supabase';

interface PageState {
  programmeData: ProgrammeData | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  userId: string | null;
  userEmail: string | null;
}

export default function ProgrammePage() {
  const router = useRouter();
  const [state, setState] = useState<PageState>({
    programmeData: null,
    loading: true,
    refreshing: false,
    error: null,
    userId: null,
    userEmail: null
  });

  /**
   * Charge le programme de l'utilisateur depuis Supabase
   */
  const loadProgramme = async (): Promise<void> => {
    console.log('🔄 Chargement du programme...');
    
    try {
      // Vérification de l'authentification Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Erreur session Supabase:', sessionError);
        throw new Error(`Erreur d'authentification: ${sessionError.message}`);
      }

      if (!session?.user) {
        console.log('❌ Aucune session active, redirection vers auth');
        router.push('/auth');
        return;
      }

      const supabaseUserId = session.user.id;
      const userEmail = session.user.email || 'Email non disponible';
      
      console.log('👤 Utilisateur connecté:', { id: supabaseUserId, email: userEmail });

      // Charger ou initialiser le programme
      let programme = await programmeSupabaseService.getProgramme(supabaseUserId);
      
      if (!programme) {
        console.log('🏗️ Initialisation d\'un nouveau programme...');
        programme = await programmeSupabaseService.initializeProgramme(supabaseUserId);
      }
      
      console.log('✅ Programme chargé avec succès:', {
        overallProgress: programme.overallProgress,
        completedSubParts: programme.subParts.filter(sp => sp.completed).length,
        totalEntries: programme.subParts.reduce((acc, sp) => acc + sp.fields.length, 0)
      });

      setState(prev => ({
        ...prev,
        programmeData: programme,
        userId: supabaseUserId,
        userEmail,
        error: null
      }));

    } catch (error) {
      console.error('💥 Erreur lors du chargement:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      
      setState(prev => ({
        ...prev,
        error: errorMessage
      }));
    } finally {
      setState(prev => ({
        ...prev,
        loading: false,
        refreshing: false
      }));
    }
  };

  /**
   * Actualise les données du programme
   */
  const handleRefresh = async (): Promise<void> => {
    setState(prev => ({ ...prev, refreshing: true, error: null }));
    await loadProgramme();
  };

  /**
   * Gère le clic sur une sous-partie
   */
  const handleSubPartClick = async (subPartId: number, slug: string): Promise<void> => {
    if (!state.programmeData || !state.userId) return;
    
    try {
      console.log(`🚀 Tentative navigation vers ${slug} (ID: ${subPartId})`);
      
      const canAccess = await programmeSupabaseService.canAccessSubPart(state.userId, subPartId);
      
      if (canAccess) {
        console.log(`✅ Navigation autorisée vers ${slug}`);
        router.push(`/programme/${slug}`);
      } else {
        console.log(`❌ Accès refusé à ${slug}`);
        alert('⚠️ Cette section n\'est pas encore accessible.\n\nComplétez d\'abord la section précédente pour débloquer celle-ci.');
      }
    } catch (error) {
      console.error('❌ Erreur navigation:', error);
      
      // Fallback sécurisé
      if (subPartId === 1) {
        console.log('🔄 Fallback : redirection vers première section');
        router.push(`/programme/${slug}`);
      } else {
        alert('❌ Une erreur est survenue. Veuillez réessayer.');
      }
    }
  };

  /**
   * Calcule les statistiques du programme
   */
  const getStatistics = () => {
    if (!state.programmeData) return { completed: 0, total: 0, entries: 0 };
    
    return {
      completed: state.programmeData.subParts.filter(sp => sp.completed).length,
      total: state.programmeData.subParts.length,
      entries: state.programmeData.subParts.reduce((acc, sp) => acc + sp.fields.length, 0)
    };
  };

  /**
   * Détermine le message motivationnel à afficher
   */
  const getMotivationalMessage = () => {
    if (!state.programmeData) return { emoji: '🌟', message: 'Chargement...' };
    
    const progress = state.programmeData.overallProgress;
    
    if (progress === 0) {
      return {
        emoji: '🌟',
        message: 'Commence ton parcours en cliquant sur AMBITIONS',
        subtitle: 'Chaque grand voyage commence par un premier pas'
      };
    } else if (progress < 25) {
      return {
        emoji: '🚀',
        message: 'Excellente initiative ! Tu viens de commencer ton transformation',
        subtitle: 'Continue sur cette lancée, tu es sur la bonne voie'
      };
    } else if (progress < 50) {
      return {
        emoji: '💪',
        message: 'Tu progresses bien ! Tes efforts commencent à payer',
        subtitle: `Plus que ${100 - progress}% pour atteindre ton objectif`
      };
    } else if (progress < 75) {
      return {
        emoji: '⭐',
        message: 'Impressionnant ! Tu es à mi-parcours de ta transformation',
        subtitle: 'Tu développes de vraies nouvelles habitudes'
      };
    } else if (progress < 100) {
      return {
        emoji: '🔥',
        message: 'Tu y es presque ! Quelques derniers efforts et c\'est gagné',
        subtitle: 'Tu es à quelques pas d\'être la personne qui atteint ses objectifs les plus ambitieux'
      };
    } else {
      return {
        emoji: '🎉',
        message: 'FÉLICITATIONS ! Tu as complété tout le programme !',
        subtitle: 'Tu as maintenant tous les outils pour réussir et transformer ta vie'
      };
    }
  };

  // Charger les données au montage du composant
  useEffect(() => {
    loadProgramme();
  }, [router]);

  // État de chargement initial
  if (state.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-500 mx-auto mb-6"></div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Chargement de ton programme</h2>
          <p className="text-gray-600 mb-4">Connexion à Supabase et récupération de tes données...</p>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-75"></div>
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse delay-150"></div>
          </div>
        </div>
      </div>
    );
  }

  // État d'erreur critique
  if (state.error || !state.programmeData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-lg">
          <div className="text-6xl mb-6">⚠️</div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur de chargement</h1>
          <p className="text-gray-700 mb-6 leading-relaxed">
            {state.error || 'Impossible de charger le programme. Vérifiez votre connexion internet.'}
          </p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={handleRefresh}
              disabled={state.refreshing}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state.refreshing ? 'Rechargement...' : 'Réessayer'}
            </button>
            <button 
              onClick={() => router.push('/dashboard')}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-all"
            >
              Retour au dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = getStatistics();
  const motivation = getMotivationalMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 p-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Indicateur de statut Supabase */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
              <span className="text-green-800 font-medium">
                Connecté à Supabase - Données synchronisées
              </span>
              {state.userEmail && (
                <span className="text-green-600 text-sm ml-2">
                  ({state.userEmail})
                </span>
              )}
            </div>
            <button 
              onClick={handleRefresh}
              disabled={state.refreshing}
              className="flex items-center gap-2 text-green-600 hover:text-green-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={state.refreshing ? 'animate-spin' : ''} />
              <span className="text-sm">
                {state.refreshing ? 'Actualisation...' : 'Actualiser'}
              </span>
            </button>
          </div>
        </div>

        {/* Header principal */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                TON PROGRAMME
              </span>
            </h1>
            <p className="text-xl text-gray-700 leading-relaxed">
              C'est le moment d'intégrer ton parcours d'excellence mentale afin de l'enraciner
            </p>
          </div>
          
          {/* Barre de progression globale avec animation */}
          <div className="relative mb-6">
            <div className="bg-gray-200 rounded-full h-8 overflow-hidden shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-1000 ease-out flex items-center justify-end pr-4 relative"
                style={{ width: `${state.programmeData.overallProgress}%` }}
              >
                {/* Effet de brillance */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                
                {state.programmeData.overallProgress > 0 && (
                  <span className="text-white text-sm font-bold relative z-10">
                    {state.programmeData.overallProgress}%
                  </span>
                )}
              </div>
            </div>
            <p className="text-center text-gray-600 mt-2 font-medium">
              Progression globale du programme
            </p>
          </div>

          {/* Statistiques détaillées */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
              <div className="flex items-center justify-center mb-2">
                <Check className="text-green-600 mr-2" size={20} />
                <span className="text-3xl font-bold text-green-600">{stats.completed}</span>
                <span className="text-green-500 ml-1">/{stats.total}</span>
              </div>
              <p className="text-sm text-green-700 font-medium">Modules complétés</p>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <div className="flex items-center justify-center mb-2">
                <BookOpen className="text-blue-600 mr-2" size={20} />
                <span className="text-3xl font-bold text-blue-600">{stats.entries}</span>
              </div>
              <p className="text-sm text-blue-700 font-medium">Entrées créées</p>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="text-purple-600 mr-2" size={20} />
                <span className="text-3xl font-bold text-purple-600">{state.programmeData.overallProgress}</span>
                <span className="text-purple-500 ml-1">%</span>
              </div>
              <p className="text-sm text-purple-700 font-medium">Progression totale</p>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
              <div className="flex items-center justify-center mb-2">
                <Users className="text-yellow-600 mr-2" size={20} />
                <span className="text-3xl font-bold text-yellow-600">
                  {8 - stats.completed}
                </span>
              </div>
              <p className="text-sm text-yellow-700 font-medium">Modules restants</p>
            </div>
          </div>
        </div>

        {/* Grille des modules */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {state.programmeData.subParts.map((subPart, index) => {
            const canAccess = index === 0 || state.programmeData!.subParts[index - 1]?.completed;
            
            return (
              <div
                key={subPart.id}
                className={`bg-white rounded-2xl p-6 shadow-lg transform transition-all duration-300 ${
                  canAccess 
                    ? 'hover:scale-105 cursor-pointer hover:shadow-xl hover:bg-gradient-to-br hover:from-white hover:to-gray-50' 
                    : 'opacity-60 cursor-not-allowed'
                }`}
                onClick={() => canAccess && handleSubPartClick(subPart.id, subPart.slug)}
              >
                <div className="text-center">
                  {/* Icône avec état */}
                  <div className="relative inline-block mb-4">
                    <div className={`text-6xl transition-all duration-300 ${
                      !canAccess ? 'opacity-50 grayscale' : 'hover:scale-110'
                    }`}>
                      {subPart.icon}
                    </div>
                    
                    {/* Badge de statut */}
                    {!canAccess && index > 0 && (
                      <div className="absolute -top-2 -right-2 bg-gray-500 rounded-full p-1 shadow-lg">
                        <Lock size={16} className="text-white" />
                      </div>
                    )}
                    {subPart.completed && (
                      <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1 shadow-lg animate-bounce">
                        <Check size={16} className="text-white" />
                      </div>
                    )}
                    {canAccess && !subPart.completed && (
                      <div className="absolute -top-2 -right-2 bg-blue-500 rounded-full p-1 shadow-lg">
                        <Play size={16} className="text-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Nom du module */}
                  <h3 className={`font-bold text-sm mb-3 transition-all duration-300 ${
                    canAccess 
                      ? `bg-gradient-to-r ${subPart.color} bg-clip-text text-transparent hover:scale-105` 
                      : 'text-gray-400'
                  }`}>
                    {subPart.name}
                  </h3>
                  
                  {/* Barre de progression du module */}
                  <div className="bg-gray-200 rounded-full h-3 mb-3 overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${subPart.color} rounded-full transition-all duration-700 ease-out relative`}
                      style={{ width: `${subPart.progress}%` }}
                    >
                      {subPart.progress > 0 && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                      )}
                    </div>
                  </div>
                  
                  {/* Informations détaillées */}
                  <div className="text-xs space-y-1">
                    <p className={`font-semibold ${canAccess ? 'text-gray-700' : 'text-gray-400'}`}>
                      {subPart.progress}% complété
                    </p>
                    <p className={canAccess ? 'text-gray-600' : 'text-gray-400'}>
                      {subPart.fields.length} / {subPart.minFields || 1} entrées
                    </p>
                    <div className={`font-medium ${
                      subPart.completed 
                        ? 'text-green-600' 
                        : canAccess 
                          ? 'text-blue-600' 
                          : 'text-gray-400'
                    }`}>
                      {subPart.completed ? (
                        <span className="flex items-center justify-center gap-1">
                          <Check size={12} />
                          Complété
                        </span>
                      ) : canAccess ? (
                        <span className="flex items-center justify-center gap-1">
                          <Play size={12} />
                          Accessible
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-1">
                          <Lock size={12} />
                          Verrouillé
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Message motivationnel dynamique */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center mb-8">
          <div className="mb-6">
            <span className="text-6xl mb-4 block animate-pulse">{motivation.emoji}</span>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              {motivation.message}
            </h2>
            {motivation.subtitle && (
              <p className="text-lg text-gray-600 leading-relaxed">
                {motivation.subtitle}
              </p>
            )}
          </div>
          
          {/* Bouton d'action principal */}
          {state.programmeData.overallProgress === 100 ? (
            <button
              onClick={() => router.push('/programme/conclusion')}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
            >
              🎉 Voir la conclusion
            </button>
          ) : state.programmeData.overallProgress === 0 ? (
            <button
              onClick={() => handleSubPartClick(1, 'ambitions')}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
            >
              🚀 Commencer le programme
            </button>
          ) : (
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  const nextIncomplete = state.programmeData!.subParts.find(sp => !sp.completed);
                  if (nextIncomplete) {
                    handleSubPartClick(nextIncomplete.id, nextIncomplete.slug);
                  }
                }}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-full font-semibold transition-all transform hover:scale-105 shadow-lg"
              >
                Continuer le programme
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-full font-semibold transition-all"
              >
                Retour au dashboard
              </button>
            </div>
          )}
          
          {/* Informations de session */}
          {state.programmeData.lastUpdated && (
            <p className="text-xs text-gray-400 mt-6">
              Dernière mise à jour : {state.programmeData.lastUpdated.toLocaleDateString('fr-FR')} à {state.programmeData.lastUpdated.toLocaleTimeString('fr-FR')}
            </p>
          )}
        </div>

        {/* Informations de développement (à supprimer en production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-100 rounded-lg p-4 text-xs">
            <h4 className="font-bold text-gray-700 mb-2">🔧 Informations de développement</h4>
            <div className="grid grid-cols-2 gap-4 text-gray-600">
              <div>
                <p><strong>User ID:</strong> {state.userId}</p>
                <p><strong>Email:</strong> {state.userEmail}</p>
                <p><strong>Progression:</strong> {state.programmeData.overallProgress}%</p>
              </div>
              <div>
                <p><strong>Modules complétés:</strong> {stats.completed}/{stats.total}</p>
                <p><strong>Entrées totales:</strong> {stats.entries}</p>
                <p><strong>Dernière MAJ:</strong> {state.programmeData.lastUpdated.toISOString()}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}