// app/programme/components/SubPartTemplate.tsx - FIXED VERSION

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, AlertCircle, CheckCircle, Save } from 'lucide-react';
import { programmeSupabaseService } from '../../../lib/programmeSupabaseService';
import { ModuleService } from '../../../lib/moduleService';
import { ProgrammeData, SubPart, SUBPARTS_CONFIG } from '../../../lib/types/programme';
import { supabase } from '../../../lib/supabase'; // Add this import
import EditableField from './EditableField';
import ModuleNavigation from './ModuleNavigation';
import LiveProgressBar from './LiveProgressBar';

interface SubPartTemplateProps {
  subPartId: number;
}

export default function SubPartTemplate({ subPartId }: SubPartTemplateProps) {
  const router = useRouter();
  const [programmeData, setProgrammeData] = useState<ProgrammeData | null>(null);
  const [currentSubPart, setCurrentSubPart] = useState<SubPart | null>(null);
  const [newValue, setNewValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [canAccessNext, setCanAccessNext] = useState(false);

  // Chargement initial - FIXED
  useEffect(() => {
    const loadData = async () => {
      try {
        // ✅ Get actual Supabase user session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Erreur session Supabase:', sessionError);
          router.push('/auth');
          return;
        }

        if (!session?.user) {
          console.log('❌ Aucune session active, redirection vers auth');
          router.push('/auth');
          return;
        }

        // ✅ Use the actual UUID from Supabase
        const supabaseUserId = session.user.id; // This is a UUID
        const supabaseUserEmail = session.user.email || 'Email non disponible';
        
        console.log('👤 Utilisateur connecté:', { 
          id: supabaseUserId, 
          email: supabaseUserEmail 
        });

        setUserId(supabaseUserId); // ✅ Store the UUID
        setUserEmail(supabaseUserEmail); // ✅ Store email separately for display

        // ✅ Use UUID for all service calls
        const canAccess = await ModuleService.canAccessModule(supabaseUserId, subPartId);
        if (!canAccess) {
          router.push('/programme');
          return;
        }

        // ✅ Load programme using UUID
        const programme = await programmeSupabaseService.getProgramme(supabaseUserId);
        if (programme) {
          setProgrammeData(programme);
          const subPart = programme.subParts.find(sp => sp.id === subPartId);
          setCurrentSubPart(subPart || null);
          
          // Vérifier si le module suivant est accessible
          const nextCanAccess = await ModuleService.canAccessModule(supabaseUserId, subPartId + 1);
          setCanAccessNext(nextCanAccess || (subPart?.progress || 0) >= 100);
        }
      } catch (err) {
        console.error('Erreur lors du chargement:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [subPartId, router]);

  // Fonction pour recharger les données - FIXED
  const reloadData = async () => {
    if (!userId) return; // userId is now a UUID
    
    try {
      const programme = await programmeSupabaseService.getProgramme(userId); // ✅ UUID
      if (programme) {
        setProgrammeData(programme);
        const subPart = programme.subParts.find(sp => sp.id === subPartId);
        setCurrentSubPart(subPart || null);
        
        // Vérifier l'accès au module suivant
        const nextCanAccess = await ModuleService.canAccessModule(userId, subPartId + 1); // ✅ UUID
        setCanAccessNext(nextCanAccess || (subPart?.progress || 0) >= 100);
      }
    } catch (err) {
      console.error('Erreur lors du rechargement:', err);
    }
  };

  // Ajouter une nouvelle entrée - FIXED
  const handleAddField = async () => {
    if (!newValue.trim() || !userId || !currentSubPart) return; // userId is UUID

    setUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      await programmeSupabaseService.addField(userId, subPartId, newValue); // ✅ UUID
      await reloadData();
      setNewValue('');
      setSuccess('Entrée ajoutée avec succès !');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'ajout');
    } finally {
      setUpdating(false);
    }
  };

  // Mettre à jour une entrée - FIXED
  const handleUpdateField = async (fieldId: string, newValue: string) => {
    if (!userId) return; // userId is UUID
    
    await ModuleService.updateField(userId, fieldId, newValue); // ✅ UUID
    await reloadData();
  };

  // Supprimer une entrée - FIXED
  const handleDeleteField = async (fieldId: string) => {
    if (!userId) return; // userId is UUID
    
    setUpdating(true);
    try {
      await ModuleService.deleteField(userId, fieldId, subPartId); // ✅ UUID
      await reloadData();
      setSuccess('Entrée supprimée');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression');
    } finally {
      setUpdating(false);
    }
  };

  // Sauvegarder les modifications - FIXED
  const handleSave = async () => {
    if (!programmeData) return;
    
    setUpdating(true);
    try {
      await programmeSupabaseService.saveProgramme(programmeData); // Already uses programmeData.userId (UUID)
      setSuccess('Modifications sauvegardées !');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setUpdating(false);
    }
  };

  // Rest of the component remains the same...
  // (The render logic doesn't need changes since it doesn't directly use user IDs)

  // Gestion de la progression en temps réel
  const handleProgressUpdate = (progress: number) => {
    if (currentSubPart) {
      setCurrentSubPart({ ...currentSubPart, progress });
    }
  };

  // États de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du module...</p>
          {userEmail && (
            <p className="text-sm text-gray-500 mt-2">Connecté en tant que: {userEmail}</p>
          )}
        </div>
      </div>
    );
  }

  if (!currentSubPart) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <p className="text-red-600 mb-4">Module non trouvé</p>
          <button 
            onClick={() => router.push('/programme')}
            className="text-purple-600 hover:underline"
          >
            Retour au programme
          </button>
        </div>
      </div>
    );
  }

  const canAddMore = !currentSubPart.maxFields || currentSubPart.fields.length < currentSubPart.maxFields;
  const meetsMinimum = currentSubPart.fields.length >= (currentSubPart.minFields || 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-xs text-blue-700">
              <strong>Debug:</strong> User ID (UUID): {userId} | Email: {userEmail}
            </p>
          </div>
        )}

        {/* Navigation entre modules */}
        <ModuleNavigation
          currentSubPartId={subPartId}
          currentSubPart={currentSubPart}
          canAccessNext={meetsMinimum}
          isLoading={loading || updating}
        />

        {/* Header du module */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
          <div className="text-center mb-6">
            <div className={`text-6xl mb-4`}>{currentSubPart.icon}</div>
            <h1 className={`text-3xl font-bold bg-gradient-to-r ${currentSubPart.color} bg-clip-text text-transparent mb-4`}>
              {currentSubPart.name}
            </h1>
            <p className="text-xl text-gray-700 mb-6">
              {currentSubPart.description}
            </p>
          </div>

          {/* Barre de progression en temps réel */}
          <LiveProgressBar
            subPart={currentSubPart}
            currentCount={currentSubPart.fields.length}
            onProgressUpdate={handleProgressUpdate}
          />
        </div>

        {/* Messages d'état */}
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
                disabled={updating}
              />
              <button
                onClick={handleAddField}
                disabled={!newValue.trim() || updating}
                className={`flex items-center gap-2 px-6 py-4 rounded-xl font-semibold transition-all ${
                  !newValue.trim() || updating
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-500 hover:bg-purple-600 text-white transform hover:scale-105'
                }`}
              >
                {updating ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Plus size={20} />
                )}
                {updating ? 'Ajout...' : 'Ajouter'}
              </button>
            </div>
          </div>
        )}

        {/* Liste des entrées existantes avec édition */}
        {currentSubPart.fields.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">
                Tes entrées ({currentSubPart.fields.length})
              </h3>
              <button
                onClick={handleSave}
                disabled={updating}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <Save size={16} />
                {updating ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
            
            <div className="space-y-4">
              {currentSubPart.fields.map((field, index) => (
                <EditableField
                  key={field.id}
                  field={field}
                  index={index}
                  onUpdate={handleUpdateField}
                  onDelete={handleDeleteField}
                  isUpdating={updating}
                />
              ))}
            </div>
          </div>
        )}

        {/* Message d'encouragement */}
        {!meetsMinimum && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-4">🎯</div>
            <p className="text-yellow-800 font-medium">
              Ajoutez au moins {(currentSubPart.minFields || 1) - currentSubPart.fields.length} entrée(s) supplémentaire(s) pour débloquer le module suivant
            </p>
          </div>
        )}

        {/* Message de félicitations */}
        {meetsMinimum && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-4">✨</div>
            <p className="text-green-800 font-medium mb-4">
              Excellent ! Ce module est complété. Vous pouvez maintenant passer au suivant.
            </p>
            {canAddMore && (
              <p className="text-green-600 text-sm">
                Vous pouvez encore ajouter {currentSubPart.maxFields ? (currentSubPart.maxFields - currentSubPart.fields.length) : 'des'} entrée(s) si vous le souhaitez.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}