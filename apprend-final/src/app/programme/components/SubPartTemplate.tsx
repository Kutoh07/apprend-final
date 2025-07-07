// app/programme/components/SubPartTemplate.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { programmeSupabaseService } from '../../../lib/programmeSupabaseService';
import { ProgrammeData, SubPart, SUBPARTS_CONFIG } from '../../../lib/types/programme';
import { supabase } from '../../../lib/supabase';

interface SubPartTemplateProps {
  subPartId: number;
}

export default function SubPartTemplate({ subPartId }: SubPartTemplateProps) {
  const router = useRouter();
  const [programmeData, setProgrammeData] = useState<ProgrammeData | null>(null);
  const [currentSubPart, setCurrentSubPart] = useState<SubPart | null>(null);
  const [newValue, setNewValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

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

      // Vérifier si l'enregistrement existe
      const { data: existingProgress } = await supabase
        .from('subpart_progress')
        .select('id')
        .eq('user_id', userId)
        .eq('subpart_id', subPartId)
        .single();

      if (existingProgress) {
        // Mettre à jour l'enregistrement existant
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
          console.log(`✅ Progrès mis à jour: ${progress}%`);
        }
      } else {
        // Créer un nouvel enregistrement
        const { error: insertError } = await supabase
          .from('subpart_progress')
          .insert({
            user_id: userId,
            subpart_id: subPartId,
            progress,
            completed,
            completed_at: completed ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('❌ Erreur lors de la création:', insertError);
        } else {
          console.log(`✅ Progrès créé: ${progress}%`);
        }
      }
    } catch (error) {
      console.error(`💥 Erreur lors de la correction de la sous-partie ${subPartId}:`, error);
    }
  };

  // Chargement initial
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log(`🔄 Chargement de la sous-partie ${subPartId}`);
        
        // Vérification de l'authentification Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Erreur de session:', sessionError);
          router.push('/auth');
          return;
        }

        if (!session?.user) {
          console.log('❌ Pas de session, redirection vers auth');
          router.push('/auth');
          return;
        }

        const supabaseUserId = session.user.id;
        setUserId(supabaseUserId);
        
        console.log('👤 Utilisateur Supabase:', supabaseUserId);

        // Vérifier l'accès à cette sous-partie
        try {
          const canAccess = await programmeSupabaseService.canAccessSubPart(supabaseUserId, subPartId);
          console.log(`🔐 Accès à la sous-partie ${subPartId}:`, canAccess);
          
          if (!canAccess) {
            console.log('❌ Accès refusé, retour au programme');
            router.push('/programme');
            return;
          }
        } catch (accessError) {
          console.warn('⚠️ Erreur de vérification d\'accès:', accessError);
          // Si erreur de vérification, autoriser la première sous-partie
          if (subPartId !== 1) {
            router.push('/programme');
            return;
          }
        }

        // Charger le programme
        console.log('📡 Chargement du programme...');
        const programme = await programmeSupabaseService.getProgramme(supabaseUserId);
        
        if (programme) {
          console.log('✅ Programme chargé:', programme);
          setProgrammeData(programme);
          const subPart = programme.subParts.find(sp => sp.id === subPartId);
          console.log('📋 Sous-partie trouvée:', subPart);
          setCurrentSubPart(subPart || null);
        } else {
          throw new Error('Programme non trouvé');
        }
        
      } catch (err) {
        console.error('💥 Erreur lors du chargement:', err);
        setError(`Erreur lors du chargement: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [subPartId, router]);

  // Ajouter une nouvelle entrée
  const handleAddField = async () => {
    if (!newValue.trim() || !userId || !currentSubPart) {
      console.warn('⚠️ Conditions non remplies pour ajouter une entrée');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      console.log(`📝 Ajout d'une entrée pour la sous-partie ${subPartId}:`, newValue.trim());
      
      const newField = await programmeSupabaseService.addField(userId, subPartId, newValue);
      
      if (newField) {
        console.log('✅ Entrée ajoutée avec succès:', newField);
        
        // Recharger les données
        const updatedProgramme = await programmeSupabaseService.getProgramme(userId);
        if (updatedProgramme) {
          setProgrammeData(updatedProgramme);
          const updatedSubPart = updatedProgramme.subParts.find(sp => sp.id === subPartId);
          setCurrentSubPart(updatedSubPart || null);
          console.log('🔄 Données mises à jour');
        }
        
        setNewValue('');
        setSuccess('Entrée ajoutée avec succès !');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error('Échec de l\'ajout de l\'entrée');
      }
    } catch (err: any) {
      console.error('💥 Erreur lors de l\'ajout:', err);
      setError(err.message || 'Erreur lors de l\'ajout');
    } finally {
      setSaving(false);
    }
  };

  // Supprimer une entrée
  const handleRemoveField = async (fieldId: string) => {
    if (!userId) return;
    
    setSaving(true);
    try {
      console.log(`🗑️ Suppression de l'entrée ${fieldId}`);
      
      await programmeSupabaseService.removeField(userId, fieldId, subPartId);
      
      // Recharger les données
      const updatedProgramme = await programmeSupabaseService.getProgramme(userId);
      if (updatedProgramme) {
        setProgrammeData(updatedProgramme);
        const updatedSubPart = updatedProgramme.subParts.find(sp => sp.id === subPartId);
        setCurrentSubPart(updatedSubPart || null);
      }
      
      setSuccess('Entrée supprimée');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      console.error('💥 Erreur lors de la suppression:', err);
      setError(err.message || 'Erreur lors de la suppression');
    } finally {
      setSaving(false);
    }
  };

  // Navigation
  const handleBack = () => {
    router.push('/programme');
  };

  // NOUVELLE FONCTION: Navigation avec correction automatique du progrès
  const handleNext = async () => {
    if (!userId) return;
    
    setNavigating(true);
    try {
      console.log('🔄 Préparation de la navigation vers le module suivant...');
      
      // 1. Corriger le progrès du module actuel
      await forceUpdateSubpartProgress(userId, subPartId);
      
      // 2. Mettre à jour le progrès global
      const { data: allProgress } = await supabase
        .from('subpart_progress')
        .select('progress')
        .eq('user_id', userId);

      if (allProgress && allProgress.length > 0) {
        const totalProgress = allProgress.reduce((sum, p) => sum + p.progress, 0);
        const overallProgress = Math.round(totalProgress / allProgress.length);
        
        await supabase
          .from('user_programmes')
          .update({
            overall_progress: overallProgress,
            last_updated: new Date().toISOString()
          })
          .eq('user_id', userId);

        console.log('✅ Progrès global mis à jour:', overallProgress + '%');
      }
      
      // 3. Naviguer vers le module suivant
      if (programmeData && subPartId < programmeData.subParts.length) {
        const nextSubPart = SUBPARTS_CONFIG.find(config => config.id === subPartId + 1);
        if (nextSubPart) {
          console.log(`🚀 Navigation vers ${nextSubPart.name}`);
          router.push(`/programme/${nextSubPart.slug}`);
        }
      } else {
        console.log('🎉 Navigation vers la conclusion');
        router.push('/programme/conclusion');
      }
      
    } catch (error) {
      console.error('💥 Erreur lors de la navigation:', error);
      setError('Erreur lors de la navigation');
    } finally {
      setNavigating(false);
    }
  };

  // États de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-2">Chargement...</p>
          <div className="text-xs text-gray-400">
            Connexion à Supabase et vérification des accès...
          </div>
        </div>
      </div>
    );
  }

  if (error || !currentSubPart) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur</h1>
          <p className="text-gray-700 mb-6">
            {error || 'Sous-partie non trouvée'}
          </p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg"
            >
              Réessayer
            </button>
            <button 
              onClick={handleBack}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
            >
              Retour au programme
            </button>
          </div>
        </div>
      </div>
    );
  }

  const canAddMore = !currentSubPart.maxFields || currentSubPart.fields.length < currentSubPart.maxFields;
  const meetsMinimum = currentSubPart.fields.length >= (currentSubPart.minFields || 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Indicateur de connexion */}
        <div className="bg-green-100 border border-green-300 rounded-lg p-3 mb-6">
          <div className="flex items-center text-sm">
            <span className="text-green-600 mr-2">✅</span>
            <span className="text-green-800">Connecté à Supabase - Correction automatique du progrès activée</span>
          </div>
        </div>

        {/* Header */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft size={20} />
              Retour au programme
            </button>
            
            <div className="text-center">
              <div className={`text-6xl mb-2`}>{currentSubPart.icon}</div>
              <h1 className={`text-3xl font-bold bg-gradient-to-r ${currentSubPart.color} bg-clip-text text-transparent`}>
                {currentSubPart.name}
              </h1>
            </div>
            
            <div className="w-24"></div> {/* Spacer pour centrer le titre */}
          </div>

          <p className="text-xl text-gray-700 text-center mb-6">
            {currentSubPart.description}
          </p>

          {/* Barre de progression */}
          <div className="bg-gray-200 rounded-full h-4 mb-2 overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${currentSubPart.color} transition-all duration-500 flex items-center justify-end pr-2`}
              style={{ width: `${currentSubPart.progress}%` }}
            >
              {currentSubPart.progress > 0 && (
                <span className="text-white text-xs font-bold">{currentSubPart.progress}%</span>
              )}
            </div>
          </div>
          
          <div className="flex justify-between text-sm text-gray-600">
            <span>{currentSubPart.fields.length} / {currentSubPart.minFields || 1} minimum</span>
            <span>{currentSubPart.maxFields ? `Max: ${currentSubPart.maxFields}` : 'Illimité'}</span>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-center gap-2 text-red-700">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-center gap-2 text-green-700">
            <CheckCircle size={20} />
            <span>{success}</span>
          </div>
        )}

        {/* Formulaire d'ajout */}
        {canAddMore && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Ajouter une nouvelle entrée</h3>
            <div className="flex gap-4">
              <textarea
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder={currentSubPart.placeholder}
                className="flex-1 p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                rows={3}
                disabled={saving}
              />
              <button
                onClick={handleAddField}
                disabled={!newValue.trim() || saving}
                className={`flex items-center gap-2 px-6 py-4 rounded-xl font-semibold transition-all ${
                  !newValue.trim() || saving
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-500 hover:bg-purple-600 text-white transform hover:scale-105'
                }`}
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Plus size={20} />
                )}
                {saving ? 'Ajout...' : 'Ajouter'}
              </button>
            </div>
          </div>
        )}

        {/* Liste des entrées existantes */}
        {currentSubPart.fields.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Tes entrées ({currentSubPart.fields.length})</h3>
            <div className="space-y-4">
              {currentSubPart.fields.map((field, index) => (
                <div key={field.id} className="bg-gray-50 rounded-xl p-4 flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-gray-800 whitespace-pre-wrap">{field.value}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Ajouté le {field.createdAt.toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveField(field.id)}
                    disabled={saving}
                    className="ml-4 p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                    title="Supprimer cette entrée"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
            Programme
          </button>

          {meetsMinimum && (
            <button
              onClick={handleNext}
              disabled={navigating}
              className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all transform hover:scale-105 ${
                navigating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-purple-500 hover:bg-purple-600 text-white'
              }`}
            >
              {navigating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Finalisation...</span>
                </>
              ) : (
                <>
                  <span>{subPartId < 8 ? 'Suivant' : 'Terminer'}</span>
                  <Save size={20} />
                </>
              )}
            </button>
          )}
        </div>

        {!meetsMinimum && (
          <div className="text-center mt-4">
            <p className="text-gray-600">
              Ajoutez au moins {(currentSubPart.minFields || 1) - currentSubPart.fields.length} entrée(s) pour continuer
            </p>
          </div>
        )}

        {/* Info sur la correction automatique */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          <p className="text-blue-800">
            💡 <strong>Correction automatique :</strong> En cliquant sur "Suivant", 
            le progrès sera automatiquement recalculé et mis à jour pour débloquer le module suivant.
          </p>
        </div>
      </div>
    </div>
  );
}